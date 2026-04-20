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
import { RoleManagementScreen } from './src/screens/RoleManagementScreen';
import { UserPermissionsScreen } from './src/screens/UserPermissionsScreen';
import { LoginChannelScreen } from './src/screens/LoginChannelScreen';
import { AllOrganizationsScreen } from './src/screens/AllOrganizationsScreen';
import { AllUsersScreen } from './src/screens/AllUsersScreen';
import { authStore } from './src/api/authStore';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      try {
        await SplashScreen.hideAsync();
        
        // Check if user has valid tokens
        const token = await authStore.getToken();
        const refreshToken = await authStore.getRefreshToken();
        
        // If we have both tokens, consider user authenticated
        setIsAuthenticated(!!(token && refreshToken));
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsAuthenticated(false);
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
      const hasTokens = !!(token && refreshToken);
      
      if (hasTokens !== isAuthenticated) {
        setIsAuthenticated(hasTokens);
      }
    };

    // Check auth status periodically
    const interval = setInterval(checkAuthStatus, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#008BFF" />
      </View>
    );
  }


  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={isAuthenticated ? "Main" : "Login"}
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
          <Stack.Screen name="RoleManagement" component={RoleManagementScreen} />
          <Stack.Screen name="UserPermissions" component={UserPermissionsScreen} />
          <Stack.Screen name="LoginChannel" component={LoginChannelScreen} />
          <Stack.Screen name="AllOrganizations" component={AllOrganizationsScreen} />
          <Stack.Screen name="AllUsers" component={AllUsersScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;

