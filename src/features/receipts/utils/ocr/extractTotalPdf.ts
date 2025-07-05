/**
 * Limpa e converte uma string de moeda para um número.
 * Versão otimizada para TOTAL A PAGAR especificamente.
 */
function parseCurrency(valueStr: string): number | null {
  if (!valueStr) return null;

  console.log(`🔍 Processando valor: "${valueStr}"`);

  // Correção de erros comuns de OCR
  let cleanStr = valueStr
    .replace(/O/gi, '0')
    .replace(/o(?=\d)/gi, '0')
    .replace(/l/gi, '1')
    .replace(/I/gi, '1')
    .replace(/S/gi, '5')
    .replace(/\$/gi, 'S')
    .replace(/\(/gi, '')
    .replace(/\)/gi, '');

  // Remove símbolos de moeda e espaços
  cleanStr = cleanStr
    .replace(/€|EUR|EURO/gi, '')
    .replace(/\s+/g, '')
    .trim();

  console.log(`🧹 Após limpeza: "${cleanStr}"`);

  if (!cleanStr) return null;

  // Se não contém separadores decimais
  if (!/[.,]/.test(cleanStr)) {
    const num = parseFloat(cleanStr);
    return isNaN(num) ? null : num;
  }

  const lastComma = cleanStr.lastIndexOf(',');
  const lastDot = cleanStr.lastIndexOf('.');

  let processedStr = cleanStr;

  if (lastComma > -1 && lastDot === -1) {
    // Apenas vírgula - formato português
    const afterComma = cleanStr.substring(lastComma + 1);
    if (afterComma.length === 2 && /^\d{2}$/.test(afterComma)) {
      processedStr = cleanStr.replace(',', '.');
    } else {
      processedStr = cleanStr.replace(/,/g, '');
    }
  } else if (lastDot > -1 && lastComma === -1) {
    // Apenas ponto
    const afterDot = cleanStr.substring(lastDot + 1);
    if (afterDot.length === 2 && /^\d{2}$/.test(afterDot)) {
      processedStr = cleanStr;
    } else {
      processedStr = cleanStr.replace(/\./g, '');
    }
  } else if (lastComma > -1 && lastDot > -1) {
    // Ambos presentes
    if (lastComma > lastDot) {
      // Formato português: 1.234,56
      processedStr = cleanStr.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato inglês: 1,234.56
      processedStr = cleanStr.replace(/,/g, '');
    }
  }

  const num = parseFloat(processedStr);
  console.log(`✅ Resultado: ${num}`);
  return isNaN(num) ? null : num;
}

/**
 * Extrai especificamente o TOTAL A PAGAR de uma fatura portuguesa.
 * Versão focada e otimizada para esse valor específico.
 */
export function extractTotalPdf(
  text: string,
  lines: string[],
): { value: number | null; confidence: number } {
  console.log('💰 Extraindo TOTAL A PAGAR...');

  const candidates: Array<{
    value: number;
    confidence: number;
    method: string;
  }> = [];

  // Normalizar texto
  const normalizedText = text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim();

  // Padrões específicos para TOTAL A PAGAR (do mais específico ao mais geral)
  const patterns = [
    {
      name: 'TOTAL A PAGAR - Exato',
      regex: /TOTAL\s+A\s+PAGAR\s*:?\s*([€]?\s*[\d.,OolI]+)\s*[€]?/gi,
      confidence: 98,
    },
    {
      name: 'TOTAL A PAGAR - Tolerante',
      regex: /TOTAL\s+A\s+PAGAR.*?([€]?\s*[\d.,OolI]+)\s*[€]?/gi,
      confidence: 95,
    },
    {
      name: 'A PAGAR',
      regex: /A\s+PAGAR\s*:?\s*([€]?\s*[\d.,OolI]+)\s*[€]?/gi,
      confidence: 85,
    },
  ];

  // Buscar com padrões regex
  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;
    const matches = [...normalizedText.matchAll(pattern.regex)];

    for (const match of matches) {
      if (match && match[1]) {
        const rawValue = match[1].replace(/\s+/g, '');
        const value = parseCurrency(rawValue);

        if (value !== null && value > 0) {
          candidates.push({
            value,
            confidence: pattern.confidence,
            method: pattern.name,
          });
          console.log(`✅ ${pattern.name}: ${value}€`);
        }
      }
    }
  }

  // Busca linha por linha - ESTRATÉGIA PRINCIPAL
  console.log('🔍 Busca linha por linha...');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Procurar linha com "TOTAL A PAGAR"
    if (/TOTAL\s+A\s+PAGAR/i.test(line)) {
      console.log(`📄 Linha encontrada: "${line}"`);

      // Tentar extrair valor da mesma linha
      const sameLine = line.match(
        /TOTAL\s+A\s+PAGAR\s*:?\s*([€]?\s*[\d.,OolI]+)\s*[€]?/i,
      );
      if (sameLine && sameLine[1]) {
        const value = parseCurrency(sameLine[1]);
        if (value !== null && value > 0) {
          candidates.push({
            value,
            confidence: 95,
            method: 'Mesma linha',
          });
          console.log(`✅ Valor na mesma linha: ${value}€`);
        }
      }

      // Se não encontrou na mesma linha, procurar nas próximas 3 linhas
      if (!sameLine || !sameLine[1]) {
        for (let j = 1; j <= 3 && i + j < lines.length; j++) {
          const nextLine = lines[i + j].trim();
          console.log(`📄 Verificando linha +${j}: "${nextLine}"`);

          // Procurar valor no início da linha (mais provável)
          const nextLineMatch = nextLine.match(/^([€]?\s*[\d.,OolI]+)\s*[€]?/);
          if (nextLineMatch && nextLineMatch[1]) {
            const value = parseCurrency(nextLineMatch[1]);
            if (value !== null && value > 0) {
              candidates.push({
                value,
                confidence: 92 - j * 2, // Reduz confiança conforme distância
                method: `Linha +${j}`,
              });
              console.log(
                `✅ Valor encontrado ${j} linha(s) depois: ${value}€`,
              );
              break; // Para na primeira linha que encontrar um valor válido
            }
          }

          // Procurar valor em qualquer lugar da linha
          const anywhereMatch = nextLine.match(/([€]?\s*[\d.,OolI]+)\s*[€]?/);
          if (anywhereMatch && anywhereMatch[1] && !nextLineMatch) {
            const value = parseCurrency(anywhereMatch[1]);
            if (value !== null && value > 0) {
              candidates.push({
                value,
                confidence: 88 - j * 3,
                method: `Linha +${j} (meio)`,
              });
              console.log(`✅ Valor no meio da linha +${j}: ${value}€`);
            }
          }
        }
      }
    }
  }

  // Fallback: procurar valores razoáveis próximos a "PAGAR"
  if (candidates.length === 0) {
    console.log('🔍 Fallback: procurando valores próximos a PAGAR...');

    const pagarMatches = [
      ...normalizedText.matchAll(/PAGAR.*?([€]?\s*[\d.,OolI]+)\s*[€]?/gi),
    ];
    for (const match of pagarMatches) {
      const value = parseCurrency(match[1]);
      if (value !== null && value > 0 && value < 100000) {
        // Valor razoável
        candidates.push({
          value,
          confidence: 70,
          method: 'Próximo a PAGAR',
        });
        console.log(`⚠️ Fallback - valor próximo a PAGAR: ${value}€`);
      }
    }
  }

  if (candidates.length === 0) {
    console.log('❌ Nenhum valor TOTAL A PAGAR encontrado');
    return { value: null, confidence: 0 };
  }

  // Ordenar por confiança
  candidates.sort((a, b) => b.confidence - a.confidence);

  console.log('📊 Candidatos encontrados:');
  candidates.forEach((candidate, index) => {
    console.log(
      `  ${index + 1}. ${candidate.value}€ (${candidate.confidence}%) - ${candidate.method}`,
    );
  });

  const best = candidates[0];
  console.log(
    `🏆 TOTAL A PAGAR selecionado: ${best.value}€ (${best.confidence}%)`,
  );

  return {
    value: best.value,
    confidence: best.confidence,
  };
}
