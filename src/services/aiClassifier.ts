import { GoogleGenAI } from '@google/genai';

export interface AIClassificationResult {
  category: 'OTP' | 'SPAM' | 'BANCO' | 'CLIENTE' | 'SISTEMA' | 'OUTRO';
  confidence: number;
  summary: string;
  entities: {
    bank?: string;
    amount?: string;
    sender?: string;
    code?: string;
    reference?: string;
  };
  classifiedBy: 'GEMINI_2.5_FLASH' | 'HEURISTIC_RULE_ENGINE';
}

// Client-side & Fallback Heuristic Classifier (runs fast offline or when Gemini key is absent)
export function classifyEventHeuristically(
  text: string,
  title?: string,
  sender?: string
): AIClassificationResult {
  const content = `${sender || ''} ${title || ''} ${text}`.toUpperCase();

  // 1. BANCO (BAI, BFA, BIC, ProxyPay, Multicaixa, etc.)
  if (
    content.includes('BAI') ||
    content.includes('BFA') ||
    content.includes('BIC') ||
    content.includes('BANCO') ||
    content.includes('PROXYPAY') ||
    content.includes('MULTICAIXA') ||
    content.includes('EXPRESS') ||
    content.includes('TRANSFERENCIA') ||
    content.includes('PAGAMENTO') ||
    content.includes('SALDO') ||
    content.includes('IBAN')
  ) {
    let bank = 'BANCO';
    if (content.includes('BAI')) bank = 'BAI';
    else if (content.includes('BFA')) bank = 'BFA';
    else if (content.includes('BIC')) bank = 'BIC';
    else if (content.includes('PROXYPAY')) bank = 'PROXYPAY';

    // Extract amount if present (e.g. 50.000 Kz or 50000.00 KZ)
    const amountMatch = content.match(/(\d+[\d.,]*\s*(KZ|AOA|EUR|USD))/i) || content.match(/((KZ|AOA)\s*\d+[\d.,]*)/i);

    return {
      category: 'BANCO',
      confidence: 0.96,
      summary: `Notificação bancária/financeira (${bank})`,
      entities: {
        bank,
        amount: amountMatch ? amountMatch[0] : undefined,
        sender: sender || undefined
      },
      classifiedBy: 'HEURISTIC_RULE_ENGINE'
    };
  }

  // 2. OTP / Código de Verificação
  if (
    content.includes('CÓDIGO') ||
    content.includes('CODIGO') ||
    content.includes('OTP') ||
    content.includes('VERIFICAÇÃO') ||
    content.includes('VERIFICACAO') ||
    content.includes('SENHA') ||
    content.includes('CONFIRMAÇÃO') ||
    content.includes('CONFIRMACAO') ||
    /\b\d{4,8}\b/.test(content)
  ) {
    const codeMatch = content.match(/\b\d{4,8}\b/);
    return {
      category: 'OTP',
      confidence: 0.95,
      summary: 'Código de verificação ou autenticação OTP',
      entities: {
        code: codeMatch ? codeMatch[0] : undefined,
        sender: sender || undefined
      },
      classifiedBy: 'HEURISTIC_RULE_ENGINE'
    };
  }

  // 3. SPAM / Oferta
  if (
    content.includes('GANHE') ||
    content.includes('PROMOÇÃO') ||
    content.includes('PROMOCAO') ||
    content.includes('BÓNUS') ||
    content.includes('APOSTA') ||
    content.includes('DESCONTO') ||
    content.includes('APROVEITE')
  ) {
    return {
      category: 'SPAM',
      confidence: 0.88,
      summary: 'Mensagem promocional ou spam em potencial',
      entities: { sender: sender || undefined },
      classifiedBy: 'HEURISTIC_RULE_ENGINE'
    };
  }

  // 4. CLIENTE
  if (sender && !sender.match(/^\d{3,5}$/)) {
    return {
      category: 'CLIENTE',
      confidence: 0.85,
      summary: 'Comunicação direta de contacto/cliente',
      entities: { sender },
      classifiedBy: 'HEURISTIC_RULE_ENGINE'
    };
  }

  // 5. SISTEMA / OUTRO
  return {
    category: 'SISTEMA',
    confidence: 0.75,
    summary: 'Evento de sistema ou notificação geral',
    entities: { sender: sender || undefined },
    classifiedBy: 'HEURISTIC_RULE_ENGINE'
  };
}

// Server-side Gemini AI Classifier using @google/genai
export async function classifyWithGeminiServer(
  apiKey: string,
  text: string,
  title?: string,
  sender?: string
): Promise<AIClassificationResult> {
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    return classifyEventHeuristically(text, title, sender);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Você é um classificador especializado em mensagens e notificações de telecomunicações e bancos em Angola (BAI, BFA, BIC, Millennium, ProxyPay, Multicaixa Express).
Classifique o texto a seguir em uma das categorias exatas: OTP, SPAM, BANCO, CLIENTE, SISTEMA.

Remetente: ${sender || 'N/A'}
Título: ${title || 'N/A'}
Conteúdo: ${text}

Responda ESTRITAMENTE em formato JSON sem markdown:
{
  "category": "OTP|SPAM|BANCO|CLIENTE|SISTEMA",
  "confidence": 0.98,
  "summary": "Resumo curto em 1 frase em português",
  "entities": {
    "bank": "nome do banco se houver",
    "amount": "valor monetário se houver",
    "sender": "nome do remetente",
    "code": "código OTP de verificação se houver"
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const rawText = response.text || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      category: parsed.category || 'SISTEMA',
      confidence: parsed.confidence || 0.9,
      summary: parsed.summary || 'Classificado via Gemini AI',
      entities: parsed.entities || {},
      classifiedBy: 'GEMINI_2.5_FLASH'
    };
  } catch (error) {
    console.warn('[GeminiClassifier] Fallback para heurística local devido a erro:', error);
    return classifyEventHeuristically(text, title, sender);
  }
}
