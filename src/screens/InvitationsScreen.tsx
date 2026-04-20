import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { getInvitations, updateInvitation, resendInvitation, cancelInvitation } from '../api/client';
import { useOrganization } from '../hooks/useOrganization';
import { usePermissions } from '../hooks/usePermissions';

interface Invitation {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  role_slug: string;
  org_id: string;
  invited_by: string;
  expires_at: string;
  expired: boolean;
  created_at: string;
}

export const InvitationsScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { organization, isPlatformAdmin } = useOrganization();
  const { canManageUsers } = usePermissions();
  
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (canManageUsers) {
      fetchInvitations();
    }
  }, [canManageUsers]);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      // For platform admins, get all invitations; for org admins, get org-specific invitations
      const orgId = isPlatformAdmin ? undefined : organization?.id;
      const invitationsData = await getInvitations(orgId);
      setInvitations(invitationsData);
    } catch (error: any) {
      console.error('Failed to fetch invitations:', error);
      Alert.alert('Error', error.message || 'Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInvitations();
    setRefreshing(false);
  };

  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await resendInvitation(invitationId);
      Alert.alert('Success', 'Invitation resent successfully');
    } catch (error: any) {
      console.error('Failed to resend invitation:', error);
      Alert.alert('Error', error.message || 'Failed to resend invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvitation = (invitationId: string, userName: string) => {
    Alert.alert(
      'Cancel Invitation',
      `Are you sure you want to cancel the invitation for ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => confirmCancelInvitation(invitationId)
        }
      ]
    );
  };

  const confirmCancelInvitation = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await cancelInvitation(invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      Alert.alert('Success', 'Invitation cancelled successfully');
    } catch (error: any) {
      console.error('Failed to cancel invitation:', error);
      Alert.alert('Error', error.message || 'Failed to cancel invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditInvitation = (invitation: Invitation) => {
    navigation.navigate('EditInvitation', { invitation });
  };

  const getInvitationStatus = (invitation: Invitation) => {
    if (invitation.expired) {
      return 'expired';
    }
    // If not expired, it's still pending (since there's no accepted status in this API)
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    if (!status) return COLORS.textSecondary;
    switch (status.toLowerCase()) {
      case 'pending': return '#F59E0B';
      case 'accepted': return '#10B981';
      case 'expired': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return 'alert';
    switch (status.toLowerCase()) {
      case 'pending': return 'clock';
      case 'accepted': return 'check-circle';
      case 'expired': return 'x-circle';
      case 'cancelled': return 'ban';
      default: return 'alert';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const InvitationCard = ({ invitation }: { invitation: Invitation }) => {
    const isActionLoading = actionLoading === invitation.id;
    const userName = `${invitation.first_name || ''} ${invitation.last_name || ''}`.trim() || 'Unknown User';
    const contact = invitation.email || invitation.phone_number || 'No contact info';
    const status = getInvitationStatus(invitation);
    
    return (
      <View style={styles.invitationCard}>
        <View style={styles.invitationHeader}>
          <View style={styles.invitationInfo}>
            <Typography variant="body" style={styles.userName}>{userName}</Typography>
            <Typography variant="caption" color={COLORS.textSecondary}>{contact}</Typography>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
            <Icon 
              name={getStatusIcon(status)} 
              size={12} 
              color={getStatusColor(status)} 
            />
            <Typography 
              variant="caption" 
              color={getStatusColor(status)}
              style={styles.statusText}
            >
              {status.toUpperCase()}
            </Typography>
          </View>
        </View>
        
        <View style={styles.invitationDetails}>
          <Typography variant="caption" color={COLORS.textSecondary}>
            Sent: {invitation.created_at ? formatDate(invitation.created_at) : 'Unknown'}
          </Typography>
          <Typography variant="caption" color={COLORS.textSecondary}>
            Expires: {invitation.expires_at ? formatDate(invitation.expires_at) : 'Unknown'}
          </Typography>
        </View>

        {status === 'pending' && (
          <View style={styles.invitationActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditInvitation(invitation)}
              disabled={isActionLoading}
            >
              <Icon name="edit" size={16} color={COLORS.brand} />
              <Typography variant="caption" color={COLORS.brand} style={styles.actionText}>
                Edit
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleResendInvitation(invitation.id)}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color={COLORS.brand} />
              ) : (
                <>
                  <Icon name="send" size={16} color={COLORS.brand} />
                  <Typography variant="caption" color={COLORS.brand} style={styles.actionText}>
                    Resend
                  </Typography>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleCancelInvitation(invitation.id, userName)}
              disabled={isActionLoading}
            >
              <Icon name="close" size={16} color="#EF4444" />
              <Typography variant="caption" color="#EF4444" style={styles.actionText}>
                Cancel
              </Typography>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (!canManageUsers) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Invitations" 
          showBack={true} 
          onBack={() => navigation.goBack()} 
        />
        <View style={styles.noPermissionContainer}>
          <Icon name="shield" size={48} color={COLORS.textSecondary} />
          <Typography variant="h2" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
            Access Denied
          </Typography>
          <Typography variant="body" color={COLORS.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
            You don't have permission to manage invitations
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={isPlatformAdmin ? "All Invitations" : "Invitations"} 
        showBack={true} 
        onBack={() => navigation.goBack()} 
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
            Loading invitations...
          </Typography>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {invitations.length > 0 ? (
            <>
              <View style={styles.summaryCard}>
                <Typography variant="h2" style={styles.summaryTitle}>
                  Invitation Summary
                </Typography>
                <View style={styles.summaryStats}>
                  <View style={styles.statItem}>
                    <Typography variant="h1" color={COLORS.brand}>
                      {invitations.filter(inv => !inv.expired).length}
                    </Typography>
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      Pending
                    </Typography>
                  </View>
                  <View style={styles.statItem}>
                    <Typography variant="h1" color="#EF4444">
                      {invitations.filter(inv => inv.expired).length}
                    </Typography>
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      Expired
                    </Typography>
                  </View>
                  <View style={styles.statItem}>
                    <Typography variant="h1" color={COLORS.textSecondary}>
                      {invitations.length}
                    </Typography>
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      Total
                    </Typography>
                  </View>
                </View>
              </View>

              {invitations.map(invitation => (
                <InvitationCard key={invitation.id} invitation={invitation} />
              ))}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="mail" size={48} color={COLORS.textSecondary} />
              <Typography variant="h2" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
                No Invitations
              </Typography>
              <Typography variant="body" color={COLORS.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                No pending invitations found. Create a new user to send an invitation.
              </Typography>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => navigation.navigate('UserForm')}
              >
                <Icon name="add" size={20} color={COLORS.white} />
                <Typography variant="body" color={COLORS.white} style={{ marginLeft: 8 }}>
                  Invite User
                </Typography>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    marginBottom: 16,
    color: COLORS.text,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  invitationCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  invitationInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 10,
  },
  invitationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  actionText: {
    marginLeft: 4,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
});