// API Service - Centralized API calls
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  toggleActive: (id) => api.put(`/users/${id}/toggle-active`),
  updatePermissions: (id, permissions) => api.put(`/users/${id}/permissions`, { permissions }),
};

// Reports API
export const reportsAPI = {
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  create: (formData) => api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/reports/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/reports/${id}`),
  getStats: (params) => api.get('/reports/stats', { params }),
  markSeen: (id) => api.post(`/reports/${id}/mark-seen`),
  markAllSeen: () => api.post('/reports/mark-all-seen'),
};

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Governorates API
export const governoratesAPI = {
  getAll: () => api.get('/governorates'),
  create: (data) => api.post('/governorates', data),
  delete: (id) => api.delete(`/governorates/${id}`),
};

// Invoices API
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (formData) => api.post('/invoices', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  approve: (id) => api.post(`/invoices/${id}/approve`),
  reject: (id, reason) => api.post(`/invoices/${id}/reject`, { reason }),
};

// Extracts API
export const extractsAPI = {
  getAll: (params) => api.get('/extracts', { params }),
  getById: (id) => api.get(`/extracts/${id}`),
  create: (formData) => api.post('/extracts', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/extracts/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/extracts/${id}`),
};

// Water Connections API
export const waterConnectionsAPI = {
  getAll: (params) => api.get('/water-connections', { params }),
  getById: (id) => api.get(`/water-connections/${id}`),
  create: (formData) => api.post('/water-connections', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/water-connections/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/water-connections/${id}`),
};

// Sewage Connections API
export const sewageConnectionsAPI = {
  getAll: (params) => api.get('/sewage-connections', { params }),
  getById: (id) => api.get(`/sewage-connections/${id}`),
  create: (formData) => api.post('/sewage-connections', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/sewage-connections/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/sewage-connections/${id}`),
};

// Cars API
export const carsAPI = {
  getAll: (params) => api.get('/cars', { params }),
  getById: (id) => api.get(`/cars/${id}`),
  create: (formData) => api.post('/cars', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/cars/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/cars/${id}`),
};

// Employee Requests API
export const employeeRequestsAPI = {
  getAll: (params) => api.get('/employee-requests', { params }),
  getById: (id) => api.get(`/employee-requests/${id}`),
  create: (formData) => api.post('/employee-requests', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/employee-requests/${id}`, data),
  delete: (id) => api.delete(`/employee-requests/${id}`),
  approve: (id) => api.post(`/employee-requests/${id}/approve`),
  reject: (id, reason) => api.post(`/employee-requests/${id}/reject`, { reason }),
};

// Notifications API
export const notificationsAPI = {
  getPendingCount: () => api.get('/notifications/pending-count'),
};

// Dashboard API
export const dashboardAPI = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
};

export default api;
