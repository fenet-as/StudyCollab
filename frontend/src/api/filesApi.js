// frontend/src/api/filesApi.js

const API_BASE_URL = 'http://localhost:8080/api';

const getHeaders = () => {
  const token = localStorage.getItem('token'); 
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const filesApi = {
  // --- CATEGORIES / FOLDERS ---
  
  getCategories: async (groupId) => {
    const res = await fetch(`${API_BASE_URL}/groups/${groupId}/categories`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  createCategory: async (groupId, categoryData) => {
    const res = await fetch(`${API_BASE_URL}/groups/${groupId}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(),
      },
      body: JSON.stringify({
        name: categoryData.name,
        parentId: categoryData.parentId
      }),
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  deleteCategory: async (groupId, categoryId) => {
    const res = await fetch(`${API_BASE_URL}/groups/${groupId}/categories/${categoryId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete category');
    return true;
  },

  // --- FILES ---

  getFiles: async (groupId) => {
    const res = await fetch(`${API_BASE_URL}/groups/${groupId}/files`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch files');
    return res.json();
  },

  uploadFile: async (groupId, formData) => {
    const res = await fetch(`${API_BASE_URL}/groups/${groupId}/files`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Upload failed');
    }
    return res.json();
  },

  deleteFile: async (groupId, fileId) => {
    const res = await fetch(`${API_BASE_URL}/groups/${groupId}/files/${fileId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete file');
    return true;
  },

  // GET: /api/groups/{groupId}/files/{fileId}/download?disposition=inline|attachment
  getFileDownloadUrl: async (groupId, fileId, disposition = 'inline') => {
    const res = await fetch(
      `${API_BASE_URL}/groups/${groupId}/files/${fileId}/download?disposition=${disposition}`, 
      { headers: getHeaders() }
    );
    if (!res.ok) throw new Error('Failed to generate download URL');
    return res.json(); // Returns { downloadUrl: "https://..." }
  }
};