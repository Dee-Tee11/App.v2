import { supabase } from '@/lib/supabase';
import { extractTextFromImage, parseReceiptData } from './ocrService';
import type { Database } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';

type Receipt = Database['public']['Tables']['receipts']['Row'];
type ReceiptInsert = Database['public']['Tables']['receipts']['Insert'];

export interface ProcessedReceipt {
  id: string;
  imageUrl: string;
  extractedText: string;
  merchantName: string | null;
  totalValue: number | null;
  dateDetected: string | null;
  createdAt: string;
}

export async function processReceipt(imageUri: string): Promise<ProcessedReceipt> {
  try {
    console.log('🚀 Processando recibo:', imageUri);
    
    // Step 1: Extract text using OCR
    const ocrResult = await extractTextFromImage(imageUri);
    console.log('📄 OCR Result completo:', ocrResult);
    
    // Step 2: Extract text from OCR result properly
    let extractedText = '';
    if (ocrResult.ParsedResults && ocrResult.ParsedResults.length > 0) {
      extractedText = ocrResult.ParsedResults[0].ParsedText || '';
    }
    
    console.log('📝 Texto extraído:', extractedText);
    
    if (!extractedText) {
      throw new Error('Nenhum texto foi extraído da imagem');
    }
    
    // Step 3: Parse the extracted text
    const parsedData = parseReceiptData(extractedText);
    
    // Step 4: Upload image to Supabase Storage
    const imageUrl = await uploadReceiptImage(imageUri);
    
    // Step 5: Save receipt data to database
    const receipt = await saveReceiptToDatabase({
      image_url: imageUrl,
      extracted_text: parsedData.extractedText,
      merchant_name: parsedData.merchantName,
      total_amount: parsedData.totalValue,
      date_detected: parsedData.dateDetected,
    });
    
    return {
      id: receipt.id,
      imageUrl: receipt.image_url,
      extractedText: receipt.extracted_text || '',
      merchantName: receipt.merchant_name,
      totalValue: receipt.total_amount,
      dateDetected: receipt.date_detected,
      createdAt: receipt.created_at,
    };
  } catch (error) {
    console.error('❌ Erro no processamento do recibo:', error);
    throw error;
  }
}

async function uploadReceiptImage(imageUri: string): Promise<string> {
  try {
    console.log('📤 Fazendo upload da imagem:', imageUri);
    const fileName = `receipt_${Date.now()}.jpg`;

    // Método usando FormData (Recomendado para React Native)
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: fileName,
    } as any);

    // Upload usando FormData
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, formData, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('❌ Erro no upload:', error);
      throw new Error(`Image upload failed: ${error.message}`);
    }

    // Gera URL pública
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(data.path);

    console.log('✅ Upload concluído:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Erro no upload da imagem:', error);
    throw error;
  }
}

// Método alternativo usando Uint8Array (caso o primeiro não funcione)
async function uploadReceiptImageAlternative(imageUri: string): Promise<string> {
  try {
    const fileName = `receipt_${Date.now()}.jpg`;

    // Lê o ficheiro como base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Converte base64 para Uint8Array
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const uint8Array = new Uint8Array(byteNumbers);

    // Faz upload direto do Uint8Array
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, uint8Array, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }

    // Gera URL pública
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
}

// Método usando fetch nativo (fallback)
async function uploadReceiptImageWithFetch(imageUri: string): Promise<string> {
  try {
    const fileName = `receipt_${Date.now()}.jpg`;

    // Copia o ficheiro para um local temporário se necessário
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Lê o ficheiro
    const fileData = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Converte para formato correto
    const response = await fetch(`data:image/jpeg;base64,${fileData}`);
    const blob = await response.blob();

    // Upload usando o blob
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }

    // Gera URL pública
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
}

async function saveReceiptToDatabase(receiptData: ReceiptInsert): Promise<Receipt> {
  try {
    console.log('💾 Salvando no banco de dados:', receiptData);
    
    const { data, error } = await supabase
      .from('receipts')
      .insert(receiptData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao salvar na BD:', error);
      throw new Error(`Database save failed: ${error.message}`);
    }
    
    console.log('✅ Salvo na BD:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao salvar recibo:', error);
    throw error;
  }
}

export async function getReceipts(): Promise<ProcessedReceipt[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to fetch receipts: ${error.message}`);
  }
  
  return data.map(receipt => ({
    id: receipt.id,
    imageUrl: receipt.image_url,
    extractedText: receipt.extracted_text || '',
    merchantName: receipt.merchant_name,
    totalValue: receipt.total_amount,
    dateDetected: receipt.date_detected,
    createdAt: receipt.created_at,
  }));
}

export async function deleteReceipt(id: string): Promise<void> {
  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw new Error(`Failed to delete receipt: ${error.message}`);
  }
}