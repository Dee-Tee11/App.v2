import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

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
}

// Image preprocessing function for better OCR results
async function preprocessImageForOCR(imageUri: string): Promise<string> {
  try {
    // Optimize image for OCR
    const optimizedImage = await manipulateAsync(
      imageUri,
      [
        // Resize to optimal size (OCR works better with medium-sized images)
        { resize: { width: 1200 } },
      ],
      {
        compress: 0.8,
        format: SaveFormat.JPEG,
        base64: false,
      }
    );

    console.log('🖼️ Imagem otimizada para OCR:', optimizedImage.uri);
    return optimizedImage.uri;
  } catch (error) {
    console.error('❌ Erro ao processar imagem:', error);
    // Return original URI if preprocessing fails
    return imageUri;
  }
}

// Extract text from image using OCR
export async function extractTextFromImage(imageUri: string): Promise<any> {
  try {
    // Preprocess the image for better OCR results
    const optimizedImageUri = await preprocessImageForOCR(imageUri);
    
    const base64 = await FileSystem.readAsStringAsync(optimizedImageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const formData = new FormData();
    formData.append('base64Image', `data:image/jpeg;base64,${base64}`);
    formData.append('apikey', OCR_API_KEY || 'YOUR_API_KEY_HERE');
    
    // Optimized OCR settings for Portuguese receipts
    formData.append('language', 'por');
    formData.append('OCREngine', '2');
    formData.append('scale', 'true');
    formData.append('isTable', 'true');
    formData.append('detectOrientation', 'true');
    
    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('📄 Resultado OCR:', result);
    
    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage || 'OCR processing failed');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erro no OCR:', error);
    throw error;
  }
}

// Parse receipt data from OCR text
export function parseReceiptData(ocrText: string): ParsedReceiptData {
  console.log('🔍 A analisar texto OCR:', ocrText);
  
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Enhanced patterns for Portuguese receipts
  const patterns = {
    total: [
      /total[:\s]*€?\s*(\d+[.,]\d{2})/i,
      /total[:\s]*(\d+[.,]\d{2})\s*€?/i,
      /soma[:\s]*€?\s*(\d+[.,]\d{2})/i,
      /importância[:\s]*€?\s*(\d+[.,]\d{2})/i,
      /a\s+pagar[:\s]*€?\s*(\d+[.,]\d{2})/i,
      /montante[:\s]*€?\s*(\d+[.,]\d{2})/i,
      /€\s*(\d+[.,]\d{2})/,
      /(\d+[.,]\d{2})\s*€/,
      /(\d+[.,]\d{2})\s*eur/i,
    ],
    
    date: [
      /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/,
      /(\d{2,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,
      /(\d{1,2})\s+de\s+\w+\s+de\s+(\d{2,4})/i,
    ],
    
    merchant: [
      /^([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ\s&.-]{3,40})/,
      /loja[:\s]*([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ\s&.-]+)/i,
      /estabelecimento[:\s]*([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ\s&.-]+)/i,
    ]
  };

  const result: ParsedReceiptData = {
    extractedText: ocrText,
    totalValue: null,
    dateDetected: null,
    merchantName: null,
  };

  // Search for total amount
  const totalValue = extractTotalValue(ocrText);
  if (totalValue) {
    result.totalValue = totalValue;
  }

  // Search for date
  const dateDetected = extractDate(ocrText);
  if (dateDetected) {
    result.dateDetected = dateDetected;
  }

  // Search for merchant name
  const merchantName = extractMerchantName(ocrText);
  if (merchantName) {
    result.merchantName = merchantName;
  }

  console.log('📊 Dados extraídos:', result);
  return result;
}

function extractMerchantName(text: string): string | null {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Patterns to skip (common receipt elements that aren't merchant names)
  const skipPatterns = [
    /\d{3}-\d{3}-\d{3}/, // Portuguese tax ID (NIF)
    /\d{9}/, // Long numbers
    /contribuinte/i,
    /nif/i,
    /morada/i,
    /endereço/i,
    /telefone/i,
    /telef/i,
    /email/i,
    /@/,
    /www\./i,
    /\.pt$/i,
    /\.com$/i,
    /http/i,
    /total/i,
    /subtotal/i,
    /€/,
    /data/i,
    /hora/i,
    /\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}/, // Date patterns
  ];
  
  // Search in first 5 lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    
    // Skip lines that match patterns to avoid
    if (skipPatterns.some(pattern => pattern.test(line))) continue;
    if (line.length < 3 || line.length > 50) continue;
    
    // Check if line has enough letters (likely to be a merchant name)
    const letterCount = (line.match(/[a-záàâãéêíóôõúç]/gi) || []).length;
    if (letterCount >= 3) {
      console.log('🏪 Nome do estabelecimento encontrado:', line);
      return line;
    }
  }
  
  return null;
}

function extractTotalValue(text: string): number | null {
  // Portuguese-specific patterns for total amounts
  const patterns = [
    // Patterns with Portuguese words
    /total[:\s]+€?[\s]*([0-9]+[.,][0-9]{2})/gi,
    /soma[:\s]+€?[\s]*([0-9]+[.,][0-9]{2})/gi,
    /montante[:\s]+€?[\s]*([0-9]+[.,][0-9]{2})/gi,
    /valor[:\s]+(total|final)?[:\s]*€?[\s]*([0-9]+[.,][0-9]{2})/gi,
    /a\s+pagar[:\s]+€?[\s]*([0-9]+[.,][0-9]{2})/gi,
    /subtotal[:\s]+€?[\s]*([0-9]+[.,][0-9]{2})/gi,
    /importância[:\s]+€?[\s]*([0-9]+[.,][0-9]{2})/gi,
    
    // Patterns with euro symbol
    /€[\s]*([0-9]+[.,][0-9]{2})/g,
    /([0-9]+[.,][0-9]{2})[\s]*€/g,
    /([0-9]+[.,][0-9]{2})[\s]*eur/gi,
    
    // Generic patterns (as fallback)
    /([0-9]+[.,][0-9]{2})/g,
  ];

  const amounts: number[] = [];

  for (const pattern of patterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      // Find the number in the match groups
      const numberStr = match.find(group => group && /^[0-9]+[.,][0-9]{2}$/.test(group));
      if (numberStr) {
        const amount = parseFloat(numberStr.replace(',', '.'));
        if (!isNaN(amount) && amount > 0 && amount < 10000) { // Reasonable limit
          amounts.push(amount);
        }
      }
    }
  }

  // Debug: Show all found amounts
  console.log('💰 Valores encontrados:', amounts);

  // Return the highest amount found (likely to be the total)
  return amounts.length > 0 ? Math.max(...amounts) : null;
}

function extractDate(text: string): string | null {
  // Common date patterns for Portuguese format
  const patterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g, // DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2}\s+de\s+\w+\s+de\s+\d{2,4})/gi, // DD de MMMM de YYYY
    /(\d{1,2}\s+\w+\s+\d{2,4})/g, // DD MMMM YYYY
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const dateStr = match[0];
        
        // Handle Portuguese date format
        let date: Date;
        if (dateStr.includes('/') || dateStr.includes('-') || dateStr.includes('.')) {
          // Handle DD/MM/YYYY format
          const parts = dateStr.split(/[\/\-\.]/);
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Month is 0-indexed
            let year = parseInt(parts[2]);
            
            // Handle 2-digit years
            if (year < 100) {
              year += year < 50 ? 2000 : 1900;
            }
            
            date = new Date(year, month, day);
          } else {
            continue;
          }
        } else {
          // Try parsing other formats
          date = new Date(dateStr);
        }
        
        if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
          console.log('📅 Data encontrada:', dateStr, '-> Convertida para:', date.toISOString().split('T')[0]);
          return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
        }
      } catch (error) {
        console.error('Erro ao processar data:', error);
        // Continue to next pattern
      }
    }
  }

  return null;
}