import React, { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import './src/i18n'; // initialise i18next with Kinyarwanda as default language
import './src/types/navigation'; // navigation types
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from './src/screens/LoginScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { MainTabNavigator } from './src/navigation/MainTabNavigator';
import { NotificationScreen } from './src/screens/NotificationScreen';
import { OTPScreen } from './src/screens/OTPScreen';
import { ResetPasswordConfirmScreen } from './src/screens/ResetPasswordConfirmScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ChangePasswordScreen } from './src/screens/ChangePasswordScreen';
import { UsersListScreen } from './src/screens/UsersListScreen';
import { UserDetailsScreen } from './src/screens/UserDetailsScreen';
import { UserFormScreen } from './src/screens/UserFormScreen';
import { OrganizationScreen } from './src/screens/OrganizationScreen';
import { TwoFactorScreen } from './src/screens/TwoFactorScreen';
import { PostLogin2FAScreen } from './src/screens/PostLogin2FAScreen';
import { RoleManagementScreen } from './src/screens/RoleManagementScreen';
import { UserPermissionsScreen } from './src/screens/UserPermissionsScreen';
import { LoginChannelScreen } from './src/screens/LoginChannelScreen';
import { AllOrganizationsScreen } from './src/screens/AllOrganizationsScreen';
import { CreateOrganizationScreen } from './src/screens/CreateOrganizationScreen';
import { AllUsersScreen } from './src/screens/AllUsersScreen';
import { InvitationsScreen } from './src/screens/InvitationsScreen';
import { EditInvitationScreen } from './src/screens/EditInvitationScreen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();

function AppNavigator() {
  const { isAuthenticated, needs2FAVerification, loading } = useAuth();

  useEffect(() => {
    async function hideSplash() {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Error hiding splash screen:', error);
      }
    }
    
    if (!loading) {
      hideSplash();
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' }}>
        <ActivityIndicator size="large" color="#008BFF" />
      </View>
    );
  }

  // Determine initial route based on auth and 2FA state
  let initialRouteName = "Login";
  if (needs2FAVerification) {
    initialRouteName = "PostLogin2FA";
  } else if (isAuthenticated) {
    initialRouteName = "Main";
  }
  
  console.log('App navigation decision:', { 
    initialRouteName, 
    isAuthenticated, 
    needs2FAVerification, 
    loading 
  });

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="ResetPasswordConfirm" component={ResetPasswordConfirmScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="UsersList" component={UsersListScreen} />
        <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
        <Stack.Screen name="UserForm" component={UserFormScreen} />
        <Stack.Screen name="Organization" component={OrganizationScreen} />
        <Stack.Screen name="TwoFactor" component={TwoFactorScreen} />
        <Stack.Screen name="PostLogin2FA" component={PostLogin2FAScreen} />
        <Stack.Screen name="RoleManagement" component={RoleManagementScreen} />
        <Stack.Screen name="UserPermissions" component={UserPermissionsScreen} />
        <Stack.Screen name="LoginChannel" component={LoginChannelScreen} />
        <Stack.Screen name="AllOrganizations" component={AllOrganizationsScreen} />
        <Stack.Screen name="CreateOrganization" component={CreateOrganizationScreen} />
        <Stack.Screen name="AllUsers" component={AllUsersScreen} />
        <Stack.Screen name="Invitations" component={InvitationsScreen} />
        <Stack.Screen name="EditInvitation" component={EditInvitationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;

