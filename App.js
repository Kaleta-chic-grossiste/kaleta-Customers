import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ParamsProvider } from './context/ParamsContext';
import SplashScreen from './components/SplashScreen';

import HomeScreen from './screens/HomeScreen';
import MenuScreen from './screens/MenuScreen';
import ReservationScreen from './screens/ReservationScreen';
import GalerieScreen from './screens/GalerieScreen';
import ContactScreen from './screens/ContactScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const LOGO = require('./assets/logo.png');

function AppNavigator() {
  const { isDark, colors, updatePrimaryColor, updateSecondaryColor } = useTheme();

  const handleColorsLoaded = (primary, secondary) => {
    if (primary && typeof updatePrimaryColor === 'function') updatePrimaryColor(primary);
    if (secondary && typeof updateSecondaryColor === 'function') updateSecondaryColor(secondary);
  };

  return (
    <ParamsProvider onColorsLoaded={handleColorsLoaded}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bg} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBorder,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
          tabBarIcon: ({ focused, color }) => {
            const icons = {
              Accueil:  focused ? 'home'       : 'home-outline',
              Menu:     focused ? 'restaurant' : 'restaurant-outline',
              Réserver: focused ? 'calendar'   : 'calendar-outline',
              Galerie:  focused ? 'images'     : 'images-outline',
              Contact:  focused ? 'call'       : 'call-outline',
              Profil:   focused ? 'person'     : 'person-outline',
            };
            return (
              <View style={{ alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Image
                  source={LOGO}
                  style={{ width: 14, height: 14, opacity: focused ? 1 : 0.3, tintColor: color }}
                  resizeMode="contain"
                />
                <Ionicons name={icons[route.name]} size={16} color={color} />
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Accueil"  component={HomeScreen} />
        <Tab.Screen name="Menu"     component={MenuScreen} />
        <Tab.Screen name="Réserver" component={ReservationScreen} />
        <Tab.Screen name="Galerie"  component={GalerieScreen} />
        <Tab.Screen name="Contact"  component={ContactScreen} />
        <Tab.Screen name="Profil"   component={ProfileScreen} />
      </Tab.Navigator>
    </ParamsProvider>
  );
}

function SplashInner({ onFinish }) {
  return <SplashScreen onFinish={onFinish} />;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        {!splashDone ? (
          <SplashInner onFinish={() => setSplashDone(true)} />
        ) : (
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}
