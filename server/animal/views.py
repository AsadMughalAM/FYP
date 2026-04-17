from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import requests
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
from .gemini_service import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GEMINI_TIMEOUT_SECONDS,
    GEMINI_API_BASE_URL_V1BETA,
    GEMINI_API_BASE_URL_V1,
)

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
            h5_model_path = Path(settings.BASE_DIR) / 'ml_model' / 'trained_models' / 'cow_disease_detector.h5'
            saved_model_path = Path(settings.BASE_DIR) / 'ml_model' / 'trained_models' / 'cow_disease_detector_savedmodel'
            classes_path = Path(settings.BASE_DIR) / 'ml_model' / 'trained_models' / 'cow_disease_detector_classes.pkl'

            model_path = None
            if os.path.exists(h5_model_path):
                model_path = h5_model_path
                print(f"🔍 Using H5 model: {h5_model_path.resolve()}")
            elif os.path.exists(saved_model_path):
                model_path = saved_model_path
                print(f"🔍 Using SavedModel directory: {saved_model_path.resolve()}")

            print(f"🔍 Looking for H5 model at: {h5_model_path.resolve()}")
            print(f"🔍 Looking for SavedModel at: {saved_model_path.resolve()}")
            print(f"🔍 Looking for classes at: {classes_path.resolve()}")
            
            if model_path is None:
                error_msg = (
                    f"Model file not found. Expected one of: "
                    f"{h5_model_path.resolve()} or {saved_model_path.resolve()}"
                )
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
            
            # Patch BatchNormalization/InputLayer for cross-version deserialization
            from tensorflow.keras.layers import BatchNormalization as OriginalBN
            from tensorflow.keras.layers import InputLayer as OriginalInputLayer
            
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
                        if custom_objects is not None:
                            try:
                                return super().from_config(config, custom_objects)
                            except TypeError:
                                return super().from_config(config)
                        return super().from_config(config)
                    except (TypeError, ValueError) as e:
                        # If still fails, try with default axis
                        if 'axis' in config:
                            config['axis'] = -1
                        if custom_objects is not None:
                            try:
                                return super().from_config(config, custom_objects)
                            except TypeError:
                                return super().from_config(config)
                        return super().from_config(config)

            class FixedInputLayer(OriginalInputLayer):
                """Custom InputLayer that maps legacy batch_shape configs."""
                @classmethod
                def from_config(cls, config, custom_objects=None):
                    if isinstance(config, dict) and 'batch_shape' in config:
                        batch_shape = config.pop('batch_shape')
                        if isinstance(batch_shape, (list, tuple)) and len(batch_shape) >= 1:
                            batch_size = batch_shape[0]
                            input_shape = tuple(batch_shape[1:]) if len(batch_shape) > 1 else ()
                            if batch_size is not None:
                                config['batch_size'] = batch_size
                            if input_shape:
                                config['input_shape'] = input_shape
                    if custom_objects is not None:
                        try:
                            return super().from_config(config, custom_objects)
                        except TypeError:
                            return super().from_config(config)
                    return super().from_config(config)
            
            # Register custom objects - use the fixed version
            policy_class = tf.keras.mixed_precision.Policy
            custom_objects = {
                'BatchNormalization': FixedBatchNormalization,
                'keras.layers.BatchNormalization': FixedBatchNormalization,
                'tensorflow.keras.layers.BatchNormalization': FixedBatchNormalization,
                'InputLayer': FixedInputLayer,
                'keras.layers.InputLayer': FixedInputLayer,
                'tensorflow.keras.layers.InputLayer': FixedInputLayer,
                'DTypePolicy': policy_class,
                'keras.DTypePolicy': policy_class,
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

                # Fallback: rebuild architecture from H5 JSON config after normalizing
                # legacy keys (batch_shape, DTypePolicy) that break newer deserializers.
                try:
                    if not str(model_path).lower().endswith('.h5'):
                        raise ValueError("H5-only fallback skipped for non-H5 model format.")

                    import h5py
                    import json

                    def _normalize_layer_config(node):
                        if isinstance(node, dict):
                            if node.get('class_name') == 'InputLayer' and isinstance(node.get('config'), dict):
                                cfg = node['config']
                                if 'batch_shape' in cfg:
                                    batch_shape = cfg.pop('batch_shape')
                                    if isinstance(batch_shape, (list, tuple)) and len(batch_shape) >= 1:
                                        cfg['batch_input_shape'] = list(batch_shape)

                            if node.get('class_name') == 'DTypePolicy':
                                return 'float32'

                            for k, v in list(node.items()):
                                node[k] = _normalize_layer_config(v)
                            return node

                        if isinstance(node, list):
                            return [_normalize_layer_config(item) for item in node]

                        return node

                    with h5py.File(str(model_path), 'r') as h5f:
                        raw_model_config = h5f.attrs.get('model_config')
                        if isinstance(raw_model_config, bytes):
                            raw_model_config = raw_model_config.decode('utf-8')
                        model_config = json.loads(raw_model_config)
                        model_config = _normalize_layer_config(model_config)

                    model_json = json.dumps(model_config)
                    self._model = tf.keras.models.model_from_json(model_json, custom_objects=custom_objects)
                    self._model.load_weights(str(model_path))
                    print("✅ Model loaded successfully via normalized H5 config fallback")
                except Exception as manual_load_error:
                    print(f"⚠️ Manual H5 config fallback failed: {str(manual_load_error)[:200]}...")
                
                # Try alternative loading methods for version compatibility issues
                if self._model is not None:
                    pass
                elif 'Operation.from_config' in error_str or 'takes 2 positional arguments but 3 were given' in error_str:
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
            print(f"🔄 Model: {GEMINI_MODEL}")
            print(f"")
            
            info = get_disease_info(normalized_name, use_cache=False, force_fresh=True)
            if not info:
                return Response(
                    {
                        "error": "Disease info unavailable",
                        "message": "Unable to fetch disease information at this time. Please try again."
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Log the data source for debugging BEFORE removing it
            data_source = info.get('_source', 'unknown')
            
            if data_source == 'gemini_error':
                return Response(
                    {
                        "error": "Gemini API failed",
                        "message": "Real-time disease information is unavailable right now.",
                        "gemini_error": info.get("gemini_error"),
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
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
                print(f"⚠️ Unknown data source: {data_source} (continuing)")
            
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
                "data_source": "gemini_api_realtime" if data_source == "gemini_api" else "json_fallback",
                "timestamp": detection.created_at.isoformat()
            }
            
            if data_source != "gemini_api":
                response_data["warning"] = (
                    "Real-time disease info (Gemini) is temporarily unavailable. "
                    "Showing fallback data instead."
                )

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


from .dataset_processor import DatasetProcessor
from .models import SymptomDiagnosis
from .serializers import SymptomDiagnosisSerializer

class SymptomsAPIView(APIView):
    """Get list of all symptoms from dataset"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Return all available symptoms"""
        try:
            processor = DatasetProcessor()
            symptoms = processor.get_symptoms()
            
            return Response({
                "success": True,
                "count": len(symptoms),
                "symptoms": symptoms
            })
        except FileNotFoundError as e:
            return Response(
                {
                    "success": False,
                    "error": "Dataset not found",
                    "message": str(e)
                },
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Failed to load symptoms",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DiagnoseAPIView(APIView):
    """Diagnose disease based on symptoms"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Diagnose disease from symptoms
        
        Expected JSON:
        {
            "symptoms": ["fever", "lameness", "loss of appetite"]
        }
        """
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            logger.info(f"🔍 DiagnoseAPIView POST request received")
            logger.info(f"📦 Content-Type: {request.content_type}")
            logger.info(f"📦 Request method: {request.method}")
            
            symptoms = request.data.get('symptoms', [])
            logger.info(f"📦 Request data: {request.data}")
            logger.info(f"✅ Extracted symptoms: {symptoms}")
            logger.info(f"✅ Symptoms type: {type(symptoms)}")
            logger.info(f"✅ Symptoms length: {len(symptoms) if isinstance(symptoms, list) else 'N/A'}")
            
            if not symptoms:
                logger.warning("❌ No symptoms provided in request")
                return Response(
                    {
                        "success": False,
                        "error": "No symptoms provided",
                        "message": "Please provide at least one symptom",
                        "received_data": str(request.data)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not isinstance(symptoms, list):
                logger.warning(f"❌ Symptoms is not a list, type: {type(symptoms)}")
                return Response(
                    {
                        "success": False,
                        "error": "Invalid format",
                        "message": "Symptoms must be a list",
                        "received_type": str(type(symptoms)),
                        "received_data": str(symptoms)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"🔄 Initializing DatasetProcessor...")
            processor = DatasetProcessor()
            logger.info(f"🔄 Calling diagnose with symptoms: {symptoms}")
            results = processor.diagnose(symptoms, top_n=5)
            logger.info(f"✅ Diagnosis complete, found {len(results)} results")
            
            if not results:
                logger.info("⚠️ No matching diseases found")
                return Response({
                    "success": True,
                    "message": "No matching diseases found for the provided symptoms",
                    "results": [],
                    "suggestions": "Try selecting different symptoms or check spelling",
                    "input_symptoms": symptoms
                })
            
            # Get the best result (first one, highest confidence)
            best_result = results[0]
            disease_id = best_result.get('disease_id', '')
            disease_name_from_result = best_result.get('disease_name', 'Unknown')
            
            # Extract optional fields from request
            animal_name = request.data.get('animal_name', '')
            animal_age = request.data.get('animal_age', None)
            notes = request.data.get('notes', '')
            
            # Fetch REAL-TIME disease info from Gemini API (same as image-based detection)
            logger.info(f"")
            logger.info(f"🔄🔄🔄 FETCHING REAL-TIME GEMINI DATA FOR SYMPTOM DIAGNOSIS 🔄🔄🔄")
            logger.info(f"🔄 Disease ID: {disease_id}")
            logger.info(f"🔄 Disease Name: {disease_name_from_result}")
            
            # Use disease_id if available, otherwise use disease_name
            gemini_disease_key = disease_id if disease_id else disease_name_from_result.lower().replace(' ', '-')
            
            from .gemini_service import GEMINI_API_KEY, GEMINI_MODEL
            logger.info(f"🔄 Calling Gemini API for: {gemini_disease_key}")
            logger.info(f"🔄 Model: {GEMINI_MODEL}")
            
            gemini_info = get_disease_info(gemini_disease_key, use_cache=False, force_fresh=True)
            
            # Log the data source
            data_source = gemini_info.get('_source', 'unknown')
            logger.info(f"🔄 Data source: {data_source}")
            
            # Use Gemini data if available, otherwise fallback to dataset processor data
            if data_source == 'gemini_api':
                logger.info(f"✅✅✅ SUCCESS: REAL-TIME GEMINI DATA RECEIVED ✅✅✅")
                logger.info(f"✅ Disease: {gemini_info.get('name', disease_name_from_result)}")
                logger.info(f"✅ Severity: {gemini_info.get('severity', 'Unknown')}")
                logger.info(f"✅ Treatment count: {len(gemini_info.get('treatment', []))}")
                logger.info(f"✅ Prevention count: {len(gemini_info.get('prevention', []))}")
                logger.info(f"✅ Medicines count: {len(gemini_info.get('antibiotics', []))}")
                
                # Update best_result with Gemini data
                best_result['disease_name'] = gemini_info.get('name', disease_name_from_result)
                best_result['severity'] = gemini_info.get('severity', 'Unknown')
                best_result['treatment'] = gemini_info.get('treatment', [])
                best_result['prevention'] = gemini_info.get('prevention', [])
                best_result['medicines'] = gemini_info.get('antibiotics', [])
                best_result['contagious'] = gemini_info.get('contagious', False)
                
                # Update all results with Gemini data for the best match
                results[0] = best_result
            else:
                logger.warning(f"⚠️ Gemini API returned {data_source}, using dataset processor data")
                # Keep the original data from dataset processor
            
            # Save diagnosis to database with Gemini-enhanced data
            try:
                logger.info(f"💾 Saving diagnosis to database with Gemini data...")
                diagnosis = SymptomDiagnosis.objects.create(
                    user=request.user,
                    animal_name=animal_name or None,
                    animal_age=animal_age,
                    input_symptoms=symptoms,
                    disease_name=best_result.get('disease_name', 'Unknown'),
                    disease_id=disease_id,
                    confidence_score=best_result.get('confidence', 0.0),
                    match_rate=best_result.get('match_rate', 0.0) / 100.0,  # Convert percentage to decimal
                    severity=best_result.get('severity', 'Unknown'),
                    matched_symptoms=best_result.get('matched_symptoms', []),
                    treatment=best_result.get('treatment', []),
                    prevention=best_result.get('prevention', []),
                    medicines=best_result.get('medicines', []),
                    contagious=best_result.get('contagious', False),
                    all_results=results,  # Store all results for reference
                    notes=notes or None,
                    status='diagnosed'
                )
                logger.info(f"✅ Diagnosis saved with ID: {diagnosis.id}")
                logger.info(f"✅ Saved with Gemini-enhanced data: {data_source == 'gemini_api'}")
                
                # Serialize the saved diagnosis for response
                serializer = SymptomDiagnosisSerializer(diagnosis, context={'request': request})
                saved_diagnosis_data = serializer.data
                
            except Exception as save_error:
                logger.error(f"❌ Error saving diagnosis to database: {str(save_error)}")
                import traceback
                logger.error(traceback.format_exc())
                saved_diagnosis_data = None
            
            logger.info(f"✅ Returning {len(results)} disease matches")
            response_data = {
                "success": True,
                "message": f"Found {len(results)} possible disease(s)",
                "results": results,
                "input_symptoms": symptoms,
                "diagnosis_id": saved_diagnosis_data.get('id') if saved_diagnosis_data else None,
                "saved": saved_diagnosis_data is not None,
                "gemini_enhanced": data_source == 'gemini_api'  # Indicate if Gemini data was used
            }
            
            if saved_diagnosis_data:
                response_data["saved_diagnosis"] = saved_diagnosis_data
            
            logger.info(f"📤 Sending response with {len(results)} results")
            logger.info(f"📤 Gemini enhanced: {response_data['gemini_enhanced']}")
            return Response(response_data, status=status.HTTP_200_OK)
            
        except FileNotFoundError as e:
            logger.error(f"❌ FileNotFoundError: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return Response(
                {
                    "success": False,
                    "error": "Dataset not found",
                    "message": str(e),
                    "details": "Please ensure dataset files exist in server/Dataset/"
                },
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            logger.error(f"❌ Exception in DiagnoseAPIView: {str(e)}")
            logger.error(f"❌ Traceback: {error_trace}")
            print(f"❌ ERROR in DiagnoseAPIView: {str(e)}")
            print(f"❌ Traceback: {error_trace}")
            return Response(
                {
                    "success": False,
                    "error": "Diagnosis failed",
                    "message": str(e),
                    "error_type": type(e).__name__,
                    "details": error_trace.split('\n')[-5:] if error_trace else None
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DiseaseDetailAPIView(APIView):
    """Get detailed information about a specific disease"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, disease_id):
        """
        Get disease details by ID
        
        Args:
            disease_id: Disease identifier (e.g., 'mastitis', 'foot-and-mouth')
        """
        try:
            processor = DatasetProcessor()
            disease_details = processor.get_disease_details(disease_id)
            
            if not disease_details.get('name'):
                return Response(
                    {
                        "success": False,
                        "error": "Disease not found",
                        "message": f"Disease '{disease_id}' not found in dataset"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                "success": True,
                "data": disease_details
            })
            
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Failed to fetch disease details",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SymptomDiagnosisHistoryAPIView(APIView):
    """Get symptom diagnosis history for current user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all symptom diagnoses for current user"""
        try:
            diagnoses = SymptomDiagnosis.objects.filter(user=request.user).order_by('-created_at')
            serializer = SymptomDiagnosisSerializer(diagnoses, many=True, context={'request': request})
            return Response({
                "success": True,
                "count": diagnoses.count(),
                "data": serializer.data
            })
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Failed to fetch diagnosis history",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SymptomDiagnosisDetailAPIView(APIView):
    """Get specific symptom diagnosis details"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, diagnosis_id):
        """Get symptom diagnosis details"""
        try:
            diagnosis = SymptomDiagnosis.objects.get(
                id=diagnosis_id,
                user=request.user
            )
            serializer = SymptomDiagnosisSerializer(diagnosis, context={'request': request})
            return Response({
                "success": True,
                "data": serializer.data
            })
        except SymptomDiagnosis.DoesNotExist:
            return Response(
                {"success": False, "error": "Diagnosis not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class VetChatAPIView(APIView):
    """Secure server-side Gemini chat proxy for VetChat UI."""

    permission_classes = [IsAuthenticated]

    @staticmethod
    def _build_system_prompt():
        return (
            "You are a professional veterinary assistant providing expert guidance on "
            "animal health and wellness.\n\n"
            "IMPORTANT GUIDELINES:\n"
            "- Always respond formally, politely, and professionally\n"
            "- Provide accurate, evidence-based information about animal health\n"
            "- For serious or emergency symptoms, recommend consulting a licensed veterinarian immediately\n"
            "- Be empathetic and understanding in your responses\n"
            "- Avoid definitive diagnoses; provide general guidance and suggest professional consultation\n"
            "- Use clear language accessible to pet owners\n"
            "- For medications/treatments, advise veterinarian consultation for dosing\n"
            "- If unsure, clearly say so and suggest consulting a professional\n\n"
            "Keep responses concise, practical, and safety-first."
        )

    def post(self, request):
        user_message = (request.data.get("message") or "").strip()
        history = request.data.get("history", [])

        if not user_message:
            return Response(
                {"error": "Message is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not GEMINI_API_KEY:
            return Response(
                {"error": "Server Gemini API key is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        normalized_history = []
        if isinstance(history, list):
            for item in history[-10:]:
                role = item.get("role") if isinstance(item, dict) else None
                text = item.get("text") if isinstance(item, dict) else None
                if role in ("user", "model") and isinstance(text, str) and text.strip():
                    normalized_history.append(
                        {"role": role, "parts": [{"text": text.strip()}]}
                    )

        request_body = {
            "contents": [
                {"role": "user", "parts": [{"text": self._build_system_prompt()}]},
                *normalized_history,
                {"role": "user", "parts": [{"text": user_message}]},
            ],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 1024,
            },
        }

        fallback_models_raw = os.environ.get("GEMINI_FALLBACK_MODELS", "")
        fallback_models = [m.strip() for m in fallback_models_raw.split(",") if m.strip()]
        models_to_try = [GEMINI_MODEL, *fallback_models]

        last_error = None
        for model in models_to_try:
            base_urls_to_try = [(GEMINI_API_BASE_URL_V1BETA, "v1beta")]
            if not model.endswith("-latest"):
                base_urls_to_try.append((GEMINI_API_BASE_URL_V1, "v1"))

            for base_url, _version in base_urls_to_try:
                url = f"{base_url}/models/{model}:generateContent?key={GEMINI_API_KEY}"
                try:
                    response = requests.post(
                        url,
                        json=request_body,
                        headers={"Content-Type": "application/json"},
                        timeout=GEMINI_TIMEOUT_SECONDS,
                    )

                    if response.status_code != 200:
                        last_error = response.text[:300]
                        continue

                    data = response.json()
                    candidates = data.get("candidates") or []
                    if not candidates:
                        last_error = "Gemini returned no candidates"
                        continue

                    parts = candidates[0].get("content", {}).get("parts", [])
                    if not parts or "text" not in parts[0]:
                        last_error = "Gemini returned unexpected response format"
                        continue

                    return Response(
                        {
                            "reply": parts[0]["text"].strip(),
                            "model": model,
                        },
                        status=status.HTTP_200_OK,
                    )
                except requests.exceptions.RequestException as exc:
                    last_error = str(exc)
                    continue

        return Response(
            {"error": "Gemini chat request failed", "details": last_error},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    
    def patch(self, request, diagnosis_id):
        """Update symptom diagnosis status and notes"""
        try:
            diagnosis = SymptomDiagnosis.objects.get(
                id=diagnosis_id,
                user=request.user
            )
            
            # Update allowed fields
            if 'status' in request.data:
                diagnosis.status = request.data['status']
            if 'notes' in request.data:
                diagnosis.notes = request.data['notes']
            if 'animal_name' in request.data:
                diagnosis.animal_name = request.data['animal_name']
            if 'animal_age' in request.data:
                diagnosis.animal_age = request.data['animal_age']
            
            diagnosis.save()
            serializer = SymptomDiagnosisSerializer(diagnosis, context={'request': request})
            return Response({
                "success": True,
                "data": serializer.data
            })
            
        except SymptomDiagnosis.DoesNotExist:
            return Response(
                {"success": False, "error": "Diagnosis not found"},
                status=status.HTTP_404_NOT_FOUND
            )
