import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Download, Filter, TrendingUp } from 'lucide-react-native';
import { getReceipts, deleteReceipt } from '@/services/receiptService';
//import { exportToExcel } from '@/services/exportService';
import type { ProcessedReceipt } from '@/services/receiptService';
import ReceiptCard from '@/components/ReceiptCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Animated, {
  FadeIn,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export default function ReceiptsScreen() {
  const [receipts, setReceipts] = useState<ProcessedReceipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<ProcessedReceipt[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const exportScale = useSharedValue(1);

  useEffect(() => {
    loadReceipts();
  }, []);

  useEffect(() => {
    filterReceipts();
  }, [receipts, searchQuery]);

  const loadReceipts = async (isRefresh = false) => {
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
  };

  const filterReceipts = () => {
    if (!searchQuery.trim()) {
      setFilteredReceipts(receipts);
      return;
    }

    const filtered = receipts.filter((receipt) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        receipt.extractedText.toLowerCase().includes(searchLower) ||
        receipt.merchantName?.toLowerCase().includes(searchLower) ||
        receipt.totalValue?.toString().includes(searchLower) ||
        receipt.dateDetected?.includes(searchQuery)
      );
    });

    setFilteredReceipts(filtered);
  };

  const handleDeleteReceipt = (receiptId: string) => {
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
      ]
    );
  };

  const handleReceiptPress = (receipt: ProcessedReceipt) => {
    Alert.alert(
      `Recibo #${receipt.id.slice(-8).toUpperCase()}`,
      receipt.extractedText || 'Nenhum texto disponível',
      [{ text: 'OK' }]
    );
  };
  /** 
  const handleExportToExcel = async () => {
    if (filteredReceipts.length === 0) {
      Alert.alert('Aviso', 'Não há recibos para exportar.');
      return;
    }

    exportScale.value = withSpring(0.95, { damping: 15 }, () => {
      exportScale.value = withSpring(1, { damping: 15 });
    });

    setIsExporting(true);
    try {
      await exportToExcel(filteredReceipts);
      Alert.alert('Sucesso', 'Recibos exportados para Excel com sucesso!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Erro', 'Falha ao exportar recibos. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };*/

  const getTotalValue = () => {
    return filteredReceipts.reduce(
      (sum, receipt) => sum + (receipt.totalValue || 0),
      0
    );
  };

  const exportAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: exportScale.value }],
  }));

  const renderReceipt = ({
    item,
    index,
  }: {
    item: ProcessedReceipt;
    index: number;
  }) => (
    <Animated.View entering={FadeIn.delay(index * 100)}>
      <ReceiptCard
        receipt={item}
        onPress={() => handleReceiptPress(item)}
        onDelete={() => handleDeleteReceipt(item.id)}
      />
    </Animated.View>
  );

  const renderEmptyState = () => (
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

  const renderHeader = () => (
    <Animated.View entering={SlideInDown.delay(200)}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#10B981" strokeWidth={2} />
          <View style={styles.statContent}>
            <Text style={styles.statValue}>€{getTotalValue().toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Gasto</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <Filter size={24} color="#6366F1" strokeWidth={2} />
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{filteredReceipts.length}</Text>
            <Text style={styles.statLabel}>Recibos</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar recibos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <Animated.View style={exportAnimatedStyle}>
          <TouchableOpacity
            style={[
              styles.exportButton,
              isExporting && styles.exportButtonDisabled,
            ]}
            //onPress={handleExportToExcel}
            disabled={isExporting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                isExporting ? ['#9CA3AF', '#6B7280'] : ['#10B981', '#059669']
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
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <SafeAreaView>
            <Text style={styles.headerTitle}>Os Meus Recibos</Text>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <LoadingSpinner message="A carregar recibos..." />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#059669']}
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

      <View style={styles.content}>
        <FlatList
          data={filteredReceipts}
          renderItem={renderReceipt}
          keyExtractor={(item) => item.id}
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
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={
            filteredReceipts.length === 0
              ? styles.emptyListContainer
              : styles.listContainer
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    paddingHorizontal: 24,
    paddingTop: 20,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 24,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  statContent: {
    marginLeft: 16,
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    fontWeight: '500',
  },
  exportButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  exportButtonDisabled: {
    opacity: 0.7,
  },
  exportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  emptyListContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
});
