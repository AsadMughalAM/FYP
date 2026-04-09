export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? '';

export const GEMINI_MODEL = 'gemini-2.5-flash';

export const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export const getListModelsUrl = () => {
  return `${GEMINI_API_BASE_URL}/models?key=${GEMINI_API_KEY}`;
};

export const getGeminiApiUrl = (model = GEMINI_MODEL) => {
  return `${GEMINI_API_BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
};
