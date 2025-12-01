"""
Animal Disease Detection Model
Trains a CNN model to detect diseases in animal images
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report, confusion_matrix
import pickle
import json
from pathlib import Path

class DiseaseDetectionModel:
    def __init__(self, model_name="animal_disease_model", img_size=224):
        self.model_name = model_name
        self.img_size = img_size
        self.model = None
        self.class_indices = None
        self.disease_info = None
        
    def build_model(self, num_classes):
        """Build CNN model with transfer learning"""
        base_model = keras.applications.MobileNetV2(
            input_shape=(self.img_size, self.img_size, 3),
            include_top=False,
            weights='imagenet'
        )
        
        # Freeze base model
        base_model.trainable = False
        
        # Create model
        # NOTE: We use Rescaling layer in model, so ImageDataGenerator should NOT rescale
        # This ensures consistency between training and prediction
        model = models.Sequential([
            layers.Input(shape=(self.img_size, self.img_size, 3)),
            layers.Rescaling(1./255),  # Normalize pixel values to [0, 1]
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dense(256, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.3),
            layers.Dense(num_classes, activation='softmax')
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        self.model = model
        return model
    
    def train(self, dataset_path, epochs=50, batch_size=32, validation_split=0.2):
        """
        Train model on dataset
        
        Dataset structure:
        dataset/
        ├── disease1/
        │   ├── image1.jpg
        │   └── image2.jpg
        ├── disease2/
        │   └── ...
        """
        dataset_path = Path(dataset_path)
        
        if not dataset_path.exists():
            raise ValueError(f"Dataset path does not exist: {dataset_path}")
        
        # Get disease classes
        disease_classes = sorted([d.name for d in dataset_path.iterdir() if d.is_dir()])
        num_classes = len(disease_classes)
        
        print(f"Found {num_classes} disease classes: {disease_classes}")
        
        # Build model
        self.build_model(num_classes)
        
        # Create class indices mapping: index -> class_name
        # This ensures consistent mapping between training and prediction
        self.class_indices = {i: disease for i, disease in enumerate(disease_classes)}
        
        print(f"Class indices mapping: {self.class_indices}")
        print(f"Number of classes: {num_classes}")
        
        # Verify class order matches directory order
        for idx, class_name in enumerate(disease_classes):
            if self.class_indices[idx] != class_name:
                raise ValueError(f"Class index mismatch at index {idx}: expected {class_name}, got {self.class_indices[idx]}")
        
        # Data augmentation
        # IMPORTANT: Do NOT rescale here since model has Rescaling layer
        # This ensures preprocessing consistency between training and prediction
        train_datagen = ImageDataGenerator(
            rescale=None,  # Model handles rescaling via Rescaling layer
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            horizontal_flip=True,
            zoom_range=0.2,
            shear_range=0.2,
            fill_mode='nearest',
            validation_split=validation_split
        )
        
        # Load training data
        train_generator = train_datagen.flow_from_directory(
            str(dataset_path),
            target_size=(self.img_size, self.img_size),
            batch_size=batch_size,
            class_mode='categorical',
            subset='training'
        )
        
        # Load validation data
        val_generator = train_datagen.flow_from_directory(
            str(dataset_path),
            target_size=(self.img_size, self.img_size),
            batch_size=batch_size,
            class_mode='categorical',
            subset='validation'
        )
        
        # Verify generators have same class indices
        if train_generator.class_indices != val_generator.class_indices:
            raise ValueError("Training and validation generators have different class indices!")
        
        # Update class_indices from generator (ensures consistency)
        generator_class_indices = train_generator.class_indices
        # Invert: generator gives class_name -> index, we need index -> class_name
        self.class_indices = {v: k for k, v in generator_class_indices.items()}
        print(f"Updated class indices from generator: {self.class_indices}")
        
        # Calculate class weights for imbalanced datasets
        from sklearn.utils.class_weight import compute_class_weight
        import numpy as np
        
        # Get class distribution from training generator
        class_counts = train_generator.classes
        unique_classes = np.unique(class_counts)
        class_weights_dict = {}
        
        try:
            class_weights = compute_class_weight(
                'balanced',
                classes=unique_classes,
                y=class_counts
            )
            for i, cls in enumerate(unique_classes):
                class_weights_dict[int(cls)] = float(class_weights[i])
            print(f"Class weights computed: {class_weights_dict}")
            print(f"Class distribution: {dict(zip(unique_classes, np.bincount(class_counts)))}")
        except Exception as e:
            print(f"WARNING: Could not compute class weights: {e}. Using equal weights.")
            class_weights_dict = None
        
        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True,
                verbose=1
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-7,
                verbose=1
            ),
            keras.callbacks.ModelCheckpoint(
                filepath=os.path.join(str(Path(dataset_path).parent), 'best_model_checkpoint.h5'),
                monitor='val_accuracy',
                save_best_only=True,
                save_weights_only=False,
                verbose=1
            )
        ]
        
        # Train model
        print("Starting training...")
        print(f"Training samples: {train_generator.samples}")
        print(f"Validation samples: {val_generator.samples}")
        
        history = self.model.fit(
            train_generator,
            validation_data=val_generator,
            epochs=epochs,
            callbacks=callbacks,
            class_weight=class_weights_dict,  # Handle imbalanced classes
            verbose=1
        )
        
        print("Training completed!")
        
        # Evaluate on validation set
        print("\n" + "="*50)
        print("EVALUATION RESULTS")
        print("="*50)
        val_loss, val_acc = self.model.evaluate(val_generator, verbose=1)
        print(f"Validation Loss: {val_loss:.4f}")
        print(f"Validation Accuracy: {val_acc*100:.2f}%")
        
        # Get predictions for confusion matrix
        val_generator.reset()
        y_pred = self.model.predict(val_generator, verbose=0)
        y_pred_classes = np.argmax(y_pred, axis=1)
        y_true = val_generator.classes[:len(y_pred_classes)]
        
        # Print classification report
        print("\n" + "="*50)
        print("CLASSIFICATION REPORT")
        print("="*50)
        target_names = [self.class_indices[i] for i in sorted(self.class_indices.keys())]
        report = classification_report(y_true, y_pred_classes, target_names=target_names)
        print(report)
        
        # Print confusion matrix
        print("\n" + "="*50)
        print("CONFUSION MATRIX")
        print("="*50)
        cm = confusion_matrix(y_true, y_pred_classes)
        print(cm)
        
        print("\n" + "="*50)
        
        return history
    
    def predict(self, image_path):
        """Predict disease from image"""
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        # Load and preprocess image
        # IMPORTANT: Do NOT normalize here - model's Rescaling layer handles it
        # This matches the training preprocessing (no rescale in ImageDataGenerator)
        img = keras.preprocessing.image.load_img(
            image_path,
            target_size=(self.img_size, self.img_size),
            color_mode='rgb'
        )
        img_array = keras.preprocessing.image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        # Do NOT divide by 255.0 - model's Rescaling layer will handle normalization
        
        # Predict
        predictions = self.model.predict(img_array, verbose=0)
        predicted_class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_idx])
        
        disease = self.class_indices[predicted_class_idx]
        
        return {
            'disease': disease,
            'confidence': confidence,
            'all_predictions': {
                self.class_indices[i]: float(predictions[0][i])
                for i in range(len(predictions[0]))
            }
        }
    
    def save_model(self, save_path="models"):
        """Save trained model with proper class indices"""
        os.makedirs(save_path, exist_ok=True)
        
        if self.model is None:
            raise ValueError("No model to save. Train the model first.")
        
        if self.class_indices is None:
            raise ValueError("Class indices not set. Cannot save model without class mapping.")
        
        # Save model in H5 format
        model_path = os.path.join(save_path, f"{self.model_name}.h5")
        self.model.save(model_path, save_format='h5')
        print(f"Model saved: {model_path}")
        
        # Save class indices - ensure it's a dict mapping index -> class_name
        indices_path = os.path.join(save_path, f"{self.model_name}_classes.pkl")
        
        # Verify class_indices format
        if not isinstance(self.class_indices, dict):
            # Convert list/other format to dict
            if isinstance(self.class_indices, (list, tuple)):
                self.class_indices = {i: name for i, name in enumerate(self.class_indices)}
        
        # Save with verification
        with open(indices_path, 'wb') as f:
            pickle.dump(self.class_indices, f)
        
        # Print class mapping for verification
        print(f"Class indices saved: {indices_path}")
        print(f"Class mapping:")
        for idx in sorted(self.class_indices.keys()):
            print(f"   Index {idx}: {self.class_indices[idx]}")
        
        # Also save as JSON for human readability
        json_path = os.path.join(save_path, f"{self.model_name}_classes.json")
        import json
        with open(json_path, 'w') as f:
            json.dump(self.class_indices, f, indent=2)
        print(f"Class indices (JSON) saved: {json_path}")
    
    def load_model(self, model_path, classes_path):
        """Load trained model with validation"""
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        if not os.path.exists(classes_path):
            raise FileNotFoundError(f"Classes file not found: {classes_path}")
        
        # Load model
        self.model = keras.models.load_model(model_path, compile=False)
        print(f"Model loaded from {model_path}")
        
        # Load class indices
        with open(classes_path, 'rb') as f:
            loaded_indices = pickle.load(f)
        
        # Validate and convert class indices format
        if isinstance(loaded_indices, dict):
            self.class_indices = loaded_indices
        elif isinstance(loaded_indices, (list, tuple)):
            # Convert list to dict
            self.class_indices = {i: name for i, name in enumerate(loaded_indices)}
        else:
            raise ValueError(f"Invalid class_indices format: {type(loaded_indices)}")
        
        print(f"Class indices loaded: {self.class_indices}")
        
        # Verify model output shape matches number of classes
        if self.model.output_shape[-1] != len(self.class_indices):
            raise ValueError(
                f"Model output shape ({self.model.output_shape[-1]}) "
                f"does not match number of classes ({len(self.class_indices)})"
            )
        
        print(f"Model validation passed: {len(self.class_indices)} classes")
    
    def load_disease_info(self, json_path):
        """Load disease information (symptoms, treatment, etc)"""
        with open(json_path, 'r') as f:
            self.disease_info = json.load(f)


# Example usage
if __name__ == "__main__":
    # Initialize model
    model = DiseaseDetectionModel(model_name="cow_disease_detector")
    
    # Train model (replace with your dataset path)
    # dataset_path = r"C:\path\to\your\dataset"
    # history = model.train(dataset_path, epochs=50)
    
    # Save model
    # model.save_model(save_path="ml_model/trained_models")
    
    # Load model
    # model.load_model(
    #     "ml_model/trained_models/cow_disease_detector.h5",
    #     "ml_model/trained_models/cow_disease_detector_classes.pkl"
    # )
    
    # Predict
    # result = model.predict("path/to/image.jpg")
    # print(result)
