import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { styles } from '@/src/features/receipts/styles/MyReceipts.styles';
import { getCurrentUser } from '@/src/features/users/service/userService';
import {
  getReceipts,
  deleteReceipt,
} from '@/src/features/receipts/service/receiptService';
import type { ProcessedReceipt } from '@/src/features/receipts/service/receiptService';

import LoadingSpinner from '@/src/components/LoadingSpinner';
import ReceiptCard from '@/src/features/receipts/components/MyReceiptsReceiptCard';
import ReceiptsHeader from '@/src/features/receipts/components/ReceiptsHeader';
import ReceiptsStats from '@/src/features/receipts/components/MyReceiptsReceiptsStats';
import ReceiptsSearchBar from '@/src/features/receipts/components/MyReceiptsReceiptsSearchBar';
import ReceiptsEmptyState from '@/src/features/receipts/components/ReceiptsEmptyState';
import { useReceiptsExport } from '@/src/hooks/useReceiptsExport';
import { useReceiptsFilter } from '@/src/hooks/useReceiptsFilter';

export default function ReceiptsScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<ProcessedReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { filteredReceipts, searchQuery, setSearchQuery } =
    useReceiptsFilter(receipts);
  const { handleExport, isExporting } = useReceiptsExport(
    userId,
    email,
    filteredReceipts,
    searchQuery,
  );

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = useCallback(async () => {
    await Promise.all([loadReceipts(), fetchCurrentUser()]);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setUserId(user.id ?? null);
      setEmail(user.email ?? null);
    } catch (error) {
      console.error('Erro ao obter utilizador:', error);
    }
  }, []);

  const loadReceipts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getReceipts();
      setReceipts(data);
    } catch (error) {
      console.error('Failed to load receipts:', error);
      Alert.alert('Erro', 'Falha ao carregar recibos. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleDeleteReceipt = useCallback((receiptId: string) => {
    Alert.alert(
      'Eliminar Recibo',
      'Tem a certeza de que deseja eliminar este recibo? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReceipt(receiptId);
              setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
            } catch (error) {
              Alert.alert('Erro', 'Falha ao eliminar recibo. Tente novamente.');
            }
          },
        },
      ],
    );
  }, []);

  const handleReceiptPress = useCallback((receipt: ProcessedReceipt) => {
    const receiptInfo = [
      `🏪 Comerciante: ${receipt.merchantName || 'N/A'}`,
      `💰 Total: €${receipt.totalValue?.toFixed(2) || '0.00'}`,
      `📅 Data: ${receipt.dateDetected || 'N/A'}`,
      `🎯 Categoria: ${receipt.categoria || 'N/A'}`,
      ``,
      `📄 Texto extraído:`,
      receipt.extractedText || 'Nenhum texto disponível',
    ].join('\n');

    Alert.alert(`Recibo #${receipt.id.slice(-8).toUpperCase()}`, receiptInfo, [
      { text: 'OK' },
    ]);
  }, []);

  const renderReceipt = useCallback(
    ({ item, index }: { item: ProcessedReceipt; index: number }) => (
      <Animated.View entering={FadeIn.delay(index * 100)}>
        <ReceiptCard
          receipt={item}
          onPress={() => handleReceiptPress(item)}
          onDelete={() => handleDeleteReceipt(item.id)}
        />
      </Animated.View>
    ),
    [handleReceiptPress, handleDeleteReceipt],
  );

  const renderHeader = useCallback(
    () => (
      <>
        <ReceiptsStats receipts={filteredReceipts} />
        <ReceiptsSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onExport={handleExport}
          isExporting={isExporting}
        />
      </>
    ),
    [filteredReceipts, searchQuery, setSearchQuery, handleExport, isExporting],
  );

  const keyExtractor = useCallback((item: ProcessedReceipt) => item.id, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ReceiptsHeader />
        <View style={styles.loadingContainer}>
          <LoadingSpinner message="A carregar recibos..." />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ReceiptsHeader />
      <View style={styles.content}>
        <FlatList
          data={filteredReceipts}
          renderItem={renderReceipt}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadReceipts(true)}
              colors={['#10B981']}
              tintColor="#10B981"
            />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={<ReceiptsEmptyState searchQuery={searchQuery} />}
          contentContainerStyle={
            filteredReceipts.length === 0
              ? styles.emptyListContainer
              : styles.listContainer
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8}
        />
      </View>
    </View>
  );
}
