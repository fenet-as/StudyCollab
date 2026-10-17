// userApi.js

import { api } from './config.js';

export const userApi = {
  getCurrentUser: async () => (await api.get('/users/me')).data,
  
  updateProfileName: async (fullName) => 
    (await api.put('/users/profile', { fullName })).data,
  
  updateAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file); // Changed from 'file' to 'avatar'
    
    // Changed route to '/avatars/upload' and method to POST
    return (await api.post('/avatars/upload', formData, { 
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  },
  
  changePassword: async (currentPassword, newPassword) => 
    (await api.put('/users/change-password', { currentPassword, newPassword })).data,
};