import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '../components/Icon';
import { useTranslation } from 'react-i18next';

import { TicketingScreen } from '../screens/TicketingScreen';
import { FleetScreen } from '../screens/FleetScreen';
import { TripCalendarScreen } from '../screens/TripCalendarScreen';
import { OperationsScreen } from '../screens/OperationsScreen';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused, color }: { name: string, focused: boolean, color: string }) => {
  let iconName = '';
  switch (name) {
    case 'Ticketing':   iconName = 'card'; break;
    case 'Fleets':      iconName = 'bus'; break;
    case 'Trips':       iconName = 'map'; break;
    case 'Operations':  iconName = 'business'; break; // Changed from 'settings' to 'business'
    case 'Reports':     iconName = 'chart'; break;
  }

  return (
    <View style={[styles.iconWrapper, focused && styles.activeBubble]}>
      <Icon name={iconName as any} size={22} color={color} />
    </View>
  );
};

export const MainTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: (props) => <TabIcon name={route.name} {...props} />,
        tabBarActiveTintColor: COLORS.brand,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen
        name="Ticketing"
        component={TicketingScreen}
        options={{ tabBarLabel: t('ticketing.title') }}
      />
      <Tab.Screen
        name="Fleets"
        component={FleetScreen}
        options={{ tabBarLabel: t('fleet.title') }}
      />
      <Tab.Screen
        name="Trips"
        component={TripCalendarScreen}
        options={{ tabBarLabel: t('trips.title') }}
      />
      <Tab.Screen
        name="Operations"
        component={OperationsScreen}
        options={{ tabBarLabel: 'Operations' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 20,
    right: 20,
    height: 64,
    backgroundColor: COLORS.white,
    borderRadius: 32,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    paddingBottom: 0,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activeBubble: {
    backgroundColor: '#E6F0FF',
  },
});
