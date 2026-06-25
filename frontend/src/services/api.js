import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

let refreshPromise = null;

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshPromise) {
        const rt = localStorage.getItem('refreshToken');
        if (!rt) { window.location.href = '/login'; return Promise.reject(err); }
        refreshPromise = axios.post('/api/auth/refresh', { refreshToken: rt })
          .then(r => { localStorage.setItem('accessToken', r.data.accessToken); return r.data.accessToken; })
          .catch(() => { localStorage.clear(); window.location.href = '/login'; })
          .finally(() => { refreshPromise = null; });
      }
      const token = await refreshPromise;
      if (token) { original.headers.Authorization = `Bearer ${token}`; return api(original); }
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const leadsApi = {
  list: (params) => api.get('/leads', { params }),
  get: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  bulk: (data) => api.post('/leads/bulk', data),
  activities: (id) => api.get(`/leads/${id}/activities`),
  getNotes: (id) => api.get(`/leads/${id}/notes`),
  addNote: (id, content) => api.post(`/leads/${id}/notes`, { content, type: 'manual' }),
  deleteNote: (leadId, noteId) => api.delete(`/leads/${leadId}/notes/${noteId}`),
};

export const recordingsApi = {
  list: (leadId) => api.get('/recordings', leadId ? { params: { leadId } } : undefined),
  upload: (leadId, formData) => api.post(`/recordings/upload/${leadId}`, formData),
  record: (leadId, formData) => api.post(`/recordings/record/${leadId}`, formData),
  delete: (id) => api.delete(`/recordings/${id}`),
  transcribe: (id) => api.post(`/recordings/${id}/transcribe`),
  analyze: (id) => api.post(`/recordings/${id}/analyze`),
};

export const usersApi = {
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const csvApi = {
  preview: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/csv/import?preview=true', fd);
  },
  import: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/csv/import?preview=false', fd);
  },
  export: (params) => api.get('/csv/export', { params, responseType: 'blob' }),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  charts: () => api.get('/dashboard/charts'),
};

export const tagsApi = {
  list: () => api.get('/tags'),
  setLeadTags: (leadId, tagNames) => api.post(`/tags/lead/${leadId}`, { tagNames }),
};
