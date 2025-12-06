import pandas as pd
import os
import json
from pathlib import Path
from django.conf import settings
from collections import defaultdict
import re

class DatasetProcessor:
    """Process and manage dataset files from server/Dataset/"""
    
    _instance = None
    _symptoms = None
    _diseases = None
    _disease_symptom_map = None
    _symptom_disease_map = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatasetProcessor, cls).__new__(cls)
        return cls._instance
    
    def _normalize_symptom_name(self, symptom):
        """Normalize symptom name for better matching"""
        symptom = str(symptom).lower().strip()
        symptom = re.sub(r'[_-]', ' ', symptom)
        symptom = re.sub(r'\s+', ' ', symptom)
        return symptom
    
    def _format_symptom_name(self, symptom):
        """Format symptom name for display"""
        symptom = str(symptom).replace('_', ' ').replace('-', ' ')
        words = symptom.split()
        return ' '.join(word.capitalize() for word in words)
    
    def load_dataset(self):
        """Load and process all dataset files from Dataset folder"""
        import logging
        logger = logging.getLogger(__name__)
        
        if self._symptoms is not None:
            logger.info("✅ Dataset already loaded, skipping")
            return
        
        logger.info("🔄 Starting dataset load...")
        dataset_dir = Path(settings.BASE_DIR) / 'Dataset'
        logger.info(f"📁 Dataset directory: {dataset_dir}")
        logger.info(f"📁 Directory exists: {dataset_dir.exists()}")
        logger.info(f"📁 BASE_DIR: {settings.BASE_DIR}")
        
        if not dataset_dir.exists():
            error_msg = f"Dataset directory not found: {dataset_dir}"
            logger.error(f"❌ {error_msg}")
            raise FileNotFoundError(error_msg)
        
        all_data = []
        symptoms_set = set()
        disease_symptom_map = defaultdict(lambda: {'symptoms': [], 'count': 0})
        
        csv_files = list(dataset_dir.glob('*.csv'))
        logger.info(f"📄 Found {len(csv_files)} CSV files: {[f.name for f in csv_files]}")
        
        if not csv_files:
            error_msg = f"No CSV files found in {dataset_dir}"
            logger.error(f"❌ {error_msg}")
            raise FileNotFoundError(error_msg)
        
        for csv_file in csv_files:
            try:
                logger.info(f"📄 Processing {csv_file.name}...")
                df = pd.read_csv(csv_file)
                logger.info(f"✅ Loaded {len(df)} rows from {csv_file.name}")
                
                if 'prognosis' not in df.columns:
                    logger.warning(f"⚠️ {csv_file.name} does not have 'prognosis' column, skipping")
                    continue
                
                symptom_columns = [col for col in df.columns if col != 'prognosis']
                symptoms_set.update(symptom_columns)
                logger.info(f"✅ Found {len(symptom_columns)} symptom columns")
                
                row_count = 0
                for _, row in df.iterrows():
                    disease = str(row['prognosis']).strip().lower()
                    if pd.isna(disease) or disease == '':
                        continue
                    
                    active_symptoms = []
                    for symptom in symptom_columns:
                        if pd.notna(row[symptom]) and int(row[symptom]) == 1:
                            active_symptoms.append(symptom)
                    
                    if active_symptoms:
                        disease_symptom_map[disease]['symptoms'].extend(active_symptoms)
                        disease_symptom_map[disease]['count'] += 1
                        row_count += 1
                
                logger.info(f"✅ Processed {row_count} valid rows from {csv_file.name}")
                all_data.append(df)
            except Exception as e:
                logger.error(f"❌ Error processing {csv_file}: {e}")
                import traceback
                logger.error(traceback.format_exc())
                print(f"Warning: Could not process {csv_file}: {e}")
                continue
        
        if not all_data:
            raise ValueError("No valid data found in dataset files")
        
        combined_df = pd.concat(all_data, ignore_index=True)
        
        symptom_columns = [col for col in combined_df.columns if col != 'prognosis']
        self._symptoms = sorted([self._format_symptom_name(s) for s in symptom_columns])
        
        disease_list = []
        symptom_disease_map = defaultdict(set)
        
        processed_disease_map = {}
        
        for disease, data in disease_symptom_map.items():
            symptom_counts = defaultdict(int)
            for symptom in data['symptoms']:
                symptom_counts[symptom] += 1
            
            total_cases = data['count']
            common_symptoms = [
                {
                    'name': self._format_symptom_name(symptom),
                    'frequency': count / total_cases,
                    'raw_name': symptom
                }
                for symptom, count in sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)
            ]
            
            disease_list.append({
                'id': disease,
                'name': self._format_symptom_name(disease),
                'common_symptoms': common_symptoms[:10],
                'total_cases': total_cases
            })
            
            processed_disease_map[disease] = {
                'symptoms': list(symptom_counts.keys()),
                'count': total_cases
            }
            
            for symptom in symptom_counts.keys():
                symptom_disease_map[symptom].add(disease)
        
        self._diseases = disease_list
        self._disease_symptom_map = processed_disease_map
        self._symptom_disease_map = {
            self._format_symptom_name(k): list(v) 
            for k, v in symptom_disease_map.items()
        }
        
        logger.info(f"✅ Loaded {len(self._symptoms)} symptoms and {len(self._diseases)} diseases")
        logger.info(f"✅ Sample symptoms: {self._symptoms[:5]}")
        logger.info(f"✅ Sample diseases: {[d['name'] for d in self._diseases[:5]]}")
        print(f"✅ Loaded {len(self._symptoms)} symptoms and {len(self._diseases)} diseases")
    
    def get_symptoms(self):
        """Get list of all symptoms"""
        if self._symptoms is None:
            self.load_dataset()
        return self._symptoms
    
    def get_diseases(self):
        """Get list of all diseases"""
        if self._diseases is None:
            self.load_dataset()
        return self._diseases
    
    def diagnose(self, input_symptoms, top_n=5):
        """
        Diagnose based on input symptoms
        
        Args:
            input_symptoms: List of symptom names (can be formatted or raw)
            top_n: Number of top matches to return
        
        Returns:
            List of dictionaries with disease, confidence, and details
        """
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            logger.info(f"🔍 diagnose() called with {len(input_symptoms)} symptoms: {input_symptoms}")
            
            if self._disease_symptom_map is None:
                logger.info("📦 Loading dataset (first time)...")
                self.load_dataset()
                logger.info("✅ Dataset loaded successfully")
            
            if not input_symptoms:
                logger.warning("⚠️ No input symptoms provided")
                return []
            
            if not isinstance(input_symptoms, list):
                logger.error(f"❌ input_symptoms is not a list: {type(input_symptoms)}")
                raise ValueError(f"input_symptoms must be a list, got {type(input_symptoms)}")
            
            logger.info(f"🔄 Normalizing {len(input_symptoms)} symptoms...")
            normalized_input = [self._normalize_symptom_name(s) for s in input_symptoms]
            logger.info(f"✅ Normalized symptoms: {normalized_input}")
            
            logger.info(f"🔄 Processing {len(self._disease_symptom_map)} diseases...")
            disease_scores = defaultdict(lambda: {'matches': 0, 'total_symptoms': 0, 'matched_symptoms': []})
            
            for disease, data in self._disease_symptom_map.items():
                all_symptoms = [self._normalize_symptom_name(s) for s in data['symptoms']]
                unique_symptoms = set(all_symptoms)
                
                matched = []
                for input_symptom in normalized_input:
                    for symptom in unique_symptoms:
                        if input_symptom in symptom or symptom in input_symptom:
                            matched.append(symptom)
                            break
                
                if matched:
                    disease_scores[disease]['matches'] = len(matched)
                    disease_scores[disease]['total_symptoms'] = len(unique_symptoms)
                    disease_scores[disease]['matched_symptoms'] = matched
            
            logger.info(f"✅ Found {len(disease_scores)} diseases with matches")
            
            results = []
            for disease, score_data in disease_scores.items():
                if score_data['matches'] == 0:
                    continue
                
                match_ratio = score_data['matches'] / len(normalized_input)
                symptom_coverage = score_data['matches'] / max(score_data['total_symptoms'], 1)
                
                confidence = (match_ratio * 0.6) + (symptom_coverage * 0.4)
                
                disease_info = self._get_disease_info(disease)
                
                results.append({
                    'disease_id': disease,
                    'disease_name': disease_info.get('name', self._format_symptom_name(disease)),
                    'confidence': round(confidence, 3),
                    'match_rate': round(match_ratio * 100, 1),
                    'matched_symptoms': [self._format_symptom_name(s) for s in score_data['matched_symptoms']],
                    'total_symptoms_in_disease': score_data['total_symptoms'],
                    'severity': disease_info.get('severity', 'Unknown'),
                    'treatment': disease_info.get('treatment', []),
                    'prevention': disease_info.get('prevention', []),
                    'medicines': disease_info.get('antibiotics', []),
                    'contagious': disease_info.get('contagious', False)
                })
            
            results.sort(key=lambda x: x['confidence'], reverse=True)
            final_results = results[:top_n]
            logger.info(f"✅ Returning top {len(final_results)} results")
            return final_results
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            logger.error(f"❌ Error in diagnose(): {str(e)}")
            logger.error(f"❌ Traceback: {error_trace}")
            print(f"❌ ERROR in diagnose(): {str(e)}")
            print(f"❌ Traceback: {error_trace}")
            raise
    
    def _get_disease_info(self, disease_id):
        """Get disease information from disease_info.json"""
        disease_id = disease_id.lower().strip()
        
        disease_info_path = Path(settings.BASE_DIR) / 'ml_model' / 'disease_info.json'
        
        if disease_info_path.exists():
            try:
                with open(disease_info_path, 'r') as f:
                    disease_info = json.load(f)
                    
                for key, info in disease_info.items():
                    if key.lower() == disease_id or disease_id in key.lower() or key.lower() in disease_id:
                        return info
            except Exception as e:
                print(f"Error loading disease info: {e}")
        
        return {}
    
    def get_disease_details(self, disease_id):
        """Get detailed information about a specific disease"""
        if self._disease_symptom_map is None:
            self.load_dataset()
        
        disease_id = disease_id.lower().strip()
        
        disease_info = self._get_disease_info(disease_id)
        
        if disease_id in self._disease_symptom_map:
            all_symptoms = self._disease_symptom_map[disease_id]['symptoms']
            symptom_counts = defaultdict(int)
            for symptom in all_symptoms:
                symptom_counts[symptom] += 1
            
            common_symptoms = [
                {
                    'name': self._format_symptom_name(symptom),
                    'frequency': count / len(all_symptoms),
                    'raw_name': symptom
                }
                for symptom, count in sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)
            ]
        else:
            common_symptoms = []
        
        return {
            'id': disease_id,
            'name': disease_info.get('name', self._format_symptom_name(disease_id)),
            'symptoms': [s['name'] for s in common_symptoms[:15]],
            'severity': disease_info.get('severity', 'Unknown'),
            'treatment': disease_info.get('treatment', []),
            'prevention': disease_info.get('prevention', []),
            'medicines': disease_info.get('antibiotics', []),
            'contagious': disease_info.get('contagious', False),
            'duration': disease_info.get('duration', 'Unknown'),
            'causes': disease_info.get('causes', [])
        }

