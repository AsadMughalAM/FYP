"""
Simple script to test Gemini API connection
Run this to verify your Gemini API is working
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from animal.gemini_service import get_disease_info_from_gemini, GEMINI_API_KEY, GEMINI_MODEL

def test_gemini_api():
    print("=" * 60)
    print("Testing Gemini API Connection")
    print("=" * 60)
    print(f"API Key: {GEMINI_API_KEY[:20]}...{GEMINI_API_KEY[-5:]}")
    print(f"Model: {GEMINI_MODEL}")
    print("=" * 60)
    print()
    
    # Test with a simple disease
    test_disease = "foot-and-mouth"
    print(f"Testing with disease: {test_disease}")
    print()
    
    result = get_disease_info_from_gemini(test_disease)
    
    if result:
        print("✅ SUCCESS! Gemini API is working!")
        print()
        print("Response received:")
        print(f"  Name: {result.get('name')}")
        print(f"  Severity: {result.get('severity')}")
        print(f"  Symptoms: {len(result.get('symptoms', []))} items")
        print(f"  Treatment: {len(result.get('treatment', []))} items")
        print(f"  Prevention: {len(result.get('prevention', []))} items")
        print(f"  Source: {result.get('_source', 'unknown')}")
    else:
        print("❌ FAILED! Gemini API is not working")
        print()
        print("Please check:")
        print("  1. API key is correct")
        print("  2. Internet connection")
        print("  3. API quota/limits")
        print("  4. Model name is correct")
    
    print()
    print("=" * 60)

if __name__ == "__main__":
    test_gemini_api()

