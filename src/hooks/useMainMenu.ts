import { useNavigation } from '@react-navigation/native';
import { usePermissions } from './usePermissions';

export const useMainMenu = () => {
  const navigation = useNavigation<any>();
  const {
    canManageUsers,
    canManageRoles,
    canViewOrganizations,
    canManageOrganizations,
  } = usePermissions();

  const getMenuItems = () => {
    const items = [];
    
    // Analytics
    items.push({
      id: 'analytics',
      title: 'Analytics',
      icon: 'chart' as const,
      onPress: () => navigation.navigate('Analytics'),
    });
    
    // User Management - Only for users who can manage users or roles
    if (canManageUsers || canManageRoles || canViewOrganizations || canManageOrganizations) {
      items.push({
        id: 'user-management',
        title: 'Account & Access',
        icon: 'users' as const,
        onPress: () => navigation.navigate('UserManagement'),
      });
    }
    
    // Settings
    items.push({
      id: 'settings',
      title: 'Settings',
      icon: 'settings' as const,
      onPress: () => navigation.navigate('Settings'),
    });
    
    return items;
  };

  return { getMenuItems };
};