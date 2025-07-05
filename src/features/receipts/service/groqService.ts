
import { ParsedReceiptData } from './ocrService';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Extracts structured data from receipt text using the Groq API.
 *
 * @param text The raw text extracted from a receipt.
 * @returns A promise that resolves to the parsed receipt data.
 */
export async function extractDataWithGroq(
  text: string,
): Promise<Partial<ParsedReceiptData>> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is not configured. Please set EXPO_PUBLIC_GROQ_API_KEY.');
  }

  console.log('🧠 Calling Groq API to extract receipt data...');

  // Prompt para o LLM
  const prompt = `
    Analisa o seguinte texto de um recibo e extrai as informações especificadas.
    Devolve os dados como um objeto JSON válido. Se um valor não for encontrado, devolve null para esse campo.

    - merchantName: O nome da loja ou comerciante.
    - totalValue: O valor total da compra (como um número).
    - dateDetected: A data da transação no formato AAAA-MM-DD.
    - categoria: A categoria da despesa (ex: "Restaurante", "Supermercado", "Transporte").
    - ivaDedutivel: Um booleano que indica se o IVA é dedutível (true/false).
    - valorTotalIVA: O valor total do IVA (como um número).

    Texto do Recibo:
    """
    ${text}
    """

    Saída JSON:
  `;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Or another model you prefer
        messages: [
          {
            role: 'system',
            content: 'És um assistente especialista em extração de dados de recibos. A tua resposta deve ser apenas um objeto JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Groq API Error Response:', errorBody);
      throw new Error(`Groq API request failed with status ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Groq API returned an empty response.');
    }

    console.log('✅ Groq API Response:', content);

    // Extrair o objeto JSON do texto de resposta
    const jsonMatch = content.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('Groq API did not return a valid JSON object.');
    }

    const jsonString = jsonMatch[0];
    const parsedJson = JSON.parse(jsonString);

    // Map the response to the ParsedReceiptData interface
    const extractedData: Partial<ParsedReceiptData> = {
      merchantName: parsedJson.merchantName || null,
      totalValue: parsedJson.totalValue ? Number(parsedJson.totalValue) : null,
      dateDetected: parsedJson.dateDetected || null,
      categoria: parsedJson.categoria || null,
      ivaDedutivel: parsedJson.ivaDedutivel || false,
      valorTotalIVA: parsedJson.valorTotalIVA ? Number(parsedJson.valorTotalIVA) : null,
      extractedText: text, // Include the original text
    };

    return extractedData;

  } catch (error) {
    console.error('❌ Error calling Groq API:', error);
    // In case of an error, return an empty object or re-throw
    throw error;
  }
}
