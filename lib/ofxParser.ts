/**
 * Simple parser for OFX (Open Financial Exchange) files.
 * Extracts basic transaction data: Date, Amount, Memo (Description).
 */

export interface OfxTransaction {
    date: string; // YYYY-MM-DD
    amount: number;
    memo: string;
    fitid: string; // Unique transaction ID from bank
}

export const parseOfx = (ofxString: string): OfxTransaction[] => {
    const transactions: OfxTransaction[] = [];

    // Split into individual transaction blocks
    const STMTTRN_REGEX = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;

    while ((match = STMTTRN_REGEX.exec(ofxString)) !== null) {
        const block = match[1];

        // Extract fields
        const trnamt = extractTagValue(block, 'TRNAMT');
        const dtposted = extractTagValue(block, 'DTPOSTED');
        const memo = extractTagValue(block, 'MEMO') || extractTagValue(block, 'NAME'); // Fallback to NAME
        const fitid = extractTagValue(block, 'FITID');

        if (trnamt && dtposted && memo) {
            transactions.push({
                amount: parseFloat(trnamt.replace(',', '.')),
                date: formatDate(dtposted),
                memo: cleanText(memo),
                fitid: fitid || Math.random().toString(36).substring(7)
            });
        }
    }

    return transactions;
};

const extractTagValue = (block: string, tag: string): string | null => {
    const regex = new RegExp(`<${tag}>([^<\\n\\r]+)`, 'i');
    const match = block.match(regex);
    return match ? match[1].trim() : null;
};

const formatDate = (ofxDate: string): string => {
    // OFX date format is usually YYYYMMDD...
    const year = ofxDate.substring(0, 4);
    const month = ofxDate.substring(4, 6);
    const day = ofxDate.substring(6, 8);
    return `${year}-${month}-${day}`;
};

const cleanText = (text: string): string => {
    // Remove possible leftover XML chars or encoding artifacts
    return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
};
