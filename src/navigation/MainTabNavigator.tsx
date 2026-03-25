import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { TicketingScreen } from '../screens/TicketingScreen';
import { FleetScreen } from '../screens/FleetScreen';
import { TripScreen } from '../screens/TripScreen';
import { ReportScreen } from '../screens/ReportScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused, color }: { name: string, focused: boolean, color: string }) => {
  let iconName = '';
  switch (name) {
    case 'Ticketing': iconName = focused ? 'card' : 'card-outline'; break;
    case 'Fleets': iconName = focused ? 'bus' : 'bus-outline'; break;
    case 'Trips': iconName = focused ? 'map' : 'map-outline'; break;
    case 'Reports': iconName = focused ? 'bar-chart' : 'bar-chart-outline'; break;
    case 'Settings': iconName = focused ? 'settings' : 'settings-outline'; break;
  }

  return (
    <View style={[styles.iconWrapper, focused && styles.activeBubble]}>
      <Ionicons name={iconName} size={22} color={color} />
    </View>
  );
};

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: (props) => <TabIcon name={route.name} {...props} />,
        tabBarActiveTintColor: COLORS.brand,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: false,
        tabBarShowLabel: true, // Re-enabled labels
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen name="Ticketing" component={TicketingScreen} />
      <Tab.Screen name="Fleets" component={FleetScreen} />
      <Tab.Screen name="Trips" component={TripScreen} />
      <Tab.Screen name="Reports" component={ReportScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    height: 62, 
    backgroundColor: COLORS.white,
    borderRadius: 31,
  
    borderTopWidth: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : 0, // Fix for android centering
  },
  activeBubble: {
    backgroundColor: '#E6F0FF',
  },
});
