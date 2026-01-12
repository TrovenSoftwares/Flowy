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
}

/**
 * Calls Groq API to extract financial data from message content.
 * Uses Llama 3.3 70B for high-quality extraction.
 */
export async function extractFinancialDataWithAI(
    apiKey: string, // API Key First
    content: string,
    categories: { id: string; name: string }[],
    accounts: { id: string; name: string }[],
    clients: { id: string; name: string }[] = []
): Promise<GroqExtractionResult | null> {
    if (!apiKey || !content) return null;

    const categoryList = categories.map(c => c.name).join(', ');
    const accountList = accounts.map(a => a.name).join(', ');
    const clientList = clients.map(c => c.name).join(', ');

    const prompt = `
    Extract financial data from the following message.
    Message: "${content}"

    Lists:
    - Categories: [${categoryList}]
    - Accounts: [${accountList}]
    - Clients: [${clientList}]

    Instructions:
    1. Value: Total monetary value.
    2. Type: 'income' or 'expense'.
    3. Classification: 'sale' (if it sells a product), 'transaction' (payment/receipt), or 'discard'.
    4. Category: Exact name from list.
    5. Description: Short summary.
    6. Date: YYYY-MM-DD.
    7. Account: Exact name from list.
    8. Weight: Numeric only (e.g. 10).
    9. Shipping: Shipping cost.
    10. Client: Exact name from Clients list if found.

    Return JSON:
    {
      "value": "00.00",
      "type": "income/expense",
      "classification": "sale/transaction/discard",
      "category_name": "exact_string_match",
      "description": "string",
      "date": "YYYY-MM-DD",
      "account_name": "exact_string_match",
      "weight": "string",
      "shipping": "string",
      "client_name": "exact_string_match"
    }
  `;

    // Helper to perform the fetch
    const doFetch = async (url: string, headers: any, body: any) => {
        try {
            const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            if (!response.ok) return null;
            const data = await response.json();
            return data;
        } catch (e) {
            console.error('AI Fetch Error:', e);
            return null;
        }
    };

    let jsonResult: any = null;

    // 1. Anthropic (Claude)
    if (apiKey.startsWith('sk-ant-')) {
        const data = await doFetch('https://api.anthropic.com/v1/messages', {
            'x-api-key': apiKey,
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
                // Clean markdown code blocks if present
                const cleanText = data.content[0].text.replace(/```json/g, '').replace(/```/g, '');
                jsonResult = JSON.parse(cleanText);
            } catch (e) { console.error('Claude JSON Parse Error', e); }
        }
    }
    // 2. OpenAI
    else if (apiKey.startsWith('sk-')) {
        const data = await doFetch('https://api.openai.com/v1/chat/completions', {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }, {
            model: 'gpt-4o', // Upgraded to 4o as per user hint
            messages: [
                { role: 'system', content: 'You are a financial assistant. Return JSON only.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        });
        if (data && data.choices) {
            jsonResult = JSON.parse(data.choices[0]?.message?.content || '{}');
        }
    }
    // 3. Groq (Default)
    else {
        const data = await doFetch('https://api.groq.com/openai/v1/chat/completions', {
            'Authorization': `Bearer ${apiKey}`,
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
            jsonResult = JSON.parse(data.choices[0]?.message?.content || '{}');
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
