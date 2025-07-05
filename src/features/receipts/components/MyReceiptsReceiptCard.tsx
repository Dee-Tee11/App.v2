import React, { useState } from 'react';
import { styles } from '@/src/features/receipts/styles/ReceiptCard.styles';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import {
  Calendar,
  DollarSign,
  FileText,
  Trash2,
  Store,
  Tag,
  X,
} from 'lucide-react-native';
import type { ProcessedReceipt } from '@/src/features/receipts/service/receiptService';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

interface ReceiptCardProps {
  receipt: ProcessedReceipt;
  onPress: () => void;
  onDelete: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ReceiptCard({
  receipt,
  onPress,
  onDelete,
}: ReceiptCardProps) {
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const scale = useSharedValue(1);
  const deleteScale = useSharedValue(1);
  const imageScale = useSharedValue(1);

  // Valores para zoom e pan da imagem expandida
  const zoomScale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetImageTransform = () => {
    'worklet';
    zoomScale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data não detectada';
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return 'Valor não detectado';
    return `€${amount.toFixed(2)}`;
  };

  const getCategoryColor = (categoria: string | null) => {
    if (!categoria) return '#6B7280';

    const colors: { [key: string]: string } = {
      alimentação: '#F59E0B',
      transporte: '#3B82F6',
      saúde: '#EF4444',
      entretenimento: '#8B5CF6',
      compras: '#10B981',
      serviços: '#F97316',
      educação: '#06B6D4',
      casa: '#84CC16',
      vestuário: '#EC4899',
      outros: '#6B7280',
    };

    return colors[categoria.toLowerCase()] || '#6B7280';
  };

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.98, { damping: 15 }),
      withSpring(1, { damping: 15 }),
    );
    onPress();
  };

  const handleDelete = () => {
    deleteScale.value = withSequence(
      withSpring(0.9, { damping: 15 }),
      withSpring(1, { damping: 15 }),
    );
    onDelete();
  };

  const handleImagePress = () => {
    imageScale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 15 }),
    );
    setImageModalVisible(true);
  };

  const handleCloseModal = () => {
    resetImageTransform();
    setImageModalVisible(false);
  };

  // Gesture para pinch-to-zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      zoomScale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      // Limitar o zoom entre 1x e 5x
      if (zoomScale.value < 1) {
        zoomScale.value = withSpring(1);
        savedScale.value = 1;
      } else if (zoomScale.value > 5) {
        zoomScale.value = withSpring(5);
        savedScale.value = 5;
      } else {
        savedScale.value = zoomScale.value;
      }
    });

  // Gesture para arrastar a imagem
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Gesture para duplo toque (reset ou zoom)
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (zoomScale.value > 1) {
        // Se já tem zoom, reset
        runOnJS(resetImageTransform)();
      } else {
        // Se não tem zoom, zoom 2x
        zoomScale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  // Combinar todos os gestures
  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(doubleTapGesture, pinchGesture),
    panGesture,
  );

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const deleteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deleteScale.value }],
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const expandedImageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: zoomScale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <>
      <Animated.View style={[styles.card, cardAnimatedStyle]}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
          <View style={styles.cardContent}>
            <View style={styles.imageContainer}>
              <Animated.View style={imageAnimatedStyle}>
                <TouchableOpacity
                  onPress={handleImagePress}
                  activeOpacity={0.8}
                  style={styles.imageWrapper}
                >
                  <Image
                    source={{ uri: receipt.imageUrl }}
                    style={styles.image}
                  />
                  <View style={styles.imageOverlay}>
                    <FileText size={16} color="#FFFFFF" strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
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

              {receipt.categoria && (
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <Tag
                      size={16}
                      color={getCategoryColor(receipt.categoria)}
                      strokeWidth={2}
                    />
                  </View>
                  <Text
                    style={[
                      styles.infoText,
                      {
                        color: getCategoryColor(receipt.categoria),
                        fontWeight: '600',
                        textTransform: 'capitalize',
                      },
                    ]}
                  >
                    {receipt.categoria}
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

              {receipt.ivaDedutivel === true &&
                receipt.totalValue &&
                receipt.valorTotalIVA !== null && (
                  <View style={styles.infoRow}>
                    <View style={styles.iconContainer}>
                      <DollarSign size={16} color="#F59E0B" strokeWidth={2} />
                    </View>
                    <Text
                      style={[
                        styles.infoText,
                        { color: '#F59E0B', fontWeight: '600' },
                      ]}
                    >
                      IVA dedutível: €
                      {(
                        (receipt.totalValue * receipt.valorTotalIVA) /
                        100
                      ).toFixed(2)}
                    </Text>
                  </View>
                )}

              <View style={styles.textPreview}>
                <Text style={styles.previewText} numberOfLines={2}>
                  {receipt.extractedText || 'Nenhum texto extraído'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal para imagem expandida */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <X size={24} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>

              <GestureDetector gesture={composedGesture}>
                <Animated.View style={styles.expandedImageContainer}>
                  <Animated.Image
                    source={{ uri: receipt.imageUrl }}
                    style={[styles.expandedImage, expandedImageAnimatedStyle]}
                    resizeMode="contain"
                  />
                </Animated.View>
              </GestureDetector>

              <TouchableOpacity
                style={styles.modalBackgroundTouchable}
                onPress={handleCloseModal}
                activeOpacity={1}
              >
                <View style={styles.modalInfo}>
                  <Text style={styles.modalTitle}>
                    Recibo #{receipt.id.slice(-8).toUpperCase()}
                  </Text>
                  {receipt.merchantName && (
                    <Text style={styles.modalSubtitle}>
                      {receipt.merchantName}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}
