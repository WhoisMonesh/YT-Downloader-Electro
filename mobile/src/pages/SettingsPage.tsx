import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Moon, Folder, Download, Zap } from 'lucide-react-native';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [autoConvert, setAutoConvert] = useState(false);
  const [oneClick, setOneClick] = useState(false);

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-6">
      <View className="mb-6">
        <Text className="text-3xl font-extrabold text-primary mb-1">Settings</Text>
        <Text className="text-gray-400 font-medium">Configure your downloader</Text>
      </View>

      <View className="space-y-4">
        {/* Appearance Section */}
        <View className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <Text className="text-white font-bold text-lg mb-4">Appearance</Text>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-primary/20 p-2 rounded-lg mr-3">
                <Moon color="#8b5cf6" size={20} />
              </View>
              <Text className="text-white font-medium">Dark Mode</Text>
            </View>
            <Switch 
              value={darkMode} 
              onValueChange={setDarkMode}
              trackColor={{ false: '#374151', true: '#8b5cf6' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Storage Section */}
        <View className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <Text className="text-white font-bold text-lg mb-4">Storage</Text>
          
          <TouchableOpacity className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="bg-blue-500/20 p-2 rounded-lg mr-3">
                <Folder color="#3b82f6" size={20} />
              </View>
              <View>
                <Text className="text-white font-medium">Download Location</Text>
                <Text className="text-gray-400 text-xs mt-1">/storage/emulated/0/Download</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Behavior Section */}
        <View className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <Text className="text-white font-bold text-lg mb-4">Behavior</Text>
          
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1 pr-4">
              <View className="bg-green-500/20 p-2 rounded-lg mr-3">
                <Download color="#10b981" size={20} />
              </View>
              <View>
                <Text className="text-white font-medium">Auto-Convert Audio</Text>
                <Text className="text-gray-400 text-xs mt-1">Automatically extract MP3 from video links</Text>
              </View>
            </View>
            <Switch 
              value={autoConvert} 
              onValueChange={setAutoConvert}
              trackColor={{ false: '#374151', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-4">
              <View className="bg-amber-500/20 p-2 rounded-lg mr-3">
                <Zap color="#f59e0b" size={20} />
              </View>
              <View>
                <Text className="text-white font-medium">One-Click Download</Text>
                <Text className="text-gray-400 text-xs mt-1">Skip analysis and download immediately</Text>
              </View>
            </View>
            <Switch 
              value={oneClick} 
              onValueChange={setOneClick}
              trackColor={{ false: '#374151', true: '#f59e0b' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </View>
      <View className="h-10" />
    </ScrollView>
  );
}
