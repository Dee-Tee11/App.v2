import * as XLSX from 'xlsx';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/src/lib/supabase';
import type { ProcessedReceipt } from './receiptService';

export async function exportAndSendEmail(userId: string, email: string) {
  try {
    // 1. Buscar os recibos do utilizador
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) {
      throw new Error('Erro ao buscar os dados dos recibos.');
    }

    if (data.length === 0) {
      return {
        success: false,
        error: 'Não foram encontrados recibos para exportar.',
      };
    }

    // 2. Preparar os dados para o Excel (formatação melhorada)
    const formattedData = data.map((receipt: any, index: number) => ({
      Nº: index + 1,
      ID: receipt.id,
      Comerciante: receipt.merchantName || 'N/A',
      'Valor Total (€)': receipt.totalValue || 0,
      Data: receipt.dateDetected || 'N/A',
      Categoria: receipt.categoria || 'Sem categoria',
      'Texto Extraído': receipt.extractedText || '',
      'Data de Criação': receipt.created_at
        ? new Date(receipt.created_at).toLocaleDateString('pt-PT')
        : 'N/A',
    }));

    // 3. Gerar Excel com os dados
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Definir largura das colunas
    const columnWidths = [
      { wch: 5 }, // Nº
      { wch: 15 }, // ID
      { wch: 25 }, // Comerciante
      { wch: 15 }, // Valor Total
      { wch: 12 }, // Data
      { wch: 15 }, // Categoria
      { wch: 50 }, // Texto Extraído
      { wch: 15 }, // Data de Criação
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Recibos');

    // 4. Converter para base64
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'base64',
    });

    // 5. Criar nome do ficheiro com timestamp
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const fileName = `recibos-${timestamp}.xlsx`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    // 6. Guardar ficheiro temporariamente
    await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 7. Verificar se o ficheiro foi criado
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('Erro ao criar o ficheiro Excel.');
    }

    // 8. Partilhar ficheiro
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Partilhar Recibos Excel',
        UTI: 'com.microsoft.excel.xlsx',
      });
    } else {
      // Se não conseguir partilhar, pelo menos informa onde está o ficheiro
      console.log('Sharing não disponível. Ficheiro guardado em:', fileUri);
      return {
        success: true,
        message: `Ficheiro guardado em: ${fileName}`,
        filePath: fileUri,
      };
    }

    // 9. Limpar ficheiro temporário após 30 segundos (opcional)
    setTimeout(async () => {
      try {
        const fileExists = await FileSystem.getInfoAsync(fileUri);
        if (fileExists.exists) {
          await FileSystem.deleteAsync(fileUri);
          console.log('Ficheiro temporário removido:', fileName);
        }
      } catch (cleanupError) {
        console.log('Erro ao limpar ficheiro temporário:', cleanupError);
      }
    }, 30000);

    return {
      success: true,
      message: `Ficheiro Excel criado com ${data.length} recibos`,
      totalReceipts: data.length,
      fileName: fileName,
    };
  } catch (err: any) {
    console.error('Erro no exportService:', err.message);
    return {
      success: false,
      error: err.message || 'Erro desconhecido ao exportar recibos',
    };
  }
}

// Função adicional para exportar apenas recibos filtrados
export async function exportFilteredReceipts(
  receipts: ProcessedReceipt[],
  fileName?: string,
) {
  try {
    if (receipts.length === 0) {
      return {
        success: false,
        error: 'Não há recibos para exportar.',
      };
    }

    // Preparar os dados para o Excel
    const formattedData = receipts.map((receipt, index) => ({
      Nº: index + 1,
      ID: receipt.id,
      Comerciante: receipt.merchantName || 'N/A',
      'Valor Total (€)': receipt.totalValue || 0,
      Data: receipt.dateDetected || 'N/A',
      Categoria: receipt.categoria || 'Sem categoria',
      'Texto Extraído': receipt.extractedText || '',
      'Data de Criação': receipt.createdAt
        ? new Date(receipt.createdAt).toLocaleDateString('pt-PT')
        : 'N/A',
    }));

    // Gerar Excel
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    const columnWidths = [
      { wch: 5 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 50 },
      { wch: 15 },
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Recibos Filtrados');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'base64',
    });

    // Criar nome do ficheiro
    const timestamp = new Date().toISOString().slice(0, 10);
    const finalFileName = fileName || `recibos-filtrados-${timestamp}.xlsx`;
    const fileUri = `${FileSystem.documentDirectory}${finalFileName}`;

    // Guardar e partilhar
    await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Partilhar Recibos Filtrados',
        UTI: 'com.microsoft.excel.xlsx',
      });
    }

    return {
      success: true,
      message: `Ficheiro Excel criado com ${receipts.length} recibos filtrados`,
      totalReceipts: receipts.length,
      fileName: finalFileName,
    };
  } catch (err: any) {
    console.error('Erro ao exportar recibos filtrados:', err.message);
    return {
      success: false,
      error: err.message || 'Erro desconhecido ao exportar recibos filtrados',
    };
  }
}
