import { api } from './config.js';

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

// Verifies the user email using the UUID token from the email link
export const verifyEmailToken = async (token) => {
  const response = await api.get(`/auth/verify-email?token=${token}`);
  return response.data;
};

// Resends verification email
export const resendVerificationEmail = async (email) => {
  const response = await api.post('/auth/resend-verification', { email });
  return response.data;
};

// Refreshes the JWT access token using the HttpOnly cookie
export const refreshToken = async () => {
  const response = await api.post('/auth/refresh');
  return response.data;
};

// Logs out user and revokes refresh token
export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};