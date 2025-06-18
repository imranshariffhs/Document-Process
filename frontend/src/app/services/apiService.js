import axios from 'axios';
import { saveAs } from 'file-saver';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout for file processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.response.data?.message || 'Server error occurred';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

export const apiService = {
  // Health check
  async healthCheck() {
    try {
      const response = await api.get('/health');
      return response;
    } catch (error) {
      throw new Error('Backend service is not available');
    }
  },

  // File upload (single file)
  async uploadFile(file) {
    try {
      const formData = new FormData();
      
      // Add single file to FormData
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });

      return response;
    } catch (error) {
      throw error;
    }
  },

  // Schema management
  async getSchemas() {
    try {
      const response = await api.get('/schemas');
      return response.schemas || [];
    } catch (error) {
      throw error;
    }
  },

  async createSchema(schemaData) {
    try {
      const response = await api.post('/schemas', schemaData);
      return response.schema;
    } catch (error) {
      throw error;
    }
  },

  async updateSchema(schemaId, schemaData) {
    try {
      const response = await api.put(`/schemas/${schemaId}`, schemaData);
      return response.schema;
    } catch (error) {
      throw error;
    }
  },

  async deleteSchema(schemaId) {
    try {
      const response = await api.delete(`/schemas/${schemaId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Document processing
  async processDocuments(sessionId, schemaId) {
    try {
      const response = await api.post('/process', {
        session_id: sessionId,
        schema_id: schemaId,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Export results
  async exportResults(resultId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/export/${resultId}`, {
        responseType: 'blob',
        timeout: 60000, // 1 minute timeout for export
      });

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const fileName = `extracted_data_${resultId}.xlsx`;
      saveAs(blob, fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Failed to export results');
    }
  },

  // Session management
  async resetSession(sessionId) {
    try {
      const response = await api.delete(`/reset/${sessionId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Utility functions
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  validateFileType(file) {
    const allowedTypes = ['application/pdf'];
    return allowedTypes.includes(file.type);
  },

  validateFileSize(file, maxSizeMB = 16) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },

  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('Please select a file');
      return errors;
    }

    if (!this.validateFileType(file)) {
      errors.push('Only PDF files are allowed');
    }

    if (!this.validateFileSize(file)) {
      errors.push('File size must be less than 16MB');
    }

    return errors;
  },

  // Schema validation
  validateSchema(schema) {
    const errors = [];

    if (!schema.name || schema.name.trim() === '') {
      errors.push('Schema name is required');
    }

    if (!schema.fields || schema.fields.length === 0) {
      errors.push('At least one field is required');
    }

    if (schema.fields) {
      schema.fields.forEach((field, index) => {
        if (!field.name || field.name.trim() === '') {
          errors.push(`Field ${index + 1}: Name is required`);
        }

        if (!field.type) {
          errors.push(`Field ${index + 1}: Type is required`);
        }
      });
    }

    return errors;
  },

  // Data formatting utilities
  formatDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  },

  formatDateTime(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return dateString;
    }
  },

  // Error handling utilities
  getErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.response?.data?.error) {
      return error.response.data.error;
    }

    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    return 'An unexpected error occurred';
  },

  // Processing status utilities
  getProcessingStatus(results) {
    if (!results || results.length === 0) {
      return { total: 0, success: 0, failed: 0, successRate: 0 };
    }

    const total = results.length;
    const success = results.filter(r => r.status === 'success').length;
    const failed = total - success;
    const successRate = Math.round((success / total) * 100);

    return { total, success, failed, successRate };
  },
}; 