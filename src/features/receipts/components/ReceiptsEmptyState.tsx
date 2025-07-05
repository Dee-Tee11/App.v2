import React from 'react';
import { View, Text } from 'react-native';
import { Search } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { styles } from '@/src/features/receipts/styles/MyReceipts.styles';

interface ReceiptsEmptyStateProps {
  searchQuery: string;
}

export default function ReceiptsEmptyState({
  searchQuery,
}: ReceiptsEmptyStateProps) {
  return (
    <Animated.View style={styles.emptyContainer} entering={FadeIn}>
      <View style={styles.emptyIconContainer}>
        <Search size={48} color="#9CA3AF" strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery
          ? 'Nenhum resultado encontrado'
          : 'Nenhum recibo encontrado'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery
          ? 'Tente ajustar os critérios de pesquisa'
          : 'Comece por digitalizar o seu primeiro recibo na aba Scanner'}
      </Text>
    </Animated.View>
  );
}
