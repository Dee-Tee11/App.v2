// O teu ficheiro ScannerScreen.tsx atualizado
import React, { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { updateReceipt } from '@/src/features/receipts/service/receiptService';
import { styles } from '@/src/features/receipts/styles/ScannerScreen.styles';
import type { ProcessedReceipt } from '@/src/features/receipts/service/receiptService';

import ScannerHeader from '@/src/features/receipts/components/ScannerHeader';
import ActionButtons from '@/src/features/receipts/components/ActionButtons';
import ProcessingView from '@/src/features/receipts/components/ProcessingView';
import { ResultCard } from '@/src/features/receipts/components/ResultCard';

import { usePermissions } from '@/src/hooks/usePermissions';
import { useImageProcessing } from '@/src/hooks/useImageProcessing';
import { useReceiptForm } from '@/src/hooks/useReceiptForm';
import { useApiCheck } from '@/src/hooks/useApiCheck';

export default function ScannerScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ProcessedReceipt | null>(null);

  const { processImage } = useImageProcessing(setIsProcessing, setLastResult);
  const { quickApiCheck, isCheckingApi } = useApiCheck();

  const {
    isLoadingPermissions,
    hasCameraPermission,
    hasGalleryPermission,
    requestCameraPermission,
    requestGalleryPermission,
  } = usePermissions();

  const {
    formData,
    isConfirming,
    updateFormData,
    resetForm,
    handleConfirmReceipt,
  } = useReceiptForm(lastResult, updateReceipt);

  const onConfirmAndClear = async () => {
    if (!lastResult) return;
    await handleConfirmReceipt(lastResult, resetForm);
    setLastResult(null);
  };

  if (isLoadingPermissions) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScannerHeader onApiCheck={quickApiCheck} isCheckingApi={isCheckingApi} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isProcessing ? (
          <ProcessingView />
        ) : (
          <>
            <ActionButtons
              onTakePhoto={() => processImage('camera')}
              onPickImage={() => processImage('gallery')}
              onPickDocument={() => processImage('document')}
              cameraPermission={hasCameraPermission}
              galleryPermission={hasGalleryPermission}
              onRequestPermissions={async () => {
                await requestCameraPermission();
                await requestGalleryPermission();
              }}
            />

            {lastResult && (
              <ResultCard
                imageUrl={lastResult.imageUrl}
                extractedText={lastResult.extractedText}
                merchantName={formData.merchantName}
                setMerchantName={(value) =>
                  updateFormData('merchantName', value)
                }
                totalValue={formData.totalValue}
                setTotalValue={(value) => updateFormData('totalValue', value)}
                date={formData.date}
                setDate={(value) => updateFormData('date', value)}
                category={formData.category}
                setCategory={(value) => updateFormData('category', value)}
                ivaDedutivel={formData.ivaDedutivel}
                setIvaDedutivel={(value) =>
                  updateFormData('ivaDedutivel', value)
                }
                valorTotalIVA={formData.valorTotalIVA}
                setValorTotalIVA={(value) =>
                  updateFormData('valorTotalIVA', value)
                }
                isFatura={formData.isFatura}
                setIsFatura={(value) => updateFormData('isFatura', value)}
                contarIVA={formData.contarIVA || false}
                setContarIVA={(value) => updateFormData('contarIVA', value)}
                isConfirming={isConfirming}
                onConfirm={onConfirmAndClear}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
