// lib/axios.js
import axios from 'axios';
import { useState } from 'react';

// Debug log để kiểm tra env


const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' 
      ? (sessionStorage.getItem('token') || localStorage.getItem('token')) 
      : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData, let axios handle it automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    if (process.env.NODE_ENV === 'development') {
    
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      
    }
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
    }
    
    // Xử lý lỗi chung
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Chỉ redirect nếu không phải trang messages
        if (!window.location.pathname.includes('/messages')) {
          window.location.href = '/login';
        }
      }
    }
    if (error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        // Không redirect cho các API liên quan đến team/messages khi đang ở trang messages
        const isMessagesPage = window.location.pathname.includes('/messages');
        const isTeamApi = error.config?.url?.includes('/api/team/');
        const isMessagesApi = error.config?.url?.includes('/api/messages/');
        
        // Chỉ skip redirect nếu đang ở messages page VÀ là team/messages API
        const shouldSkipRedirect = isMessagesPage && (isTeamApi || isMessagesApi);
        
        if (!shouldSkipRedirect) {
          window.location.href = '/not-found';
        }
        // Nếu skip redirect, chỉ reject error để component xử lý
      }
    }
    
    if (error.response?.status === 500) {
      // Log error với thông tin chi tiết hơn
      const errorData = error.response.data;
      const errorMessage = errorData?.message || errorData?.error || 'Internal Server Error';
      const errorUrl = error.config?.url || 'Unknown URL';
      
      console.error('Server Error (500):', {
        url: errorUrl,
        message: errorMessage,
        data: errorData,
        status: error.response.status,
        statusText: error.response.statusText
      });
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

// Export các method thường dùng
export const api = {
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, data, config) => axiosInstance.post(url, data, config),
  put: (url, data, config) => axiosInstance.put(url, data, config),
  patch: (url, data, config) => axiosInstance.patch(url, data, config),
  delete: (url, config) => axiosInstance.delete(url, config),
  
  // Review API methods
  reviews: {
    // Create a new review
    create: (reviewData) => axiosInstance.post('/reviews', reviewData),
    
    // Get all reviews
    getAll: () => axiosInstance.get('/reviews'),
    
    // Get reviews for a specific product
    getByProduct: (productId) => axiosInstance.get(`/reviews/product/${productId}`),
    
    // Get unreviewed products for a user
    getUnreviewed: (productId) => axiosInstance.get(`/reviews/unreviewed/${productId}`),
    
    // Update a review
    update: (reviewId, reviewData) => axiosInstance.put(`/reviews/${reviewId}`, reviewData),
    
    // Delete a review
    delete: (reviewId) => axiosInstance.delete(`/reviews/${reviewId}`),
  },
};

// Utility functions cho các trường hợp đặc biệt
export const apiUtils = {
  // Upload file
  uploadFile: (url, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return axiosInstance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
  
  // Download file
  downloadFile: async (url, filename) => {
    try {
      const response = await axiosInstance.get(url, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  },

  // Create review
  createReview: async (reviewData) => {
    try {
      const response = await axiosInstance.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Create review failed:', error);
      throw error;
    }
  },
};

// Custom hooks cho React components
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const request = async (apiCall) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { request, loading, error };
};