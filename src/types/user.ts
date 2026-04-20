export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  phone_verified_at?: string | null;
  email_verified_at?: string | null;
  avatar_path?: string;
  user_type: string; // 'staff', 'admin', 'driver', etc.
  status: string; // 'active', 'inactive', 'suspended'
  org_id: string | null; // null for platform admins
  roles: string[];
  permissions?: Array<{
    inverted: boolean;
    action: string[];
    subject: string[];
    conditions?: {
      org_id?: string | null;
      id?: string;
      [key: string]: any;
    };
  }>;
  login_channel?: string;
  notif_channel?: string[];
  locale?: string;
  two_factor_enabled?: boolean;
  driver_license_number?: string | null;
  driver_license_verified_at?: string | null;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  // Legacy fields for backward compatibility
  role_id?: string;
  role?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  password: string;
  role_id: string;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  role_id?: string;
}