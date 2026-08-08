// frontend/src/api/notesApi.js
import axios from 'axios';

const API_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const notesApi = {
  // Fetch only group-specific notes
  getByGroup: async (groupId) => {
    const response = await axios.get(`${API_URL}/notes/group/${groupId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  create: async (noteData) => {
    const response = await axios.post(`${API_URL}/notes`, noteData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  update: async (id, noteData) => {
    const response = await axios.put(`${API_URL}/notes/${id}`, noteData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`${API_URL}/notes/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};