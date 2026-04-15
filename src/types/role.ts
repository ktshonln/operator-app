export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  org_id?: string;
  is_managed: boolean;
  grants?: Grant[];
  created_at: string;
  updated_at?: string;
}

export interface Grant {
  id: string;
  pattern: string;
  is_managed: boolean;
  created_at: string;
  description?: string;
}

export interface Permission {
  id: string;
  code: string;
  action: string;
  subject: string;
  display_name: string;
  description: string;
  group: string;
  scopes: string[];
}

export interface CreateRoleRequest {
  name: string;
  org_id: string;
  patterns: string[];
  slug?: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}