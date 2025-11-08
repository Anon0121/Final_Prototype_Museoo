// API Configuration
const getBackendURL = () => {
  // If accessing from localhost, use localhost backend
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // If accessing from Vercel (production), use Vercel backend
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://backend-8bycrtvhf-julianas-projects-638cf11e.vercel.app';
  }

  // If accessing from ngrok, use ngrok backend
  if (window.location.hostname.includes('ngrok.io') || window.location.hostname.includes('ngrok-free.app')) {
    // Extract the ngrok URL and use it for backend
    const currentHost = window.location.hostname;
    const currentProtocol = window.location.protocol;
    return `${currentProtocol}//${currentHost.replace('5173', '3000')}`;
  }

  // If accessing from external IP, use HTTP backend on same network
  return `http://${window.location.hostname}:3000`;
};

export const API_BASE_URL = getBackendURL();
console.log('🌐 API Base URL:', API_BASE_URL);

// Create axios instance with base URL
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 35000, // Increased to 35 seconds to match backend timeout
});

// Demo mode interceptor - return mock data when no backend
api.interceptors.request.use((config) => {
  if (!API_BASE_URL) {
    // Demo mode - return mock success response
    return Promise.reject({
      isDemo: true,
      message: 'Demo mode - backend not available',
      response: {
        data: {
          success: true,
          message: 'Demo mode - form submitted successfully',
          demo: true
        }
      }
    });
  }
  return config;
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Handle demo mode gracefully
    if (error.isDemo) {
      console.log('🎭 Demo mode - returning mock success response');
      return Promise.resolve(error.response);
    }
    console.error('❌ API Response Error:', error.response?.status, error.response?.data?.message || error.message);
    console.error('📋 Full error:', error);
    console.error('🌐 Request URL:', error.config?.url);
    console.error('🔗 Base URL:', error.config?.baseURL);
    return Promise.reject(error);
  }
);

export default api; 