import React, { useState, useMemo } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { YearlyIncome } from '../types';
import { Plus, Edit2, Trash2, TrendingUp, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Combobox } from './Combobox';

export const IncomeTracker: React.FC = () => {
    const { yearlyIncomes, addYearlyIncome, updateYearlyIncome, deleteYearlyIncome, stories } = useTimelineStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<YearlyIncome>>({
        year: new Date().getFullYear(),
        employer: '',
        baseSalary: 0,
        totalEarnings: 0,
        role: '',
        isVerifiedByTaxReturn: false,
        superAmount: 0
    });

    const resetForm = () => {
        setFormData({
            year: new Date().getFullYear(),
            employer: '',
            baseSalary: 0,
            totalEarnings: 0,
            role: '',
            isVerifiedByTaxReturn: false,
            superAmount: 0
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleEdit = (income: YearlyIncome) => {
        setFormData(income);
        setEditingId(income.id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this income record?')) {
            await deleteYearlyIncome(id);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.employer || !formData.year) return;

        const incomeData = {
            year: Number(formData.year),
            employer: formData.employer,
            baseSalary: Number(formData.baseSalary),
            totalEarnings: Number(formData.totalEarnings),
            role: formData.role || '',
            isVerifiedByTaxReturn: formData.isVerifiedByTaxReturn || false,
            superAmount: Number(formData.superAmount)
        };

        if (editingId) {
            await updateYearlyIncome(editingId, incomeData);
        } else {
            await addYearlyIncome(incomeData as any);
        }
        resetForm();
    };

    // Extract Career Data for Autocomplete
    const { companies, rolesByCompany } = useMemo(() => {
        const uniqueCompanies = new Set<string>();
        const roleMap: Record<string, Set<string>> = {};

        stories.forEach(story => {
            // Basic filter for career content
            const isCareer = story.tags.some(t => ['career', 'work', 'job', 'professional', 'business'].includes(t.toLowerCase()));
            if (!isCareer) return;

            // Extract Company
            const metadata = story.metadata || {};
            const company = (metadata.company as string) || story.location || (story.content.match(/at ([A-Z][a-zA-Z\s&]+)/)?.[1]);

            if (company) {
                uniqueCompanies.add(company);

                // Extract Role
                const role = (metadata.position as string) || story.title;
                if (role) {
                    if (!roleMap[company]) roleMap[company] = new Set();
                    roleMap[company].add(role);
                }
            }
        });

        return {
            companies: Array.from(uniqueCompanies).sort(),
            rolesByCompany: roleMap
        };
    }, [stories]);

    const availableRoles = useMemo(() => {
        if (!formData.employer || !rolesByCompany[formData.employer]) return [];
        return Array.from(rolesByCompany[formData.employer]).sort();
    }, [formData.employer, rolesByCompany]);

    // Chart Data
    const chartData = useMemo(() => {
        return [...yearlyIncomes]
            .sort((a, b) => a.year - b.year)
            .map(item => ({
                year: item.year,
                Base: item.baseSalary,
                Total: item.totalEarnings,
                Production: item.totalEarnings - item.baseSalary
            }));
    }, [yearlyIncomes]);

    // Role Classification Logic (Simple for now in UI)
    const productionMultiplier = (total: number, base: number): string => {
        if (base === 0) return '0.00';
        return (total / base).toFixed(2);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-theme-primary flex items-center gap-2">
                        <DollarSign className="w-6 h-6" />
                        Wage & Earnings Capacity
                    </h2>
                    <p className="text-theme-secondary text-sm mt-1">
                        Track your base salary against actaul production earnings to establish your true market value.
                    </p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:scale-95 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Income Year
                </button>
            </div>

            {/* Form */}
            {isAdding && (
                <div className="bg-theme-bg-secondary p-6 rounded-xl border border-theme-border animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold text-theme-primary mb-4">
                        {editingId ? 'Edit Income Record' : 'Log New Financial Year'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">Financial Year Ending</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full bg-theme-bg-primary border border-theme-border rounded-lg px-3 py-2 text-theme-primary focus:ring-2 focus:ring-primary-500"
                                    value={formData.year}
                                    onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Combobox
                                    label="Employer"
                                    value={formData.employer || ''}
                                    onChange={(val) => setFormData({ ...formData, employer: val })}
                                    options={companies}
                                    placeholder="Search or type company..."
                                    required
                                />
                            </div>
                            <div>
                                <Combobox
                                    label="Role/Title"
                                    value={formData.role || ''}
                                    onChange={(val) => setFormData({ ...formData, role: val })}
                                    options={availableRoles}
                                    placeholder={availableRoles.length > 0 ? "Select or type role..." : "Type role..."}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1 flex items-center justify-between">
                                    <span>Verified by Tax Return?</span>
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                        checked={formData.isVerifiedByTaxReturn}
                                        onChange={e => setFormData({ ...formData, isVerifiedByTaxReturn: e.target.checked })}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">Base Salary (Contract)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-theme-tertiary">$</span>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-theme-bg-primary border border-theme-border rounded-lg pl-7 pr-3 py-2 text-theme-primary focus:ring-2 focus:ring-primary-500"
                                        value={formData.baseSalary}
                                        onChange={e => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">Total Earnings (Gross)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-theme-tertiary">$</span>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-theme-bg-primary border border-theme-border rounded-lg pl-7 pr-3 py-2 text-theme-primary focus:ring-2 focus:ring-primary-500"
                                        value={formData.totalEarnings}
                                        onChange={e => setFormData({ ...formData, totalEarnings: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">Superannuation</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-theme-tertiary">$</span>
                                    <input
                                        type="number"
                                        className="w-full bg-theme-bg-primary border border-theme-border rounded-lg pl-7 pr-3 py-2 text-theme-primary focus:ring-2 focus:ring-primary-500"
                                        value={formData.superAmount}
                                        onChange={e => setFormData({ ...formData, superAmount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-bg-secondary rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                {editingId ? 'Update Record' : 'Save Record'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Charts Section */}
            {chartData.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Earnings Capacity Analysis</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="year" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" tickFormatter={(val) => `$${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    formatter={(value: any) => [formatCurrency(value), '']}
                                />
                                <Legend />
                                <Bar dataKey="Base" fill="#94a3b8" name="Base Salary" stackId="a" />
                                <Bar dataKey="Production" fill="#10b981" name="Production/OT" stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Records List */}
            <div className="space-y-4">
                {yearlyIncomes.length === 0 && !isAdding ? (
                    <div className="text-center py-12 bg-theme-bg-secondary rounded-xl border border-theme-border border-dashed">
                        <DollarSign className="w-12 h-12 text-theme-tertiary mx-auto mb-3" />
                        <h3 className="text-theme-primary font-medium">No income records logged</h3>
                        <p className="text-theme-secondary text-sm">Add your past tax years to analyze your earnings capacity.</p>
                    </div>
                ) : (
                    yearlyIncomes
                        .sort((a, b) => b.year - a.year)
                        .map(income => {
                            const multiplier = productionMultiplier(income.totalEarnings, income.baseSalary);
                            const isHighUtilization = parseFloat(multiplier) >= 1.5;

                            return (
                                <div key={income.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary-500/50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xl font-bold text-slate-900 dark:text-white">{income.year}</span>
                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full font-medium">
                                                {income.role}
                                            </span>
                                            {income.isVerifiedByTaxReturn && (
                                                <span className="flex items-center gap-1 text-green-600 text-xs font-medium" title="Verified by Tax Return">
                                                    <CheckCircle className="w-3 h-3" /> Verified
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">{income.employer}</div>

                                        <div className="flex gap-6 text-sm">
                                            <div>
                                                <span className="block text-xs text-slate-500 uppercase tracking-wider">Base</span>
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(income.baseSalary)}</span>
                                            </div>
                                            <div>
                                                <span className="block text-xs text-slate-500 uppercase tracking-wider">Total</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(income.totalEarnings)}</span>
                                            </div>
                                            {income.superAmount && (
                                                <div>
                                                    <span className="block text-xs text-slate-500 uppercase tracking-wider">Super</span>
                                                    <span className="text-slate-600 dark:text-slate-400">{formatCurrency(income.superAmount)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="flex-1 md:flex-none">
                                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Production Multiplier</div>
                                            <div className={`text-2xl font-bold flex items-center gap-2 ${isHighUtilization ? 'text-green-500' : 'text-blue-500'}`}>
                                                {multiplier}x
                                                {isHighUtilization && <TrendingUp className="w-4 h-4" />}
                                            </div>
                                            {isHighUtilization && (
                                                <div className="text-xs text-green-600 font-medium">High Utilization Specialist</div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
                                            <button
                                                onClick={() => handleEdit(income)}
                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(income.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                )}
            </div>
        </div>
    );
};
