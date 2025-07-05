/**
 * Extrai a categoria do estabelecimento baseada no nome e texto completo
 * @param merchantName Nome do comerciante extraído
 * @param fullText Texto completo do OCR (opcional, para fallback)
 * @returns Categoria identificada ou null
 */
export function extractCategory(
  merchantName: string,
  fullText?: string,
): string | null {
  console.log('🔍 Nome original recebido:', merchantName);
  console.log('📄 Texto completo disponível:', !!fullText);

  // Se não temos merchantName, tentar extrair do texto completo
  if (!merchantName && fullText) {
    merchantName = attemptMerchantExtractionFromFullText(fullText);
    console.log('🔍 Nome extraído do texto:', merchantName);
  }

  if (!merchantName || merchantName.trim().length === 0) {
    console.log('❌ Nome do comerciante vazio ou inválido');
    return null;
  }

  const nome = merchantName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  console.log('🔡 Nome normalizado:', nome);

  // Categorias expandidas com mais palavras-chave portuguesas
  const keywords = [
    {
      regex:
        /padaria|pao|pastelaria|confeitaria|doces|bolos|croissant|pães|massa folhada/i,
      categoria: 'Padaria',
    },
    {
      regex:
        /churrasque|grelhados|frango|grill|churrasco|assados|franguinho|chicken/i,
      categoria: 'Churrasqueira',
    },
    {
      regex:
        /supermercado|pingo doce|continente|intermarche|lidl|auchan|el corte|minipreco|froiz|jumbo|modelo|recheio/i,
      categoria: 'Supermercado',
    },
    {
      regex: /farmacia|farmácia|saude|medicamento|parafarmacia|wells|holon/i,
      categoria: 'Farmácia',
    },
    {
      regex:
        /cafe|cafetaria|bar|taberna|pub|snack|pastelaria|cafe central|delta|bica|galao/i,
      categoria: 'Café/Bar',
    },
    {
      regex:
        /restaurante|tasca|bistro|marisqueira|pizzaria|hamburguer|comida|refeicao|fast food|mcdonalds|burger|kfc|pizza hut/i,
      categoria: 'Restaurante',
    },
    {
      regex:
        /gasolineira|combustivel|galp|bp|repsol|cepsa|shell|petrogal|posto|gas|gasolina|diesel/i,
      categoria: 'Combustível',
    },
    {
      regex: /talho|acougue|carnes|charcutaria|carniceria/i,
      categoria: 'Talho',
    },
    {
      regex:
        /mercearia|mini mercado|minimercado|loja|conveniencia|24h|vinte quatro/i,
      categoria: 'Mercearia',
    },
    {
      regex: /papelaria|livraria|material|escritorio|escolar|fnac|bertrand/i,
      categoria: 'Papelaria/Livraria',
    },
    {
      regex:
        /telecomunicacoes|vodafone|meo|nos|optimus|tmn|telefone|internet|worten|radio popular/i,
      categoria: 'Telecomunicações',
    },
    {
      regex:
        /banco|atm|multibanco|caixa|credito|debito|transferencia|cgd|millennium|santander|bpi/i,
      categoria: 'Serviços Bancários',
    },
    {
      regex: /sapataria|calcado|sapatos|tenis|botas|sport zone|decathlon/i,
      categoria: 'Calçado',
    },
    {
      regex:
        /roupa|vestuario|moda|textil|zara|h&m|pull|massimo|primark|inditex/i,
      categoria: 'Vestuário',
    },
    {
      regex:
        /clinica|medico|dentista|otica|oculista|saude|hospital|centro de saude/i,
      categoria: 'Saúde',
    },
    {
      regex: /hotel|pousada|alojamento|turismo|viagem|booking|airbnb/i,
      categoria: 'Alojamento',
    },
    {
      regex:
        /taxi|uber|bolt|transporte|viagem|autocarro|comboio|cp|carris|metro/i,
      categoria: 'Transporte',
    },
    {
      regex: /cabeleireiro|barbeiro|estetica|beleza|manicure|spa|salao/i,
      categoria: 'Beleza/Estética',
    },
    {
      regex: /veterinario|animais|pet shop|ração|veterinaria/i,
      categoria: 'Veterinário/Animais',
    },
    {
      regex: /correios|ctt|dhl|ups|fedex|envio|encomenda/i,
      categoria: 'Correios/Envios',
    },
  ];

  // Primeiro, tentar match direto no nome
  for (const { regex, categoria } of keywords) {
    if (regex.test(nome)) {
      console.log(
        `✅ Categoria identificada: "${categoria}" com regex ${regex} no nome`,
      );
      return categoria;
    }
  }

  // Se não encontrou no nome, tentar no texto completo (se disponível)
  if (fullText) {
    console.log('🔍 Tentando identificar categoria no texto completo...');
    const fullTextNormalized = fullText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    for (const { regex, categoria } of keywords) {
      if (regex.test(fullTextNormalized)) {
        console.log(
          `✅ Categoria identificada: "${categoria}" com regex ${regex} no texto completo`,
        );
        return categoria;
      }
    }
  }

  // Tentar categorização por padrões específicos no nome
  const categoryByPattern = categorizeBySimilarity(nome);
  if (categoryByPattern) {
    console.log(
      `✅ Categoria identificada por similaridade: "${categoryByPattern}"`,
    );
    return categoryByPattern;
  }

  console.log('⚠️ Nenhuma categoria encontrada para:', nome);
  console.log('📋 Sugestão: Adicionar palavra-chave para este estabelecimento');
  return null;
}

/**
 * Tenta extrair o nome do comerciante do texto completo quando não foi identificado
 */
function attemptMerchantExtractionFromFullText(fullText: string): string {
  const lines = fullText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  console.log(
    '🔍 Tentando extrair merchant das primeiras linhas:',
    lines.slice(0, 5),
  );

  // Procurar por padrões típicos de nomes de estabelecimentos
  for (const line of lines.slice(0, 8)) {
    // Verificar apenas as primeiras 8 linhas
    // Linhas que parecem ser nomes de estabelecimentos
    if (line.length > 3 && line.length < 60) {
      // Evitar linhas que são claramente outros dados
      if (
        !/^\d+[.,]\d{2}/.test(line) && // Não é um preço
        !/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(line) && // Não é uma data
        !/^N\.I\.F|^Tel|^Morada|^Mesa|^Fatura|^Recibo|^Data:|^Hora:/i.test(
          line,
        ) && // Não são labels
        !/^\d{9}/.test(line) && // Não é um NIF
        !/^[*]{3,}/.test(line) && // Não são separadores
        !/^_{3,}/.test(line) && // Não são separadores
        !/^-{3,}/.test(line)
      ) {
        // Não são separadores

        // Se a linha tem palavras significativas e não é só números
        if (/[a-zA-Z]/.test(line) && line.split(' ').length <= 6) {
          console.log(`💡 Possível nome encontrado na linha: "${line}"`);
          return line;
        }
      }
    }
  }

  console.log('❌ Não foi possível extrair nome do texto completo');
  return '';
}

/**
 * Categorização por padrões estruturais e similaridade
 */
function categorizeBySimilarity(nome: string): string | null {
  // Padrões mais específicos baseados em estrutura do nome
  const patterns = [
    { pattern: /lda|limitada|sa|sociedade/i, categoria: 'Empresa' },
    { pattern: /unipessoal/i, categoria: 'Empresa' },
    { pattern: /\d{4,}/, categoria: null }, // Números longos geralmente não são nomes úteis
    { pattern: /^.{1,3}$/, categoria: null }, // Nomes muito curtos provavelmente são erro
  ];

  for (const { pattern, categoria } of patterns) {
    if (pattern.test(nome)) {
      return categoria;
    }
  }

  return null;
}

/**
 * Função auxiliar para debug - mostra categorias disponíveis
 */
export function getAvailableCategories(): string[] {
  return [
    'Padaria',
    'Churrasqueira',
    'Supermercado',
    'Farmácia',
    'Café/Bar',
    'Restaurante',
    'Combustível',
    'Talho',
    'Mercearia',
    'Papelaria/Livraria',
    'Telecomunicações',
    'Serviços Bancários',
    'Calçado',
    'Vestuário',
    'Saúde',
    'Alojamento',
    'Transporte',
    'Beleza/Estética',
    'Veterinário/Animais',
    'Correios/Envios',
  ];
}
