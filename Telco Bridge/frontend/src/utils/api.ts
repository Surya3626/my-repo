import axios, { AxiosError } from 'axios';

// ─── Utilities ─────────────────────────────────────────────────────────────

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/** Extract a user-friendly error message from backend ApiResponse or network error */
export function extractErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    // Backend returns { success: false, message: "..." }
    if (data?.message && typeof data.message === 'string') return data.message;
    if (data?.error && typeof data.error === 'string') return data.error;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred. Please try again.';
}

// ─── Axios Instance ───────────────────────────────────────────────────────

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s timeout
});

// ─── Request Interceptor ──────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const isAdminRequest = config.url
      && (config.url.startsWith('/admin') || config.url.includes('/admin/'));

    const adminToken = localStorage.getItem('tpf_admin_token');
    const customerToken = localStorage.getItem('tpf_token');

    const token = isAdminRequest
      ? (adminToken || customerToken)
      : (customerToken || adminToken);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['X-Correlation-ID'] = uuidv4();
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const isApiAdmin = error.config?.url
        && (error.config.url.startsWith('/admin') || error.config.url.includes('/admin/'));

      if (isApiAdmin) {
        localStorage.removeItem('tpf_admin_token');
        localStorage.removeItem('tpf_admin_username');
      } else {
        localStorage.removeItem('tpf_token');
        // Note: customer profile is NOT stored in localStorage anymore
      }
    }
    return Promise.reject(error);
  }
);

export default api;
