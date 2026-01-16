export interface GroqExtractionResult {
    value: string;
    type: 'income' | 'expense';
    classification: 'transaction' | 'sale' | 'discard';
    category_id: string;
    category_name: string;
    description: string;
    date?: string;
    account_id: string;
    account_name?: string;
    weight?: string;
    shipping?: string;
    client_id: string;
    client_name?: string;
    seller?: string;
    dev_code?: string;
    suggested_category?: string;
}

const GLOBAL_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GLOBAL_CLAUDE_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const GLOBAL_OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const GLOBAL_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/**
 * Calls AI APIs to extract financial data from message content.
 * Follows a sequential fallback logic: Groq -> Claude -> Gemini -> GPT.
 */
export async function extractFinancialDataWithAI(
    _apiKey: string | null | undefined, // Legacy param, ignored now for standardization
    content: string,
    categories: { id: string; name: string }[],
    accounts: { id: string; name: string }[],
    clients: { id: string; name: string }[] = []
): Promise<GroqExtractionResult | null> {
    if (!content) return null;

    const categoryList = categories.map(c => c.name).join(', ');
    const accountList = accounts.map(a => a.name).join(', ');
    const clientList = clients.map(c => c.name).join(', ');

    const prompt = `
    Você é um assistente financeiro especializado em classificar mensagens.
    
    Mensagem: "${content}"

    Listas disponíveis:
    - Categorias: [${categoryList}]
    - Contas bancárias: [${accountList}]
    - Clientes: [${clientList}]

    REGRAS DE CLASSIFICAÇÃO:
    
    1. "sale" (VENDA): Use quando a mensagem falar sobre:
       - Venda de produtos, mercadorias ou serviços
       - Pedidos de clientes, encomendas
       - Orçamentos, propostas comerciais
       - Palavras-chave: "venda", "vendeu", "pedido", "encomenda", "cliente comprou"
    
    2. "transaction" (RECEITA/DESPESA): Use quando a mensagem falar sobre:
       - Pagamentos recebidos (PIX, transferência, boleto) ou "Tipo: Receita" = type: "income"
       - Palavras-chave RECEITA: "entrada", "recebimento", "receita", "entrou", "recebi"
       - Pagamentos efetuados, gastos, despesas = type: "expense"
       - Palavras-chave DESPESA: "despesa", "saiu", "pagamento", "saida", "peguei"
       - Contas a pagar/receber
       - Palavras-chave GERAIS: "paguei", "gasto", "transferi", "pix"
    
    3. "discard" (IGNORAR): Use quando a mensagem:
       - NÃO contém informações financeiras
       - É apenas conversa casual, saudações, perguntas
       - Não menciona valores monetários, vendas ou pagamentos

    EXTRAIA:
    - value: Valor monetário numérico (ex: "1234.56"). IMPORTANTE: Converta formato BR (1.234,56) para US (1234.56). Se "100002", assuma 100002.00.
    - type: "income" (dinheiro recebido) ou "expense" (dinheiro pago)
    - classification: "sale", "transaction" ou "discard"
    - category_name: Nome exato da lista. Deixe vazio se não encontrar match exato.
    - suggested_category: Se category_name for vazio, sugira uma categoria contextual (ex: "Receitas", "Produtos").
    - description: Gere uma descrição completa baseada no contexto, INCLUINDO explicitamente o valor formatado (R$ X,XX). Ex: "Pagamento de R$ 500,00 ref. aluguel", "Recebimento de R$ 1.250,50 de Cliente Y".
    - date: Extraia qualquer data no formato DD/MM/YY ou DD/MM/YYYY e converta OBRIGATORIAMENTE para YYYY-MM-DD. Ex: "14/12/25" -> "2025-12-14". Ignore a data atual do servidor se houver data na mensagem.
    - account_name: Nome exato da lista de contas
    - weight: Peso se mencionado (apenas número)
    - shipping: Valor do frete se mencionado
    - client_name: Nome exato do cliente da lista
    - seller: Nome do vendedor se mencionado na mensagem
    - dev_code: Código de devolução se mencionado (ex: "Cód. Dev: 123")

    Retorne APENAS JSON:
    {
      "value": "00.00",
      "type": "income",
      "classification": "transaction",
      "category_name": "",
      "description": "",
      "date": "YYYY-MM-DD",
      "account_name": "",
      "weight": "",
      "shipping": "",
      "client_name": "",
      "seller": "",
      "dev_code": "",
      "suggested_category": ""
    }
  `;

    const doFetch = async (url: string, headers: any, body: any) => {
        try {
            const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            if (!response.ok) return null;
            return await response.json();
        } catch (e) {
            console.error('AI Fetch Error:', e);
            return null;
        }
    };

    let jsonResult: any = null;

    // --- FALLBACK SEQUENCE ---

    // 1. GROQ (Priority 1)
    if (!jsonResult && GLOBAL_GROQ_KEY) {
        const data = await doFetch('https://api.groq.com/openai/v1/chat/completions', {
            'Authorization': `Bearer ${GLOBAL_GROQ_KEY}`,
            'Content-Type': 'application/json'
        }, {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are a financial assistant. Return JSON only.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        });
        if (data && data.choices) {
            try {
                jsonResult = JSON.parse(data.choices[0]?.message?.content || '{}');
            } catch (e) { console.error('Groq JSON Parse Error', e); }
        }
    }

    // 2. CLAUDE (Priority 2)
    if (!jsonResult && GLOBAL_CLAUDE_KEY) {
        const data = await doFetch('https://api.anthropic.com/v1/messages', {
            'x-api-key': GLOBAL_CLAUDE_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        }, {
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1024,
            messages: [
                { role: 'user', content: prompt + "\n\nReturn ONLY raw JSON, no markdown formatting." }
            ]
        });
        if (data && data.content && data.content[0]?.text) {
            try {
                const cleanText = data.content[0].text.replace(/```json/g, '').replace(/```/g, '');
                jsonResult = JSON.parse(cleanText);
            } catch (e) { console.error('Claude JSON Parse Error', e); }
        }
    }

    // 3. GEMINI (Priority 3)
    if (!jsonResult && GLOBAL_GEMINI_KEY) {
        const data = await doFetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GLOBAL_GEMINI_KEY}`, {
            'Content-Type': 'application/json'
        }, {
            contents: [{
                parts: [{ text: prompt + "\n\nReturn ONLY raw JSON, no markdown formatting." }]
            }],
            generationConfig: {
                response_mime_type: "application/json"
            }
        });
        if (data && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            try {
                const cleanText = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '');
                jsonResult = JSON.parse(cleanText);
            } catch (e) { console.error('Gemini JSON Parse Error', e); }
        }
    }

    // 4. GPT (Priority 4)
    if (!jsonResult && GLOBAL_OPENAI_KEY) {
        const data = await doFetch('https://api.openai.com/v1/chat/completions', {
            'Authorization': `Bearer ${GLOBAL_OPENAI_KEY}`,
            'Content-Type': 'application/json'
        }, {
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'You are a financial assistant. Return JSON only.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        });
        if (data && data.choices) {
            try {
                jsonResult = JSON.parse(data.choices[0]?.message?.content || '{}');
            } catch (e) { console.error('OpenAI JSON Parse Error', e); }
        }
    }

    if (!jsonResult) return null;

    // Map Names to IDs
    const category = categories.find(c => c.name?.toLowerCase() === jsonResult.category_name?.toLowerCase());
    const account = accounts.find(a => a.name?.toLowerCase() === jsonResult.account_name?.toLowerCase());
    const client = clients.find(c => c.name?.toLowerCase() === jsonResult.client_name?.toLowerCase());

    return {
        ...jsonResult,
        category_id: category?.id || '',
        account_id: account?.id || '',
        client_id: client?.id || ''
    };
}
