import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Calendar, DollarSign, ShoppingBag, ChartPie as PieChart, ChartBar as BarChart3, ArrowUp, ArrowDown } from 'lucide-react-native';
import { getReceipts } from '@/services/receiptService';
import type { ProcessedReceipt } from '@/services/receiptService';
import LoadingSpinner from '@/components/LoadingSpinner';
import Animated, {
  FadeIn,
  SlideInDown,
  BounceIn,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface MonthlyData {
  month: string;
  total: number;
  count: number;
}

interface CategoryData {
  name: string;
  total: number;
  count: number;
  percentage: number;
}

export default function AnalyticsScreen() {
  const [receipts, setReceipts] = useState<ProcessedReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const data = await getReceipts();
      setReceipts(data);
    } catch (error) {
      console.error('Failed to load receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAnalyticsData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter receipts based on selected period
    let filteredReceipts = receipts;
    
    if (selectedPeriod === 'month') {
      filteredReceipts = receipts.filter(receipt => {
        const receiptDate = new Date(receipt.dateDetected || receipt.createdAt);
        return receiptDate.getMonth() === currentMonth && receiptDate.getFullYear() === currentYear;
      });
    } else if (selectedPeriod === 'quarter') {
      const quarterStart = Math.floor(currentMonth / 3) * 3;
      filteredReceipts = receipts.filter(receipt => {
        const receiptDate = new Date(receipt.dateDetected || receipt.createdAt);
        const receiptMonth = receiptDate.getMonth();
        return receiptMonth >= quarterStart && receiptMonth < quarterStart + 3 && receiptDate.getFullYear() === currentYear;
      });
    } else {
      filteredReceipts = receipts.filter(receipt => {
        const receiptDate = new Date(receipt.dateDetected || receipt.createdAt);
        return receiptDate.getFullYear() === currentYear;
      });
    }

    const totalSpent = filteredReceipts.reduce((sum, receipt) => sum + (receipt.totalValue || 0), 0);
    const totalReceipts = filteredReceipts.length;
    const averageSpent = totalReceipts > 0 ? totalSpent / totalReceipts : 0;

    // Monthly breakdown
    const monthlyData: MonthlyData[] = [];
    for (let i = 0; i < 12; i++) {
      const monthReceipts = receipts.filter(receipt => {
        const receiptDate = new Date(receipt.dateDetected || receipt.createdAt);
        return receiptDate.getMonth() === i && receiptDate.getFullYear() === currentYear;
      });
      
      monthlyData.push({
        month: new Date(currentYear, i, 1).toLocaleDateString('pt-PT', { month: 'short' }),
        total: monthReceipts.reduce((sum, receipt) => sum + (receipt.totalValue || 0), 0),
        count: monthReceipts.length,
      });
    }

    // Category analysis (based on merchant names)
    const categoryMap = new Map<string, { total: number; count: number }>();
    
    filteredReceipts.forEach(receipt => {
      const merchant = receipt.merchantName || 'Outros';
      const existing = categoryMap.get(merchant) || { total: 0, count: 0 };
      categoryMap.set(merchant, {
        total: existing.total + (receipt.totalValue || 0),
        count: existing.count + 1,
      });
    });

    const categories: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalSpent,
      totalReceipts,
      averageSpent,
      monthlyData,
      categories,
    };
  };

  const analytics = getAnalyticsData();

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'month': return 'Este Mês';
      case 'quarter': return 'Este Trimestre';
      case 'year': return 'Este Ano';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <SafeAreaView>
            <Text style={styles.headerTitle}>Análise de Gastos</Text>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <LoadingSpinner message="A carregar análises..." />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView>
          <Animated.View entering={FadeIn.delay(100)}>
            <Text style={styles.headerTitle}>Análise de Gastos</Text>
            <Text style={styles.headerSubtitle}>
              Insights dos seus gastos
            </Text>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Period Selector */}
        <Animated.View 
          style={styles.periodSelector}
          entering={SlideInDown.delay(200)}
        >
          {(['month', 'quarter', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period === 'month' ? 'Mês' : period === 'quarter' ? 'Trimestre' : 'Ano'}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Summary Cards */}
        <Animated.View 
          style={styles.summaryContainer}
          entering={SlideInDown.delay(300)}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <DollarSign size={24} color="#10B981" strokeWidth={2} />
            </View>
            <Text style={styles.summaryValue}>€{analytics.totalSpent.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Gasto</Text>
            <Text style={styles.summaryPeriod}>{getPeriodLabel()}</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <ShoppingBag size={24} color="#6366F1" strokeWidth={2} />
            </View>
            <Text style={styles.summaryValue}>{analytics.totalReceipts}</Text>
            <Text style={styles.summaryLabel}>Recibos</Text>
            <Text style={styles.summaryPeriod}>{getPeriodLabel()}</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <TrendingUp size={24} color="#F59E0B" strokeWidth={2} />
            </View>
            <Text style={styles.summaryValue}>€{analytics.averageSpent.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Média por Recibo</Text>
            <Text style={styles.summaryPeriod}>{getPeriodLabel()}</Text>
          </View>
        </Animated.View>

        {/* Monthly Chart */}
        <Animated.View 
          style={styles.chartContainer}
          entering={BounceIn.delay(400)}
        >
          <View style={styles.chartHeader}>
            <BarChart3 size={20} color="#6366F1" strokeWidth={2} />
            <Text style={styles.chartTitle}>Gastos Mensais</Text>
          </View>
          
          <View style={styles.chart}>
            {analytics.monthlyData.map((month, index) => {
              const maxValue = Math.max(...analytics.monthlyData.map(m => m.total));
              const height = maxValue > 0 ? (month.total / maxValue) * 120 : 0;
              
              return (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.chartBarContainer}>
                    <View 
                      style={[
                        styles.chartBarFill, 
                        { height: height || 2 }
                      ]} 
                    />
                  </View>
                  <Text style={styles.chartBarLabel}>{month.month}</Text>
                  <Text style={styles.chartBarValue}>
                    {month.total > 0 ? `€${month.total.toFixed(0)}` : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Top Categories */}
        {analytics.categories.length > 0 && (
          <Animated.View 
            style={styles.categoriesContainer}
            entering={BounceIn.delay(500)}
          >
            <View style={styles.categoriesHeader}>
              <PieChart size={20} color="#8B5CF6" strokeWidth={2} />
              <Text style={styles.categoriesTitle}>Top Estabelecimentos</Text>
            </View>
            
            {analytics.categories.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{category.count} recibos</Text>
                </View>
                <View style={styles.categoryValue}>
                  <Text style={styles.categoryAmount}>€{category.total.toFixed(2)}</Text>
                  <Text style={styles.categoryPercentage}>{category.percentage.toFixed(1)}%</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {receipts.length === 0 && (
          <Animated.View 
            style={styles.emptyContainer}
            entering={FadeIn.delay(300)}
          >
            <View style={styles.emptyIconContainer}>
              <BarChart3 size={48} color="#9CA3AF" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Nenhum dado disponível</Text>
            <Text style={styles.emptyDescription}>
              Comece por digitalizar alguns recibos para ver as suas análises aqui
            </Text>
          </Animated.View>
        )}
      </ScrollView>
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
    marginTop: -24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 140 : 120, // Account for tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginTop: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  periodButtonActive: {
    backgroundColor: '#6366F1',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  summaryPeriod: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 10,
    letterSpacing: -0.2,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  chartBarContainer: {
    height: 120,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  chartBarFill: {
    width: 16,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    minHeight: 2,
  },
  chartBarLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 8,
  },
  chartBarValue: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  categoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 10,
    letterSpacing: -0.2,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryValue: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 40,
  },
});