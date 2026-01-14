import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';
import CustomSelect from '../components/CustomSelect';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-hot-toast';
import { WeightIcon } from '../components/BrandedIcons';
import StatCard from '../components/StatCard';

interface Return {
    id: string;
    weight: number;
    gram_value: number;
    total_value: number;
    return_date: string;
    contact_id: string;
    account_id: string;
    reason_id: string;
    created_at: string;
    contact?: { name: string };
    account?: { name: string };
    reason?: { name: string };
}

const Returns: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [returns, setReturns] = useState<Return[]>([]);
    const [stats, setStats] = useState({ total: 0, totalValue: 0, totalWeight: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [periodFilter, setPeriodFilter] = useState('Todos');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('returns')
                .select(`
                    *,
                    contact:contacts(name),
                    account:accounts(name),
                    reason:return_reasons(name)
                `)
                .order('return_date', { ascending: false });

            if (error) throw error;

            setReturns(data || []);
            setStats({
                total: data?.length || 0,
                totalValue: data?.reduce((sum, r) => sum + Number(r.total_value), 0) || 0,
                totalWeight: data?.reduce((sum, r) => sum + Number(r.weight || 0), 0) || 0
            });
        } catch (error) {
            console.error('Error fetching returns:', error);
            toast.error('Erro ao carregar devoluções.');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async () => {
        if (!deleteModal.id) return;
        try {
            const { error } = await supabase
                .from('returns')
                .delete()
                .eq('id', deleteModal.id);

            if (error) throw error;

            toast.success('Devolução excluída!');
            fetchData();
        } catch (error) {
            toast.error('Erro ao excluir devolução.');
        }
        setDeleteModal({ isOpen: false, id: null });
    };

    const filteredReturns = returns.filter(ret => {
        const matchesSearch =
            ret.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ret.reason?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const formatWeight = (weight: number) => {
        return `${weight.toFixed(3)}g`;
    };

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="w-full px-8 py-6 border-b border-[#e7edf3] dark:border-slate-800">
                <div className="max-w-[1200px] mx-auto">
                    <PageHeader
                        title="Devoluções"
                        description="Gerencie as devoluções de produtos e acompanhe os valores."
                        actions={
                            <div className="flex gap-3">
                                <button
                                    onClick={() => navigate('/returns/reasons')}
                                    className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium transition-colors border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    <span className="material-symbols-outlined text-[20px]">category</span>
                                    <span>Motivos</span>
                                </button>
                                <button
                                    onClick={() => navigate('/returns/new')}
                                    className="group flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-5 rounded-lg transition-all shadow-lg shadow-primary/30 min-w-max active:scale-95"
                                >
                                    <span className="material-symbols-outlined">add_circle</span>
                                    <span>Nova Devolução</span>
                                </button>
                            </div>
                        }
                    />
                </div>
            </div>

            <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        label="Total de Devoluções"
                        value={stats.total.toString()}
                        trend="Produtos devolvidos"
                        icon="assignment_return"
                        iconColor="text-purple-500 bg-purple-500/10"
                        trendColor="text-purple-600"
                    />
                    <StatCard
                        label="Peso Total"
                        value={formatWeight(stats.totalWeight)}
                        trend="Em gramas"
                        icon={<WeightIcon className="size-6 text-blue-500" />}
                        iconColor="text-blue-500 bg-blue-500/10"
                        trendColor="text-blue-600"
                    />
                    <StatCard
                        label="Valor Total"
                        value={formatCurrency(stats.totalValue)}
                        trend="Débito do cliente"
                        icon="payments"
                        iconColor="text-amber-500 bg-amber-500/10"
                        trendColor="text-amber-600"
                    />
                </div>

                {/* Search & Filters */}
                <div className="bg-white dark:bg-slate-850 rounded-xl border border-[#e7edf3] dark:border-slate-800 shadow-sm p-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative flex-1 max-w-xl">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                className="block w-full rounded-lg border-transparent bg-[#f8fafc] dark:bg-slate-900 border focus:border-primary focus:ring-4 focus:ring-primary/10 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 dark:text-white transition-all"
                                placeholder="Buscar por cliente ou motivo..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <CustomSelect
                                value={periodFilter}
                                onChange={setPeriodFilter}
                                icon="calendar_month"
                                options={[
                                    { value: 'Todos', label: 'Todos os Períodos' },
                                    { value: 'Hoje', label: 'Hoje' },
                                    { value: 'Semana', label: 'Esta Semana' },
                                    { value: 'Mês', label: 'Este Mês' },
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-850 rounded-xl border border-[#e7edf3] dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredReturns.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
                            <span className="material-symbols-outlined text-4xl mb-2">assignment_return</span>
                            <p>Nenhuma devolução encontrada.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                    <thead className="bg-[#fcfdfd] dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-[#e7edf3] dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4">Cliente</th>
                                            <th className="px-6 py-4">Motivo</th>
                                            <th className="px-6 py-4">Data</th>
                                            <th className="px-6 py-4 text-right">Peso</th>
                                            <th className="px-6 py-4 text-right">Valor/g</th>
                                            <th className="px-6 py-4 text-right">Valor Total</th>
                                            <th className="px-6 py-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {filteredReturns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((ret) => (
                                            <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-900 dark:text-white">{ret.contact?.name || '-'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                                        {ret.reason?.name || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-500">{formatDate(ret.return_date)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-slate-700 dark:text-slate-300">{ret.weight ? formatWeight(ret.weight) : '-'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-slate-700 dark:text-slate-300">{ret.gram_value ? formatCurrency(ret.gram_value) : '-'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-bold text-rose-600">{formatCurrency(ret.total_value)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => navigate(`/returns/edit/${ret.id}`)}
                                                            className="text-slate-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                                            title="Editar"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteModal({ isOpen: true, id: ret.id })}
                                                            className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                                            title="Excluir"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Footer */}
                            <div className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    <span className="hidden sm:inline">Mostrando </span>
                                    <span className="font-bold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredReturns.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{filteredReturns.length}</span>
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
                                    <span className="text-sm font-bold text-primary px-2">{currentPage} / {Math.ceil(filteredReturns.length / itemsPerPage) || 1}</span>
                                    <button
                                        disabled={currentPage === Math.ceil(filteredReturns.length / itemsPerPage) || filteredReturns.length === 0}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="Excluir Devolução?"
                message="Tem certeza que deseja excluir esta devolução? Esta ação não pode ser desfeita."
                confirmLabel="Sim, Excluir"
                type="danger"
            />
        </div>
    );
};

export default Returns;
