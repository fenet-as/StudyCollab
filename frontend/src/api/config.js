import axios from 'axios';
import { setupAuthInterceptors } from './authInterceptor';

// 1. Resolve API Base URL:
// - Uses import.meta.env.VITE_API_BASE_URL if explicitly provided
// - Otherwise automatically falls back based on Vite environment mode:
//     * Development (npm run dev): http://localhost:8080/api
//     * Production  (npm run build): https://studycollab-l3p2.onrender.com/api
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:8080/api'
    : 'https://studycollab-l3p2.onrender.com/api');

// Server base URL without '/api' (for static file / avatar paths)
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// 2. Create standard Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// 3. Attach authentication, automatic token refresh, and request queue interceptors
setupAuthInterceptors(api);