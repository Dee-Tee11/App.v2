import React from 'react';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { styles } from '@/src/features/receipts/styles/MyReceipts.styles';

export default function ReceiptsHeader() {
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <SafeAreaView>
        <Animated.View entering={FadeIn.delay(100)}>
          <Text style={styles.headerTitle}>Os Meus Recibos</Text>
          <Text style={styles.headerSubtitle}>
            Gerencie e analise os seus gastos
          </Text>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}
