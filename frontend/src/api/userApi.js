// frontend/src/api/userApi.js
import axios from 'axios';

// 💡 1. Create a dedicated Axios instance pointing straight to your Spring Boot backend
const API = axios.create({
  baseURL: 'http://localhost:8080'
});

// Helper to extract the token safely from browser storage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { 
      Authorization: token ? `Bearer ${token}` : '' 
    }
  };
};

export const userApi = {
  // Fetch current authenticated user metrics
  getCurrentUser: async () => {
    // 💡 2. Swapped "axios.get" for "API.get" to apply the backend baseURL
    const response = await API.get('/api/users/me', getAuthHeaders());
    return response.data;
  },

  // Update profile full name text field
  updateProfileName: async (fullName) => {
    const response = await API.put('/api/users/profile', { fullName }, getAuthHeaders());
    return response.data;
  },

  // Process dynamic multipart form image file streams
  updateAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file); // 'avatar' matches @RequestParam("avatar") in AvatarController

    const config = getAuthHeaders();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await API.post('/api/avatars/upload', formData, config);
    return response.data;
  },

  // Change account password safety signatures
  changePassword: async (currentPassword, newPassword) => {
    const response = await API.put(
      '/api/users/change-password', 
      { currentPassword, newPassword }, 
      getAuthHeaders()
    );
    return response.data;
  }
};