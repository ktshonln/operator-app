import { API_CONFIG } from './config';
import { authStore } from './authStore';
import { Organization } from '../types/organization';
import { Role, CreateRoleRequest, UpdateRoleRequest, Permission } from '../types/role';


type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
}

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

export const apiClient = async (endpoint: string, options: RequestOptions = {}, isRetry = false) => {
  const { method = 'GET', headers = {}, body } = options;

  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const token = await authStore.getToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...API_CONFIG.DEFAULT_HEADERS,
    ...(token && endpoint !== '/auth/refresh' ? { 'Authorization': `Bearer ${token}` } : {}),
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
      // Handle token expiration with automatic refresh
      if (response.status === 401 && !isRetry && endpoint !== '/auth/refresh') {
        try {
          // If we're already refreshing, wait for that to complete
          if (isRefreshing && refreshPromise) {
            await refreshPromise;
            // Retry the original request with the new token
            return apiClient(endpoint, options, true);
          }

          // Start refresh process
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = refreshAccessToken();
            
            const refreshResponse = await refreshPromise;
            
            if (refreshResponse.access_token) {
              await authStore.saveToken(refreshResponse.access_token);
              
              // If new refresh token is provided, save it
              if (refreshResponse.refresh_token) {
                await authStore.saveRefreshToken(refreshResponse.refresh_token);
              }
              
              isRefreshing = false;
              refreshPromise = null;
              
              // Retry the original request with the new token
              return apiClient(endpoint, options, true);
            } else {
              // No access token in response, clear tokens and redirect to login
              isRefreshing = false;
              refreshPromise = null;
              await authStore.clearAll();
              
              throw {
                status: 401,
                message: 'Your session has expired. Please login again.',
                data,
                isTokenExpired: true,
              };
            }
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          isRefreshing = false;
          refreshPromise = null;
          
          // Clear expired tokens and redirect to login
          await authStore.clearAll();
          
          throw {
            status: 401,
            message: 'Your session has expired. Please login again.',
            data,
            isTokenExpired: true,
          };
        }
      }
      
      // Handle other 401 errors or if refresh failed
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
              // Check if this is a token expiration issue
              if (data.isTokenExpired || response.status === 401) {
                errorMessage = 'Your session has expired. Please login again.';
              } else {
                errorMessage = 'Invalid email/phone or password';
              }
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

      // Override message for token expiration cases
      if (data && data.isTokenExpired) {
        errorMessage = 'Your session has expired. Please login again.';
      }

      throw {
        status: response.status,
        message: errorMessage,
        data,
        isTokenExpired: data && data.isTokenExpired,
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

// OTP API functions
export const resendOTP = async (identifier: string) => {
  return apiClient('/auth/resend-otp', {
    method: 'POST',
    body: { identifier },
  });
};

// Enhanced OTP resend with user_id, purpose, and channel
export const resendOTPEnhanced = async (userId: string, purpose: string, channel: string) => {
  console.log('API Client - Resending OTP with enhanced format:', { userId, purpose, channel });
  return apiClient('/auth/resend-otp', {
    method: 'POST',
    body: { 
      user_id: userId,
      purpose: purpose,
      channel: channel
    },
  });
};

// 2FA Verification API
export const initiate2FA = async (userId: string) => {
  return apiClient('/auth/initiate-2fa', {
    method: 'POST',
    body: { 
      user_id: userId 
    },
  });
};

export const verify2FA = async (userId: string, otp: string) => {
  return apiClient('/auth/verify-2fa', {
    method: 'POST',
    headers: {
      'X-Client-Type': 'mobile',
    },
    body: { 
      user_id: userId,
      otp: otp,
      device_name: 'phone'
    },
  });
};

// Token refresh API
export const refreshAccessToken = async () => {
  const refreshToken = await authStore.getRefreshToken();
  
  if (!refreshToken) {
    console.warn('No refresh token available, clearing auth store');
    await authStore.clearAll();
    throw new Error('No refresh token available');
  }

  try {
    return await apiClient('/auth/refresh', {
      method: 'POST',
      body: { 
        refresh_token: refreshToken 
      },
    });
  } catch (error) {
    console.error('Refresh token request failed:', error);
    // If refresh fails, clear all tokens
    await authStore.clearAll();
    throw error;
  }
};

// Logout API functions
export const logout = async () => {
  return apiClient('/auth/logout', {
    method: 'POST',
  });
};

export const logoutAll = async () => {
  return apiClient('/auth/logout-all', {
    method: 'POST',
  });
};

// Login Channel Management API functions
export const initiateLoginChannelChange = async (channel: 'email' | 'phone', identifier?: string) => {
  const body: any = { channel };
  
  // If switching to a different channel and providing new identifier
  if (identifier) {
    body.identifier = identifier;
  }
  
  console.log('Initiating login channel change with body:', body);
  
  try {
    const response = await apiClient('/users/me/login-channel', {
      method: 'POST',
      body,
    });
    
    console.log('Login channel initiate response:', response);
    return response;
  } catch (error: any) {
    console.error('Initiate login channel error:', error);
    
    // Log detailed validation errors if available
    if (error.data && error.data.error && error.data.error.details) {
      console.log('Initiate validation errors:', JSON.stringify(error.data.error.details, null, 2));
    }
    
    throw error;
  }
};

export const confirmLoginChannelChange = async (otp: string, channel: 'email' | 'phone') => {
  console.log('Confirming login channel change with OTP:', otp, 'Channel:', channel);
  
  // Based on the validation error, the API only accepts otp and channel (no identifier)
  const requestBody = {
    otp: otp,
    channel: channel
  };
  
  console.log('Request body for confirm:', requestBody);
  
  try {
    return await apiClient('/users/me/login-channel/confirm', {
      method: 'POST',
      body: requestBody,
    });
  } catch (error: any) {
    console.error('Confirm login channel error details:', error);
    
    // If it's a validation error, log the details for debugging
    if (error.data && error.data.error && error.data.error.details) {
      console.log('Detailed validation errors:', JSON.stringify(error.data.error.details, null, 2));
    }
    
    throw error;
  }
};

// Role Management API functions
export const createRole = async (roleData: CreateRoleRequest): Promise<Role> => {
  console.log('API Client - Creating role with data:', JSON.stringify(roleData, null, 2));
  return apiClient('/roles', {
    method: 'POST',
    body: roleData,
  });
};

export const getRoles = async (orgId?: string): Promise<Role[]> => {
  const endpoint = orgId ? `/roles?org_id=${orgId}` : '/roles';
  const response = await apiClient(endpoint, {
    method: 'GET',
  });
  
  // Handle paginated response
  if (response && response.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  // If it's already an array, return as is
  if (Array.isArray(response)) {
    return response;
  }
  
  // Fallback
  return [];
};

// Get roles with grants by fetching each role individually
export const getRolesWithGrants = async (orgId?: string): Promise<Role[]> => {
  try {
    // First get the list of roles
    const roles = await getRoles(orgId);
    
    // Then fetch detailed information for each role to get grants
    const rolesWithGrants = await Promise.all(
      roles.map(async (role) => {
        try {
          const detailedRole = await getRoleById(role.id);
          return detailedRole;
        } catch (error) {
          console.warn(`Failed to fetch details for role ${role.id}:`, error);
          // Return the basic role info if detailed fetch fails
          return role;
        }
      })
    );
    
    return rolesWithGrants;
  } catch (error) {
    console.error('Failed to fetch roles with grants:', error);
    throw error;
  }
};

export const getRoleById = async (roleId: string): Promise<Role> => {
  return apiClient(`/roles/${roleId}`, {
    method: 'GET',
  });
};

export const updateRole = async (roleId: string, roleData: UpdateRoleRequest): Promise<Role> => {
  return apiClient(`/roles/${roleId}`, {
    method: 'PATCH',
    body: roleData,
  });
};

export const deleteRole = async (roleId: string): Promise<void> => {
  return apiClient(`/roles/${roleId}`, {
    method: 'DELETE',
  });
};

// Permissions API functions
export const getPermissions = async (): Promise<Permission[]> => {
  const response = await apiClient('/permissions', {
    method: 'GET',
  });
  
  // Handle paginated response
  if (response && response.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  // If it's already an array, return as is
  if (Array.isArray(response)) {
    return response;
  }
  
  // Fallback
  return [];
};

// Get user's permissions
export const getUserPermissions = async (): Promise<Permission[]> => {
  try {
    // Get current user with their permissions
    const user = await apiClient('/users/me', {
      method: 'GET',
    });
    
    console.log('User data structure:', JSON.stringify(user, null, 2));
    
    if (!user) {
      console.warn('No user data found');
      return [];
    }
    
    // Check if user has permissions directly
    if (user.permissions && Array.isArray(user.permissions)) {
      console.log(`Found ${user.permissions.length} permissions directly in user object`);
      
      // Get all available permissions to match against user permissions
      const allPermissions = await getPermissions();
      console.log(`Found ${allPermissions.length} total permissions from /permissions endpoint`);
      
      // Convert user permissions to match Permission interface
      const userPermissions: Permission[] = [];
      
      for (const userPerm of user.permissions) {
        // User permissions have format: {action: ["manage"], subject: ["User"], conditions: {...}}
        // We need to match this to permissions with codes like "user:manage:org"
        
        if (userPerm.action && userPerm.subject && Array.isArray(userPerm.action) && Array.isArray(userPerm.subject)) {
          for (const action of userPerm.action) {
            for (const subject of userPerm.subject) {
              // Try to find matching permission by constructing expected code patterns
              const possibleCodes = [
                `${subject.toLowerCase()}:${action.toLowerCase()}`,
                `${subject.toLowerCase()}:${action.toLowerCase()}:org`,
                `${subject.toLowerCase()}:${action.toLowerCase()}:platform`,
                `${subject.toLowerCase()}:${action.toLowerCase()}:own`
              ];
              
              for (const code of possibleCodes) {
                const matchingPermission = allPermissions.find(p => p.code === code);
                if (matchingPermission && !userPermissions.find(up => up.id === matchingPermission.id)) {
                  userPermissions.push(matchingPermission);
                  console.log(`Matched permission: ${matchingPermission.code} (${matchingPermission.display_name})`);
                }
              }
            }
          }
        }
      }
      
      console.log(`Converted ${userPermissions.length} permissions for user`);
      return userPermissions;
    }
    
    // Fallback: if no direct permissions, try role-based approach
    if (user.roles && Array.isArray(user.roles)) {
      console.log('No direct permissions found, trying role-based approach');
      console.log('User roles:', user.roles);
      
      // Since roles are just strings, we can't get grants from them
      // This would require a different API endpoint like /users/me/roles with details
      console.warn('Role-based permission fetching not supported with current API structure');
      return [];
    }
    
    console.warn('No permissions or roles found for user');
    return [];
  } catch (error: any) {
    console.error('Failed to fetch user permissions:', error);
    return [];
  }
};

export const getUserPermissionsDetailed = async (): Promise<Permission[]> => {
  try {
    const user = await apiClient('/users/me', { method: 'GET' });
    
    if (!user) {
      console.log('No user data found for detailed method');
      return [];
    }
    
    console.log('Detailed method - checking user permissions directly');
    
    // If user has permissions array, convert them to Permission objects
    if (user.permissions && Array.isArray(user.permissions)) {
      const allPermissions = await getPermissions();
      const userPermissions: Permission[] = [];
      
      // Create a more comprehensive mapping
      for (const userPerm of user.permissions) {
        if (userPerm.action && userPerm.subject) {
          const actions = Array.isArray(userPerm.action) ? userPerm.action : [userPerm.action];
          const subjects = Array.isArray(userPerm.subject) ? userPerm.subject : [userPerm.subject];
          
          for (const action of actions) {
            for (const subject of subjects) {
              // Find all permissions that match this action/subject combination
              const matchingPermissions = allPermissions.filter(p => {
                const [permSubject, permAction] = p.code.split(':');
                return permSubject?.toLowerCase() === subject.toLowerCase() && 
                       permAction?.toLowerCase() === action.toLowerCase();
              });
              
              for (const perm of matchingPermissions) {
                if (!userPermissions.find(up => up.id === perm.id)) {
                  userPermissions.push(perm);
                  console.log(`Detailed method matched: ${perm.code}`);
                }
              }
            }
          }
        }
      }
      
      console.log(`Detailed method found ${userPermissions.length} permissions`);
      return userPermissions;
    }
    
    console.log('No permissions found in user object');
    return [];
  } catch (error) {
    console.error('Failed to fetch detailed user permissions:', error);
    return [];
  }
};

// Role Grant Management API functions
export const addGrantToRole = async (roleId: string, grantId: string) => {
  console.log('API Client - Adding grant to role:', { roleId, pattern: grantId });
  return apiClient(`/roles/${roleId}/grants`, {
    method: 'POST',
    body: { 
      pattern: grantId 
    },
  });
};

export const removeGrantFromRole = async (roleId: string, grantId: string) => {
  return apiClient(`/roles/${roleId}/grants/${grantId}`, {
    method: 'DELETE',
  });
};

// User Management API functions
export const getUsers = async (orgId?: string) => {
  const endpoint = orgId ? `/users?org_id=${orgId}` : '/users';
  const response = await apiClient(endpoint, {
    method: 'GET',
  });
  
  // Handle paginated response
  if (response && response.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  // If it's already an array, return as is
  if (Array.isArray(response)) {
    return response;
  }
  
  // Fallback
  return [];
};

export const getUserById = async (userId: string) => {
  return apiClient(`/users/${userId}`, {
    method: 'GET',
  });
};

export const createUser = async (userData: {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  password: string;
  role_id: string;
}) => {
  return apiClient('/users', {
    method: 'POST',
    body: userData,
  });
};

export const updateUser = async (userId: string, userData: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  role_id?: string;
}) => {
  return apiClient(`/users/${userId}`, {
    method: 'PATCH',
    body: userData,
  });
};

export const deleteUser = async (userId: string) => {
  return apiClient(`/users/${userId}`, {
    method: 'DELETE',
  });
};

// Avatar Upload API functions
export const getAvatarPresignedUrl = async (contentType: string) => {
  return apiClient(`/users/me/avatar/presigned-url?content_type=${encodeURIComponent(contentType)}`, {
    method: 'GET',
  });
};

export const updateUserAvatar = async (avatarPath: string | null) => {
  return apiClient('/users/me', {
    method: 'PATCH',
    body: { avatar_path: avatarPath },
  });
};

// Organization Logo Upload API functions
export const getOrganizationLogoPresignedUrl = async (orgId: string, contentType: string) => {
  return apiClient(`/organizations/${orgId}/logo/presigned-url?content_type=${encodeURIComponent(contentType)}`, {
    method: 'GET',
  });
};

export const updateOrganizationLogo = async (orgId: string, logoPath: string | null) => {
  return apiClient(`/organizations/${orgId}`, {
    method: 'PATCH',
    body: { logo_path: logoPath },
  });
};

export const uploadImageToPresignedUrl = async (uploadUrl: string, imageUri: string, contentType: string) => {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  });
  
  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
  }
  
  return uploadResponse;
};