import axios from 'axios';

const API = axios.create({
  baseURL: `https://studycollab-l3p2.onrender.com/api/auth`,
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