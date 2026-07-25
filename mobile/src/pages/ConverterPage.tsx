import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { FolderUp, Settings2, FileAudio } from 'lucide-react-native';

export default function ConverterPage() {
  const [selectedFormat, setSelectedFormat] = useState('mp4');

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-6">
      <View className="mb-6">
        <Text className="text-3xl font-extrabold text-primary mb-1">Converter</Text>
        <Text className="text-gray-400 font-medium">Convert local media files</Text>
      </View>

      <TouchableOpacity className="bg-white/5 border border-dashed border-primary/50 rounded-2xl p-8 items-center justify-center mb-6">
        <View className="bg-primary/20 p-4 rounded-full mb-4">
          <FolderUp color="#8b5cf6" size={32} />
        </View>
        <Text className="text-white font-bold text-lg mb-1">Select Media File</Text>
        <Text className="text-gray-400 text-sm">Tap to choose from gallery or files</Text>
      </TouchableOpacity>

      <View className="bg-white/5 p-4 rounded-2xl border border-white/10">
        <View className="flex-row items-center mb-4">
          <Settings2 color="#8b5cf6" size={20} />
          <Text className="text-white font-bold text-base ml-2">Output Format</Text>
        </View>
        
        <View className="flex-row flex-wrap gap-2 mb-4">
          {['mp4', 'mp3', 'wav', 'mkv'].map((fmt) => (
            <TouchableOpacity 
              key={fmt}
              onPress={() => setSelectedFormat(fmt)}
              className={`px-4 py-2 rounded-lg border ${selectedFormat === fmt ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/10'}`}
            >
              <Text className={`font-medium ${selectedFormat === fmt ? 'text-primary' : 'text-gray-400'}`}>
                {fmt.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity className="bg-primary py-3 rounded-xl flex-row items-center justify-center">
          <FileAudio color="white" size={20} />
          <Text className="text-white font-bold text-lg ml-2">Convert</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
