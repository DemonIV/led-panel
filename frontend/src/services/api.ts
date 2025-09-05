
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
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

// LED API
export const ledAPI = {
  getAll: () => api.get('/leds'),
  create: (data: any) => api.post('/leds', data),
  update: (id: number, data: any) => api.put(`/leds/${id}`, data),
  delete: (id: number) => api.delete(`/leds/${id}`),
  importCSV: (file: FormData) => api.post('/leds/import-csv', file, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Mağaza API
export const magazaAPI = {
  getAll: () => api.get('/magazalar'),
  getById: (id: number) => api.get(`/magazalar/${id}`),
  create: (data: any) => api.post('/magazalar', data),
  update: (id: number, data: any) => api.put(`/magazalar/${id}`, data),
  delete: (id: number) => api.delete(`/magazalar/${id}`),
};

// Reports API
export const reportsAPI = {
  getDashboardStats: () => api.get('/reports/dashboard'),
  getMonthlyReport: (params: any) => api.get('/reports/monthly', { params }),
  exportToCSV: (filters: any) => api.post('/reports/export-csv', filters, {
    responseType: 'blob'
  }),
};

// Aspect Rules API
export const aspectRulesAPI = {
  getAll: () => api.get('/aspect-rules'),
  create: (data: any) => api.post('/aspect-rules', data),
  update: (id: number, data: any) => api.put(`/aspect-rules/${id}`, data),
  delete: (id: number) => api.delete(`/aspect-rules/${id}`),
  recalculateAll: () => api.post('/aspect-rules/recalculate'),
};

// Cleanup API
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

// Asset API
export const assetAPI = {
  upload: (projectId: number, file: FormData) => api.post(`/assets/upload`, file, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getByProject: (projectId: number) => api.get(`/assets/project/${projectId}`),
  delete: (id: number) => api.delete(`/assets/${id}`),
};

// ✅ YENİ: Gelişmiş Scraper API
export const scraperAPI = {
  // Basit scraping
  scrapeURL: (url: string, selectors: any) => 
    api.post('/scraper/scrape', { url, selectors }),
    
  // Toplu scraping
  scrapeBulk: (urls: string[], selectors: any, autoImport: boolean) => 
    api.post('/scraper/scrape-bulk', { urls, selectors, autoImport }),
    
  // ✅ YENİ: Görsel indirme
  downloadImages: (imageUrls: string[], productId?: string, productName?: string) =>
    api.post('/scraper/download-images', { imageUrls, productId, productName }),
    
  // ✅ YENİ: Tam proje oluşturma
  scrapeAndCreateProject: (url: string, selectors: any, projectSettings: any, downloadImages?: boolean, imageSettings?: any) =>
    api.post('/scraper/scrape-and-create-project', { 
      url, 
      selectors, 
      projectSettings, 
      downloadImages, 
      imageSettings 
    }),
    
  // ✅ YENİ: Görsel optimizasyonu
  optimizeImages: (projectId: number) =>
    api.post(`/scraper/optimize-images/${projectId}`),
    
  // Hazır şablonlar
  getPresets: () => api.get('/scraper/presets'),
  
  // İstatistikler
  getStats: () => api.get('/scraper/stats'),
};

// Template API
export const templateAPI = {
  getAll: () => api.get('/templates'),
  getStats: () => api.get('/templates/stats'),
  getByType: (type: string) => api.get(`/templates/type/${type}`),
  create: (data: any) => api.post('/templates', data),
  update: (id: number, data: any) => api.put(`/templates/${id}`, data),
  delete: (id: number) => api.delete(`/templates/${id}`),
  logUsage: (templateID: number, projectID: number) => api.post('/templates/usage', { templateID, projectID }),
};

// Render Queue API
export const renderQueueAPI = {
  getQueue: (status?: string) => api.get('/render-queue', { params: { status } }),
  getStats: () => api.get('/render-queue/stats'),
  getNext: () => api.get('/render-queue/next'),
  addToQueue: (data: any) => api.post('/render-queue', data),
  updateStatus: (id: number, data: any) => api.put(`/render-queue/${id}`, data),
  deleteFromQueue: (id: number) => api.delete(`/render-queue/${id}`),
};


export default api;