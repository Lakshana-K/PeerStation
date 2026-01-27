// Get API URL from environment variable or use localhost for development
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('🔗 API URL:', API_URL);