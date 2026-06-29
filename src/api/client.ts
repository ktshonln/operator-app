import { API_CONFIG } from './config';
import { authStore } from './authStore';
import { Organization } from '../types/organization';
import { Role, CreateRoleRequest, UpdateRoleRequest, Permission } from '../types/role';
import { isDriverRoleSlug } from '../utils/roles';
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
// Bumped on login/logout so stale in-flight 401s cannot clear a newer session
let authEpoch = 0;
let authLoginGraceUntil = 0;

/** Call on login/logout — invalidates pending refresh/retry and queued requests */
export const resetAuthClientState = () => {
  authEpoch += 1;
  authLoginGraceUntil = 0;
  isRefreshing = false;
  refreshPromise = null;
  const aborted = { status: 401, message: 'Auth state changed', isAborted: true };
  processQueue(aborted, null);
};

/** Ignore session-revoked clears briefly after login (Katisha session propagation) */
export const beginLoginGrace = (ms = 5000) => {
  authLoginGraceUntil = Date.now() + ms;
};

const clearAuthIfCurrent = async (requestEpoch: number): Promise<boolean> => {
  if (requestEpoch !== authEpoch) {
    console.log('Skipping auth clear — superseded by a newer login');
    return false;
  }
  await authStore.clearAll();
  return true;
};

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

const isSessionRevokedError = (data: any): boolean => {
  const code = data?.error?.code ?? '';
  const message = (data?.error?.message ?? '').toLowerCase();
  return code === 'SESSION_REVOKED' || message.includes('session revoked');
};

const buildUnauthorizedError = (data: any, status: number) => {
  const revoked = isSessionRevokedError(data);
  return {
    status,
    message: revoked
      ? 'Your session was ended by the server. Please log in again.'
      : 'Your session has expired. Please login again.',
    data,
    isTokenExpired: true,
    isSessionRevoked: revoked,
  };
};

const unwrapTokenPayload = (payload: any) =>
  payload?.data && !payload?.access_token ? payload.data : payload;

export const apiClient = async (endpoint: string, options: RequestOptions = {}, isRetry = false) => {
  const { method = 'GET', headers = {}, body } = options;
  const requestEpoch = authEpoch;

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

      if (response.status === 401 && !isAuthEndpoint) {
        const missingAuthHeader =
          !token ||
          (data?.error?.message ?? '').toLowerCase().includes('missing authorization');

        // No token sent — already logged out; don't refresh or wipe a newer login
        if (missingAuthHeader) {
          throw buildUnauthorizedError(data, response.status);
        }

        // Session revoked — refresh cannot recover
        if (isSessionRevokedError(data)) {
          const inLoginGrace = Date.now() < authLoginGraceUntil;
          if (inLoginGrace) {
            console.warn('Session revoked during login grace — keeping tokens');
          } else {
            console.log('Session revoked, clearing tokens');
            await clearAuthIfCurrent(requestEpoch);
          }
          throw buildUnauthorizedError(data, response.status);
        }

        if (!isRetry) {
          console.log('Token expired, attempting refresh...');

          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(() => apiClient(endpoint, options, true)).catch((err) => {
              throw err;
            });
          }

          isRefreshing = true;
          refreshPromise = refreshAccessToken(requestEpoch);

          try {
            const refreshResponse = unwrapTokenPayload(await refreshPromise);

            if (refreshResponse?.access_token) {
              await authStore.saveToken(refreshResponse.access_token);

              if (refreshResponse.refresh_token) {
                await authStore.saveRefreshToken(refreshResponse.refresh_token);
              }

              console.log('Token refreshed successfully');
              processQueue(null, refreshResponse.access_token);

              return apiClient(endpoint, options, true);
            }

            throw new Error('No access token in refresh response');
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);

            await clearAuthIfCurrent(requestEpoch);

            const error = buildUnauthorizedError(data, 401);
            processQueue(error, null);
            throw error;
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        }

        console.log('Unauthorized request, clearing tokens');
        await clearAuthIfCurrent(requestEpoch);
        throw buildUnauthorizedError(data, response.status);
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

      // Log full error details for debugging
      if (__DEV__) {
        console.error('Full API Error Details:', {
          url,
          method,
          status: response.status,
          errorCode: data?.error?.code,
          errorMessage: data?.error?.message,
          errorDetails: data?.error?.details,
          fullData: data,
        });
        
        // For 500 errors, remind developer to check backend logs
        if (response.status === 500) {
          console.warn('⚠️ 500 Internal Server Error - Check your backend server logs for the actual error details');
        }
      }

      throw {
        status: response.status,
        message: errorMessage,
        data,
        isTokenExpired: false,
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
const normalizeOrganization = (raw: any): Organization => {
  const data = raw?.data ?? raw?.organization ?? raw;
  return data as Organization;
};

/** GET /organizations/me — user-service; org_id comes from JWT (no query param for org admins). */
export const getMyOrganization = async (): Promise<Organization> => {
  const response = await apiClient('/organizations/me', {
    method: 'GET',
  });
  const org = normalizeOrganization(response);
  if (__DEV__ && org?.id) {
    console.log('getMyOrganization OK:', {
      id: org.id,
      name: org.name,
      status: org.status,
    });
  }
  return org;
};

export const getAllOrganizations = async () => {
  const allOrgs: any[] = [];
  let page = 1;
  let total = 0;
  const limit = 100;

  do {
    const response = await apiClient(`/organizations?page=${page}&limit=${limit}`, { method: 'GET' });

    let batch: any[] = [];
    if (response?.data && Array.isArray(response.data)) {
      batch = response.data;
      total = response.total ?? batch.length;
    } else if (Array.isArray(response)) {
      batch = response;
      total = batch.length;
    }

    allOrgs.push(...batch);
    page += 1;
  } while (allOrgs.length < total);

  return allOrgs;
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
export const refreshAccessToken = async (requestEpoch?: number) => {
  const epoch = requestEpoch ?? authEpoch;
  const refreshToken = await authStore.getRefreshToken();

  if (!refreshToken) {
    console.warn('No refresh token available');
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
      if (epoch === authEpoch) await authStore.clearAll();
      throw {
        status: response.status,
        message: data?.error?.message || 'Session expired. Please log in again.',
        data,
        isTokenExpired: true,
      };
    }

    return unwrapTokenPayload(data);
  } catch (error: any) {
    if (error?.isTokenExpired) throw error;
    if (epoch === authEpoch) await authStore.clearAll();
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

export interface DriverOption {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  licenseNumber?: string;
  /** Has role slug driver but user_type is not staff — cannot assign to bus. */
  pendingActivation?: boolean;
  userType?: string;
  roleSlugs?: string[];
}

const mapDriverUsers = (users: any[], pendingActivation = false): DriverOption[] =>
  users
    .filter(user => user?.id && user.status !== 'inactive')
    .map(user => ({
      id: user.id,
      name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email || 'driver',
      email: user.email,
      licenseNumber: user.driver_license_number ?? undefined,
      pendingActivation,
      userType: user.user_type,
      roleSlugs: user.roles,
    }));

/** Katisha user_type is passenger or staff. Bus drivers are staff with role slug driver. */
const isStaffUser = (user: any): boolean =>
  String(user?.user_type ?? '').toLowerCase() === 'staff';

const userHasDriverRole = (user: any, driverSlugs: Set<string>): boolean => {
  const roles: string[] = user.roles ?? [];
  return roles.some((slug: string) => driverSlugs.has(slug));
};

const isBusAssignableDriver = (user: any, driverSlugs: Set<string>): boolean =>
  Boolean(user?.id) &&
  user.status !== 'inactive' &&
  isStaffUser(user) &&
  userHasDriverRole(user, driverSlugs);

const fetchStaffOrgUsers = async (orgId: string): Promise<any[]> => {
  const matched: any[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await getUsers({ org_id: orgId, user_type: 'staff', page, limit: 100 });
    const batch = response.data ?? [];
    matched.push(...batch);
    totalPages = response.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return matched;
};

const fetchAllOrgUsers = async (orgId: string): Promise<any[]> => {
  const allUsers: any[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await getUsers({ org_id: orgId, page, limit: 100 });
    allUsers.push(...(response.data ?? []));
    totalPages = response.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return allUsers;
};

const getDriverRoleSlugs = async (orgId: string): Promise<Set<string>> => {
  const slugs = new Set<string>(['driver']);
  try {
    const roles = await getRoles(orgId);
    for (const role of roles) {
      if (role.slug && isDriverRoleSlug(role.slug)) {
        slugs.add(role.slug);
      }
    }
  } catch (error) {
    console.warn('getDrivers: could not load org roles', error);
  }
  return slugs;
};

/** Staff users with role slug driver — valid driver_id candidates for buses. */
export const getDriverRoleUsers = async (orgId: string): Promise<DriverOption[]> => {
  const driverSlugs = await getDriverRoleSlugs(orgId);

  let candidates: any[] = [];
  try {
    candidates = await fetchStaffOrgUsers(orgId);
  } catch (error) {
    console.warn('getDrivers: user_type=staff query failed', error);
    candidates = await fetchAllOrgUsers(orgId);
  }

  const enrichedUsers = await Promise.all(
    candidates.map(async user => {
      try {
        return await getUserById(user.id);
      } catch {
        return user;
      }
    }),
  );

  const assignable = enrichedUsers.filter(user => isBusAssignableDriver(user, driverSlugs));
  console.log(
    `getDrivers: org=${orgId} assignable=${assignable.length}`,
    assignable.map(u => ({ id: u.id, user_type: u.user_type, roles: u.roles })),
  );
  return mapDriverUsers(assignable, false);
};

/** Role slug driver but user_type is not staff (e.g. still passenger). */
export const getPendingDrivers = async (orgId: string): Promise<DriverOption[]> => {
  const driverSlugs = await getDriverRoleSlugs(orgId);
  const allUsers = await fetchAllOrgUsers(orgId);

  const enrichedUsers = await Promise.all(
    allUsers.map(async user => {
      try {
        return await getUserById(user.id);
      } catch {
        return user;
      }
    }),
  );

  const pending = enrichedUsers.filter(
    user => userHasDriverRole(user, driverSlugs) && !isBusAssignableDriver(user, driverSlugs),
  );

  if (pending.length > 0) {
    console.warn(
      'getDrivers: users have role slug driver but are not staff:',
      pending.map(u => ({ id: u.id, name: `${u.first_name} ${u.last_name}`, user_type: u.user_type, roles: u.roles })),
    );
  }

  return mapDriverUsers(pending, true);
};

/** Org users assignable as bus driver_id. */
export const getDrivers = async (orgId: string): Promise<DriverOption[]> => {
  return getDriverRoleUsers(orgId);
};

export const getUserById = async (userId: string) => {
  return apiClient(`/users/${userId}`, {
    method: 'GET',
  });
};

// Invite user instead of direct creation — API only accepts these fields (no user_type).
export const inviteUser = async (userData: {
  first_name: string;
  last_name: string;
  org_id: string;
  role_slugs: string[];
  email?: string;
  phone_number?: string;
}) => {
  const payload: Record<string, unknown> = {
    first_name: userData.first_name,
    last_name: userData.last_name,
    org_id: userData.org_id,
    role_slugs: userData.role_slugs,
  };
  if (userData.email) payload.email = userData.email;
  if (userData.phone_number) payload.phone_number = userData.phone_number;

  console.log('inviteUser - sending payload:', JSON.stringify(payload, null, 2));
  try {
    return await apiClient('/users/invite', {
      method: 'POST',
      body: payload,
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
  phone_number?: string;
  driver_license_number?: string;
}) => {
  return apiClient(`/users/${userId}`, {
    method: 'PATCH',
    body: userData,
  });
};

/** Replace or assign roles — profile PATCH does not accept role fields. */
export const getUserRoles = async (userId: string) => {
  return apiClient(`/users/${userId}/roles`, { method: 'GET' });
};

const normalizeAssignedRoles = (response: any): Array<{ id?: string; slug?: string }> => {
  if (!response) return [];
  const raw = Array.isArray(response) ? response : response.data ?? response.roles ?? [];
  if (!Array.isArray(raw)) return [];

  return raw.map((role: any) => ({
    id: role.id ?? role.role_id,
    slug: role.slug ?? role.role_slug,
  }));
};

const removeUserRole = async (
  userId: string,
  role: { id?: string; slug?: string },
) => {
  const attempts: Array<{ method: HttpMethod; endpoint?: string; body?: Record<string, unknown> }> = [
    ...(role.id ? [{ method: 'DELETE' as const, endpoint: `/users/${userId}/roles/${role.id}` }] : []),
    ...(role.id ? [{ method: 'DELETE' as const, body: { role_id: role.id } }] : []),
    ...(role.slug ? [{ method: 'DELETE' as const, body: { role_slug: role.slug } }] : []),
  ];

  for (const attempt of attempts) {
    try {
      await apiClient(attempt.endpoint ?? `/users/${userId}/roles`, {
        method: attempt.method,
        body: attempt.body,
      });
      return;
    } catch {
      // try next shape
    }
  }
};

export const updateUserRoles = async (
  userId: string,
  params: { roleId: string; roleSlug: string },
) => {
  const { roleSlug } = params;

  console.log(`updateUserRoles: PUT /users/${userId}/roles`, { role_slugs: [roleSlug] });
  return apiClient(`/users/${userId}/roles`, {
    method: 'PUT',
    body: { role_slugs: [roleSlug] },
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