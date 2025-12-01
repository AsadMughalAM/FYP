import argparse
from pathlib import Path
import os
import sys

# ensure package path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ml_model.disease_detector import DiseaseDetectionModel


def main():
    parser = argparse.ArgumentParser(description='Run non-interactive training')
    parser.add_argument('--dataset', '-d', required=True, help='Path to dataset')
    parser.add_argument('--epochs', type=int, default=2, help='Number of epochs')
    parser.add_argument('--batch', type=int, default=16, help='Batch size')
    args = parser.parse_args()

    dataset_path = Path(args.dataset)
    if not dataset_path.exists():
        print(f'Dataset not found: {dataset_path}')
        return 2

    model = DiseaseDetectionModel(model_name='cow_disease_detector')
    print('Starting training with dataset:', dataset_path)
    model.train(str(dataset_path), epochs=args.epochs, batch_size=args.batch)

    out_dir = Path(__file__).resolve().parent / 'trained_models'
    model.save_model(save_path=str(out_dir))
    print('Model saved to', out_dir)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
