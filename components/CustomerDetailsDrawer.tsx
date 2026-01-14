import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { formatDate, formatPhone, formatCpfCnpj } from '../utils/utils';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PdfIcon, WeightIcon } from './BrandedIcons';

interface CustomerDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    contact: any | null;
}

const CustomerDetailsDrawer: React.FC<CustomerDetailsDrawerProps> = ({
    isOpen,
    onClose,
    contact
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalSales: 0,
        totalPayments: 0,
        balance: 0
    });

    const fetchHistory = useCallback(async () => {
        if (!contact?.id) return;
        setLoading(true);
        try {
            const [salesRes, transRes] = await Promise.all([
                supabase
                    .from('sales')
                    .select('*')
                    .eq('client_id', contact.id)
                    .order('date', { ascending: false }),
                supabase
                    .from('transactions')
                    .select('*')
                    .eq('contact_id', contact.id)
                    .in('type', ['income', 'expense'])
                    .eq('status', 'confirmed')
                    .order('date', { ascending: false })
            ]);

            if (salesRes.error) throw salesRes.error;
            if (transRes.error) throw transRes.error;

            const sales = (salesRes.data || []).map(s => ({
                ...s,
                type: 'sale',
                sortDate: new Date(s.date)
            }));

            const payments = (transRes.data || []).map(p => ({
                ...p,
                type: p.type === 'income' ? 'payment' : 'chargeback',
                sortDate: new Date(p.date)
            }));

            const combined = [...sales, ...payments].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
            setHistory(combined);

            const totalSalesOnly = sales.reduce((acc, s) => acc + (Number(s.value) + Number(s.shipping || 0)), 0);

            // Payments (Income) and Chargebacks (Expense)
            const incomeSum = payments.filter(p => p.type === 'payment').reduce((acc, p) => acc + Number(p.value), 0);
            const expenseSum = payments.filter(p => p.type === 'chargeback').reduce((acc, p) => acc + Number(p.value), 0);

            // New Logic: Sales includes Chargebacks (as debt increase). Payments is just Income.
            const totalS = totalSalesOnly + expenseSum;
            const totalP = incomeSum;

            setStats({
                totalSales: totalS,
                totalPayments: totalP,
                balance: totalS - totalP
            });

        } catch (error: any) {
            console.error('Error fetching history:', error);
            toast.error('Erro ao carregar histórico do cliente.');
        } finally {
            setLoading(false);
        }
    }, [contact]);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
            fetchHistory();
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
    }, [isOpen, fetchHistory]);

    const exportToPDF = () => {
        if (!contact || history.length === 0) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;

        // Helper: Format Money
        const fmt = (val: number) => "R$\u00A0" + val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        // -- HEADER --
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(30, 41, 59);
        doc.text('Extrato de Conta Corrente', margin, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Sistema: Versix ERP', margin, 26);

        // Date Info (Top Right)
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        const now = new Date();
        doc.text(`Gerado em: ${now.toLocaleString('pt-BR')}`, pageWidth - margin, 20, { align: 'right' });

        // -- CLIENT INFO BOX --
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.1);
        doc.roundedRect(margin, 35, pageWidth - (margin * 2), 25, 2, 2, 'D');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`Cliente: ${contact.name}`, margin + 5, 42);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Documento: ${formatCpfCnpj(contact.id_number)}`, margin + 5, 48);
        doc.text(`Telefone: ${formatPhone(contact.phone)}`, margin + 5, 54);
        doc.text(`Email: ${contact.email || '---'}`, pageWidth - margin - 5, 48, { align: 'right' });

        // -- SUMMARY BOXES --
        const boxWidth = (pageWidth - (margin * 2) - 10) / 3;
        const boxHeight = 20;
        const boxY = 65;

        const drawSummaryBox = (x: number, title: string, value: string, color: [number, number, number] = [30, 41, 59]) => {
            doc.setDrawColor(229, 231, 235);
            doc.roundedRect(x, boxY, boxWidth, boxHeight, 2, 2, 'D');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(title, x + 5, boxY + 7);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(value, x + 5, boxY + 15);
        };

        drawSummaryBox(margin, 'Vendas (+)', fmt(stats.totalSales), [30, 41, 59]); // Dark slate
        drawSummaryBox(margin + boxWidth + 5, 'Pagamentos (-)', fmt(stats.totalPayments), [5, 150, 105]); // Emerald/Green
        drawSummaryBox(margin + (boxWidth + 5) * 2, 'Saldo Líquido', fmt(stats.balance), stats.balance > 0 ? [185, 28, 28] : [5, 150, 105]); // Red if > 0, Green if <= 0

        // -- TABLE --
        // Sorting history for running balance Calculation (oldest to newest) - COMPLIANCE with user request
        const sortedForDisplay = [...history].sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
        let runningBalance = 0;

        const tableData = sortedForDisplay.map(item => {
            const value = item.type === 'sale' ? (Number(item.value) + Number(item.shipping || 0)) : Number(item.value);

            // Logic: Sales & Chargebacks = Debit (Clients owe more) -> Add to running balance (Positive Balance = Debt)
            // Income = Credit (Client pays) -> Subtract from running balance

            let displayValue = fmt(value);

            if (item.type === 'sale' || item.type === 'chargeback') {
                runningBalance += value;
                // Sales & Chargebacks: No sign (Positive visual), Red Color implied
                displayValue = fmt(value);
            } else {
                runningBalance -= value;
                // Payments: Negative sign, Green Color implied
                displayValue = `- ${fmt(value)}`;
            }

            const descriptionMain = item.type === 'sale' ? `Venda #${item.code || '---'}` : item.type === 'chargeback' ? `Cheque Devolvido` : 'Pagamento Recebido';

            return [
                formatDate(item.date),
                descriptionMain,
                item.type === 'sale' ? 'Venda' : item.type === 'chargeback' ? 'Débito' : 'Pagamento',
                displayValue,
                fmt(runningBalance)
            ];
        });

        autoTable(doc, {
            startY: 92,
            head: [['DATA', 'DESCRIÇÃO', 'TIPO', 'VALOR', 'SALDO']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [243, 244, 246], textColor: [30, 41, 59], fontStyle: 'bold', fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59], lineColor: [229, 231, 235] },
            columnStyles: {
                3: { halign: 'right', fontStyle: 'bold' },
                4: { halign: 'right', fontStyle: 'bold' }
            },
            didParseCell: (data) => {
                const rowIndex = data.row.index;
                const item = sortedForDisplay[rowIndex];

                if (data.section === 'body') {
                    // Column VALOR (Index 3)
                    if (data.column.index === 3) {
                        data.cell.styles.textColor = (item.type === 'sale' || item.type === 'chargeback') ? [185, 28, 28] : [5, 150, 105];
                    }

                    // Column SALDO (Index 4)
                    if (data.column.index === 4) {
                        let rowBalance = 0;
                        for (let i = 0; i <= rowIndex; i++) {
                            const rowItem = sortedForDisplay[i];
                            const val = rowItem.type === 'sale' ? (Number(rowItem.value) + Number(rowItem.shipping || 0)) : Number(rowItem.value);
                            if (rowItem.type === 'sale' || rowItem.type === 'chargeback') rowBalance += val;
                            else rowBalance -= val;
                        }

                        if (rowBalance > 0) {
                            data.cell.styles.textColor = [185, 28, 28]; // Red
                        } else if (rowBalance < 0) {
                            data.cell.styles.textColor = [5, 150, 105]; // Green
                        }
                    }
                }
            }
        });

        // -- FOOTER --
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175);
            doc.text(`Extrato cliente gerado automaticamente • Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        doc.save(`Extrato_${contact.name.replace(/\s+/g, '_')}.pdf`);
        toast.success('Extrato PDF gerado com sucesso!');
    };

    if (!isOpen && !isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`relative w-full max-w-lg h-full bg-white dark:bg-slate-850 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="material-symbols-outlined text-primary">person</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Detalhes do Cliente</h3>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{contact?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportToPDF}
                            disabled={history.length === 0}
                            className="flex items-center justify-center size-9 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 tooltip"
                            title="Exportar Extrato PDF"
                        >
                            <PdfIcon className="size-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-symbols-outlined font-bold">close</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Telefone</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatPhone(contact?.phone) || '---'}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CPF/CNPJ</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCpfCnpj(contact?.id_number)}</p>
                        </div>
                        <div className="col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{contact?.email || '---'}</p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 text-center">
                            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1">Vendas</p>
                            <p className="text-sm font-bold text-blue-700 dark:text-blue-400">R$ {stats.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 text-center">
                            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Pagos</p>
                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">R$ {stats.totalPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className={`p-3 rounded-xl border text-center ${stats.balance > 0 ? 'border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/10'}`}>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${stats.balance > 0 ? 'text-amber-500' : 'text-slate-500'}`}>Saldo</p>
                            <p className={`text-sm font-bold ${stats.balance > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Histórico de Atividades</h4>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">{history.length} Eventos</span>
                        </div>

                        <div className="relative space-y-4 before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-slate-100 dark:before:bg-slate-800">
                            {loading ? (
                                <div className="py-12 text-center text-slate-400 text-sm italic">Carregando histórico...</div>
                            ) : history.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 text-sm italic">Nenhuma atividade registrada.</div>
                            ) : (
                                history.map((item, idx) => (
                                    <div key={idx} className="relative pl-12">
                                        {/* Icon */}
                                        <div className={`absolute left-0 size-10 rounded-full border-4 border-white dark:border-slate-850 flex items-center justify-center z-10 ${item.type === 'sale' ? 'bg-blue-500 text-white' :
                                            item.type === 'chargeback' ? 'bg-rose-500 text-white' :
                                                'bg-emerald-500 text-white'
                                            }`}>
                                            <span className="material-symbols-outlined text-[18px]">
                                                {item.type === 'sale' ? 'receipt_long' :
                                                    item.type === 'chargeback' ? 'money_off' :
                                                        'payments'}
                                            </span>
                                        </div>

                                        {/* Card */}
                                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/20 transition-all">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {item.type === 'sale' ? `Venda #${item.code || '---'}` :
                                                            item.type === 'chargeback' ? (item.description || 'Cheque Devolvido / Estorno') :
                                                                'Pagamento Recebido'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{formatDate(item.date)}</p>
                                                </div>
                                                <p className={`text-sm font-bold ${item.type === 'sale' ? 'text-blue-600' :
                                                    item.type === 'chargeback' ? 'text-rose-600' :
                                                        'text-emerald-600'
                                                    }`}>
                                                    {item.type === 'sale' ? '-' : item.type === 'chargeback' ? '-' : '+'} R$ {(item.type === 'sale' ? (Number(item.value) + Number(item.shipping || 0)) : Number(item.value)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            {item.type === 'sale' && item.weight && (
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                    <WeightIcon className="size-3.5" />
                                                    <span>{item.weight}g</span>
                                                </div>
                                            )}
                                            {item.description && (
                                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 italic">"{item.description}"</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="w-full h-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95"
                    >
                        Fechar Detalhes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailsDrawer;
