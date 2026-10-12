import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

let inMemoryAccessToken = sessionStorage.getItem('honestroom_access_token') || null;

export function setAccessToken(token) {
  inMemoryAccessToken = token || null;
  if (token) {
    sessionStorage.setItem('honestroom_access_token', token);
  } else {
    sessionStorage.removeItem('honestroom_access_token');
  }
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (inMemoryAccessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  }
  return config;
});

export function extractErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  const responseData = error.response?.data;
  if (responseData) {
    if (typeof responseData.message === 'string' && responseData.message.trim()) {
      return responseData.message;
    }
    if (responseData.fieldErrors && typeof responseData.fieldErrors === 'object') {
      const firstErr = Object.values(responseData.fieldErrors)[0];
      if (firstErr) return firstErr;
    }
  }
  if (error.message && error.message !== 'Network Error') {
    return error.message;
  }
  return fallback;
}

export default apiClient;
