import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://crm-mjky.onrender.com/api';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const rt = await SecureStore.getItemAsync('refreshToken');
      if (rt) {
        try {
          const r = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: rt });
          await SecureStore.setItemAsync('accessToken', r.data.accessToken);
          original.headers.Authorization = `Bearer ${r.data.accessToken}`;
          return api(original);
        } catch {
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
        }
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const leadsApi = {
  list: (params) => api.get('/leads', { params }),
  get: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
};

export const aiApi = {
  transcribe: (formData) => api.post('/ai/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  extract: (text) => api.post('/ai/extract', { text }),
};

export default api;
