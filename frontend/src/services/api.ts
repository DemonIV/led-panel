import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - her request'e token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const ledAPI = {
  getAll: () => api.get('/leds'),
  create: (data: any) => api.post('/leds', data),
  update: (id: number, data: any) => api.put(`/leds/${id}`, data),
  delete: (id: number) => api.delete(`/leds/${id}`),
  importCSV: (file: FormData) => api.post('/leds/import-csv', file, {  // ✅ YENİ EKLENEN
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// YENİ: Mağaza API
export const magazaAPI = {
  getAll: () => api.get('/magazalar'),
  getById: (id: number) => api.get(`/magazalar/${id}`),
  create: (data: any) => api.post('/magazalar', data),
  update: (id: number, data: any) => api.put(`/magazalar/${id}`, data),
  delete: (id: number) => api.delete(`/magazalar/${id}`),
};
// YENİ: Reports API
export const reportsAPI = {
  getDashboardStats: () => api.get('/reports/dashboard'),
  getMonthlyReport: (params: any) => api.get('/reports/monthly', { params }),
  exportToCSV: (filters: any) => api.post('/reports/export-csv', filters, {
    responseType: 'blob'
  }),
};
// YENİ: Aspect Rules API
export const aspectRulesAPI = {
  getAll: () => api.get('/aspect-rules'),
  create: (data: any) => api.post('/aspect-rules', data),
  update: (id: number, data: any) => api.put(`/aspect-rules/${id}`, data),
  delete: (id: number) => api.delete(`/aspect-rules/${id}`),
  recalculateAll: () => api.post('/aspect-rules/recalculate'),
};

// YENİ: Cleanup API
export const cleanupAPI = {
  getStats: () => api.get('/cleanup/stats'),
  analyzeDuplicates: () => api.get('/cleanup/analyze'),
  cleanupDuplicates: (dryRun: boolean = true) => api.delete(`/cleanup/duplicates?dryRun=${dryRun}`),
};

// Project API
export const projectAPI = {
  getAll: () => api.get('/projects'),
  create: (data: any) => api.post('/projects', data),
  update: (id: number, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
  getAssets: (id: number) => api.get(`/projects/${id}/assets`),
};

// Asset API - projectAPI'nin altına ekleyin
// Asset API - En alta ekleyin
export const assetAPI = {
  upload: (projectId: number, file: FormData) => api.post(`/assets/upload`, file, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getByProject: (projectId: number) => api.get(`/assets/project/${projectId}`),
  delete: (id: number) => api.delete(`/assets/${id}`),
};


export default api;