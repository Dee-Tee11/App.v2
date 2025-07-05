import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  Image as ImageIcon,
  ChevronRight,
  FileText,
} from 'lucide-react-native';
import Animated, {
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { styles } from '@/src/features/receipts/styles/ScannerScreen.styles';

interface ActionButtonsProps {
  onTakePhoto: () => void;
  onPickImage: () => void;
  onPickDocument: () => void;
  cameraPermission: boolean | null;
  galleryPermission: boolean | null;
  onRequestPermissions: () => void;
}

export default function ActionButtons({
  onTakePhoto,
  onPickImage,
  onPickDocument,
  cameraPermission,
  galleryPermission,
  onRequestPermissions,
}: ActionButtonsProps) {
  const cameraScale = useSharedValue(1);
  const galleryScale = useSharedValue(1);
  const documentScale = useSharedValue(1);

  const animateButton = (scale: Animated.SharedValue<number>) => {
    scale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 15 }),
    );
  };

  const cameraAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cameraScale.value }],
  }));

  const galleryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: galleryScale.value }],
  }));

  const documentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: documentScale.value }],
  }));

  const handleTakePhoto = () => {
    animateButton(cameraScale);
    onTakePhoto();
  };

  const handlePickImage = () => {
    animateButton(galleryScale);
    onPickImage();
  };

  const handlePickDocument = () => {
    animateButton(documentScale);
    onPickDocument();
  };

  return (
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
              <ChevronRight
                size={20}
                color="rgba(255,255,255,0.7)"
                strokeWidth={2}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.buttonWrapper, galleryAnimatedStyle]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <View style={styles.buttonIcon}>
                <ImageIcon size={28} color="#FFFFFF" strokeWidth={2} />
              </View>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonTitle}>Galeria</Text>
                <Text style={styles.buttonSubtitle}>Escolher foto</Text>
              </View>
              <ChevronRight
                size={20}
                color="rgba(255,255,255,0.7)"
                strokeWidth={2}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.buttonWrapper, documentAnimatedStyle]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePickDocument}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <View style={styles.buttonIcon}>
                <FileText size={28} color="#FFFFFF" strokeWidth={2} />
              </View>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonTitle}>PDF</Text>
                <Text style={styles.buttonSubtitle}>Escolher ficheiro</Text>
              </View>
              <ChevronRight
                size={20}
                color="rgba(255,255,255,0.7)"
                strokeWidth={2}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {(!cameraPermission || !galleryPermission) && (
        <Text style={styles.permissionNote}>
          Permissões necessárias serão solicitadas
        </Text>
      )}
    </Animated.View>
  );
}
