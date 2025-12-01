from django.core.management.base import BaseCommand
from pathlib import Path
import argparse
import os
import sys

# Import the model class from ml_model
from ...disease_detector import DiseaseDetectionModel

class Command(BaseCommand):
    help = 'Train the animal disease detection model. Example: python manage.py train_model --dataset "C:/..." --epochs 50'

    def add_arguments(self, parser):
        parser.add_argument('--dataset', '-d', type=str, help='Path to dataset', required=False)
        parser.add_argument('--epochs', type=int, default=50)
        parser.add_argument('--batch-size', type=int, default=32)
        parser.add_argument('--validation-split', type=float, default=0.2)
        parser.add_argument('--save-dir', type=str, default=None, help='Directory to save trained models (default: server/ml_model/trained_models)')

    def handle(self, *args, **options):
        dataset = options.get('dataset')
        epochs = options.get('epochs')
        batch_size = options.get('batch_size')
        val_split = options.get('validation_split')
        save_dir = options.get('save_dir')

        base_dir = Path(__file__).resolve().parents[4]  # move up to project root
        default_dataset = base_dir / 'server' / 'Cows datasets'
        default_save_dir = base_dir / 'server' / 'ml_model' / 'trained_models'

        if not dataset:
            dataset_path = default_dataset
            self.stdout.write(self.style.WARNING(f'No dataset path provided, using default: {dataset_path}'))
        else:
            dataset_path = Path(dataset)

        if not dataset_path.exists():
            self.stderr.write(self.style.ERROR(f'Dataset path does not exist: {dataset_path}'))
            return

        save_dir = Path(save_dir) if save_dir else default_save_dir
        os.makedirs(save_dir, exist_ok=True)

        self.stdout.write(self.style.SUCCESS(f'Found dataset: {dataset_path}'))
        # Initialize and train
        model = DiseaseDetectionModel(model_name='cow_disease_detector')
        try:
            history = model.train(str(dataset_path), epochs=epochs, batch_size=batch_size, validation_split=val_split)
            # Save model to save_dir
            model.save_model(save_path=str(save_dir))
            # Additionally export SavedModel format
            try:
                sm_path = save_dir / 'cow_disease_detector_savedmodel'
                model.model.save(str(sm_path), save_format='tf')
                self.stdout.write(self.style.SUCCESS(f'Saved SavedModel at: {sm_path}'))
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'Could not save SavedModel: {e}'))

            # Optionally instruct how to convert to ONNX externally
            self.stdout.write(self.style.SUCCESS('Training and export complete.'))
            self.stdout.write(self.style.NOTICE(f'Model files in: {save_dir}'))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Training failed: {e}'))