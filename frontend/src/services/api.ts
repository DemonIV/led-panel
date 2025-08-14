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
};

// YENİ: Mağaza API
export const magazaAPI = {
  getAll: () => api.get('/magazalar'),
  getById: (id: number) => api.get(`/magazalar/${id}`),
  create: (data: any) => api.post('/magazalar', data),
  update: (id: number, data: any) => api.put(`/magazalar/${id}`, data),
  delete: (id: number) => api.delete(`/magazalar/${id}`),
};


export default api;