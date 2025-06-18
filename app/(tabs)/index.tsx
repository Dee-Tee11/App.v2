import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, FileText, DollarSign, Calendar, Store, Sparkles, Zap, ChevronRight } from 'lucide-react-native';
import { processReceipt } from '@/services/receiptService';
import type { ProcessedReceipt } from '@/services/receiptService';
import LoadingSpinner from '@/components/LoadingSpinner';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  FadeIn,
  SlideInDown,
  BounceIn
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ScannerScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ProcessedReceipt | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [galleryPermission, setGalleryPermission] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const cameraScale = useSharedValue(1);
  const galleryScale = useSharedValue(1);
  const resultOpacity = useSharedValue(0);

  useEffect(() => {
    setIsMounted(true);
    checkPermissions();
    
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (lastResult) {
      resultOpacity.value = withSpring(1, { damping: 15 });
    }
  }, [lastResult]);

  const checkPermissions = async () => {
    if (Platform.OS !== 'web') {
      try {
        const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
        if (isMounted) {
          setCameraPermission(cameraStatus.granted);
        }

        const galleryStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (isMounted) {
          setGalleryPermission(galleryStatus.granted);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        if (isMounted) {
          setCameraPermission(false);
          setGalleryPermission(false);
        }
      }
    } else {
      if (isMounted) {
        setCameraPermission(true);
        setGalleryPermission(true);
      }
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'web') {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        const granted = status === 'granted';
        if (isMounted) {
          setCameraPermission(granted);
        }
        if (!granted) {
          Alert.alert(
            'Permissão Necessária',
            'É necessário acesso à câmara para digitalizar recibos.',
            [{ text: 'OK' }]
          );
          return false;
        }
      } catch (error) {
        console.error('Error requesting camera permission:', error);
        return false;
      }
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    if (Platform.OS !== 'web') {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        const granted = status === 'granted';
        if (isMounted) {
          setGalleryPermission(granted);
        }
        if (!granted) {
          Alert.alert(
            'Permissão Necessária',
            'É necessário acesso à galeria para selecionar imagens.',
            [{ text: 'OK' }]
          );
          return false;
        }
      } catch (error) {
        console.error('Error requesting media library permission:', error);
        return false;
      }
    }
    return true;
  };

  const animateButton = (scale: Animated.SharedValue<number>) => {
    scale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
  };

  const handleTakePhoto = async () => {
    animateButton(cameraScale);
    
    if (!cameraPermission) {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets[0] && isMounted) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      if (isMounted) {
        Alert.alert('Erro', 'Falha ao tirar foto. Tente novamente.');
      }
    }
  };

  const handlePickImage = async () => {
    animateButton(galleryScale);
    
    if (!galleryPermission) {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });

      if (!result.canceled && result.assets[0] && isMounted) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      if (isMounted) {
        Alert.alert('Erro', 'Falha ao selecionar imagem. Tente novamente.');
      }
    }
  };

  const processImage = async (imageUri: string) => {
    if (!isMounted) return;
    
    setIsProcessing(true);
    setLastResult(null);
    resultOpacity.value = 0;

    try {
      const result = await processReceipt(imageUri);
      if (isMounted) {
        setLastResult(result);
      }
    } catch (error) {
      console.error('Processing error:', error);
      
      if (!isMounted) return;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('File size exceeds') || errorMessage.includes('maximum permissible file size')) {
        Alert.alert(
          'Imagem Muito Grande',
          'A imagem é muito grande para processamento. Tente com uma imagem menor.'
        );
      } else {
        Alert.alert(
          'Falha no Processamento',
          'Erro ao processar o recibo. Verifique a ligação à internet.'
        );
      }
    } finally {
      if (isMounted) {
        setIsProcessing(false);
      }
    }
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return 'Valor não detectado';
    return `€${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data não detectada';
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  const cameraAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cameraScale.value }],
  }));

  const galleryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: galleryScale.value }],
  }));

  const resultAnimatedStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Header unificado */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <Animated.View 
            entering={FadeIn.delay(200)}
            style={styles.headerContent}
          >
            <View style={styles.titleRow}>
              <Sparkles size={24} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.headerTitle}>ReceiptScan</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Digitalize e analise recibos instantaneamente
            </Text>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isProcessing ? (
          <Animated.View 
            style={styles.loadingContainer}
            entering={FadeIn}
          >
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
        ) : (
          <>
            {/* Botões de ação unificados */}
            <Animated.View 
              style={styles.actionContainer}
              entering={SlideInDown.delay(300)}
            >
              <Text style={styles.sectionTitle}>Digitalizar Recibo</Text>
              
              <View style={styles.buttonsContainer}>
                <Animated.View style={[styles.buttonWrapper, cameraAnimatedStyle]}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.buttonGradient}
                    >
                      <View style={styles.buttonIcon}>
                        <Camera size={28} color="#FFFFFF" strokeWidth={2} />
                      </View>
                      <View style={styles.buttonContent}>
                        <Text style={styles.buttonTitle}>Tirar Foto</Text>
                        <Text style={styles.buttonSubtitle}>Usar câmara</Text>
                      </View>
                      <ChevronRight size={20} color="rgba(255,255,255,0.7)" strokeWidth={2} />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={[styles.buttonWrapper, galleryAnimatedStyle]}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                  >
                    <View style={styles.secondaryButton}>
                      <View style={[styles.buttonIcon, styles.secondaryIcon]}>
                        <ImageIcon size={28} color="#667eea" strokeWidth={2} />
                      </View>
                      <View style={styles.buttonContent}>
                        <Text style={[styles.buttonTitle, styles.secondaryTitle]}>Galeria</Text>
                        <Text style={[styles.buttonSubtitle, styles.secondarySubtitle]}>Escolher foto</Text>
                      </View>
                      <ChevronRight size={20} color="#667eea" strokeWidth={2} />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
              
              {(!cameraPermission || !galleryPermission) && (
                <Text style={styles.permissionNote}>
                  Permissões necessárias serão solicitadas
                </Text>
              )}
            </Animated.View>

            {/* Resultado unificado */}
            {lastResult && (
              <Animated.View 
                style={[styles.resultContainer, resultAnimatedStyle]}
                entering={BounceIn.delay(500)}
              >
                <Text style={styles.sectionTitle}>Resultado da Análise</Text>
                
                <View style={styles.resultCard}>
                  <Image source={{ uri: lastResult.imageUrl }} style={styles.resultImage} />
                  
                  <View style={styles.resultInfo}>
                    {/* Info unificada em grid */}
                    <View style={styles.infoGrid}>
                      {lastResult.merchantName && (
                        <View style={styles.infoCard}>
                          <View style={styles.infoIconContainer}>
                            <Store size={18} color="#8B5CF6" strokeWidth={2} />
                          </View>
                          <Text style={styles.infoLabel}>Estabelecimento</Text>
                          <Text style={[styles.infoValue, { color: '#8B5CF6' }]}>
                            {lastResult.merchantName}
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.infoCard}>
                        <View style={styles.infoIconContainer}>
                          <DollarSign size={18} color="#10B981" strokeWidth={2} />
                        </View>
                        <Text style={styles.infoLabel}>Valor Total</Text>
                        <Text style={[styles.infoValue, { color: '#10B981', fontWeight: '700' }]}>
                          {formatAmount(lastResult.totalValue)}
                        </Text>
                      </View>
                      
                      <View style={styles.infoCard}>
                        <View style={styles.infoIconContainer}>
                          <Calendar size={18} color="#6B7280" strokeWidth={2} />
                        </View>
                        <Text style={styles.infoLabel}>Data</Text>
                        <Text style={styles.infoValue}>
                          {lastResult.dateDetected ? formatDate(lastResult.dateDetected) : formatDate(lastResult.createdAt)}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Texto extraído */}
                    <View style={styles.textContainer}>
                      <View style={styles.textHeader}>
                        <FileText size={18} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.textTitle}>Texto Extraído</Text>
                      </View>
                      <ScrollView style={styles.textScrollView} nestedScrollEnabled>
                        <Text style={styles.extractedText}>
                          {lastResult.extractedText || 'Nenhum texto extraído'}
                        </Text>
                      </ScrollView>
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}
          </>
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
    paddingBottom: 32,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 10,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    marginTop: -16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  processingSteps: {
    marginTop: 20,
    gap: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  buttonsContainer: {
    gap: 12,
  },
  buttonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButton: {
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  buttonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  secondaryIcon: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  secondaryTitle: {
    color: '#1F2937',
  },
  buttonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  secondarySubtitle: {
    color: '#6B7280',
  },
  permissionNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  resultContainer: {
    marginTop: 32,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  resultImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 20,
  },
  resultInfo: {
    gap: 20,
  },
  infoGrid: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    lineHeight: 22,
  },
  textContainer: {
    marginTop: 8,
  },
  textHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  textTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textScrollView: {
    maxHeight: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  extractedText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    fontWeight: '500',
  },
});