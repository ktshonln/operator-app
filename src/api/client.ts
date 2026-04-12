import { API_CONFIG } from './config';
import { authStore } from './authStore';
import { Organization } from '../types/organization';


type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
}

export const apiClient = async (endpoint: string, options: RequestOptions = {}) => {
  const { method = 'GET', headers = {}, body } = options;

  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const token = await authStore.getToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...API_CONFIG.DEFAULT_HEADERS,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...headers,
  };

  try {
    const response = await fetch(url, {
      method,
      headers: defaultHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle empty responses or non-JSON responses
    let data = null;
    
    try {
      const text = await response.text();
      
      if (text.trim()) {
        // Try to parse as JSON
        data = JSON.parse(text);
      } else {
        // Empty response - treat as success for successful status codes
        data = response.ok ? { success: true } : { error: 'Empty response' };
      }
    } catch (parseError) {
      // JSON parse failed - handle based on response status
      if (response.ok) {
        // Successful request but invalid JSON - might be plain text success
        data = { success: true, message: 'Request completed successfully' };
      } else {
        // Error response with invalid JSON
        throw {
          status: response.status,
          message: `Server error (${response.status}). Please try again.`,
          data: null,
        };
      }
    }

    if (!response.ok) {
      // Handle token expiration globally
      if (response.status === 401) {
        // Clear expired token
        await authStore.clearAll();
        
        // Extract meaningful error messages
        let errorMessage = 'Your session has expired. Please login again.';
        
        throw {
          status: response.status,
          message: errorMessage,
          data,
          isTokenExpired: true,
        };
      }
      
      // Extract meaningful error messages
      let errorMessage = 'Something went wrong';
      
      if (data && data.error) {
        if (data.error.message) {
          errorMessage = data.error.message;
        } else if (data.error.code) {
          // Convert error codes to user-friendly messages
          switch (data.error.code) {
            case 'VALIDATION_ERROR':
              // Extract detailed validation errors
              if (data.error.details && Array.isArray(data.error.details)) {
                const validationErrors = data.error.details.map((detail: any) => {
                  if (typeof detail === 'string') return detail;
                  if (detail.message) return detail.message;
                  if (detail.field && detail.error) return `${detail.field}: ${detail.error}`;
                  return JSON.stringify(detail);
                }).join(', ');
                errorMessage = `Validation failed: ${validationErrors}`;
              } else {
                errorMessage = 'Please check your input and try again';
              }
              break;
            case 'INVALID_CREDENTIALS':
              errorMessage = 'Invalid email/phone or password';
              break;
            case 'USER_NOT_FOUND':
              errorMessage = 'User not found';
              break;
            case 'ACCOUNT_LOCKED':
              errorMessage = 'Account is locked';
              break;
            default:
              errorMessage = data.error.code.replace(/_/g, ' ').toLowerCase();
          }
        }
      } else if (data && data.message) {
        errorMessage = data.message;
      } else if (response.status === 404) {
        errorMessage = 'Endpoint not found';
      } else if (response.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      throw {
        status: response.status,
        message: errorMessage,
        data,
      };
    }

    return data;
  } catch (error: any) {
    console.error(`API Error [${method}] ${url}:`, error);
    
    // If it's already our custom error object, just re-throw it
    if (error.status !== undefined) {
      throw error;
    }
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
      throw {
        status: 0,
        message: 'Network connection failed. Please check your internet connection.',
        data: null,
      };
    }
    
    // Handle any other unexpected errors
    throw {
      status: 0,
      message: 'An unexpected error occurred. Please try again.',
      data: null,
    };
  }
};

// Organization API functions
export const getMyOrganization = async (): Promise<Organization> => {
  return apiClient('/organizations/me', {
    method: 'GET',
  });
};

export const updateOrganization = async (id: string, data: Partial<Organization>): Promise<Organization> => {
  console.log('Updating organization with data:', data);
  return apiClient(`/organizations/${id}`, {
    method: 'PATCH',
    body: data,
  });
};