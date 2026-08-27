import axios from 'axios';
import { setupInterceptors } from './interceptors';

const BASE_URL = import.meta.env.API_URL || '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

setupInterceptors(apiClient);

export default apiClient;
