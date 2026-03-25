import { api } from './api.js';

export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  deleteRoadmap: async (roadmapId) => {
    const response = await api.delete(`/admin/roadmaps/${roadmapId}`);
    return response.data;
  },
};
