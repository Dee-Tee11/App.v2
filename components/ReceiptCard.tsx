import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import {
  Calendar,
  DollarSign,
  FileText,
  Trash2,
  Store,
} from 'lucide-react-native';
import type { ProcessedReceipt } from '@/services/receiptService';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

interface ReceiptCardProps {
  receipt: ProcessedReceipt;
  onPress: () => void;
  onDelete: () => void;
}

export default function ReceiptCard({
  receipt,
  onPress,
  onDelete,
}: ReceiptCardProps) {
  const scale = useSharedValue(1);
  const deleteScale = useSharedValue(1);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data não detectada';
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return 'Valor não detectado';
    return `€${amount.toFixed(2)}`;
  };

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.98, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    onPress();
  };

  const handleDelete = () => {
    deleteScale.value = withSequence(
      withSpring(0.9, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    onDelete();
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const deleteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deleteScale.value }],
  }));

  return (
    <Animated.View style={[styles.card, cardAnimatedStyle]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <View style={styles.cardContent}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: receipt.imageUrl }} style={styles.image} />
            <View style={styles.imageOverlay}>
              <FileText size={16} color="#FFFFFF" strokeWidth={2} />
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>
                  #{receipt.id.slice(-8).toUpperCase()}
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Processado</Text>
                </View>
              </View>
              <Animated.View style={deleteAnimatedStyle}>
                <TouchableOpacity
                  onPress={handleDelete}
                  style={styles.deleteButton}
                >
                  <Trash2 size={18} color="#EF4444" strokeWidth={2} />
                </TouchableOpacity>
              </Animated.View>
            </View>

            {receipt.merchantName && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Store size={16} color="#8B5CF6" strokeWidth={2} />
                </View>
                <Text
                  style={[
                    styles.infoText,
                    { color: '#8B5CF6', fontWeight: '600' },
                  ]}
                >
                  {receipt.merchantName}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Calendar size={16} color="#6B7280" strokeWidth={2} />
              </View>
              <Text style={styles.infoText}>
                {receipt.dateDetected
                  ? formatDate(receipt.dateDetected)
                  : formatDate(receipt.createdAt)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <DollarSign size={16} color="#10B981" strokeWidth={2} />
              </View>
              <Text
                style={[
                  styles.infoText,
                  { color: '#10B981', fontWeight: '700', fontSize: 16 },
                ]}
              >
                {formatAmount(receipt.totalValue)}
              </Text>
            </View>

            <View style={styles.textPreview}>
              <Text style={styles.previewText} numberOfLines={2}>
                {receipt.extractedText || 'Nenhum texto extraído'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 20,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  textPreview: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '500',
  },
});
