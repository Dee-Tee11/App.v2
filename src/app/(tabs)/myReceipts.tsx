import React, { useState, useEffect } from 'react';
import { styles } from '@/src/features/receipts/styles/MyReceipts.styles';
import { getCurrentUser } from '@/src/features/users/service/userService';

import {
  View,
  Text,
  FlatList,
  Alert,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Download,
  Calendar,
  X,
  TrendingUp,
  DollarSign,
} from 'lucide-react-native';
import {
  getReceipts,
  deleteReceipt,
} from '@/src/features/receipts/service/receiptService';
import {
  exportAndSendEmail,
  exportFilteredReceipts,
} from '@/src/features/receipts/service/exportService';
import type { ProcessedReceipt } from '@/src/features/receipts/service/receiptService';
import ReceiptCard from '@/src/features/receipts/components/MyReceiptsReceiptCard';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import Animated, {
  FadeIn,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface DateFilter {
  startDate: string | null;
  endDate: string | null;
}

export default function ReceiptsScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [receipts, setReceipts] = useState<ProcessedReceipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<ProcessedReceipt[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Estados para filtros de data
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: null,
    endDate: null,
  });

  const exportScale = useSharedValue(1);

  useEffect(() => {
    loadReceipts();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user.id ?? null);
        setEmail(user.email ?? null);
      } catch (error) {
        console.error('Erro ao obter utilizador:', error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    filterReceipts();
  }, [receipts, searchQuery, dateFilter]);

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

  const isDateInRange = (receiptDate: string | null) => {
    if (!receiptDate || (!dateFilter.startDate && !dateFilter.endDate)) {
      return true;
    }

    const receipt = new Date(receiptDate);
    const start = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
    const end = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

    if (start && end) {
      return receipt >= start && receipt <= end;
    } else if (start) {
      return receipt >= start;
    } else if (end) {
      return receipt <= end;
    }

    return true;
  };

  const filterReceipts = () => {
    let filtered = receipts;

    // Filtro por texto de pesquisa
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (receipt) =>
          receipt.extractedText.toLowerCase().includes(searchLower) ||
          receipt.merchantName?.toLowerCase().includes(searchLower) ||
          receipt.categoria?.toLowerCase().includes(searchLower) ||
          receipt.totalValue?.toString().includes(searchLower) ||
          receipt.dateDetected?.includes(searchQuery),
      );
    }

    // Filtro por data
    filtered = filtered.filter((receipt) =>
      isDateInRange(receipt.dateDetected),
    );

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
      ],
    );
  };

  const handleReceiptPress = (receipt: ProcessedReceipt) => {
    const receiptInfo = [
      `🏪 Comerciante: ${receipt.merchantName || 'N/A'}`,
      `💰 Total: €${receipt.totalValue?.toFixed(2) || '0.00'}`,
      `📅 Data: ${receipt.dateDetected || 'N/A'}`,
      `🎯 Categoria: ${receipt.categoria || 'N/A'}`,
      `💼 IVA Dedutível: ${receipt.ivaDedutivel ? 'Sim' : 'Não'}`,
      `📊 % IVA: ${receipt.valorTotalIVA ? `${receipt.valorTotalIVA}%` : 'N/A'}`,
      ``,
      `📄 Texto extraído:`,
      receipt.extractedText || 'Nenhum texto disponível',
    ].join('\n');

    Alert.alert(`Recibo #${receipt.id.slice(-8).toUpperCase()}`, receiptInfo, [
      { text: 'OK' },
    ]);
  };

  const getTotalValue = () => {
    return filteredReceipts.reduce(
      (sum, receipt) => sum + (receipt.totalValue || 0),
      0,
    );
  };

  const getTotalDeductibleVAT = () => {
    return filteredReceipts
      .filter((receipt) => receipt.ivaDedutivel)
      .reduce((sum, receipt) => {
        const total = receipt.totalValue || 0;
        const vatPercentage = receipt.valorTotalIVA || 0;
        const vatAmount = (total * vatPercentage) / (100 + vatPercentage);
        return sum + vatAmount;
      }, 0);
  };

  const getDateRangeText = () => {
    if (dateFilter.startDate && dateFilter.endDate) {
      return `${dateFilter.startDate} - ${dateFilter.endDate}`;
    } else if (dateFilter.startDate) {
      return `Desde ${dateFilter.startDate}`;
    } else if (dateFilter.endDate) {
      return `Até ${dateFilter.endDate}`;
    }
    return 'Filtrar por Data';
  };

  const clearDateFilter = () => {
    setDateFilter({ startDate: null, endDate: null });
    setShowDateFilter(false);
  };

  const hasActiveDateFilter = () => {
    return dateFilter.startDate || dateFilter.endDate;
  };

  const handleExport = async () => {
    if (!userId || !email) {
      Alert.alert('Erro', 'Utilizador não autenticado.');
      return;
    }

    if (filteredReceipts.length === 0) {
      Alert.alert('Aviso', 'Não há recibos para exportar.');
      return;
    }

    Alert.alert('Exportar Recibos', 'Que recibos deseja exportar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Todos os Recibos',
        onPress: async () => {
          setIsExporting(true);
          exportScale.value = withSpring(0.95);

          const result = await exportAndSendEmail(userId, email);

          exportScale.value = withSpring(1);
          setIsExporting(false);

          if (result.success) {
            Alert.alert(
              'Sucesso! 🎉',
              `${result.message}\n\nO ficheiro "${result.fileName}" foi partilhado.`,
              [{ text: 'OK' }],
            );
          } else {
            Alert.alert(
              'Erro ao exportar',
              result.error || 'Erro desconhecido',
              [{ text: 'OK' }],
            );
          }
        },
      },
      {
        text: 'Recibos Filtrados',
        onPress: async () => {
          setIsExporting(true);
          exportScale.value = withSpring(0.95);

          const result = await exportFilteredReceipts(
            filteredReceipts,
            `recibos-filtrados-${new Date().toISOString().slice(0, 10)}.xlsx`,
          );

          exportScale.value = withSpring(1);
          setIsExporting(false);

          if (result.success) {
            Alert.alert(
              'Sucesso! 🎉',
              `${result.message}\n\nO ficheiro "${result.fileName}" foi partilhado.`,
              [{ text: 'OK' }],
            );
          } else {
            Alert.alert(
              'Erro ao exportar',
              result.error || 'Erro desconhecido',
              [{ text: 'OK' }],
            );
          }
        },
      },
    ]);
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
        {searchQuery || hasActiveDateFilter()
          ? 'Nenhum resultado encontrado'
          : 'Nenhum recibo encontrado'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery || hasActiveDateFilter()
          ? 'Tente ajustar os critérios de pesquisa ou filtros'
          : 'Comece por digitalizar o seu primeiro recibo na aba Scanner'}
      </Text>
    </Animated.View>
  );

  const renderDateFilterModal = () => (
    <Modal
      visible={showDateFilter}
      animationType="slide"
      transparent
      onRequestClose={() => setShowDateFilter(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={styles.modalContent}
          entering={SlideInDown.duration(300)}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtrar por Data</Text>
            <TouchableOpacity
              onPress={() => setShowDateFilter(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                📅 Selecionar Período
              </Text>

              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Data de Início:</Text>
                <TextInput
                  style={[
                    styles.dateInput,
                    dateFilter.startDate && {
                      borderColor: '#6366F1',
                      borderWidth: 2,
                    },
                  ]}
                  placeholder="AAAA-MM-DD (ex: 2025-01-01)"
                  value={dateFilter.startDate || ''}
                  onChangeText={(text) => {
                    // Validação simples do formato
                    const cleanText = text.replace(/[^0-9-]/g, '');
                    if (cleanText.length <= 10) {
                      setDateFilter((prev) => ({
                        ...prev,
                        startDate: cleanText || null,
                      }));
                    }
                  }}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="default"
                  maxLength={10}
                />
                {dateFilter.startDate && !isValidDate(dateFilter.startDate) && (
                  <Text style={styles.errorText}>
                    Formato inválido. Use: AAAA-MM-DD
                  </Text>
                )}
              </View>

              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Data de Fim:</Text>
                <TextInput
                  style={[
                    styles.dateInput,
                    dateFilter.endDate && {
                      borderColor: '#6366F1',
                      borderWidth: 2,
                    },
                  ]}
                  placeholder="AAAA-MM-DD (ex: 2025-12-31)"
                  value={dateFilter.endDate || ''}
                  onChangeText={(text) => {
                    // Validação simples do formato
                    const cleanText = text.replace(/[^0-9-]/g, '');
                    if (cleanText.length <= 10) {
                      setDateFilter((prev) => ({
                        ...prev,
                        endDate: cleanText || null,
                      }));
                    }
                  }}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="default"
                  maxLength={10}
                />
                {dateFilter.endDate && !isValidDate(dateFilter.endDate) && (
                  <Text style={styles.errorText}>
                    Formato inválido. Use: AAAA-MM-DD
                  </Text>
                )}
              </View>

              {/* Sugestões de Períodos Rápidos */}
              <View style={styles.quickFiltersContainer}>
                <Text style={styles.quickFiltersTitle}>Períodos Rápidos:</Text>

                <TouchableOpacity
                  style={styles.quickFilterButton}
                  onPress={() => {
                    const today = new Date();
                    const firstDayOfMonth = new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      1,
                    );
                    setDateFilter({
                      startDate: firstDayOfMonth.toISOString().split('T')[0],
                      endDate: today.toISOString().split('T')[0],
                    });
                  }}
                >
                  <Text style={styles.quickFilterText}>Este Mês</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickFilterButton}
                  onPress={() => {
                    const today = new Date();
                    const thirtyDaysAgo = new Date(
                      today.getTime() - 30 * 24 * 60 * 60 * 1000,
                    );
                    setDateFilter({
                      startDate: thirtyDaysAgo.toISOString().split('T')[0],
                      endDate: today.toISOString().split('T')[0],
                    });
                  }}
                >
                  <Text style={styles.quickFilterText}>Últimos 30 Dias</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickFilterButton}
                  onPress={() => {
                    const today = new Date();
                    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
                    setDateFilter({
                      startDate: firstDayOfYear.toISOString().split('T')[0],
                      endDate: today.toISOString().split('T')[0],
                    });
                  }}
                >
                  <Text style={styles.quickFilterText}>Este Ano</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearDateFilter}
            >
              <Text style={styles.clearFiltersButtonText}>Limpar Filtros</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => {
                // Validar datas antes de aplicar
                if (
                  dateFilter.startDate &&
                  !isValidDate(dateFilter.startDate)
                ) {
                  Alert.alert('Erro', 'Data de início inválida');
                  return;
                }
                if (dateFilter.endDate && !isValidDate(dateFilter.endDate)) {
                  Alert.alert('Erro', 'Data de fim inválida');
                  return;
                }

                setShowDateFilter(false);
                // O filtro será aplicado automaticamente pelo useEffect
              }}
            >
              <Text style={styles.applyFiltersButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  // Função auxiliar para validar data
  const isValidDate = (dateString: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    const [year, month, day] = dateString.split('-').map(Number);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const renderHeader = () => (
    <Animated.View entering={SlideInDown.delay(200)}>
      {/* 3 Cartões Horizontais */}
      <View style={styles.statsContainer}>
        {/* Total Gasto */}
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#667eea" strokeWidth={2} />
          <View style={styles.statContent}>
            <Text style={styles.statValue}>€{getTotalValue().toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Gasto</Text>
          </View>
        </View>

        {/* IVA Dedutível */}
        <View style={styles.statCard}>
          <DollarSign size={24} color="#10B981" strokeWidth={2} />
          <View style={styles.statContent}>
            <Text style={styles.statValue}>
              €{getTotalDeductibleVAT().toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>IVA Dedutível</Text>
          </View>
        </View>

        {/* Filtro de Data */}
        <TouchableOpacity
          style={[
            styles.statCard,
            hasActiveDateFilter() && styles.checkboxActive,
          ]}
          onPress={() => setShowDateFilter(true)}
        >
          <Calendar
            size={24}
            color={hasActiveDateFilter() ? '#6366F1' : '#F59E0B'}
            strokeWidth={2}
          />
          <View style={styles.statContent}>
            <Text
              style={[
                styles.statValue,
                { fontSize: hasActiveDateFilter() ? 12 : 14 },
              ]}
            >
              {hasActiveDateFilter() ? getDateRangeText() : 'Filtrar'}
            </Text>
            <Text style={styles.statLabel}>Por Data</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Barra de Pesquisa e Exportação */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por comerciante, categoria, valor..."
            value={searchQuery}
            onChangeText={setSearchQuery}
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
            onPress={handleExport}
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

      {/* Indicador de Filtros Ativos */}
      {hasActiveDateFilter() && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>
            Filtro ativo: {getDateRangeText()}
          </Text>
          <TouchableOpacity onPress={clearDateFilter}>
            <Text style={styles.clearFiltersLink}>Limpar</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
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

      {renderDateFilterModal()}
    </View>
  );
}
