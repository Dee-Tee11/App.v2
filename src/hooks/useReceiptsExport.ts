import { useState } from 'react';
import { Alert } from 'react-native';
import {
  exportAndSendEmail,
  exportFilteredReceipts,
} from '@/src/features/receipts/service/exportService';
import type { ProcessedReceipt } from '@/src/features/receipts/service/receiptService';

export function useReceiptsExport(
  userId: string | null,
  email: string | null,
  filteredReceipts: ProcessedReceipt[],
  searchQuery: string,
) {
  const [isExporting, setIsExporting] = useState(false);

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
        onPress: () => exportAllReceipts(userId, email),
      },
      {
        text: searchQuery ? 'Recibos Filtrados' : 'Recibos Visíveis',
        onPress: () =>
          exportFilteredReceiptsHandler(filteredReceipts, searchQuery),
      },
    ]);
  };

  const exportAllReceipts = async (userId: string, email: string) => {
    setIsExporting(true);
    try {
      const result = await exportAndSendEmail(userId, email);
      showExportResult(result);
    } finally {
      setIsExporting(false);
    }
  };

  const exportFilteredReceiptsHandler = async (
    receipts: ProcessedReceipt[],
    query: string,
  ) => {
    setIsExporting(true);
    try {
      const fileName = query
        ? `recibos-pesquisa-${query.slice(0, 10)}-${new Date().toISOString().slice(0, 10)}.xlsx`
        : undefined;

      const result = await exportFilteredReceipts(receipts, fileName);
      showExportResult(result);
    } finally {
      setIsExporting(false);
    }
  };

  const showExportResult = (result: {
    success: boolean;
    message?: string;
    fileName?: string;
    error?: string;
  }) => {
    if (result.success) {
      Alert.alert(
        'Sucesso! 🎉',
        `${result.message}\n\nO ficheiro "${result.fileName}" foi partilhado.`,
        [{ text: 'OK' }],
      );
    } else {
      Alert.alert('Erro ao exportar', result.error || 'Erro desconhecido', [
        { text: 'OK' },
      ]);
    }
  };

  return {
    handleExport,
    isExporting,
  };
}
