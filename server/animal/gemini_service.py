"""
Gemini API Service for fetching disease information dynamically
"""
import json
import os
from pathlib import Path
from django.conf import settings
import requests
from typing import Dict, Optional, List
from datetime import datetime, timedelta

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '').strip()
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-flash-latest')

# Try v1 API if v1beta doesn't work
GEMINI_API_BASE_URL_V1BETA = 'https://generativelanguage.googleapis.com/v1beta'
GEMINI_API_BASE_URL_V1 = 'https://generativelanguage.googleapis.com/v1'

# Use v1beta by default, but can fallback to v1
GEMINI_API_BASE_URL = GEMINI_API_BASE_URL_V1BETA
GEMINI_API_URL = f'{GEMINI_API_BASE_URL}/models/{GEMINI_MODEL}:generateContent'
DISEASE_INFO_PATH = Path(settings.BASE_DIR) / 'ml_model' / 'disease_info.json'

# Simple in-memory cache (expires after 24 hours)
_disease_info_cache: Dict[str, Dict] = {}
_cache_timestamps: Dict[str, datetime] = {}
CACHE_DURATION = timedelta(hours=24)


def load_disease_info_fallback():
    """Load disease information from JSON as fallback"""
    try:
        with open(DISEASE_INFO_PATH, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def get_disease_info_from_gemini(disease_name: str) -> Optional[Dict]:
    """
    Fetch disease information from Gemini API
    
    Args:
        disease_name: Name of the disease (e.g., 'foot-and-mouth', 'lumpy', 'healthy', or any other disease)
    
    Returns:
        Dictionary with disease information or None if API call fails
    """
    try:
        if not GEMINI_API_KEY:
            print('GEMINI_API_KEY is not set; add it to server/.env (see server/.env.example)')
            return None
        # Convert disease name to readable format (handle any disease name dynamically)
        disease_key = disease_name.lower().strip().replace('_', '-').replace(' ', '-')
        
        # Create readable name for prompt (smart formatting)
        readable_name = disease_key.replace('-', ' ').title()
        
        # Special handling for common cases
        if disease_key == 'healthy':
            readable_name = 'Healthy animal (no disease)'
        elif disease_key == 'foot-and-mouth':
            readable_name = 'Foot and Mouth Disease'
        elif disease_key == 'lumpy':
            readable_name = 'Lumpy Skin Disease'
        
        # Create comprehensive prompt for Gemini with strict JSON formatting
        prompt = f"""You are a veterinary expert. Provide detailed, accurate information about {readable_name} in livestock, specifically cattle/cows.

CRITICAL: You MUST return ONLY valid JSON. No markdown, no code blocks, no explanations. Start with {{ and end with }}.

Required JSON format:
{{
    "name": "Full official disease name",
    "severity": "None/Low/Medium/High/Critical",
    "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
    "treatment": ["treatment step 1", "treatment step 2", "treatment step 3"],
    "prevention": ["prevention method 1", "prevention method 2", "prevention method 3"],
    "contagious": true or false,
    "antibiotics": ["antibiotic 1", "antibiotic 2"]
}}

IMPORTANT JSON RULES:
1. All strings must be in double quotes
2. No line breaks inside string values - use spaces instead
3. No special characters that break JSON (like unescaped quotes)
4. Keep symptom/treatment/prevention text short (max 100 characters each)
5. Arrays must be properly closed with ]
6. Object must be properly closed with }}

SPECIFIC GUIDELINES:
- For healthy animals: severity="None", symptoms=["Normal appearance", "Good body condition", "Active behavior"], contagious=false
- Be medically accurate with proper veterinary terminology
- Include 3-6 items in each array
- Keep each item concise and clear
- Treatment steps should be actionable
- Prevention methods should be practical

Return ONLY valid JSON starting with {{ and ending with }}. No other text."""

        # Prepare request
        request_body = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 2048,  # Increased to prevent truncation
            },
            "safetySettings": [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE",
                },
            ],
        }

        # Use only gemini-flash-latest model
        model = GEMINI_MODEL
        
        print(f"🔍 Calling Gemini API for disease: {disease_name} -> {readable_name}")
        print(f"🔍 Model: {model}")

        # Try v1beta API first, then v1 as fallback
        base_urls_to_try = [
            (GEMINI_API_BASE_URL_V1BETA, 'v1beta'),
            (GEMINI_API_BASE_URL_V1, 'v1')
        ]
        
        response = None
        successful_version = None
        
        for base_url, version in base_urls_to_try:
            if response and response.status_code == 200:
                break
                
            url = f"{base_url}/models/{model}:generateContent?key={GEMINI_API_KEY}"
            print(f"🔍 Trying {model} with {version} API...")
            
            try:
                response = requests.post(
                    url,
                    json=request_body,
                    headers={"Content-Type": "application/json"},
                    timeout=20
                )
                
                if response.status_code == 200:
                    successful_version = version
                    print(f"✅ Successfully connected to Gemini API!")
                    print(f"✅ Working Model: {model}, API Version: {version}")
                    break
                elif response.status_code == 404:
                    print(f"⚠️ Model '{model}' not found in {version} API")
                    response = None
                    continue
                elif response.status_code == 403:
                    print(f"❌ API Key invalid or permission denied (403)")
                    print(f"❌ Error: {response.text[:300]}")
                    return None
                elif response.status_code == 429:
                    print(f"⚠️ Rate limit exceeded (429), waiting 2 seconds...")
                    import time
                    time.sleep(2)
                    response = None
                    continue
                else:
                    print(f"⚠️ {version} API returned {response.status_code}")
                    print(f"⚠️ Error: {response.text[:300]}")
                    response = None
                    continue
                    
            except requests.exceptions.Timeout:
                print(f"⚠️ Request timed out for {model} ({version})")
                response = None
                continue
            except requests.exceptions.RequestException as e:
                print(f"⚠️ Request failed for {model} ({version}): {e}")
                response = None
                continue
        
        if not response or response.status_code != 200:
            print(f"❌ Gemini API call failed")
            print(f"❌ Model: {model}")
            print(f"❌ Tried API versions: v1beta, v1")
            return None

        # Parse response
        data = response.json()
        
        if not data.get('candidates') or not data['candidates'][0].get('content'):
            print("⚠️ Gemini API returned empty response")
            return None

        # Extract text from response - handle different response structures
        try:
            if 'candidates' in data and len(data['candidates']) > 0:
                candidate = data['candidates'][0]
                if 'content' in candidate and 'parts' in candidate['content']:
                    if len(candidate['content']['parts']) > 0:
                        if 'text' in candidate['content']['parts'][0]:
                            response_text = candidate['content']['parts'][0]['text']
                        else:
                            print(f"⚠️ No 'text' field in response parts: {candidate['content']['parts'][0]}")
                            return None
                    else:
                        print(f"⚠️ Empty parts array in response")
                        return None
                else:
                    print(f"⚠️ No 'content' or 'parts' in candidate: {candidate}")
                    return None
            else:
                print(f"⚠️ No 'candidates' in response: {data}")
                return None
        except (KeyError, IndexError, TypeError) as e:
            print(f"⚠️ Error extracting response text: {e}")
            print(f"⚠️ Response structure: {data}")
            return None
        
        # Clean response text (remove markdown code blocks if present)
        response_text = response_text.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        elif response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        # Parse JSON with robust error handling for malformed/truncated JSON
        try:
            # Import repair function for robust JSON parsing
            from .gemini_json_fix import safe_parse_gemini_response
            
            # Use safe parser that handles truncated/incomplete JSON
            disease_info = safe_parse_gemini_response(response_text)
            
            # Validate structure
            required_fields = ['name', 'severity', 'symptoms', 'treatment', 'prevention']
            for field in required_fields:
                if field not in disease_info:
                    print(f"⚠️ Missing required field: {field} - filling with default")
                    # Fill with defaults instead of failing
                    if field == 'name':
                        disease_info['name'] = readable_name
                    elif field == 'severity':
                        disease_info['severity'] = 'Unknown'
                    elif field in ['symptoms', 'treatment', 'prevention']:
                        disease_info[field] = []
            
            # Ensure lists are lists
            for field in ['symptoms', 'treatment', 'prevention', 'antibiotics']:
                if field in disease_info and not isinstance(disease_info[field], list):
                    disease_info[field] = []
                elif field not in disease_info:
                    disease_info[field] = []
            
            # Ensure boolean for contagious
            if 'contagious' in disease_info:
                disease_info['contagious'] = bool(disease_info['contagious'])
            else:
                disease_info['contagious'] = False
            
            print(f"✅ Successfully fetched REAL-TIME disease info from Gemini for: {disease_name}")
            disease_info['_source'] = 'gemini_api'  # Mark as real-time Gemini data
            return disease_info
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"⚠️ Failed to parse Gemini response as JSON: {e}")
            print(f"Response text length: {len(response_text)} chars")
            print(f"Response text (first 800 chars): {response_text[:800]}")
            
            # Try using repair function as last resort
            try:
                from .gemini_json_fix import repair_json
                disease_info = repair_json(response_text)
                
                # Validate minimal structure
                if 'name' in disease_info:
                    # Fill missing fields with defaults
                    if 'severity' not in disease_info:
                        disease_info['severity'] = 'Unknown'
                    for field in ['symptoms', 'treatment', 'prevention', 'antibiotics']:
                        if field not in disease_info or not isinstance(disease_info[field], list):
                            disease_info[field] = []
                    if 'contagious' not in disease_info:
                        disease_info['contagious'] = False
                    
                    print(f"✅ Successfully repaired and parsed JSON")
                    disease_info['_source'] = 'gemini_api'
                    return disease_info
            except Exception as repair_error:
                print(f"⚠️ JSON repair also failed: {repair_error}")
            
            return None

    except requests.exceptions.RequestException as e:
        print(f"⚠️ Network error calling Gemini API: {e}")
        return None
    except Exception as e:
        print(f"⚠️ Error fetching disease info from Gemini: {e}")
        return None


def get_disease_info(disease_name: str, use_cache: bool = False, force_fresh: bool = True) -> Dict:
    """
    Get disease information from Gemini API in REAL-TIME
    
    Args:
        disease_name: Name of the disease
        use_cache: Whether to use cached responses (default: False for real-time data)
        force_fresh: Force fresh API call even if cache exists (default: True)
    
    Returns:
        Dictionary with disease information from Gemini API
    """
    # Normalize disease name
    disease_key = disease_name.lower().strip().replace(' ', '-').replace('_', '-')
    
    # Only check cache if explicitly enabled AND not forcing fresh data
    if use_cache and not force_fresh and disease_key in _disease_info_cache:
        cache_time = _cache_timestamps.get(disease_key)
        if cache_time and datetime.now() - cache_time < CACHE_DURATION:
            print(f"✅ Using cached disease info for: {disease_name}")
            return _disease_info_cache[disease_key]
    
    # ALWAYS try Gemini API first for real-time data
    print(f"🔄 Fetching REAL-TIME disease info from Gemini API for: {disease_name}")
    gemini_info = get_disease_info_from_gemini(disease_key)
    
    if gemini_info:
        # Cache the result (but next call will still be fresh if force_fresh=True)
        if use_cache:
            _disease_info_cache[disease_key] = gemini_info
            _cache_timestamps[disease_key] = datetime.now()
        print(f"✅ Successfully received real-time data from Gemini for: {disease_name}")
        return gemini_info
    
    # If Gemini fails, try ONE retry with a slight delay
    print(f"⚠️ First Gemini API call failed, retrying once for: {disease_name}")
    import time
    time.sleep(1)  # Wait 1 second before retry
    gemini_info_retry = get_disease_info_from_gemini(disease_key)
    
    if gemini_info_retry:
        if use_cache:
            _disease_info_cache[disease_key] = gemini_info_retry
            _cache_timestamps[disease_key] = datetime.now()
        print(f"✅ Successfully received real-time data from Gemini (after retry) for: {disease_name}")
        return gemini_info_retry
    
    # Only fallback to JSON as last resort if Gemini completely fails
    print(f"⚠️⚠️ Gemini API failed completely. Falling back to JSON for: {disease_name}")
    print(f"⚠️⚠️ This is NOT real-time data - please check Gemini API connection")
    disease_info = load_disease_info_fallback()
    
    # Try to find in JSON
    if disease_key in disease_info:
        info = disease_info[disease_key]
        info['_source'] = 'json_fallback'  # Mark as fallback data
        print(f"⚠️ Using JSON fallback data for: {disease_name}")
        return info
    
    # Try normalized versions
    normalized_key = disease_key.replace('_', '-')
    if normalized_key in disease_info:
        info = disease_info[normalized_key]
        info['_source'] = 'json_fallback'  # Mark as fallback data
        print(f"⚠️ Using JSON fallback data (normalized) for: {disease_name}")
        return info
    
    # Return default structure if nothing found
    print(f"❌ Disease info not found anywhere for: {disease_name}, using defaults")
    default_info = {
        "name": disease_name.replace('-', ' ').title(),
        "severity": "Unknown",
        "symptoms": [],
        "treatment": ["Consult a veterinarian for proper diagnosis and treatment"],
        "prevention": ["Maintain good animal health practices"],
        "contagious": False,
        "antibiotics": [],
        "_source": "default"
    }
    return default_info

