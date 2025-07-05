import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MediaType } from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  processReceipt,
  processPdfReceipt,
} from '@/src/features/receipts/service/receiptService';
import type { ProcessedReceipt } from '@/src/features/receipts/service/receiptService';

export const useImageProcessing = (
  setIsProcessing: (value: boolean) => void,
  setLastResult: (value: ProcessedReceipt | null) => void,
) => {
  const processImage = async (source: 'camera' | 'gallery' | 'document') => {
    setIsProcessing(true);
    setLastResult(null);

    try {
      if (source === 'document') {
        await processDocument();
      } else {
        await processImageSource(source);
      }
    } catch (error) {
      console.error('Processing error:', error);
      handleProcessingError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processImageSource = async (source: 'camera' | 'gallery') => {
    let result;

    // PEDIR PERMISSÕES!
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'É necessário permitir acesso à câmara.',
        );
        setIsProcessing(false);
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        exif: false,
      });
    } else {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'É necessário permitir acesso à galeria.',
        );
        setIsProcessing(false);
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });
    }

    if (!result.canceled && result.assets[0]) {
      const processedResult = await processReceipt(result.assets[0].uri);
      setLastResult(processedResult);
    }
  };

  const processDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];

        // Verificar se é realmente um PDF
        if (
          !file.mimeType?.includes('pdf') &&
          !file.name?.toLowerCase().endsWith('.pdf')
        ) {
          Alert.alert(
            'Formato Inválido',
            'Por favor selecione apenas ficheiros PDF.',
          );
          return;
        }

        // Verificar tamanho do ficheiro (max 10MB)
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert(
            'Ficheiro Muito Grande',
            'O ficheiro PDF é muito grande (máx. 10MB). Tente com um ficheiro menor.',
          );
          return;
        }

        const processedResult = await processPdfReceipt(
          file.uri,
          file.name || 'receipt.pdf',
        );
        setLastResult(processedResult);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      throw error;
    }
  };

  const handleProcessingError = (error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes('File size exceeds') ||
      errorMessage.includes('maximum permissible file size')
    ) {
      Alert.alert(
        'Ficheiro Muito Grande',
        'O ficheiro é muito grande para processamento. Tente com um ficheiro menor.',
      );
    } else if (
      errorMessage.includes('Network request failed') ||
      errorMessage.includes('API error')
    ) {
      Alert.alert(
        'Problema de Conexão',
        'Erro ao processar o recibo. Verifica a ligação à internet.',
      );
    } else if (errorMessage.includes('PDF processing failed')) {
      Alert.alert(
        'Erro no PDF',
        'Não foi possível processar o ficheiro PDF. Certifique-se de que é um recibo válido.',
      );
    } else if (errorMessage.includes('Unsupported file format')) {
      Alert.alert(
        'Formato Não Suportado',
        'Apenas ficheiros PDF são suportados para documentos.',
      );
    } else {
      Alert.alert(
        'Falha no Processamento',
        'Erro ao processar o recibo. Verifique a ligação à internet e tente novamente.',
      );
    }
  };

  return { processImage };
};
