// Gemini API Configuration
// Note: For production, consider moving the API key to environment variables
// Create a .env file in the client folder with: VITE_GEMINI_API_KEY=your_key_here
// Then use: export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const GEMINI_API_KEY = 'AIzaSyCV5Jd3CLwVQKy9xQNM15EEQe1-UoC__eQ';

// Preferred stable model names (prioritized in order):
// - gemini-2.5-flash (recommended - fast and stable)
// - gemini-2.0-flash (stable alternative)
// - gemini-flash-latest (stable alias)

export const GEMINI_MODEL = 'gemini-2.5-flash';

// API base URLs
export const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// List available models endpoint
export const getListModelsUrl = () => {
  return `${GEMINI_API_BASE_URL}/models?key=${GEMINI_API_KEY}`;
};

// Generate content endpoint
export const getGeminiApiUrl = (model = GEMINI_MODEL) => {
  return `${GEMINI_API_BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
};
