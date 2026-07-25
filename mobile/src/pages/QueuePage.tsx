import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Play, Pause, X, CheckCircle } from 'lucide-react-native';

export default function QueuePage() {
  // Dummy state to mimic the queue
  const dummyQueue = [
    { id: 1, title: 'Never Gonna Give You Up', progress: 100, status: 'completed' },
    { id: 2, title: 'React Native Tutorial', progress: 45, status: 'downloading' },
  ];

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-6">
      <View className="mb-6">
        <Text className="text-3xl font-extrabold text-primary mb-1">Queue</Text>
        <Text className="text-gray-400 font-medium">Manage your active downloads</Text>
      </View>

      <View className="space-y-4">
        {dummyQueue.map((item) => (
          <View key={item.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-4">
            <View className="flex-row justify-between items-start mb-3">
              <Text className="text-white font-bold text-base flex-1 mr-4" numberOfLines={1}>{item.title}</Text>
              <View className="flex-row space-x-2">
                {item.status === 'downloading' ? (
                  <>
                    <TouchableOpacity className="p-2 bg-white/10 rounded-full"><Pause color="white" size={16} /></TouchableOpacity>
                    <TouchableOpacity className="p-2 bg-red-500/20 rounded-full"><X color="#ef4444" size={16} /></TouchableOpacity>
                  </>
                ) : (
                  <CheckCircle color="#10b981" size={20} />
                )}
              </View>
            </View>
            
            <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <View 
                className={`h-full ${item.status === 'completed' ? 'bg-green-500' : 'bg-primary'}`} 
                style={{ width: `${item.progress}%` }} 
              />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-400 text-xs capitalize">{item.status}</Text>
              <Text className="text-gray-400 text-xs">{item.progress}%</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
