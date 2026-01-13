import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CustomSelect from '../components/CustomSelect';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { formatDate } from '../utils/utils';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToExcel, readExcelFile, downloadExampleTemplate, formatExcelDate } from '../utils/excelUtils';
import { PdfIcon, ExcelIcon, ImportIcon } from '../components/BrandedIcons';

const Sales: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalValue: 0,
    totalWeight: 0,
    totalShipping: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    period: 'Todo o período',
    seller: 'Todos'
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      // Busca separada para contornar ausência de FK no schema
      const [salesRes, contactsRes, accountsRes] = await Promise.all([
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('contacts').select('id, name, photo_url, phone'),
        supabase.from('accounts').select('id, name, color, icon')
      ]);

      if (salesRes.error) throw salesRes.error;

      // Mapear contacts e accounts por ID para lookup rápido
      const contactsMap = new Map((contactsRes.data || []).map(c => [c.id, c]));
      const accountsMap = new Map((accountsRes.data || []).map(a => [a.id, a]));

      // Mesclar dados client-side
      const enrichedSales = (salesRes.data || []).map(sale => ({
        ...sale,
        client: contactsMap.get(sale.client_id) || null,
        account: accountsMap.get(sale.account_id) || null
      }));

      setSales(enrichedSales);

      // Calculate stats
      const totalValue = enrichedSales.reduce((acc, s) => acc + Number(s.value || 0), 0);
      const totalWeight = enrichedSales.reduce((acc, s) => acc + Number(s.weight || 0), 0);
      const totalShipping = enrichedSales.reduce((acc, s) => acc + Number(s.shipping || 0), 0);
      setStats({
        totalSales: enrichedSales.length,
        totalValue,
        totalWeight,
        totalShipping
      });

    } catch (error: any) {
      console.error('Error fetching sales:', error);
      toast.error('Erro ao carregar vendas: ' + (error.message || 'Erro de conexão'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();

    const channel = supabase
      .channel('sales-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        () => fetchSales()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSales]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const clientName = sale.client?.name || '';
      const saleCode = sale.code || '';
      const saleValue = sale.value?.toString() || '';

      const matchesSearch =
        clientName.toLowerCase().includes(filters.search.toLowerCase()) ||
        saleCode.toLowerCase().includes(filters.search.toLowerCase()) ||
        saleValue.includes(filters.search);

      const matchesSeller = filters.seller === 'Todos' || sale.seller === filters.seller;

      let matchesPeriod = true;
      const saleDate = new Date(sale.date);
      const now = new Date();

      if (filters.period === 'Este Mês') {
        matchesPeriod = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      } else if (filters.period === 'Mês Passado') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        matchesPeriod = saleDate.getMonth() === lastMonth.getMonth() && saleDate.getFullYear() === lastMonth.getFullYear();
      } else if (filters.period === 'Últimos 7 dias') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        matchesPeriod = saleDate >= sevenDaysAgo;
      }

      return matchesSearch && matchesSeller && matchesPeriod;
    });
  }, [sales, filters]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

  const handleExportExcel = () => {
    const dataToExport = filteredSales.map(s => ({
      'Código': s.code,
      'Data': s.date,
      'Cliente': s.client?.name || 'Venda Avulsa',
      'Valor Total': Number(s.value),
      'Peso (g)': Number(s.weight || 0),
      'Frete (R$)': Number(s.shipping || 0),
      'Vendedor': s.seller,
      'Conta': s.account?.name || '---'
    }));
    exportToExcel(dataToExport, 'Vendas_Versix');
    toast.success('Arquivo Excel de Vendas gerado!');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setImporting(true);
    try {
      const data = await readExcelFile(file);
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch all contacts to match by name
      const { data: contactsData } = await supabase.from('contacts').select('id, name, balance');
      const balanceMap = new Map((contactsData || []).map(c => [c.id, c.balance || 0]));

      const findClientId = (name: string) => {
        if (!name) return null;
        const search = name.toLowerCase().trim();

        // 1. Exact match
        const exact = contactsData?.find(c => c.name.toLowerCase().trim() === search);
        if (exact) return exact.id;

        // 2. Starts with (ex: "Patricia" matches "Patricia Lopes")
        const startsWith = contactsData?.filter(c => c.name.toLowerCase().trim().startsWith(search));
        if (startsWith?.length === 1) return startsWith[0].id;

        // 3. Includes
        const includes = contactsData?.filter(c => c.name.toLowerCase().includes(search));
        if (includes?.length === 1) return includes[0].id;

        return null;
      };

      const newSales = data.map((row: any) => {
        const clientName = (row['Cliente'] || row['cliente'] || '').toString().trim();
        const client_id = findClientId(clientName);

        // Parse numeric values safely (Handling Brazilian format: 1.234,56)
        const parseValue = (val: any) => {
          if (typeof val === 'number') return val;
          if (!val) return 0;
          const clean = val.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
          const parsed = parseFloat(clean);
          return isNaN(parsed) ? 0 : parsed;
        };

        const value = parseValue(row['Valor_Total'] || row['Valor Total'] || row['valor_total'] || row['Valor'] || 0);
        const weight = parseValue(row['Peso_Gramas'] || row['Peso (g)'] || row['peso_gramas'] || row['Peso'] || 0);
        const shipping = parseValue(row['Frete'] || row['Frete (R$)'] || row['frete'] || 0);

        const isAiSale = (row['Vendedor'] || row['vendedor'] || '').toLowerCase().includes('ia');

        const rawDate = row['Data'] || row['data'];
        const formattedDate = formatExcelDate(rawDate);

        return {
          date: formattedDate,
          value,
          weight,
          shipping,
          seller: row['Vendedor'] || row['vendedor'] || (isAiSale ? 'WhatsApp IA' : 'Manual'),
          is_ai: isAiSale,
          user_id: user?.id,
          client_id,
          code: row['Codigo'] || row['Código'] || row['codigo'] || `IMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
          // account_id removed as it was null and cause FK errors
        };
      });

      const { error } = await supabase.from('sales').insert(newSales);
      if (error) throw error;

      // Update contact balances for the imported sales
      for (const sale of newSales) {
        if (sale.client_id) {
          const currentBalance = balanceMap.get(sale.client_id) || 0;
          const totalSale = sale.value + sale.shipping;
          const newBalance = currentBalance + totalSale;

          await supabase.from('contacts')
            .update({ balance: newBalance })
            .eq('id', sale.client_id);

          // Update local map to handle multiple sales for same client in same import
          balanceMap.set(sale.client_id, newBalance);
        }
      }

      toast.success(`${newSales.length} vendas importadas com sucesso!`);
      fetchSales();
      setImportModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro na importação: Verifique as colunas do Excel.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const exportToPDF = () => {
    if (filteredSales.length === 0) return;

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
    doc.text('Relatório de Vendas', margin, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Sistema: Versix ERP', margin, 26);

    // Filter Info (Top Right)
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const now = new Date();
    doc.text(`Gerado em: ${now.toLocaleString('pt-BR')}`, pageWidth - margin, 20, { align: 'right' });
    doc.text(`Filtros: Periodo: ${filters.period} | Vendedor: ${filters.seller}`, pageWidth - margin, 25, { align: 'right' });

    // -- STATS SUMMARY BOXES --
    const totalV = filteredSales.reduce((acc, s) => acc + Number(s.value || 0), 0);
    const totalW = filteredSales.reduce((acc, s) => acc + Number(s.weight || 0), 0);
    const totalF = filteredSales.reduce((acc, s) => acc + Number(s.shipping || 0), 0);

    const boxWidth = (pageWidth - (margin * 2) - 10) / 3;
    const boxHeight = 20;
    const boxY = 35;

    const drawSummaryBox = (x: number, title: string, value: string, color: [number, number, number] = [30, 41, 59]) => {
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.1);
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

    drawSummaryBox(margin, 'Total Faturado', fmt(totalV), [5, 150, 105]);
    drawSummaryBox(margin + boxWidth + 5, 'Peso Total', `${totalW.toLocaleString('pt-BR')}g`, [30, 41, 59]);
    drawSummaryBox(margin + (boxWidth + 5) * 2, 'Frete Total', fmt(totalF), [59, 130, 246]);

    // -- TABLE --
    const tableData = filteredSales.map(s => [
      s.client?.name || 'Venda Avulsa',
      formatDate(s.date),
      fmt(Number(s.value)),
      s.weight ? `${Number(s.weight).toLocaleString('pt-BR')}g` : '---',
      fmt(Number(s.shipping || 0)),
      s.seller || 'Manual'
    ]);

    autoTable(doc, {
      startY: 62,
      head: [['CLIENTE', 'DATA', 'VALOR', 'PESO', 'FRETE', 'VENDEDOR']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [243, 244, 246], textColor: [30, 41, 59], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59], lineColor: [229, 231, 235] },
      columnStyles: {
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'center' },
        4: { halign: 'right' }
      }
    });

    // -- FOOTER --
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`Relatório de Vendas Versix ERP • Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    doc.save(`Vendas_Versix_${format(now, 'dd_MM_yyyy')}.pdf`);
    toast.success('Relatório PDF gerado com sucesso!');
  };

  const handleDelete = async () => {
    if (!saleToDelete) return;
    try {
      const { error } = await supabase.from('sales').delete().eq('id', saleToDelete);
      if (error) throw error;
      toast.success('Venda excluída com sucesso.');
      fetchSales();
    } catch (error) {
      toast.error('Erro ao excluir venda.');
    } finally {
      setIsDeleteModalOpen(false);
      setSaleToDelete(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-500">
      <PageHeader
        title="Histórico de Vendas"
        description="Gerencie todas as vendas realizadas e acompanhe os recebíveis."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setImportModalOpen(true)}
              className="hidden md:flex items-center justify-center size-10 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Importar Excel"
            >
              <ImportIcon className="size-6 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={handleExportExcel}
              disabled={filteredSales.length === 0}
              className="hidden md:flex items-center justify-center size-10 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-30"
              title="Exportar Excel"
            >
              <ExcelIcon className="size-6 text-emerald-600 dark:text-emerald-500" />
            </button>
            <button
              onClick={exportToPDF}
              disabled={filteredSales.length === 0}
              className="hidden md:flex items-center justify-center size-10 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 shadow-sm"
              title="Exportar PDF"
            >
              <PdfIcon className="size-6" />
            </button>
            <button
              onClick={fetchSales}
              className="flex items-center justify-center size-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[24px]">refresh</span>
            </button>
            <button
              onClick={() => navigate('/sales/new')}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 md:px-6 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="hidden md:inline">Nova Venda</span>
            </button>
          </div>
        }
      />

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Importar Vendas</h3>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Faça o upload de um arquivo .xlsx com as colunas: <strong>Cliente, Data, Valor_Total, Peso_Gramas, Frete, Vendedor</strong>.
            </p>
            <button
              onClick={() => downloadExampleTemplate('sales')}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Baixar Planilha de Exemplo
            </button>
            <div className="flex flex-col gap-4 pt-2">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleImportExcel}
                disabled={importing}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer"
              />
              {importing && (
                <div className="flex items-center gap-2 text-sm text-primary font-bold animate-pulse">
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Importando dados...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total de Vendas"
          value={stats.totalSales.toString()}
          trend="Período selecionado"
          icon="receipt_long"
          iconColor="text-primary bg-primary/10"
        />
        <StatCard
          label="Faturamento"
          value={`R$ ${stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="Valor bruto"
          icon="payments"
          iconColor="text-emerald-500 bg-emerald-500/10"
          valueColor="text-emerald-600"
        />
        <StatCard
          label="Peso Total"
          value={`${stats.totalWeight.toLocaleString('pt-BR')}g`}
          secondaryValue={stats.totalWeight > 0 ? `R$ ${(stats.totalValue / stats.totalWeight).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/g` : null}
          trend="Soma de produtos"
          icon="scale"
          iconColor="text-amber-500 bg-amber-500/10"
        />
        <StatCard
          label="Frete Arrecadado"
          value={`R$ ${stats.totalShipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="Total de frete"
          icon="local_shipping"
          iconColor="text-blue-500 bg-blue-500/10"
        />
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-slate-850 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all dark:text-white"
              placeholder="Buscar por cliente, código ou valor..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <CustomSelect
              className="w-full sm:w-44"
              icon="calendar_today"
              value={filters.period}
              onChange={(val) => setFilters({ ...filters, period: val })}
              options={[
                { value: 'Todo o período', label: 'Todo o período' },
                { value: 'Este Mês', label: 'Este Mês' },
                { value: 'Mês Passado', label: 'Mês Passado' },
                { value: 'Últimos 7 dias', label: 'Últimos 7 dias' }
              ]}
            />
            <CustomSelect
              className="w-full sm:w-44"
              icon="person"
              value={filters.seller}
              onChange={(val) => setFilters({ ...filters, seller: val })}
              options={[
                { value: 'Todos', label: 'Todos Vendedores' },
                { value: 'WhatsApp IA', label: 'WhatsApp IA' },
                { value: 'Manual', label: 'Manual' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white dark:bg-slate-850 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <th className="py-4 pl-6 pr-3 w-12 text-center">
                <input className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 text-primary focus:ring-primary/50 size-4" type="checkbox" />
              </th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Cliente / Conta</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Data</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Valor Total</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Peso</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Frete</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Vendedor</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400 italic">Carregando vendas...</td></tr>
            ) : paginatedSales.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400 italic">Nenhuma venda encontrada.</td></tr>
            ) : (
              paginatedSales.map(sale => (
                <SaleRow
                  key={sale.id}
                  sale={sale}
                  onEdit={() => navigate(`/sales/edit/${sale.id}`)}
                  onDelete={() => { setSaleToDelete(sale.id); setIsDeleteModalOpen(true); }}
                />
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="hidden sm:inline">Mostrando </span>
            <span className="font-bold text-gray-900 dark:text-white">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredSales.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{filteredSales.length}</span>
            <span className="hidden sm:inline"> resultados</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="text-sm font-bold text-primary px-2">{currentPage} / {totalPages || 1}</span>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => p + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Venda"
        message="Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        type="danger"
      />
    </div>
  );
};

// Stat Card Component - Premium style with optional secondary value
const StatCard = ({ label, value, secondaryValue, trend, icon, iconColor, valueColor, trendColor }: any) => (
  <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 shadow-sm group hover:border-primary/30 hover:shadow-md transition-all">
    <div className="flex items-center justify-between">
      <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</p>
      <span className={`material-symbols-outlined ${iconColor} p-2 rounded-lg`}>{icon}</span>
    </div>
    <div className="flex flex-col">
      <p className={`text-2xl sm:text-3xl font-bold whitespace-nowrap ${valueColor || 'text-slate-900 dark:text-white'}`}>{value}</p>
      {secondaryValue && (
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-px flex-1 bg-gradient-to-r from-amber-400/50 to-transparent"></div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
            ≈ {secondaryValue}
          </span>
        </div>
      )}
    </div>
    <p className={`${trendColor || 'text-slate-500'} text-xs font-medium flex items-center gap-1.5`}>
      <span className="material-symbols-outlined text-sm">info</span> {trend}
    </p>
  </div>
);

// Sale Row Component - with Edit button
const SaleRow = ({ sale, onEdit, onDelete }: any) => {
  return (
    <tr className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="py-4 pl-6 pr-3 text-center">
        <input className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 text-primary focus:ring-primary/50 size-4" type="checkbox" />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-xl ${sale.account?.color || 'bg-primary'} flex items-center justify-center shrink-0 border border-white/20 shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform`}>
            {sale.account?.icon && sale.account.icon.startsWith('/') ? (
              <img src={sale.account.icon} alt={sale.account.name} className="size-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-white text-[20px]">{sale.account?.icon || 'store'}</span>
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{sale.client?.name || 'Venda Avulsa'}</span>
            <span className="text-xs text-slate-400">{sale.code || sale.account?.name || '---'}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-center text-xs font-bold text-slate-500 whitespace-nowrap">
        {formatDate(sale.date)}
      </td>
      <td className="px-4 py-4 text-sm font-bold text-emerald-600 text-right whitespace-nowrap">
        {"R$\u00A0"}{Number(sale.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-4 text-center text-xs font-bold text-slate-500">
        {sale.weight ? `${Number(sale.weight).toLocaleString('pt-BR')}g` : '---'}
      </td>
      <td className="px-4 py-4 text-right text-xs font-bold text-slate-500">
        {sale.shipping > 0 ? (
          <>{"R$\u00A0"}{Number(sale.shipping).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
        ) : <span className="text-emerald-500">Grátis</span>}
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider w-fit">
            {sale.seller || 'Manual'}
          </span>
          {sale.is_ai && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[12px]">smart_toy</span>
              PROCESSADO POR IA
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default Sales;