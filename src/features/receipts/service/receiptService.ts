import { supabase } from '@/src/lib/supabase';
import {
  extractTextFromImage,
  extractTextFromPdf,
  parsePdfReceiptData,
  parseReceiptData,
  analyzeOCRQuality,
  reprocessReceiptData,
  ParsedReceiptData,
} from './ocrService';
import { extractDataWithGroq } from './groqService';
import type { Database } from '@/src/lib/supabase';
import * as FileSystem from 'expo-file-system';

// Tipos corrigidos
type Receipt = Database['public']['Tables']['receipts']['Row'];
type ReceiptInsert = Database['public']['Tables']['receipts']['Insert'];
type ReceiptUpdate = Database['public']['Tables']['receipts']['Update'];
type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export interface ProcessedReceipt {
  id: string;
  imageUrl: string;
  extractedText: string;
  merchantName: string | null;
  totalValue: number | null;
  dateDetected: string | null;
  categoria?: string | null;
  ivaDedutivel: boolean;
  valorTotalIVA: number | null;
  isFatura: boolean;
  contarIVA: boolean;
  createdAt: string;
}

export interface UpdateReceiptData {
  merchant_name?: string | null;
  total_amount?: number | null;
  date_detected?: string | null;
  categoria?: string | null;
  iva_dedutivel?: boolean;
  valorTotalIVA?: number | null; // Mantém o nome original do schema
  is_fatura?: boolean;
  contar_iva?: boolean;
}

export interface ReceiptProcessingOptions {
  enableReprocessing?: boolean;
  skipApiHealthCheck?: boolean;
  forceUpload?: boolean;
  useGroqExtraction?: boolean;
}

// Função auxiliar para validar usuário autenticado
async function validateAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error('❌ Erro ao verificar autenticação:', error);
    throw new Error('Erro ao verificar autenticação. Tente novamente.');
  }
  if (!user) {
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }
  return user;
}

// Função auxiliar para validar texto extraído
function validateExtractedText(text: string): string {
  if (!text || text.trim().length === 0) {
    throw new Error('Nenhum texto foi extraído do documento');
  }
  return text.trim();
}

// Função auxiliar para processar dados com fallback
async function processReceiptData(
  extractedText: string,
  options: ReceiptProcessingOptions,
  ocrQuality: any,
): Promise<ParsedReceiptData> {
  let parsedData: ParsedReceiptData;

  if (options.useGroqExtraction) {
    console.log('🧠 Usando Groq para extração de dados...');
    try {
      const groqResult = await extractDataWithGroq(extractedText);
      parsedData = {
        ...groqResult,
        extractedText: extractedText,
      } as ParsedReceiptData;
    } catch (groqError) {
      console.warn(
        '⚠️ Groq extraction failed, falling back to traditional parsing:',
        groqError,
      );
      parsedData = await parseReceiptData(extractedText);
    }
  } else {
    parsedData = await parseReceiptData(extractedText);
  }
  return parsedData;
}

export async function processReceipt(
  imageUri: string,
  options: ReceiptProcessingOptions = {},
): Promise<ProcessedReceipt> {
  try {
    // Validar usuário autenticado
    const user = await validateAuthenticatedUser();
    console.log('📸 Processando imagem de recibo...');

    // Validar URI da imagem
    if (!imageUri || typeof imageUri !== 'string') {
      throw new Error('URI da imagem inválida');
    }

    // Step 1: Extrair texto usando OCR
    const ocrResult = await extractTextFromImage(imageUri);
    if (
      !ocrResult ||
      !ocrResult.ParsedResults ||
      ocrResult.ParsedResults.length === 0
    ) {
      throw new Error('Falha na extração de texto da imagem');
    }

    // Step 2: Extrair texto do resultado OCR
    const extractedText = validateExtractedText(
      ocrResult.ParsedResults[0].ParsedText || '',
    );

    // Step 2.1: Analisar qualidade do OCR
    const ocrQuality = analyzeOCRQuality(extractedText);
    console.log('📊 Qualidade do OCR:', ocrQuality);

    // Step 3: Processar dados extraídos
    const parsedData = await processReceiptData(
      extractedText,
      options,
      ocrQuality,
    );

    // Step 4: Upload da imagem para Supabase Storage
    const imageUrl = await uploadReceiptImage(imageUri);

    // Step 5: Salvar dados do recibo na base de dados
    const receipt = await saveReceiptToDatabase({
      user_id: user.id,
      image_url: imageUrl,
      extracted_text: parsedData.extractedText || extractedText,
      merchant_name: parsedData.merchantName || null,
      total_amount: parsedData.totalValue || null,
      date_detected: parsedData.dateDetected || null,
      categoria: parsedData.categoria || null,
      iva_dedutivel: parsedData.ivaDedutivel ?? false,
      valorTotalIVA: parsedData.valorTotalIVA || null, // Mantém nome original
    });
    //
    console.log('✅ Recibo de imagem processado com sucesso');
    return mapReceiptToProcessedReceipt(receipt);
  } catch (error) {
    console.error('❌ Erro no processamento do recibo:', error);
    throw error instanceof Error
      ? error
      : new Error('Erro desconhecido no processamento');
  }
}

export async function processPdfReceipt(
  pdfUri: string,
  fileName: string,
  options: ReceiptProcessingOptions = {},
): Promise<ProcessedReceipt> {
  try {
    // Validar usuário autenticado
    const user = await validateAuthenticatedUser();
    console.log('📄 Processando PDF:', fileName);

    // Validar parâmetros
    if (!pdfUri || typeof pdfUri !== 'string') {
      throw new Error('URI do PDF inválida');
    }
    if (!fileName || typeof fileName !== 'string') {
      throw new Error('Nome do arquivo inválido');
    }

    // Step 1: Extrair texto do PDF
    const extractedText = validateExtractedText(
      await extractTextFromPdf(pdfUri),
    );
    console.log(
      '📝 Texto extraído do PDF:',
      extractedText.substring(0, 200) + '...',
    );

    // Step 1.1: Analisar qualidade do OCR
    const ocrQuality = analyzeOCRQuality(extractedText);
    console.log('📊 Qualidade do OCR do PDF:', ocrQuality);

    // Step 2: Processar dados extraídos
    let parsedData: ParsedReceiptData;
    if (options.useGroqExtraction) {
      console.log('🧠 Usando Groq para extração de dados do PDF...');
      try {
        const groqResult = await extractDataWithGroq(extractedText);
        parsedData = {
          ...groqResult,
          extractedText: extractedText,
        } as ParsedReceiptData;
      } catch (groqError) {
        console.warn(
          '⚠️ Groq extraction failed, falling back to traditional parsing:',
          groqError,
        );
        parsedData = await parsePdfReceiptData(extractedText);
      }
    } else {
      parsedData = await parsePdfReceiptData(extractedText);
    }

    // Step 3: Upload do PDF para Supabase Storage
    const fileUrl = await uploadPdfFile(pdfUri, fileName);

    // Step 4: Salvar dados do recibo na base de dados
    const receipt = await saveReceiptToDatabase({
      user_id: user.id,
      image_url: fileUrl,
      extracted_text: extractedText,
      merchant_name: parsedData.merchantName || null,
      total_amount: parsedData.totalValue || null,
      date_detected: parsedData.dateDetected || null,
      categoria: parsedData.categoria || null,
      iva_dedutivel: parsedData.ivaDedutivel ?? true, // PDFs geralmente são faturas
      valorTotalIVA: parsedData.valorTotalIVA || null, // Mantém nome original
    });

    console.log('✅ PDF processado com sucesso');
    return mapReceiptToProcessedReceipt(receipt);
  } catch (error) {
    console.error('❌ Erro no processamento do PDF:', error);
    throw error instanceof Error
      ? error
      : new Error('Erro desconhecido no processamento do PDF');
  }
}

async function uploadReceiptImage(imageUri: string): Promise<string> {
  try {
    // Validar se o arquivo existe
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('Arquivo de imagem não encontrado');
    }

    const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;

    // Ler arquivo como base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Converter base64 para Uint8Array
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Upload
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, byteArray, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('❌ Erro no upload da imagem:', error);
      throw new Error(`Falha no upload da imagem: ${error.message}`);
    }

    // Gerar URL pública
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Erro no upload da imagem:', error);
    throw error instanceof Error
      ? error
      : new Error('Erro desconhecido no upload da imagem');
  }
}

async function uploadPdfFile(
  pdfUri: string,
  fileName: string,
): Promise<string> {
  try {
    // Validar se o arquivo existe
    const fileInfo = await FileSystem.getInfoAsync(pdfUri);
    if (!fileInfo.exists) {
      throw new Error('Arquivo PDF não encontrado');
    }

    // Gerar nome único e limpo
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `pdf_${timestamp}_${randomSuffix}_${sanitizedFileName}`;

    console.log('📄 Uploading PDF:', uniqueFileName);

    // Ler arquivo como base64
    const fileBase64 = await FileSystem.readAsStringAsync(pdfUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Converter base64 para Uint8Array
    const byteCharacters = atob(fileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Upload
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(uniqueFileName, byteArray, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (error) {
      console.error('❌ Erro no upload do PDF:', error);
      throw new Error(`Falha no upload do PDF: ${error.message}`);
    }

    console.log('✅ PDF uploaded successfully:', data.path);

    // Gerar URL pública
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Erro no upload do PDF:', error);
    throw error instanceof Error
      ? error
      : new Error('Erro desconhecido no upload do PDF');
  }
}

export async function updateReceipt(
  receiptId: string,
  updateData: UpdateReceiptData,
): Promise<ProcessedReceipt> {
  try {
    // Validar parâmetros
    if (!receiptId || typeof receiptId !== 'string') {
      throw new Error('ID do recibo inválido');
    }

    // Validar usuário autenticado
    const user = await validateAuthenticatedUser();
    console.log('🔄 Atualizando recibo:', receiptId);

    // Preparar dados para atualização
    const cleanedData: ReceiptUpdate = {
      updated_at: new Date().toISOString(),
    };

    // Processar cada campo de atualização
    if (updateData.merchant_name !== undefined) {
      cleanedData.merchant_name = updateData.merchant_name?.trim() || null;
    }
    if (updateData.total_amount !== undefined) {
      cleanedData.total_amount = updateData.total_amount;
    }
    if (updateData.date_detected !== undefined) {
      cleanedData.date_detected = updateData.date_detected || null;
    }
    if (updateData.categoria !== undefined) {
      cleanedData.categoria = updateData.categoria?.trim() || null;
    }
    if (updateData.iva_dedutivel !== undefined) {
      cleanedData.iva_dedutivel = updateData.iva_dedutivel;
    }
    if (updateData.valorTotalIVA !== undefined) {
      cleanedData.valorTotalIVA = updateData.valorTotalIVA; // Mantém nome original
    }
    if (updateData.is_fatura !== undefined) {
      cleanedData.is_fatura = updateData.is_fatura;
    }
    if (updateData.contar_iva !== undefined) {
      cleanedData.contar_iva = updateData.contar_iva;
    }

    // Atualizar na base de dados
    const { data, error } = await supabase
      .from('receipts')
      .update(cleanedData)
      .eq('id', receiptId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar recibo:', error);
      throw new Error(`Falha ao atualizar recibo: ${error.message}`);
    }

    if (!data) {
      throw new Error('Recibo não encontrado ou não pertence ao usuário');
    }

    console.log('✅ Recibo atualizado com sucesso');
    return mapReceiptToProcessedReceipt(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar recibo:', error);
    throw error instanceof Error
      ? error
      : new Error('Erro desconhecido na atualização');
  }
}

async function saveReceiptToDatabase(
  receiptData: ReceiptInsert,
): Promise<Receipt> {
  try {
    console.log('💾 Salvando recibo na BD...');

    const { data, error } = await supabase
      .from('receipts')
      .insert(receiptData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar na BD:', error);
      throw new Error(`Falha ao salvar na base de dados: ${error.message}`);
    }

    if (!data) {
      throw new Error('Nenhum dado retornado após inserção');
    }

    console.log('✅ Recibo salvo com sucesso');
    return data;
  } catch (error) {
    console.error('❌ Erro ao salvar recibo:', error);
    throw error instanceof Error
      ? error
      : new Error('Erro desconhecido ao salvar');
  }
}

// Função auxiliar para mapear recibo da BD para ProcessedReceipt
function mapReceiptToProcessedReceipt(receipt: Receipt): ProcessedReceipt {
  return {
    id: receipt.id,
    imageUrl: receipt.image_url,
    extractedText: receipt.extracted_text || '',
    merchantName: receipt.merchant_name,
    totalValue: receipt.total_amount,
    dateDetected: receipt.date_detected,
    categoria: receipt.categoria,
    ivaDedutivel: receipt.iva_dedutivel || false,
    valorTotalIVA: receipt.valorTotalIVA, // Mantém nome original
    isFatura: (receipt as any).is_fatura || false, // Cast temporário
    contarIVA: (receipt as any).contar_iva || false, // Cast temporário
    createdAt: receipt.created_at,
  };
}

export async function getReceipts(): Promise<ProcessedReceipt[]> {
  try {
    // Validar usuário autenticado
    const user = await validateAuthenticatedUser();

    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Falha ao buscar recibos: ${error.message}`);
    }

    return (data || []).map(mapReceiptToProcessedReceipt);
  } catch (error) {
    console.error('❌ Erro ao buscar recibos:', error);
    throw error instanceof Error
      ? error
      : new Error('Erro desconhecido ao buscar recibos');
  }
}

export async function deleteReceipt(id: string): Promise<void> {
  try {
    // Validar parâmetros
    if (!id || typeof id !== 'string') {
      throw new Error('ID do recibo inválido');
    }

    // Validar usuário autenticado
    const user = await validateAuthenticatedUser();

    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Falha ao eliminar recibo: ${error.message}`);
    }

    console.log('✅ Recibo eliminado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao eliminar recibo:', error);
    throw error instanceof Error
      ? error
      : new Error('Erro desconhecido ao eliminar recibo');
  }
}

// Funções para gerenciar User Profiles
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const user = await validateAuthenticatedUser();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Falha ao buscar perfil do usuário: ${error.message}`);
    }

    return data || null;
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    throw error instanceof Error
      ? error
      : new Error('Erro desconhecido ao buscar perfil');
  }
}

export async function createOrUpdateUserProfile(
  nif?: string,
): Promise<UserProfile> {
  try {
    const user = await validateAuthenticatedUser();

    // Validar NIF se fornecido
    if (nif && (typeof nif !== 'string' || nif.trim().length === 0)) {
      throw new Error('NIF inválido');
    }

    const profileData = {
      id: user.id,
      nif: nif?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    // Tentar inserir primeiro
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    if (!insertError) {
      console.log('✅ Perfil criado com sucesso');
      return insertData;
    }

    // Se falhou porque já existe, fazer update
    if (insertError.code === '23505') {
      const { data: updateData, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          nif: nif?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Falha ao atualizar perfil: ${updateError.message}`);
      }

      console.log('✅ Perfil atualizado com sucesso');
      return updateData;
    }

    throw new Error(`Falha ao criar perfil: ${insertError.message}`);
  } catch (error) {
    console.error('❌ Erro ao criar/atualizar perfil:', error);
    throw error instanceof Error
      ? error
      : new Error('Erro desconhecido ao criar/atualizar perfil');
  }
}
