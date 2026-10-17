import { api } from './config.js';

export const filesApi = {
  getCategories: async (groupId) => {
    const res = await api.get(`/groups/${groupId}/categories`);
    return res.data;
  },

  createCategory: async (groupId, categoryData) => {
    const res = await api.post(`/groups/${groupId}/categories`, {
      name: categoryData.name,
      parentId: categoryData.parentId,
    });
    return res.data;
  },

  deleteCategory: async (groupId, categoryId) => {
    await api.delete(`/groups/${groupId}/categories/${categoryId}`);
    return true;
  },

  getFiles: async (groupId) => {
    const res = await api.get(`/groups/${groupId}/files`);
    return res.data;
  },

  // REMOVED manual Content-Type header so Axios handles boundary & auth headers cleanly
  uploadFile: async (groupId, formData) => {
    const res = await api.post(`/groups/${groupId}/files`, formData);
    return res.data;
  },

  deleteFile: async (groupId, fileId) => {
    await api.delete(`/groups/${groupId}/files/${fileId}`);
    return true;
  },

  getFileDownloadUrl: async (groupId, fileId, disposition = 'inline') => {
    const res = await api.get(
      `/groups/${groupId}/files/${fileId}/download?disposition=${disposition}`
    );
    return res.data;
  },
};