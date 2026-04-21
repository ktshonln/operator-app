// Permission utility functions for handling user permissions and access control
import { User as BaseUser } from '../types/user';

export interface UserPermission {
  inverted: boolean;
  action: string[];
  subject: string[];
  conditions?: {
    org_id?: string | null;
    id?: string;
    [key: string]: any;
  };
}

export interface User extends BaseUser {
  permissions: UserPermission[];
}

/**
 * Check if user has permission to perform an action on a subject
 */
export const hasPermission = (
  user: User | null,
  action: string,
  subject: string,
  resourceId?: string
): boolean => {
  if (!user || !user.permissions) {
    return false;
  }

  // Platform admin with "manage all" permission has access to everything
  const hasManageAll = user.permissions.some(
    perm => 
      perm.action.includes('manage') && 
      perm.subject.includes('all') && 
      !perm.inverted
  );

  if (hasManageAll) {
    return true;
  }

  // Check specific permissions
  return user.permissions.some(permission => {
    // Skip inverted permissions for now (they deny access)
    if (permission.inverted) {
      return false;
    }

    // Check if action matches (exact match or 'manage' which includes all actions)
    const actionMatches = permission.action.includes(action) || 
                         permission.action.includes('manage');
    
    // Check if subject matches (exact match or 'all' which includes all subjects)
    const subjectMatches = permission.subject.includes(subject) || 
                          permission.subject.includes('all');

    if (!actionMatches || !subjectMatches) {
      return false;
    }

    // If no conditions, permission applies globally
    if (!permission.conditions || Object.keys(permission.conditions).length === 0) {
      return true;
    }

    // Check conditions if they exist
    if (permission.conditions) {
      // Organization-scoped permissions
      if (permission.conditions.org_id !== undefined) {
        // If condition requires specific org_id, user must be in that org
        if (permission.conditions.org_id !== null && user.org_id !== permission.conditions.org_id) {
          return false;
        }
        // If condition allows null org_id, it's platform-wide (for platform admins)
        if (permission.conditions.org_id === null) {
          return true; // Platform-wide permission
        }
      }

      // Resource-specific permissions (e.g., specific organization)
      if (permission.conditions.id !== undefined && resourceId) {
        if (permission.conditions.id !== resourceId) {
          return false;
        }
      }
    }

    return true;
  });
};

/**
 * Check if user can manage users
 */
export const canManageUsers = (user: User | null): boolean => {
  return hasPermission(user, 'manage', 'User');
};

/**
 * Check if user can manage roles
 */
export const canManageRoles = (user: User | null): boolean => {
  const result = hasPermission(user, 'manage', 'Role');
  
  // Debug logging for platform admin role management
  if (user && user.roles?.includes('platform-admin')) {
    console.log('canManageRoles debug for platform admin:', {
      userId: user.id,
      roles: user.roles,
      permissions: user.permissions,
      result,
      hasManageAll: user.permissions?.some(
        perm => 
          perm.action.includes('manage') && 
          perm.subject.includes('all') && 
          !perm.inverted
      )
    });
  }
  
  return result;
};

/**
 * Check if user can manage organizations
 */
export const canManageOrganizations = (user: User | null): boolean => {
  return hasPermission(user, 'manage', 'Org');
};

/**
 * Check if user can view/read organizations
 */
export const canViewOrganizations = (user: User | null): boolean => {
  return hasPermission(user, 'read', 'Org') || hasPermission(user, 'manage', 'Org');
};

/**
 * Check if user can manage invitations
 */
export const canManageInvitations = (user: User | null): boolean => {
  return hasPermission(user, 'manage', 'Invitation');
};

/**
 * Check if user can manage organization documents
 */
export const canManageOrgDocuments = (user: User | null): boolean => {
  return hasPermission(user, 'manage', 'OrgDocument');
};

/**
 * Check if user can view audit logs
 */
export const canViewAuditLogs = (user: User | null): boolean => {
  return hasPermission(user, 'manage', 'AuditLog') || hasPermission(user, 'read', 'AuditLog');
};

/**
 * Check if user can manage notifications
 */
export const canManageNotifications = (user: User | null): boolean => {
  return hasPermission(user, 'manage', 'Notification');
};

/**
 * Check if user is platform admin
 */
export const isPlatformAdmin = (user: User | null): boolean => {
  if (!user) return false;
  
  return user.roles.includes('platform-admin') || 
         user.permissions.some(
           perm => 
             perm.action.includes('manage') && 
             perm.subject.includes('all') && 
             !perm.inverted
         );
};

/**
 * Check if user is organization admin
 */
export const isOrgAdmin = (user: User | null): boolean => {
  if (!user) return false;
  
  return user.roles.includes('org-admin') && user.org_id !== null;
};

/**
 * Get user's organization scope
 */
export const getUserOrgScope = (user: User | null): string | null => {
  if (!user) return null;
  return user.org_id;
};

/**
 * Check if user can access a specific organization
 */
export const canAccessOrganization = (user: User | null, orgId: string): boolean => {
  if (!user) return false;
  
  // Platform admin can access any organization
  if (isPlatformAdmin(user)) {
    return true;
  }
  
  // Organization admin can only access their own organization
  if (isOrgAdmin(user)) {
    return user.org_id === orgId;
  }
  
  // Check specific permissions for the organization
  return hasPermission(user, 'read', 'Org', orgId) || hasPermission(user, 'manage', 'Org', orgId);
};

/**
 * Get available menu items based on user permissions
 */
export const getAvailableMenuItems = (user: User | null) => {
  if (!user) return [];

  const menuItems = [];

  // Profile is always available
  menuItems.push('profile');

  // Organization management
  if (canViewOrganizations(user) || canManageOrganizations(user)) {
    menuItems.push('organization');
  }

  // User management
  if (canManageUsers(user)) {
    menuItems.push('users');
  }

  // Role management
  if (canManageRoles(user)) {
    menuItems.push('roles');
  }

  // Permissions view
  menuItems.push('permissions'); // Users can always view their own permissions

  // Invitations
  if (canManageInvitations(user)) {
    menuItems.push('invitations');
  }

  // Organization documents
  if (canManageOrgDocuments(user)) {
    menuItems.push('documents');
  }

  // Audit logs
  if (canViewAuditLogs(user)) {
    menuItems.push('audit-logs');
  }

  // Notifications
  if (canManageNotifications(user)) {
    menuItems.push('notifications');
  }

  return menuItems;
};

/**
 * Format permissions for display
 */
export const formatPermissionForDisplay = (permission: UserPermission): string => {
  const actions = permission.action.join(', ');
  const subjects = permission.subject.join(', ');
  
  let description = `${actions} ${subjects}`;
  
  if (permission.conditions) {
    const conditions = [];
    
    if (permission.conditions.org_id !== undefined) {
      if (permission.conditions.org_id === null) {
        conditions.push('platform-wide');
      } else {
        conditions.push(`org: ${permission.conditions.org_id}`);
      }
    }
    
    if (permission.conditions.id) {
      conditions.push(`resource: ${permission.conditions.id}`);
    }
    
    if (conditions.length > 0) {
      description += ` (${conditions.join(', ')})`;
    }
  }
  
  return description;
};