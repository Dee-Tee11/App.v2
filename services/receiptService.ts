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

export interface EditedReceiptData {
  merchantName: string | null;
  totalValue: number | null;
  dateDetected: string | null;
  extractedText: string;
}

export async function processReceipt(
  imageUri: string, 
  shouldSave: boolean = true, 
  editedData?: EditedReceiptData
): Promise<ProcessedReceipt> {
  try {
    console.log('🚀 Processando recibo:', imageUri, 'shouldSave:', shouldSave);
    
    let parsedData;
    let imageUrl: string;

    if (editedData) {
      // Use the edited data provided
      parsedData = editedData;
      // Upload image to get the URL
      imageUrl = await uploadReceiptImage(imageUri);
    } else {
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
      const rawParsedData = parseReceiptData(extractedText);
      parsedData = {
        merchantName: rawParsedData.merchantName,
        totalValue: rawParsedData.totalValue,
        dateDetected: rawParsedData.dateDetected,
        extractedText: rawParsedData.extractedText,
      };
      
      // Step 4: Upload image to Supabase Storage (if we're going to save)
      if (shouldSave) {
        imageUrl = await uploadReceiptImage(imageUri);
      } else {
        // For preview, we can use the local URI temporarily
        imageUrl = imageUri;
      }
    }
    
    let receipt: Receipt;
    
    if (shouldSave) {
      // Step 5: Save receipt data to database
      receipt = await saveReceiptToDatabase({
        image_url: imageUrl,
        extracted_text: parsedData.extractedText,
        merchant_name: parsedData.merchantName,
        total_amount: parsedData.totalValue,
        date_detected: parsedData.dateDetected,
      });
    } else {
      // Create a temporary receipt object for preview
      receipt = {
        id: 'temp-' + Date.now(),
        user_id: null,
        image_url: imageUrl,
        extracted_text: parsedData.extractedText,
        merchant_name: parsedData.merchantName,
        total_amount: parsedData.totalValue,
        date_detected: parsedData.dateDetected,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    
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