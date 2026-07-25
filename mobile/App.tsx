import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StatusBar, SafeAreaView } from 'react-native';
import { Home, List, Settings, FileAudio } from 'lucide-react-native';

import HomePage from './src/pages/HomePage';
import QueuePage from './src/pages/QueuePage';
import ConverterPage from './src/pages/ConverterPage';
import SettingsPage from './src/pages/SettingsPage';

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#0a0a0f',
              borderTopColor: 'rgba(255,255,255,0.1)',
            },
            tabBarActiveTintColor: '#8b5cf6',
            tabBarInactiveTintColor: 'gray',
          }}
        >
          <Tab.Screen 
            name="Home" 
            component={HomePage}
            options={{
              tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
            }}
          />
          <Tab.Screen 
            name="Queue" 
            component={QueuePage}
            options={{
              tabBarIcon: ({ color, size }) => <List color={color} size={size} />
            }}
          />
          <Tab.Screen 
            name="Converter" 
            component={ConverterPage}
            options={{
              tabBarIcon: ({ color, size }) => <FileAudio color={color} size={size} />
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsPage}
            options={{
              tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default App;
