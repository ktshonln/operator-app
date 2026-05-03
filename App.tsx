import React, { useEffect } from 'react';
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
import { UserManagementScreen } from './src/screens/UserManagementScreen';
import { LoginChannelScreen } from './src/screens/LoginChannelScreen';
import { AllOrganizationsScreen } from './src/screens/AllOrganizationsScreen';
import { CreateOrganizationScreen } from './src/screens/CreateOrganizationScreen';
import { AllUsersScreen } from './src/screens/AllUsersScreen';
import { InvitationsScreen } from './src/screens/InvitationsScreen';
import { EditInvitationScreen } from './src/screens/EditInvitationScreen';
import { LocationsListScreen } from './src/screens/LocationsListScreen';
import { CreateLocationScreen } from './src/screens/CreateLocationScreen';
import { LocationDetailScreen } from './src/screens/LocationDetailScreen';
import { RoutesListScreen } from './src/screens/RoutesListScreen';
import { CreateRouteScreen } from './src/screens/CreateRouteScreen';
import { RouteDetailScreen } from './src/screens/RouteDetailScreen';
import { PriceMatrixScreen } from './src/screens/PriceMatrixScreen';
import { TripDetailScreen } from './src/screens/TripDetailScreen';
import { BusDetailScreen } from './src/screens/BusDetailScreen';
import { CreateBusScreen } from './src/screens/CreateBusScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();

// Auth screens (unauthenticated)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="ResetPasswordConfirm" component={ResetPasswordConfirmScreen} />
    </Stack.Navigator>
  );
}

// 2FA verification screen
function TwoFAStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PostLogin2FA" component={PostLogin2FAScreen} />
    </Stack.Navigator>
  );
}

// Main app screens (authenticated)
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
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
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      <Stack.Screen name="LoginChannel" component={LoginChannelScreen} />
      <Stack.Screen name="AllOrganizations" component={AllOrganizationsScreen} />
      <Stack.Screen name="CreateOrganization" component={CreateOrganizationScreen} />
      <Stack.Screen name="AllUsers" component={AllUsersScreen} />
      <Stack.Screen name="Invitations" component={InvitationsScreen} />
      <Stack.Screen name="EditInvitation" component={EditInvitationScreen} />
      {/* Transport */}
      <Stack.Screen name="LocationsList" component={LocationsListScreen} />
      <Stack.Screen name="CreateLocation" component={CreateLocationScreen} />
      <Stack.Screen name="LocationDetail" component={LocationDetailScreen} />
      <Stack.Screen name="RoutesList" component={RoutesListScreen} />
      <Stack.Screen name="CreateRoute" component={CreateRouteScreen} />
      <Stack.Screen name="RouteDetail" component={RouteDetailScreen} />
      <Stack.Screen name="PriceMatrix" component={PriceMatrixScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen name="BusDetail" component={BusDetailScreen} />
      <Stack.Screen name="CreateBus" component={CreateBusScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, needs2FAVerification, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' }}>
        <ActivityIndicator size="large" color="#008BFF" />
      </View>
    );
  }

  console.log('App navigation decision:', { 
    isAuthenticated, 
    needs2FAVerification, 
    loading 
  });

  // Render the correct navigator based on auth state
  // React Navigation will automatically animate between them
  if (needs2FAVerification) {
    return <TwoFAStack />;
  }

  if (isAuthenticated) {
    return <AppStack />;
  }

  return <AuthStack />;
}

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;

