import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, NativeModules, Alert } from 'react-native';
import { Play } from 'lucide-react-native';

const { YtDlp } = NativeModules;

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [media, setMedia] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setAnalyzing(true);
    try {
      if (YtDlp) {
        const result = await YtDlp.analyzeUrl(url);
        const parsed = JSON.parse(result);
        if (parsed.error) {
          Alert.alert("Analysis Failed", parsed.error);
        } else {
          setMedia(parsed);
        }
      } else {
        // Fallback if not running natively
        Alert.alert("Error", "Native Module not linked");
      }
    } catch (e: any) {
      Alert.alert("Analysis Failed", e.message || "Unknown error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownload = async () => {
    if (!media || !url.trim()) return;
    try {
       Alert.alert("Downloading", "Starting download...");
       // await YtDlp.startDownload(url, '/sdcard/Download/video.mp4', 'mp4', 'best');
       // Real implementation requires proper file path and permission handling.
    } catch (e: any) {
       Alert.alert("Download Failed", e.message || "Unknown error");
    }
  };

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-6">
      <View className="mb-6">
        <Text className="text-3xl font-extrabold text-primary mb-1">Downloader</Text>
        <Text className="text-gray-400 font-medium">Paste a URL to download on Android</Text>
      </View>

      <View className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-6">
        <View className="flex-row items-center bg-black/40 rounded-xl border border-white/10 pr-2 overflow-hidden">
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="Paste URL here..."
            placeholderTextColor="#888"
            className="flex-1 text-white px-4 py-3 h-12"
          />
          <TouchableOpacity 
            onPress={handleAnalyze} 
            disabled={!url.trim() || analyzing}
            className={`px-4 py-2 rounded-lg flex-row items-center justify-center ${!url.trim() || analyzing ? 'bg-primary/50' : 'bg-primary'}`}
          >
            {analyzing ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-bold">Analyze</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {media && (
        <View className="bg-white/5 p-4 rounded-2xl border border-white/10 animate-pulse">
          <Text className="text-white font-bold text-lg mb-1">{media.title}</Text>
          <Text className="text-gray-400 mb-4">{media.channel}</Text>
          
          <TouchableOpacity onPress={handleDownload} className="bg-primary py-3 rounded-xl flex-row items-center justify-center space-x-2">
            <Play color="white" size={20} />
            <Text className="text-white font-bold text-lg ml-2">Download</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
