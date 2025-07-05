import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { extractCategory } from '../utils/ocr/extractCategory';
import { extractDataWithGroq } from './groqService';

const OCR_API_KEY = process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY;
const OCR_API_URL = 'https://api.ocr.space/parse/image';

export interface OCRResult {
  ParsedText: string;
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string;
}

export interface ParsedReceiptData {
  extractedText: string;
  merchantName: string | null;
  totalValue: number | null;
  dateDetected: string | null;
  categoria: string | null;
  ivaDedutivel: boolean;
  valorTotalIVA: number | null;
  confidence: {
    merchant: number;
    total: number;
    date: number;
  };
}

export interface ApiHealthCheck {
  isOnline: boolean;
  status: number | null;
  responseTime: number;
  error?: string;
}

/**
 * Verifica se a API OCR está online e funcionando
 */
export async function checkApiHealth(): Promise<ApiHealthCheck> {
  const startTime = Date.now();

  try {
    console.log('🔍 Verificando saúde da API OCR...');

    // Teste simples com timeout curto
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(OCR_API_URL, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ReceiptScan-App/1.0',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    console.log(`📊 API Response: ${response.status} em ${responseTime}ms`);

    return {
      isOnline: true,
      status: response.status,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ Erro na verificação da API:', error);

    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout - API não respondeu em 5 segundos';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Sem conexão à internet';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      isOnline: false,
      status: null,
      responseTime,
      error: errorMessage,
    };
  }
}

/**
 * Teste mais avançado da API com uma requisição real pequena
 */
export async function testApiWithSampleRequest(): Promise<ApiHealthCheck> {
  const startTime = Date.now();

  try {
    console.log('🧪 Testando API com requisição de exemplo...');

    // Criar uma imagem de teste muito pequena (1x1 pixel transparente)
    const testBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    const formData = new FormData();
    formData.append('base64Image', testBase64);
    formData.append('apikey', OCR_API_KEY || 'helloworld'); // API key demo
    formData.append('language', 'eng');
    formData.append('ocrengine', '1');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Teste da API bem-sucedido:', result);

      return {
        isOnline: true,
        status: response.status,
        responseTime,
      };
    } else {
      console.warn('⚠️ API respondeu com erro:', response.status);

      return {
        isOnline: false,
        status: response.status,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ Erro no teste da API:', error);

    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout - API não respondeu em 8 segundos';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Sem conexão à internet';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      isOnline: false,
      status: null,
      responseTime,
      error: errorMessage,
    };
  }
}

// Image preprocessing function for better OCR results - VERSÃO CORRIGIDA
async function preprocessImageForOCR(imageUri: string): Promise<string> {
  try {
    // Optimize image for OCR with better settings
    const optimizedImage = await manipulateAsync(
      imageUri,
      [
        // Resize to optimal size for OCR - mantém proporção
        { resize: { width: 1400 } },
      ],
      {
        compress: 0.85, // Slightly better compression for faster processing
        format: SaveFormat.JPEG,
        base64: false,
      },
    );

    return optimizedImage.uri;
  } catch (error) {
    console.error('❌ Erro ao processar imagem:', error);
    // Retorna a URI original em caso de erro
    return imageUri;
  }
}

// Extract text from image using OCR
// Extract text from image using OCR with Engine 2 and fallback to Engine 1
export async function extractTextFromImage(imageUri: string): Promise<any> {
  console.log('📄 Iniciando extração de texto da imagem com fallback...');
  const optimizedImageUri = await preprocessImageForOCR(imageUri);

  const base64 = await FileSystem.readAsStringAsync(optimizedImageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  let ocrResult: any = null;
  let lastError: string | null = null;

  // Função auxiliar para criar o FormData para uma engine específica
  const createFormData = (engine: '1' | '2') => {
    const formData = new FormData();
    formData.append('base64Image', `data:image/jpeg;base64,${base64}`);
    formData.append('apikey', OCR_API_KEY || 'YOUR_API_KEY_HERE');
    formData.append('language', 'por');
    formData.append('ocrengine', engine);
    formData.append('scale', 'true');
    formData.append('istable', 'true');
    formData.append('detectorientation', 'true');
    formData.append('filetype', 'JPG');
    return formData;
  };

  // --- Tentativa 1: Engine 2 (preferencial) ---
  try {
    console.log('⚙️ Tentando extração com Engine 2...');
    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: createFormData('2'),
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const result = await response.json();
      // Verifica se o processamento não deu erro e se há texto extraído
      if (
        !result.IsErroredOnProcessing &&
        result.ParsedResults?.[0]?.ParsedText
      ) {
        console.log(
          `✅ Engine 2 extraiu ${result.ParsedResults[0].ParsedText.length} caracteres.`,
        );
        ocrResult = result;
      } else {
        lastError =
          result.ErrorMessage ||
          'Engine 2 não retornou texto ou falhou no processamento.';
        console.warn(`⚠️ ${lastError}`);
      }
    } else {
      lastError = `Engine 2 respondeu com erro HTTP: ${response.status}`;
      console.warn(`⚠️ ${lastError}`);
    }
  } catch (error: any) {
    lastError = `Falha na requisição para Engine 2: ${error.message}`;
    console.error(`❌ ${lastError}`, error);
  }

  // --- Tentativa 2: Engine 1 (fallback) ---
  // Executa se a primeira tentativa não tiver um resultado válido
  if (!ocrResult) {
    console.log('⚙️ Tentando Engine 1 como fallback...');
    try {
      const response = await fetch(OCR_API_URL, {
        method: 'POST',
        body: createFormData('1'),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        if (
          !result.IsErroredOnProcessing &&
          result.ParsedResults?.[0]?.ParsedText
        ) {
          console.log(
            `✅ Engine 1 (fallback) extraiu ${result.ParsedResults[0].ParsedText.length} caracteres.`,
          );
          ocrResult = result;
        } else {
          lastError =
            result.ErrorMessage || 'Engine 1 também falhou no processamento.';
          console.warn(`⚠️ ${lastError}`);
        }
      } else {
        lastError = `Engine 1 (fallback) respondeu com erro HTTP: ${response.status}`;
        console.warn(`⚠️ ${lastError}`);
      }
    } catch (error: any) {
      lastError = `Falha na requisição para Engine 1 (fallback): ${error.message}`;
      console.error(`❌ ${lastError}`, error);
    }
  }

  // --- Verificação final e retorno ---
  if (ocrResult) {
    console.log('📄 Resultado OCR final:', ocrResult);
    return ocrResult;
  } else {
    // Se ambas as engines falharem, lança um erro com a última mensagem de erro conhecida
    console.error('❌ Erro no OCR: Ambas as engines falharam.', lastError);
    throw new Error(lastError || 'Não foi possível extrair o texto da imagem.');
  }
}

// Parse receipt data from OCR text using Groq API
export async function parseReceiptData(
  ocrText: string,
): Promise<ParsedReceiptData> {
  console.log('🧠 Iniciando análise com Groq API...');

  const groqResult = await extractDataWithGroq(ocrText);

  const result: ParsedReceiptData = {
    extractedText: ocrText,
    totalValue: groqResult.totalValue ?? null,
    dateDetected: groqResult.dateDetected ?? null,
    merchantName: groqResult.merchantName ?? null,
    categoria: groqResult.categoria ?? null,
    ivaDedutivel: groqResult.ivaDedutivel ?? false,
    valorTotalIVA: groqResult.valorTotalIVA ?? null,
    confidence: {
      // Confidence is now implicit in the LLM's output
      merchant: groqResult.merchantName ? 1 : 0,
      total: groqResult.totalValue ? 1 : 0,
      date: groqResult.dateDetected ? 1 : 0,
    },
  };

  // Debug final completo
  console.log('📊 === RESULTADO FINAL (Groq) ===');
  console.log('🏪 Comerciante:', result.merchantName);
  console.log('💰 Total:', result.totalValue);
  console.log('📅 Data:', result.dateDetected);
  console.log('🎯 Categoria:', result.categoria);
  console.log('=================================');

  return result;
}

/**
 * Função auxiliar para debug - analisa a qualidade do OCR
 */
export function analyzeOCRQuality(ocrText: string): {
  totalLines: number;
  averageLineLength: number;
  hasStructuredData: boolean;
  confidence: 'low' | 'medium' | 'high';
} {
  const lines = ocrText.split('\n').filter((line) => line.trim().length > 0);
  const averageLineLength =
    lines.reduce((sum, line) => sum + line.length, 0) / lines.length;

  // Verificar se tem dados estruturados típicos de recibos
  const hasStructuredData = /(?:total|subtotal|iva|data|nif|€)/i.test(ocrText);

  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (lines.length > 5 && averageLineLength > 10 && hasStructuredData) {
    confidence = 'high';
  } else if (lines.length > 3 && averageLineLength > 5) {
    confidence = 'medium';
  }

  return {
    totalLines: lines.length,
    averageLineLength: Math.round(averageLineLength),
    hasStructuredData,
    confidence,
  };
}

/**
 * Função para reprocessar dados quando a primeira tentativa falha
 */
export function reprocessReceiptData(
  ocrText: string,
  previousResult: ParsedReceiptData,
): ParsedReceiptData {
  // Se alguns dados estão em falta, tentar estratégias alternativas
  const result = { ...previousResult };

  if (!result.merchantName) {
    console.log('🔍 Tentando extração alternativa do comerciante...');
    // Estratégia alternativa: pegar a primeira linha que parece um nome
    const lines = ocrText.split('\n').filter((line) => line.trim().length > 0);
    for (const line of lines.slice(0, 5)) {
      if (line.length > 3 && line.length < 50 && /[a-zA-Z]/.test(line)) {
        result.merchantName = line.trim();

        result.categoria = extractCategory(line.trim(), ocrText);
        if (result.categoria) {
          console.log(
            '🧮 Recalculando IVA para nova categoria:',
            result.categoria,
          );
        }
        console.log(`🏪 Nome alternativo encontrado: "${result.merchantName}"`);
        break;
      }
    }
  }
  return result;
}

//PDF
/**
 * Extrai texto de arquivo PDF usando OCR.space API
 */
export async function extractTextFromPdf(pdfUri: string): Promise<string> {
  console.log('📄 Iniciando extração melhorada de texto do PDF...');

  const base64 = await FileSystem.readAsStringAsync(pdfUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Configuração otimizada para faturas portuguesas
  const createFormData = (engine: string) => {
    const formData = new FormData();
    formData.append('base64Image', `data:application/pdf;base64,${base64}`);
    formData.append('apikey', OCR_API_KEY || 'YOUR_API_KEY_HERE');
    formData.append('language', 'por'); // Português
    formData.append('ocrengine', engine);
    formData.append('scale', 'true');
    formData.append('istable', 'true'); // Bom para estruturas de fatura
    formData.append('detectorientation', 'true');
    formData.append('filetype', 'PDF');

    // Configurações adicionais para melhor qualidade
    if (engine === '2') {
      formData.append('OCRengine', '2'); // Engine 2 para PDFs estruturados
    }

    return formData;
  };

  let engine2ResultText = '';
  let engine1ResultText = '';

  // Tentativa 1: Engine 2 (melhor para documentos estruturados)
  try {
    console.log('⚙️ Tentando extração com Engine 2 (estruturado)...');
    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: createFormData('2'),
    });

    if (response.ok) {
      const result = await response.json();
      if (
        !result.IsErroredOnProcessing &&
        result.ParsedResults?.[0]?.ParsedText
      ) {
        engine2ResultText = result.ParsedResults[0].ParsedText;
        console.log(
          `📄 Engine 2 extraiu ${engine2ResultText.length} caracteres`,
        );
      } else {
        console.warn(
          '⚠️ Engine 2 não extraiu texto ou encontrou erro de processamento.',
        );
      }
    } else {
      console.warn(`⚠️ Engine 2 respondeu com erro HTTP: ${response.status}`);
    }
  } catch (error) {
    console.warn('⚠️ Engine 2 falhou:', error);
  }

  // Se o Engine 2 não produziu um resultado, tentar o Engine 1 como fallback
  if (!engine2ResultText) {
    try {
      console.log('⚙️ Tentando Engine 1 como fallback...');
      const response = await fetch(OCR_API_URL, {
        method: 'POST',
        body: createFormData('1'),
      });

      if (response.ok) {
        const result = await response.json();
        if (
          !result.IsErroredOnProcessing &&
          result.ParsedResults?.[0]?.ParsedText
        ) {
          engine1ResultText = result.ParsedResults[0].ParsedText;
          console.log(
            `📄 Engine 1 extraiu ${engine1ResultText.length} caracteres`,
          );
        } else {
          console.warn(
            '⚠️ Engine 1 não extraiu texto ou encontrou erro de processamento.',
          );
        }
      } else {
        console.warn(`⚠️ Engine 1 respondeu com erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Engine 1 também falhou:', error);
    }
  }

  const finalResult = engine2ResultText || engine1ResultText;

  if (!finalResult) {
    throw new Error(
      'Nenhum texto foi extraído do PDF após todas as tentativas.',
    );
  }

  console.log(
    `✅ Melhor resultado: ${finalResult.length} caracteres extraídos`,
  );

  // Debug: mostra uma prévia do texto extraído
  const preview = finalResult.substring(0, 300).replace(/\n/g, ' ');
  console.log('📝 Prévia do texto extraído:', preview + '...');

  return finalResult;
}

/**
 * Processa dados de recibo específicos para PDFs usando a API da Groq
 */
export async function parsePdfReceiptData(
  ocrText: string,
): Promise<ParsedReceiptData> {
  console.log('🧠 Iniciando análise de PDF com Groq API...');

  const groqResult = await extractDataWithGroq(ocrText);

  const result: ParsedReceiptData = {
    extractedText: ocrText,
    totalValue: groqResult.totalValue ?? null,
    dateDetected: groqResult.dateDetected ?? null,
    merchantName: groqResult.merchantName ?? null,
    categoria: groqResult.categoria ?? null,
    ivaDedutivel: groqResult.ivaDedutivel ?? true, // Default to true for PDFs
    valorTotalIVA: groqResult.valorTotalIVA ?? null,
    confidence: {
      merchant: groqResult.merchantName ? 1 : 0,
      total: groqResult.totalValue ? 1 : 0,
      date: groqResult.dateDetected ? 1 : 0,
    },
  };

  console.log('📊 === RESULTADO FINAL PDF (Groq) ===');
  console.log('🏪 Comerciante:', result.merchantName);
  console.log('💰 Total:', result.totalValue);
  console.log('📅 Data:', result.dateDetected);
  console.log('🎯 Categoria:', result.categoria);
  console.log('=====================================');

  return result;
}
