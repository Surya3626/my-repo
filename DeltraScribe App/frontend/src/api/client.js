import axios from 'axios';
import { APP_CONFIG } from '../config/appConfig';

const apiClient = axios.create({
  baseURL: `${APP_CONFIG.apiUrl}/api`,
});

// Add interceptor for auth headers
apiClient.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Response interceptor for session expiry
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized attempt detected. Forcing logout.");
      localStorage.removeItem('user');
      window.location.href = `${APP_CONFIG.contextPath}/login`;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
