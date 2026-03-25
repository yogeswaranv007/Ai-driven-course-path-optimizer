import { api } from './api.js';

export const adminService = {
  // Stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Password
  changePassword: async (data) => {
    const response = await api.put('/admin/password', data);
    return response.data;
  },

  // Users
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  createUser: async (data) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },
  updateUser: async (id, data) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Roadmaps
  deleteRoadmap: async (id) => {
    const response = await api.delete(`/admin/roadmaps/${id}`);
    return response.data;
  },
  generateForUser: async (userId, templateId) => {
    const response = await api.post(`/admin/users/${userId}/roadmaps`, { templateId });
    return response.data;
  },
  broadcastRoadmap: async (templateId, mode) => {
    const response = await api.post('/admin/roadmaps/broadcast', { templateId, mode });
    return response.data;
  },

  // Templates
  getTemplates: async () => {
    const response = await api.get('/admin/templates');
    return response.data;
  },
  createTemplate: async (data) => {
    const response = await api.post('/admin/templates', data);
    return response.data;
  },
  updateTemplate: async (id, data) => {
    const response = await api.put(`/admin/templates/${id}`, data);
    return response.data;
  },
  deleteTemplate: async (id) => {
    const response = await api.delete(`/admin/templates/${id}`);
    return response.data;
  },
};
