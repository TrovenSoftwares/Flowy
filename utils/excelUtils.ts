import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatCpfCnpj } from './utils';

/**
 * Funções utilitárias para lidar com Excel (Importação e Exportação)
 */

export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Dados') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Gerar buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

    const fullFileName = `${fileName}_${new Date().getTime()}.xlsx`;

    // Usar a biblioteca para download ou disparar via link
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fullFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, {
                    type: 'binary',
                    cellDates: true,
                    cellNF: false,
                    cellText: false
                });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                resolve(json);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
};

/**
 * Converte diferentes formatos de data do Excel para YYYY-MM-DD
 */
export const formatExcelDate = (value: any): string => {
    if (!value) return new Date().toISOString().split('T')[0];

    // Se já for um objeto Date (graças ao cellDates: true)
    if (value instanceof Date) {
        return value.toISOString().split('T')[0];
    }

    // Se for um número (Data ordinal do Excel, ex: 45992)
    const num = Number(value);
    if (!isNaN(num) && num > 30000) { // Datas razoáveis acima de 1982
        const date = new Date(Math.round((num - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
    }

    // Se for string no formato DD/MM/YYYY
    const str = value.toString().trim();
    if (str.includes('/')) {
        const [day, month, year] = str.split('/');
        if (day && month && year) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }

    // Caso padrão retorna a string original ou data atual
    return str.length >= 10 ? str.substring(0, 10) : new Date().toISOString().split('T')[0];
};

export const downloadExampleTemplate = (type: 'contacts' | 'transactions' | 'sales') => {
    let data: any[] = [];
    let name = '';

    if (type === 'contacts') {
        data = [{
            'Nome': 'João Silva',
            'CPF_CNPJ': '123.456.789-01',
            'Telefone': '11999999999',
            'Email': 'joao@email.com'
        }];
        name = 'exemplo_contatos';
    } else if (type === 'transactions') {
        data = [{
            'Data': '2026-01-13',
            'Tipo': 'Receita', // Receita, Despesa ou Transferência
            'Valor': '150.50',
            'Descricao': 'Venda de Exemplo',
            'Categoria': 'Vendas',
            'Conta': 'Caixa Principal',
            'Pago': 'Sim', // Sim ou Não
            'Cliente': 'Pedro Alvares'
        }];
        name = 'exemplo_transacoes';
    } else if (type === 'sales') {
        data = [{
            'Cliente': 'Maria Souza',
            'Data': '2026-01-13',
            'Valor_Total': '2500.00',
            'Peso_Gramas': '100',
            'Frete': '50.00',
            'Vendedor': 'WhatsApp IA'
        }];
        name = 'exemplo_vendas';
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exemplo');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${name}_versix.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
