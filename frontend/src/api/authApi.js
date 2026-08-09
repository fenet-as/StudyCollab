import axios from 'axios';

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const registerUser = async (userData) => {
  const response = await API.post('/register', userData);
  return response.data; // Standard mapping: { token: "...", email: "..." }
};

export const loginUser = async (credentials) => {
  const response = await API.post('/login', credentials);
  return response.data; // Standard mapping: { token: "...", email: "..." }
};