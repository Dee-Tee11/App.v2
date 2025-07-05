import React from 'react';
import { View, Text } from 'react-native';
import { Zap, FileText, DollarSign } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import { styles } from '@/src/features/receipts/styles/ScannerScreen.styles';

export default function ProcessingView() {
  return (
    <Animated.View style={styles.loadingContainer} entering={FadeIn}>
      <LoadingSpinner message="Analisando recibo..." />
      <View style={styles.processingSteps}>
        <View style={styles.stepItem}>
          <View style={styles.stepIcon}>
            <Zap size={14} color="#667eea" strokeWidth={2} />
          </View>
          <Text style={styles.stepText}>Extraindo texto</Text>
        </View>
        <View style={styles.stepItem}>
          <View style={styles.stepIcon}>
            <FileText size={14} color="#667eea" strokeWidth={2} />
          </View>
          <Text style={styles.stepText}>Analisando dados</Text>
        </View>
        <View style={styles.stepItem}>
          <View style={styles.stepIcon}>
            <DollarSign size={14} color="#667eea" strokeWidth={2} />
          </View>
          <Text style={styles.stepText}>Calculando valores</Text>
        </View>
      </View>
    </Animated.View>
  );
}
