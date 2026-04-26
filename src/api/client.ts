import { API_CONFIG } from './config';
import { authStore } from './authStore';
import { Organization } from '../types/organization';
import { Role, CreateRoleRequest, UpdateRoleRequest, Permission } from '../types/role';
import { Platform } from 'react-native';


type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
}

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

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
      // Skip refresh logic for auth endpoints — they don't use tokens
      const isAuthEndpoint = endpoint.startsWith('/auth/');
      if (response.status === 401 && !isRetry && !isAuthEndpoint) {
        console.log('Token expired, attempting refresh...');
        
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            // Retry with new token
            return apiClient(endpoint, options, true);
          }).catch((err) => {
            throw err;
          });
        }

        isRefreshing = true;
        refreshPromise = refreshAccessToken();

        try {
          const refreshResponse = await refreshPromise;
          
          if (refreshResponse && refreshResponse.access_token) {
            await authStore.saveToken(refreshResponse.access_token);
            
            // If new refresh token is provided, save it
            if (refreshResponse.refresh_token) {
              await authStore.saveRefreshToken(refreshResponse.refresh_token);
            }
            
            console.log('Token refreshed successfully');
            processQueue(null, refreshResponse.access_token);
            
            // Retry the original request with the new token
            return apiClient(endpoint, options, true);
          } else {
            throw new Error('No access token in refresh response');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          
          // Clear all tokens and redirect to login
          await authStore.clearAll();
          
          const error = {
            status: 401,
            message: 'Your session has expired. Please login again.',
            data,
            isTokenExpired: true,
          };
          
          processQueue(error, null);
          throw error;
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      }
      
      // Handle other 401 errors or if refresh failed (never for auth endpoints — they use credentials not tokens)
      if (response.status === 401 && !isAuthEndpoint) {
        console.log('Unauthorized request, clearing tokens');
        await authStore.clearAll();
        
        throw {
          status: response.status,
          message: 'Your session has expired. Please login again.',
          data,
          isTokenExpired: true,
        };
      }
      
      // Extract error message — always prefer backend message over frontend fallbacks
      let errorMessage = 'Something went wrong';
      
      if (data?.error) {
        if (data.error.message && data.error.message !== data.error.code) {
          // Backend provided a human-readable message
          errorMessage = data.error.message;
        } else if (data.error.details && Array.isArray(data.error.details) && data.error.details.length > 0) {
          // Use validation detail messages from backend
          errorMessage = data.error.details.map((detail: any) => {
            if (typeof detail === 'string') return detail;
            if (detail.message) return detail.message;
            if (detail.field && detail.error) return `${detail.field}: ${detail.error}`;
            return JSON.stringify(detail);
          }).join('\n');
        } else if (data.error.code) {
          // Use the error code as-is (readable form) — no frontend overrides
          errorMessage = data.error.code.replace(/_/g, ' ');
        }
      } else if (data?.message) {
        errorMessage = data.message;
      }

      throw {
        status: response.status,
        message: errorMessage,
        data,
        isTokenExpired: !!(data?.error?.code === 'UNAUTHORIZED' || data?.error?.code === 'MISSING_REFRESH_TOKEN'),
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

export const getAllOrganizations = async () => {
  const response = await apiClient('/organizations', { method: 'GET' });
  
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

export const createOrganization = async (orgData: {
  name: string;
  org_type: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  tin: string;
  contact_phone?: string;
  address?: string;
  license_number?: string;
  parent_org_id?: string;
}) => {
  console.log('API Client - Creating organization with data:', JSON.stringify(orgData, null, 2));
  return apiClient('/organizations', {
    method: 'POST',
    body: orgData,
  });
};

export const approveOrganization = async (orgId: string) => {
  console.log('API Client - Approving organization (setting status active):', orgId);
  return apiClient(`/organizations/${orgId}`, {
    method: 'PATCH',
    body: { status: 'active' },
  });
};

export const approveCooperativeApplication = async (orgId: string) => {
  console.log('API Client - Approving cooperative application for org:', orgId);
  return apiClient(`/organizations/${orgId}/cooperative-approve`, {
    method: 'POST',
  });
};

export const rejectCooperativeApplication = async (orgId: string, reason?: string) => {
  console.log('API Client - Rejecting cooperative application for org:', orgId, 'Reason:', reason);
  return apiClient(`/organizations/${orgId}/cooperative-reject`, {
    method: 'POST',
    body: reason ? { reason } : {},
  });
};

export const activateOrganization = async (orgId: string) => {
  console.log('API Client - Activating organization:', orgId);
  return apiClient(`/organizations/${orgId}`, {
    method: 'PATCH',
    body: { status: 'active' },
  });
};

export const suspendOrganization = async (orgId: string) => {
  return apiClient(`/organizations/${orgId}`, {
    method: 'PATCH',
    body: { status: 'suspended' },
  });
};

export const rejectOrganization = async (orgId: string, reason: string) => {
  return apiClient(`/organizations/${orgId}`, {
    method: 'PATCH',
    body: { status: 'rejected', rejection_reason: reason },
  });
};

export const updateOrganization = async (id: string, data: Partial<Organization>): Promise<Organization> => {
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

// 2FA Management API functions
export const initiate2FA = async (userId: string) => {
  return apiClient('/auth/resend-otp', {
    method: 'POST',
    body: { 
      user_id: userId,
      purpose: '2fa',
      channel: 'email'
    },
  });
};

export const verify2FA = async (userId: string, otp: string) => {
  return apiClient('/auth/2fa/verify', {
    method: 'POST',
    body: { 
      user_id: userId,
      otp: otp
    },
  });
};

export const enable2FA = async () => {
  return apiClient('/users/me', {
    method: 'PATCH',
    body: { 
      two_factor_enabled: true 
    },
  });
};

export const disable2FA = async () => {
  return apiClient('/users/me', {
    method: 'PATCH',
    body: { 
      two_factor_enabled: false 
    },
  });
};

// Post-login 2FA verification:
//   purpose='login'        → /auth/2fa/verify  (user has 2FA enabled, verifying login OTP)
//   purpose='verify_email' → /auth/verify-email (new user verifying their email)
//   fallback               → /auth/verify-login (legacy)
export const verifyPostLogin2FA = async (userId: string, otp: string, channel?: string, purpose?: string) => {
  let endpoint: string;
  let body: Record<string, any>;

  if (purpose === 'verify_email') {
    endpoint = '/auth/verify-email';
    body = { user_id: userId, otp };
  } else if (purpose === 'login') {
    // /auth/verify-2fa needs user_id, otp, device_name + X-Client-Type: mobile header
    endpoint = '/auth/verify-2fa';
    body = {
      user_id: userId,
      otp,
      device_name: `${Platform.OS}_${Platform.Version || 'device'}`,
    };
  } else {
    endpoint = '/auth/verify-login';
    body = {
      user_id: userId,
      otp,
      channel: channel || 'email',
      device_name: `${Platform.OS}_${Platform.Version || 'device'}`,
    };
  }

  console.log('=== verifyPostLogin2FA API Call ===');
  console.log('Endpoint:', endpoint);
  console.log('Purpose:', purpose);
  console.log('Request body:', JSON.stringify(body, null, 2));

  try {
    const response = await apiClient(endpoint, {
      method: 'POST',
      body,
    });
    console.log('verifyPostLogin2FA SUCCESS - Response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error: any) {
    console.log('verifyPostLogin2FA FAILED');
    console.log('Error status:', error?.status);
    console.log('Error code:', error?.data?.error?.code);
    console.log('Error message:', error?.data?.error?.message);
    console.log('Full error data:', JSON.stringify(error?.data, null, 2));
    throw error;
  }
};

export const requestPostLogin2FA = async (userIdOrIdentifier: string, channel?: string) => {
  return apiClient('/auth/resend-otp', {
    method: 'POST',
    body: {
      user_id: userIdOrIdentifier,
      purpose: 'login',
      channel: channel || 'email'
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
    const url = `${API_CONFIG.BASE_URL}/auth/refresh`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Type': 'mobile',
        // API requires refresh token as Bearer token in Authorization header
        'Authorization': `Bearer ${refreshToken}`,
        ...API_CONFIG.DEFAULT_HEADERS,
      },
    });

    let data = null;
    try {
      const text = await response.text();
      if (text.trim()) data = JSON.parse(text);
    } catch {
      throw new Error('Invalid response from refresh endpoint');
    }

    if (!response.ok) {
      await authStore.clearAll();
      throw {
        status: response.status,
        message: data?.error?.message || 'Session expired. Please log in again.',
        data,
        isTokenExpired: true,
      };
    }

    return data;
  } catch (error: any) {
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

// Get user's permissions - now handled by usePermissions hook
// The /users/me endpoint returns permissions directly in the user object

// Role Grant Management API functions
export const addGrantToRole = async (roleId: string, grantId: string) => {
  console.log('API Client - Adding grant to role:', { roleId, patterns: [grantId] });
  return apiClient(`/roles/${roleId}/grants`, {
    method: 'POST',
    body: { 
      patterns: [grantId] 
    },
  });
};

export const removeGrantFromRole = async (roleId: string, grantId: string) => {
  return apiClient(`/roles/${roleId}/grants/${grantId}`, {
    method: 'DELETE',
  });
};

// User Management API functions
export const getUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  user_type?: string;
  org_id?: string;
}) => {
  let endpoint = '/users';
  
  if (params) {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.user_type) searchParams.append('user_type', params.user_type);
    if (params.org_id) searchParams.append('org_id', params.org_id);
    
    if (searchParams.toString()) {
      endpoint += `?${searchParams.toString()}`;
    }
  }
  
  console.log('API Client - Fetching users with endpoint:', endpoint);
  
  const response = await apiClient(endpoint, {
    method: 'GET',
  });
  
  // Handle paginated response
  if (response && response.data && Array.isArray(response.data)) {
    return {
      data: response.data,
      total: response.total || response.data.length,
      page: response.page || 1,
      limit: response.limit || response.data.length,
      totalPages: response.totalPages || Math.ceil((response.total || response.data.length) / (response.limit || response.data.length))
    };
  }
  
  // If it's already an array, return as is with pagination info
  if (Array.isArray(response)) {
    return {
      data: response,
      total: response.length,
      page: 1,
      limit: response.length,
      totalPages: 1
    };
  }
  
  // Fallback
  return {
    data: [],
    total: 0,
    page: 1,
    limit: 0,
    totalPages: 0
  };
};

export const getUserById = async (userId: string) => {
  return apiClient(`/users/${userId}`, {
    method: 'GET',
  });
};

// Invite user instead of direct creation
export const inviteUser = async (userData: {
  first_name: string;
  last_name: string;
  org_id: string;
  role_slugs: string[];  // API requires array
  email?: string;
  phone_number?: string;
}) => {
  console.log('inviteUser - sending payload:', JSON.stringify(userData, null, 2));
  try {
    return await apiClient('/users/invite', {
      method: 'POST',
      body: userData,
    });
  } catch (error: any) {
    if (error?.data?.error?.details) {
      console.error('inviteUser - validation details:', JSON.stringify(error.data.error.details, null, 2));
    }
    throw error;
  }
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

// Invitation Management API functions
export const getInvitations = async (orgId?: string, page?: number, limit?: number) => {
  let endpoint = '/users/invitations';
  const params = new URLSearchParams();
  
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  if (orgId) params.append('org_id', orgId);
  
  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }
  
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

export const updateInvitation = async (invitationId: string, updateData: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  role_id?: string;
  locale?: string;
}) => {
  return apiClient(`/users/invitations/${invitationId}`, {
    method: 'PATCH',
    body: updateData,
  });
};

export const resendInvitation = async (invitationId: string) => {
  return apiClient(`/users/invitations/${invitationId}/resend`, {
    method: 'POST',
  });
};

export const cancelInvitation = async (invitationId: string) => {
  return apiClient(`/users/invitations/${invitationId}`, {
    method: 'DELETE',
  });
};
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