# Model Training Guide

## Critical Fixes Applied

### 1. Preprocessing Consistency (FIXED)
**Issue**: Training used double normalization (ImageDataGenerator `rescale=1./255` + model `Rescaling` layer), but prediction only normalized once.

**Fix**: 
- Removed `rescale=1./255` from ImageDataGenerator
- Model's Rescaling layer handles normalization consistently
- Prediction preprocessing matches training (no manual /255.0)

### 2. Class Weights for Imbalanced Data (ADDED)
- Automatically computes class weights using sklearn
- Handles imbalanced datasets (e.g., too many "healthy" images)
- Prevents model from always predicting majority class

### 3. Model Saving/Loading (IMPROVED)
- Validates class indices format
- Saves both pickle and JSON formats
- Verifies model output shape matches class count
- Better error messages

### 4. Training Improvements (ADDED)
- ModelCheckpoint callback saves best model
- EarlyStopping with restore_best_weights
- Classification report and confusion matrix
- Better validation metrics

## Training Command

```bash
cd server
python manage.py train_model --epochs 50 --batch-size 32
```

## Dataset Structure

```
dataset/
├── foot-and-mouth/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── ...
├── lumpy/
│   ├── image1.jpg
│   └── ...
└── healthy/
    ├── image1.jpg
    └── ...
```

**IMPORTANT**: Ensure balanced dataset or class weights will handle imbalance.

## Verification

After training, check:
1. Validation accuracy > 70%
2. Confusion matrix shows good diagonal values
3. Classification report shows balanced precision/recall
4. Model files saved in `ml_model/trained_models/`

## Troubleshooting

### Model always predicts "Healthy"
- Check dataset balance
- Verify class weights are computed correctly
- Ensure preprocessing matches (no double normalization)
- Retrain with more epochs

### Low accuracy
- Increase training epochs
- Check dataset quality
- Verify image preprocessing
- Consider data augmentation adjustments

