import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, Filter } from 'lucide-react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { styles } from '@/src/features/receipts/styles/MyReceipts.styles';
import type { ProcessedReceipt } from '@/src/features/receipts/service/receiptService';

interface ReceiptsStatsProps {
  receipts: ProcessedReceipt[];
}

export default function ReceiptsStats({ receipts }: ReceiptsStatsProps) {
  const stats = useMemo(() => {
    const totalValue = receipts.reduce(
      (sum, receipt) => sum + (receipt.totalValue || 0),
      0,
    );

    const uniqueCategories = receipts
      .map((receipt) => receipt.categoria)
      .filter((categoria) => categoria && categoria.trim() !== '')
      .reduce((acc, categoria) => {
        if (categoria && !acc.includes(categoria)) {
          acc.push(categoria);
        }
        return acc;
      }, [] as string[]);

    return {
      totalValue: totalValue.toFixed(2),
      receiptsCount: receipts.length,
      categoriesCount: uniqueCategories.length,
    };
  }, [receipts]);

  return (
    <Animated.View entering={SlideInDown.delay(200)}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#667eea" strokeWidth={2} />
          <View style={styles.statContent}>
            <Text style={styles.statValue}>€{stats.totalValue}</Text>
            <Text style={styles.statLabel}>Total Gasto</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Filter size={24} color="#6366F1" strokeWidth={2} />
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{stats.receiptsCount}</Text>
            <Text style={styles.statLabel}>Recibos</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.categoryIcon, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.categoryIconText}>🎯</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{stats.categoriesCount}</Text>
            <Text style={styles.statLabel}>Categorias</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
