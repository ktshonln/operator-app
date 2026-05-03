import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '../components/Icon';
import { useOrganization } from '../hooks/useOrganization';
import { usePermissions } from '../hooks/usePermissions';

export const UserManagementScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const {
    canManageUsers,
    canManageRoles,
    canViewOrganizations,
    canManageOrganizations,
    isPlatformAdmin,
  } = usePermissions();

  const ManagementItem = ({ 
    title, 
    description, 
    icon, 
    onPress, 
    iconColor,
    available = true 
  }: { 
    title: string;
    description: string;
    icon: any;
    onPress?: () => void;
    iconColor?: string;
    available?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.item, !available && styles.itemDisabled]} 
      onPress={available ? onPress : undefined}
      disabled={!available}
    >
      <View style={[styles.iconContainer, { backgroundColor: (iconColor || COLORS.brand) + '15' }]}>
        <Icon name={icon} size={24} color={iconColor || COLORS.brand} />
      </View>
      <View style={styles.itemContent}>
        <Typography variant="body" style={[styles.titleText, !available && styles.disabledText]}>
          {title}
        </Typography>
        <Typography variant="caption" color={available ? COLORS.textSecondary : COLORS.textMuted} style={styles.descriptionText}>
          {description}
        </Typography>
      </View>
      {available && (
        <Icon name="chevron-right" size={20} color={COLORS.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Account & Access" 
        showBack={true} 
        onBack={() => navigation.goBack()}
        rightElement={<View />}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Organization Management Section */}
        {(canViewOrganizations || canManageOrganizations) && (
          <>
            <Typography variant="caption" style={styles.sectionHeader}>
              ORGANIZATION
            </Typography>
            
            <ManagementItem
              title={isPlatformAdmin ? t('platformAdmin.allOrganizations') : "Organization Profile"}
              description={isPlatformAdmin ? "Manage all organizations on the platform" : "View and edit organization details"}
              icon="business"
              iconColor="#8B5CF6"
              onPress={() => navigation.navigate(isPlatformAdmin ? 'AllOrganizations' : 'Organization')}
              available={canViewOrganizations || canManageOrganizations}
            />
          </>
        )}

        {/* User Management Section */}
        <Typography variant="caption" style={styles.sectionHeader}>
          TEAM & PERMISSIONS
        </Typography>
        
        <ManagementItem
          title={isPlatformAdmin ? t('platformAdmin.allUsers') : "Team Members"}
          description={isPlatformAdmin ? "Manage all users across organizations" : "View and manage team members"}
          icon="users"
          iconColor={COLORS.brand}
          onPress={() => navigation.navigate(isPlatformAdmin ? 'AllUsers' : 'UsersList')}
          available={canManageUsers}
        />
        
        <ManagementItem
          title="Pending Invitations"
          description="View and manage team invitations"
          icon="mail"
          iconColor="#F59E0B"
          onPress={() => navigation.navigate('Invitations')}
          available={canManageUsers}
        />
        
        <ManagementItem
          title={isPlatformAdmin ? t('platformAdmin.allRoles') : "Roles & Access"}
          description={isPlatformAdmin ? "Manage all roles across the platform" : "Manage team roles and permissions"}
          icon="shield"
          iconColor="#10B981"
          onPress={() => navigation.navigate('RoleManagement')}
          available={canManageRoles}
        />

        {/* Personal Section */}
        <Typography variant="caption" style={styles.sectionHeader}>
          MY ACCESS
        </Typography>
        
        <ManagementItem
          title="My Permissions"
          description="View your current permissions and access level"
          icon="shield-check"
          iconColor="#6B7280"
          onPress={() => navigation.navigate('UserPermissions')}
          available={true}
        />

        {/* Info Section */}
        {organization && !isPlatformAdmin && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="info" size={16} color={COLORS.brand} />
              <Typography variant="caption" style={styles.infoTitle}>
                CURRENT ORGANIZATION
              </Typography>
            </View>
            <Typography variant="body" style={styles.organizationName}>
              {organization.name}
            </Typography>
            <Typography variant="caption" color={COLORS.textSecondary}>
              You can manage team members within your organization
            </Typography>
          </View>
        )}

        {isPlatformAdmin && (
          <View style={[styles.infoCard, styles.platformAdminCard]}>
            <View style={styles.infoHeader}>
              <Icon name="shield-check" size={16} color="#F59E0B" />
              <Typography variant="caption" style={[styles.infoTitle, { color: '#F59E0B' }]}>
                PLATFORM ADMINISTRATOR
              </Typography>
            </View>
            <Typography variant="body" style={styles.organizationName}>
              Full Platform Access
            </Typography>
            <Typography variant="caption" color={COLORS.textSecondary}>
              You have administrative access to all organizations and users
            </Typography>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemDisabled: {
    backgroundColor: '#F8F9FA',
    opacity: 0.6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  disabledText: {
    color: COLORS.textMuted,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  platformAdminCard: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  organizationName: {
    fontWeight: '600',
    marginBottom: 4,
  },
});