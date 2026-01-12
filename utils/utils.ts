/**
 * Fetches data from BrasilAPI for a given CNPJ or CPF.
 * Currently supports CNPJ fetching.
 */
export const fetchCompanyData = async (cnpj: string) => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return null;

    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error fetching CNPJ data:', error);
        return null;
    }
};

/**
 * Common masks for Brazilian formats
 */
export const MASKS = {
    CPF: '000.000.000-00',
    CNPJ: '00.000.000/0000-00',
    PHONE: [
        { mask: '(00) 0000-0000' },
        { mask: '(00) 00000-0000' }
    ],
    CEP: '00000-000',
    CURRENCY: {
        mask: 'R$ num',
        blocks: {
            num: {
                mask: Number,
                thousandsSeparator: '.',
                padFractionalZeros: true,
                normalizeZeros: true,
                radix: ',',
                mapToRadix: ['.']
            }
        }
    }
};

/**
 * Safely formats a YYYY-MM-DD date string to DD/MM/YYYY
 */
export const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    // Supabase date columns return "YYYY-MM-DD"
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
};
/**
 * Formats a CPF or CNPJ for display
 */
export const formatCpfCnpj = (id_number: string) => {
    if (!id_number) return '-';
    const clean = id_number.replace(/\D/g, '');
    if (clean.length === 11) {
        return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (clean.length === 14) {
        return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return id_number;
};

/**
 * Formats a phone number for display
 */
export const formatPhone = (phone: string) => {
    if (!phone) return '-';
    let clean = phone.replace(/\D/g, '');

    // If it starts with 55 and has 12 or 13 digits, likely remove 55 for display 
    // or format including it? User wants "Standardise".
    // Usually local users expect (11) 9...
    // Let's strip 55 if it's there for display purposes to match mask
    if ((clean.length === 12 || clean.length === 13) && clean.startsWith('55')) {
        clean = clean.substring(2);
    }

    if (clean.length === 10) {
        return clean.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    } else if (clean.length === 11) {
        return clean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return phone;
};

/**
 * Formats a Brazilian phone number to a WhatsApp JID
 * Example: (11) 99999-9999 -> 5511999999999@s.whatsapp.net
 */
export const formatPhoneToJid = (phone: string) => {
    if (!phone) return null;
    let clean = phone.replace(/\D/g, '');
    if (clean.length < 10) return null;

    // Add Brazil country code if missing (Length check avoids matching DDD 55 as Country Code)
    if (clean.length <= 11) {
        clean = `55${clean}`;
    }
    return `${clean}@s.whatsapp.net`;
};
