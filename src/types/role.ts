export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  grants?: Grant[];
  created_at: string;
  updated_at: string;
}

export interface Grant {
  id: string;
  pattern: string;
  description?: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}