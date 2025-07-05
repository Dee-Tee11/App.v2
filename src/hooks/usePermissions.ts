// src/hooks/usePermissions.ts

import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert, ActivityIndicator, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Hook otimizado para gerir permissões da câmara e da galeria.
 * Agora inclui um estado de 'loading' para evitar re-renderizações visíveis.
 */
export const usePermissions = () => {
  // NOVO: Estado para controlar o carregamento inicial das permissões
  const [isLoading, setIsLoading] = useState(true);

  const [cameraPermissionStatus, setCameraPermissionStatus] =
    useState<ImagePicker.PermissionStatus | null>(null);
  const [galleryPermissionStatus, setGalleryPermissionStatus] =
    useState<ImagePicker.PermissionStatus | null>(null);

  // 1. VERIFICAÇÃO INICIAL (SEM SOLICITAÇÃO)
  useEffect(() => {
    const checkExistingPermissions = async () => {
      try {
        if (Platform.OS !== 'web') {
          const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
          const galleryStatus =
            await ImagePicker.getMediaLibraryPermissionsAsync();
          setCameraPermissionStatus(cameraStatus.status);
          setGalleryPermissionStatus(galleryStatus.status);
        } else {
          setCameraPermissionStatus(ImagePicker.PermissionStatus.GRANTED);
          setGalleryPermissionStatus(ImagePicker.PermissionStatus.GRANTED);
        }
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        // Em caso de erro, definimos como negado para não bloquear a app
        setCameraPermissionStatus(ImagePicker.PermissionStatus.DENIED);
        setGalleryPermissionStatus(ImagePicker.PermissionStatus.DENIED);
      } finally {
        // NOVO: Independentemente do resultado, o carregamento terminou
        setIsLoading(false);
      }
    };

    checkExistingPermissions();
  }, []);

  // O resto do teu código (requestCameraPermission, requestGalleryPermission)
  // pode permanecer exatamente igual.
  const requestCameraPermission = useCallback(async () => {
    // ... o teu código aqui ...
  }, [cameraPermissionStatus]);

  const requestGalleryPermission = useCallback(async () => {
    // ... o teu código aqui ...
  }, [galleryPermissionStatus]);

  return {
    // NOVO: Exportamos o estado de carregamento
    isLoadingPermissions: isLoading,
    hasCameraPermission:
      cameraPermissionStatus === ImagePicker.PermissionStatus.GRANTED,
    hasGalleryPermission:
      galleryPermissionStatus === ImagePicker.PermissionStatus.GRANTED,
    requestCameraPermission,
    requestGalleryPermission,
  };
};
