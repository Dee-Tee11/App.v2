// components/ScannerHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as RNImage } from 'react-native';
import { Wifi, Activity } from 'lucide-react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { styles } from '@/src/features/receipts/styles/ScannerScreen.styles';

interface ScannerHeaderProps {
  onApiCheck: () => void;
  isCheckingApi: boolean;
}

export default function ScannerHeader({
  onApiCheck,
  isCheckingApi,
}: ScannerHeaderProps) {
  const apiScale = useSharedValue(1);

  const animateButton = () => {
    apiScale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 15 }),
    );
  };

  const apiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: apiScale.value }],
  }));

  const handleApiCheck = () => {
    animateButton();
    onApiCheck();
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <SafeAreaView edges={['top']}>
        <Animated.View
          entering={FadeIn.delay(200)}
          style={styles.headerContent}
        >
          <View style={styles.titleRow}>
            <RNImage
              source={require('@/src/assets/logoTB.png')}
              style={{ width: 36, height: 36 }}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Trackly</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Digitalize e analise recibos instantaneamente
          </Text>

          <Animated.View style={[styles.apiCheckContainer, apiAnimatedStyle]}>
            <TouchableOpacity
              style={styles.apiCheckButton}
              onPress={handleApiCheck}
              disabled={isCheckingApi}
              activeOpacity={0.8}
            >
              {isCheckingApi ? (
                <Activity size={16} color="#FFFFFF" />
              ) : (
                <Wifi size={16} color="#FFFFFF" />
              )}
              <Text style={styles.apiCheckText}>
                {isCheckingApi ? 'Verificando...' : 'Testar API'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}
