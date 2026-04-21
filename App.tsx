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
import { authStore } from './src/api/authStore';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needs2FAVerification, setNeeds2FAVerification] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      try {
        await SplashScreen.hideAsync();
        
        // Check if user has valid tokens
        const token = await authStore.getToken();
        const refreshToken = await authStore.getRefreshToken();
        const user = await authStore.getUser();
        
        // If we have both tokens, consider user authenticated
        const hasTokens = !!(token && refreshToken);
        setIsAuthenticated(hasTokens);
        
        // Check if user needs 2FA verification
        if (hasTokens) {
          // User is fully authenticated
          setNeeds2FAVerification(false);
        } else if (user && !hasTokens) {
          // User exists but no tokens - might be in 2FA flow
          console.log('User exists without tokens - setting needs2FAVerification to true');
          setNeeds2FAVerification(true);
        } else {
          setNeeds2FAVerification(false);
        }
        
        console.log('App initialization complete');
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsAuthenticated(false);
        setNeeds2FAVerification(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    initializeApp();
  }, []);

  // Listen for auth changes (when tokens are cleared)
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = await authStore.getToken();
      const refreshToken = await authStore.getRefreshToken();
      const user = await authStore.getUser();
      const hasTokens = !!(token && refreshToken);
      
      // Only update state if there's actually a change
      if (hasTokens !== isAuthenticated) {
        console.log('Auth status changed:', { hasTokens, isAuthenticated });
        setIsAuthenticated(hasTokens);
      }
      
      // Check 2FA verification state only if auth status changed
      if (hasTokens !== isAuthenticated) {
        if (!hasTokens && user) {
          // User exists but no tokens - in 2FA flow
          console.log('Setting needs2FAVerification to true - user without tokens:', { userId: user.id, identifier: user.identifier });
          setNeeds2FAVerification(true);
        } else if (hasTokens) {
          // User is fully authenticated
          console.log('Setting needs2FAVerification to false - user has tokens');
          setNeeds2FAVerification(false);
        } else {
          // No user and no tokens - logged out
          console.log('Setting needs2FAVerification to false - no user, no tokens');
          setNeeds2FAVerification(false);
        }
      }
    };

    // Check auth status less frequently - every 5 seconds instead of every second
    const interval = setInterval(checkAuthStatus, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
  
        console.log('App navigation decision:', { initialRouteName });


  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}

export default App;

