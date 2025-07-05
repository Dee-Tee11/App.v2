import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Download } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { styles } from '@/src/features/receipts/styles/MyReceipts.styles';

interface ReceiptsSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExport: () => void;
  isExporting: boolean;
}

export default function ReceiptsSearchBar({
  searchQuery,
  onSearchChange,
  onExport,
  isExporting,
}: ReceiptsSearchBarProps) {
  const exportScale = useSharedValue(1);

  const exportAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: exportScale.value }],
  }));

  const handleExportPress = () => {
    exportScale.value = withSpring(0.95, {}, () => {
      exportScale.value = withSpring(1);
    });
    onExport();
  };

  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Search size={20} color="#9CA3AF" strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar por comerciante, categoria, valor..."
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
        />
      </View>

      <Animated.View style={exportAnimatedStyle}>
        <TouchableOpacity
          style={[
            styles.exportButton,
            isExporting && styles.exportButtonDisabled,
          ]}
          onPress={handleExportPress}
          disabled={isExporting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              isExporting ? ['#9CA3AF', '#6B7280'] : ['#667eea', '#764ba2']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.exportGradient}
          >
            <Download size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.exportButtonText}>
              {isExporting ? 'Exportando...' : 'Excel'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
