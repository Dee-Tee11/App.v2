import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import type { ProcessedReceipt } from '@/src/features/receipts/service/receiptService';

interface FormData {
  merchantName: string;
  totalValue: string;
  date: string;
  category: string;
  ivaDedutivel: boolean;
  valorTotalIVA: string;
  isFatura: boolean;
  contarIVA: boolean; // ✅ Campo adicionado
}

export const useReceiptForm = (
  lastResult: ProcessedReceipt | null,
  updateReceiptFn: (id: string, data: any) => Promise<any>,
) => {
  const [formData, setFormData] = useState<FormData>({
    merchantName: '',
    totalValue: '',
    date: '',
    category: '',
    ivaDedutivel: false,
    valorTotalIVA: '',
    isFatura: false,
    contarIVA: false,
  });
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (lastResult) {
      setFormData({
        merchantName: lastResult.merchantName || '',
        totalValue: lastResult.totalValue
          ? lastResult.totalValue.toString()
          : '',
        date: lastResult.dateDetected
          ? formatDateForEdit(lastResult.dateDetected)
          : formatDateForEdit(lastResult.createdAt),
        category: lastResult.categoria || '',
        ivaDedutivel: lastResult.ivaDedutivel || false,
        valorTotalIVA: lastResult.valorTotalIVA
          ? lastResult.valorTotalIVA.toString()
          : '',
        isFatura: lastResult.isFatura || false,
        contarIVA: lastResult.contarIVA || false,
      });
    } else {
      resetForm();
    }
  }, [lastResult]);

  const formatDateForEdit = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const formateDateForDatabase = (dateString: string) => {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      merchantName: '',
      totalValue: '',
      date: '',
      category: '',
      ivaDedutivel: false,
      valorTotalIVA: '',
      isFatura: false,
      contarIVA: false, // ✅ Reset incluído
    });
  };

  const handleConfirmReceipt = async (
    receipt: ProcessedReceipt | null,
    onSuccess: () => void,
  ) => {
    if (!receipt) return;

    setIsConfirming(true);

    try {
      const updatedData = {
        merchant_name: formData.merchantName.trim() || null,
        total_amount: formData.totalValue
          ? parseFloat(formData.totalValue)
          : null,
        date_detected: formData.date
          ? formateDateForDatabase(formData.date)
          : null,
        categoria: formData.category.trim() || null,
        iva_dedutivel: formData.ivaDedutivel,
        percentagem_iva: formData.valorTotalIVA
          ? parseFloat(formData.valorTotalIVA)
          : null,
        contar_iva: formData.contarIVA,
      };

      await updateReceiptFn(receipt.id, updatedData);

      Alert.alert('Sucesso', 'Recibo confirmado e guardado com sucesso!', [
        {
          text: 'OK',
          onPress: onSuccess,
        },
      ]);
    } catch (error) {
      console.error('❌ Erro ao confirmar recibo:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `Falha ao confirmar o recibo: ${errorMessage}`);
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    formData,
    isConfirming,
    updateFormData,
    resetForm,
    handleConfirmReceipt,
  };
};
