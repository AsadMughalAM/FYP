from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import AnimalDetection
from .serializers import AnimalDetectionSerializer
import json
import os
from django.conf import settings
import numpy as np
from tensorflow import keras
import pickle
from pathlib import Path

# Import Gemini service for dynamic disease information
from .gemini_service import get_disease_info

class DiseaseDetectionModel:
    """Wrapper for ML model prediction"""
    
    _instance = None
    _model = None
    _class_indices = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DiseaseDetectionModel, cls).__new__(cls)
        return cls._instance
    
    @staticmethod
    def _fix_model_config(config):
        """Fix model config to handle BatchNormalization axis as list"""
        if isinstance(config, dict):
            # Fix BatchNormalization layer configs
            if config.get('class_name') == 'BatchNormalization':
                if 'config' in config and 'axis' in config['config']:
                    axis = config['config']['axis']
                    if isinstance(axis, list) and len(axis) > 0:
                        config['config']['axis'] = axis[0]
                    elif isinstance(axis, list):
                        config['config']['axis'] = -1
            
            # Recursively fix nested configs
            for key, value in config.items():
                if isinstance(value, (dict, list)):
                    if isinstance(value, list):
                        for item in value:
                            if isinstance(item, dict):
                                DiseaseDetectionModel._fix_model_config(item)
                    else:
                        DiseaseDetectionModel._fix_model_config(value)
        
        elif isinstance(config, list):
            for item in config:
                if isinstance(item, dict):
                    DiseaseDetectionModel._fix_model_config(item)
        
        return config
    
    def load_model(self):
        """Load trained model"""
        if self._model is not None:
            return  # Model already loaded
        
        try:
            model_path = Path(settings.BASE_DIR) / 'ml_model' / 'trained_models' / 'cow_disease_detector.h5'
            classes_path = Path(settings.BASE_DIR) / 'ml_model' / 'trained_models' / 'cow_disease_detector_classes.pkl'
            
            print(f"🔍 Looking for model at: {model_path.resolve()}")
            print(f"🔍 Looking for classes at: {classes_path.resolve()}")
            
            if not os.path.exists(model_path):
                error_msg = f"Model file not found at: {model_path.resolve()}"
                print(f"❌ {error_msg}")
                raise FileNotFoundError(error_msg)
            
            if not os.path.exists(classes_path):
                error_msg = f"Classes file not found at: {classes_path.resolve()}"
                print(f"❌ {error_msg}")
                raise FileNotFoundError(error_msg)
            
            print("📦 Loading model...")
            import tensorflow as tf
            
            # Patch Operation.from_config to handle version compatibility
            # This error occurs when model was saved with different TF version
            try:
                from tensorflow.python.framework.ops import Operation
                if hasattr(Operation, 'from_config'):
                    original_from_config = Operation.from_config
                    
                    @staticmethod
                    def patched_from_config(config, custom_objects=None):
                        """Patched Operation.from_config that handles version compatibility"""
                        try:
                            # Try calling with both arguments (newer TF versions)
                            if custom_objects is not None:
                                return original_from_config(config, custom_objects)
                            else:
                                return original_from_config(config)
                        except TypeError as e:
                            # If signature mismatch, try with just config
                            if 'takes' in str(e) and 'positional arguments' in str(e):
                                try:
                                    return original_from_config(config)
                                except Exception:
                                    # If still fails, we'll let it propagate
                                    raise
                            raise
                    
                    # Replace the method
                    Operation.from_config = patched_from_config
            except (ImportError, AttributeError, Exception) as patch_error:
                print(f"⚠️ Could not patch Operation.from_config: {patch_error}")
                pass
            
            # Patch BatchNormalization to handle axis as list during deserialization
            from tensorflow.keras.layers import BatchNormalization as OriginalBN
            from tensorflow.keras.layers import Layer
            
            # Create custom BatchNormalization class
            class FixedBatchNormalization(OriginalBN):
                """Custom BatchNormalization that handles axis as list or int"""
                @classmethod
                def from_config(cls, config, custom_objects=None):
                    # Fix axis parameter if it's a list
                    if isinstance(config, dict) and 'axis' in config:
                        axis = config['axis']
                        if isinstance(axis, list):
                            config['axis'] = axis[0] if len(axis) > 0 else -1
                        elif not isinstance(axis, (int, type(None))):
                            config['axis'] = -1
                    try:
                        return super().from_config(config, custom_objects)
                    except (TypeError, ValueError) as e:
                        # If still fails, try with default axis
                        if 'axis' in config:
                            config['axis'] = -1
                        return super().from_config(config, custom_objects)
            
            # Register custom objects - use the fixed version
            custom_objects = {
                'BatchNormalization': FixedBatchNormalization,
                'keras.layers.BatchNormalization': FixedBatchNormalization,
                'tensorflow.keras.layers.BatchNormalization': FixedBatchNormalization,
            }
            
            try:
                # First try: Load with safe_mode=False and custom objects
                self._model = tf.keras.models.load_model(
                    str(model_path), 
                    compile=False,
                    safe_mode=False,
                    custom_objects=custom_objects
                )
                print("✅ Model loaded successfully with safe_mode=False and fixed BatchNormalization")
            except Exception as e1:
                error_str = str(e1)
                print(f"⚠️ First load attempt failed: {error_str[:200]}...")
                
                # Try alternative loading methods for version compatibility issues
                if 'Operation.from_config' in error_str or 'takes 2 positional arguments but 3 were given' in error_str:
                    print("🔄 Attempting alternative loading methods...")
                    
                    # Method 1: Try with tf.compat.v1 (if available)
                    try:
                        print("  Trying tf.compat.v1.keras.models.load_model...")
                        import warnings
                        with warnings.catch_warnings():
                            warnings.simplefilter("ignore")
                            self._model = tf.compat.v1.keras.models.load_model(
                                str(model_path), 
                                compile=False
                            )
                        print("✅ Model loaded successfully with tf.compat.v1")
                    except Exception as e2:
                        error_str2 = str(e2)
                        print(f"  ⚠️ Method 1 failed: {error_str2[:150]}...")
                        
                        # Method 2: Try with different loading options
                        try:
                            print("  Trying with additional compatibility options...")
                            import warnings
                            with warnings.catch_warnings():
                                warnings.simplefilter("ignore")
                                # Try with just compile=False, no custom_objects
                                self._model = tf.keras.models.load_model(
                                    str(model_path), 
                                    compile=False
                                )
                            print("✅ Model loaded successfully with compatibility options")
                        except Exception as e3:
                            error_str3 = str(e3)
                            print(f"  ⚠️ Method 2 failed: {error_str3[:150]}...")
                            
                            # Final fallback: Clear error message with retraining instructions
                            raise Exception(
                                f"Model loading failed due to TensorFlow version incompatibility.\n"
                                f"Error: Operation.from_config() signature mismatch.\n\n"
                                f"The model was saved with TensorFlow {tf.__version__} (or different version).\n"
                                f"To fix this, please retrain the model by running:\n"
                                f"  cd server\n"
                                f"  python manage.py train_model --epochs 10\n\n"
                                f"This will create a new model compatible with your current TensorFlow version."
                            )
                elif 'axis' in error_str.lower() or ('list' in error_str.lower() and 'int()' in error_str):
                    raise Exception(
                        "Model loading failed: BatchNormalization layer has incompatible format. "
                        "The model was saved with a different TensorFlow version. "
                        "Please retrain the model by running: "
                        "cd server && python manage.py train_model --epochs 10"
                    )
                else:
                    raise
            print("📦 Loading classes...")
            with open(classes_path, 'rb') as f:
                self._class_indices = pickle.load(f)
            print(f"✅ ML Model loaded successfully! Classes: {self._class_indices}")
                
        except Exception as e:
            error_msg = f"Error loading model: {e}"
            print(f"❌ {error_msg}")
            import traceback
            traceback.print_exc()
            self._model = None
            # Re-raise exception so predict() can handle it properly
            raise
    
    def predict(self, image_path):
        """Make prediction on image"""
        try:
            self.load_model()
        except Exception as e:
            raise Exception(f"Failed to load model: {e}")
        
        if self._model is None:
            error_msg = "Model not loaded. "
            if hasattr(self, '_load_error'):
                error_msg += f"Error: {self._load_error}. "
            error_msg += f"Please check if model files exist at: {Path(settings.BASE_DIR) / 'ml_model' / 'trained_models'}"
            raise Exception(error_msg)
        
        try:
            # Load and preprocess image
            # IMPORTANT: Match training preprocessing - model has Rescaling layer
            # So we do NOT normalize here (no /255.0)
            img = keras.preprocessing.image.load_img(
                image_path,
                target_size=(224, 224),
                color_mode='rgb'
            )
            img_array = keras.preprocessing.image.img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0)
            # Model's Rescaling layer will normalize - do NOT divide by 255.0 here
            
            # Predict
            predictions = self._model.predict(img_array, verbose=0)
            
            # Debug: Print raw predictions
            print(f"🔍 Raw predictions array: {predictions[0]}")
            print(f"🔍 Class indices: {self._class_indices}")
            
            # Get all predictions with their indices
            all_preds = []
            for i in range(len(predictions[0])):
                all_preds.append((i, self._class_indices[i], float(predictions[0][i])))
            
            # Sort by confidence
            all_preds.sort(key=lambda x: x[2], reverse=True)
            print(f"🔍 All predictions (sorted): {all_preds}")
            
            predicted_class_idx = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_class_idx])
            disease = self._class_indices[predicted_class_idx]
            
            # Check if confidence is too low - might indicate model issue
            if confidence < 0.5:
                print(f"⚠️ WARNING: Low confidence ({confidence:.4f}) for prediction. Model might not be properly trained.")
                # If confidence is very low, check if other predictions are close
                second_best_idx = all_preds[1][0] if len(all_preds) > 1 else None
                second_best_conf = all_preds[1][2] if len(all_preds) > 1 else 0
                if second_best_conf > 0.3 and abs(confidence - second_best_conf) < 0.1:
                    print(f"⚠️ WARNING: Top two predictions are very close. Consider retraining model.")
            
            # Format disease names for better display
            def format_disease_name(name):
                return name.replace('-', ' ').replace('_', ' ').title()
            
            # Format all predictions with readable names - show all predictions
            formatted_predictions = {}
            valid_disease_keys = ['foot-and-mouth', 'lumpy', 'healthy']
            
            # First, collect all predictions from the model
            for i in range(len(predictions[0])):
                original_name = self._class_indices[i]
                confidence_value = float(predictions[0][i])
                # Only include if it's one of the 3 trained diseases
                if original_name in valid_disease_keys:
                    formatted_name = format_disease_name(original_name)
                    formatted_predictions[formatted_name] = confidence_value
            
            # Debug: Print formatted predictions
            print(f"📊 Formatted predictions: {formatted_predictions}")
            print(f"📊 Predicted disease: {disease} (index: {predicted_class_idx}, confidence: {confidence:.4f})")
            
            # Additional validation: If confidence is very low, log warning
            if confidence < 0.4:
                print(f"⚠️ CRITICAL: Very low confidence ({confidence:.2%}) for '{disease}'. Model may need retraining.")
                # Check if predictions are too close (indicates model uncertainty)
                sorted_confs = sorted([p[2] for p in all_preds], reverse=True)
                if len(sorted_confs) > 1 and abs(sorted_confs[0] - sorted_confs[1]) < 0.15:
                    print(f"⚠️ CRITICAL: Top predictions are too close. Model is uncertain. Consider retraining.")
            
            return {
                'disease': disease,
                'disease_formatted': format_disease_name(disease),
                'confidence': confidence,
                'all_predictions': formatted_predictions,
                'model_warning': confidence < 0.4  # Flag for low confidence
            }
            
        except Exception as e:
            print(f"Prediction error: {e}")
            raise Exception(f"Failed to make prediction: {e}")
    
    def _mock_prediction(self, image_path):
        """Mock prediction - should not be used in production"""
        raise Exception("Model not loaded. Cannot make predictions without trained model.")


class DetectAnimalAPIView(APIView):
    """API endpoint for animal disease detection"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Upload image and detect disease
        
        Expected: multipart/form-data with 'image' field
        """
        try:
            image_file = request.FILES.get("image")
            
            if not image_file:
                return Response(
                    {"error": "No image uploaded"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate file size (max 10MB)
            if image_file.size > 10 * 1024 * 1024:
                return Response(
                    {"error": "File size exceeds 10MB limit"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate file type
            allowed_formats = ['.jpg', '.jpeg', '.png', '.gif']
            file_ext = os.path.splitext(image_file.name)[1].lower()
            if file_ext not in allowed_formats:
                return Response(
                    {"error": f"Invalid file format. Allowed: {', '.join(allowed_formats)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save temporary image in a cross-platform temp file
            import tempfile
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(image_file.name)[1])
            try:
                for chunk in image_file.chunks():
                    tmp.write(chunk)
                tmp.flush()
                temp_image_path = tmp.name
            finally:
                tmp.close()
            
            # Make prediction
            predictor = DiseaseDetectionModel()
            prediction = predictor.predict(temp_image_path)
            
            # Get disease information from Gemini API (with JSON fallback)
            disease_name = prediction['disease'].lower().strip()
            valid_diseases = ['foot-and-mouth', 'lumpy', 'healthy']
            
            # Validate disease name
            normalized_name = disease_name.replace('_', '-').replace(' ', '-')
            if normalized_name not in valid_diseases:
                raise ValueError(f"Disease '{prediction['disease']}' is not valid. Only {valid_diseases} are supported.")
            
            # Fetch REAL-TIME disease info from Gemini API (force fresh, no cache)
            # This ensures we get the latest, most accurate information every time
            from .gemini_service import GEMINI_API_KEY, GEMINI_MODEL
            
            print(f"")
            print(f"🔄🔄🔄 STARTING REAL-TIME GEMINI API CALL 🔄🔄🔄")
            print(f"🔄 Disease: {normalized_name}")
            print(f"🔄 API Key: {GEMINI_API_KEY[:15]}...{GEMINI_API_KEY[-5:] if len(GEMINI_API_KEY) > 20 else ''}")
            print(f"🔄 Model: {GEMINI_MODEL}")
            print(f"")
            
            info = get_disease_info(normalized_name, use_cache=False, force_fresh=True)
            
            # Log the data source for debugging BEFORE removing it
            data_source = info.get('_source', 'unknown')
            
            # CRITICAL: If using JSON fallback, DO NOT SAVE - return error instead
            if data_source == 'json_fallback':
                print(f"")
                print(f"❌❌❌ CRITICAL ERROR ❌❌❌")
                print(f"❌ Gemini API FAILED - Cannot use JSON fallback!")
                print(f"❌ Disease: {normalized_name}")
                print(f"❌ This means UI will show OLD data from JSON file")
                print(f"❌ Please check Gemini API configuration")
                print(f"")
                # Return error instead of saving JSON fallback
                return Response(
                    {
                        "error": "Gemini API failed",
                        "message": "Unable to fetch real-time disease information. Please check Gemini API configuration and try again.",
                        "details": "The system requires real-time data from Gemini API. JSON fallback is disabled to ensure data accuracy."
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            elif data_source == 'gemini_api':
                print(f"")
                print(f"✅✅✅ SUCCESS: REAL-TIME GEMINI DATA RECEIVED ✅✅✅")
                print(f"✅ Disease: {normalized_name}")
                print(f"✅ Symptoms count: {len(info.get('symptoms', []))}")
                print(f"✅ Treatment count: {len(info.get('treatment', []))}")
                print(f"✅ Prevention count: {len(info.get('prevention', []))}")
                print(f"✅ This is FRESH data from Gemini API, NOT from JSON file")
                print(f"")
            else:
                print(f"⚠️ Unknown data source: {data_source}")
                # If unknown source, also reject it
                return Response(
                    {
                        "error": "Unknown data source",
                        "message": "Unable to verify data source. Please try again."
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Remove internal field before saving
            info.pop('_source', None)
            
            print(f"✅ Disease info loaded: {info.get('name', 'N/A')} (severity: {info.get('severity', 'N/A')})")
            
            # Format disease name for display - use name from disease_info.json if available
            disease_display_name = info.get('name', prediction.get('disease_formatted', prediction['disease'].replace('-', ' ').replace('_', ' ').title()))
            
            # Use predictions directly (already filtered and formatted in predict method)
            filtered_predictions = prediction.get('all_predictions', {})
            
            # Ensure we have predictions
            if not filtered_predictions:
                raise ValueError(f"Model returned no predictions. Expected one of: {valid_diseases}")
            
            # Sort predictions by confidence for better display
            filtered_predictions = dict(sorted(filtered_predictions.items(), key=lambda x: x[1], reverse=True))
            
            # Create detection record with all Gemini AI data
            detection = AnimalDetection.objects.create(
                user=request.user,
                image=image_file,
                animal_name='Cow',
                disease_name=disease_display_name,
                confidence_score=prediction['confidence'],
                severity=info.get('severity', 'Low'),
                symptoms=info.get('symptoms', []),
                treatment=info.get('treatment', []),
                prevention=info.get('prevention', []),
                antibiotics=info.get('antibiotics', []),
                contagious=info.get('contagious', False),
                all_predictions=filtered_predictions,
                status='diagnosed'
            )
            
            # Clean up temp file
            try:
                if os.path.exists(temp_image_path):
                    os.remove(temp_image_path)
            except Exception:
                pass
            
            # Serialize detection for response
            serializer = AnimalDetectionSerializer(detection, context={'request': request})
            
            # Check if model confidence is low and add warning
            response_data = {
                "success": True,
                "message": "Disease detected successfully",
                "data": serializer.data,
                "data_source": "gemini_api_realtime",  # Indicate this is real-time Gemini data
                "timestamp": detection.created_at.isoformat()
            }
            
            # Add warning if confidence is too low
            if prediction.get('model_warning', False) or prediction['confidence'] < 0.4:
                response_data["warning"] = (
                    "Model confidence is low. The prediction may not be accurate. "
                    "Please verify the diagnosis with a veterinarian. "
                    "Consider retraining the model if this persists."
                )
                print("⚠️ WARNING: Low confidence prediction - user should verify diagnosis")
            
            return Response(
                response_data,
                status=status.HTTP_201_CREATED
            )
            
        except ValueError as e:
            # Handle validation errors
            return Response(
                {"error": str(e), "message": "Validation error occurred"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except FileNotFoundError as e:
            # Handle missing model files
            return Response(
                {"error": "Model files not found", "message": "The AI model is not available. Please contact administrator."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            # Log the full error for debugging
            import traceback
            error_trace = traceback.format_exc()
            print(f"❌ Error during prediction: {str(e)}")
            print(f"❌ Traceback: {error_trace}")
            
            return Response(
                {
                    "error": "An error occurred during prediction",
                    "message": "Please try again or contact support if the problem persists"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DetectionHistoryAPIView(APIView):
    """Get detection history for current user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all detections for current user"""
        try:
            detections = AnimalDetection.objects.filter(user=request.user).order_by('-created_at')
            serializer = AnimalDetectionSerializer(detections, many=True, context={'request': request})
            return Response({
                "success": True,
                "count": detections.count(),
                "data": serializer.data
            })
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Failed to fetch detection history",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DetectionDetailAPIView(APIView):
    """Get specific detection details"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, detection_id):
        """Get detection details"""
        try:
            detection = AnimalDetection.objects.get(
                id=detection_id,
                user=request.user
            )
            serializer = AnimalDetectionSerializer(detection, context={'request': request})
            return Response(serializer.data)
        except AnimalDetection.DoesNotExist:
            return Response(
                {"error": "Detection not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def patch(self, request, detection_id):
        """Update detection status and notes"""
        try:
            detection = AnimalDetection.objects.get(
                id=detection_id,
                user=request.user
            )
            
            # Update allowed fields
            if 'status' in request.data:
                detection.status = request.data['status']
            if 'notes' in request.data:
                detection.notes = request.data['notes']
            
            detection.save()
            serializer = AnimalDetectionSerializer(detection, context={'request': request})
            return Response(serializer.data)
            
        except AnimalDetection.DoesNotExist:
            return Response(
                {"error": "Detection not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class StatisticsAPIView(APIView):
    """Get disease detection statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get statistics for current user"""
        detections = AnimalDetection.objects.filter(user=request.user)
        
        # Disease distribution
        disease_counts = {}
        for d in detections:
            disease_counts[d.disease_name] = disease_counts.get(d.disease_name, 0) + 1
        
        # Status distribution
        status_counts = {}
        for d in detections:
            status_counts[d.status] = status_counts.get(d.status, 0) + 1
        
        # Average confidence
        avg_confidence = 0
        if detections.exists():
            avg_confidence = sum(d.confidence_score for d in detections) / detections.count()
        
        return Response({
            "total_detections": detections.count(),
            "disease_distribution": disease_counts,
            "status_distribution": status_counts,
            "average_confidence": round(avg_confidence, 3),
            "latest_detection": detections.first().created_at if detections.exists() else None
        })
