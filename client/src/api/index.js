const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export default API_BASE_URL;
