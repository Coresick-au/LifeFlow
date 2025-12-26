import React, { useState, useEffect, useMemo } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { WealthItem } from '../types';
import { DollarSign, TrendingUp, Lock, AlertCircle, Plus, Edit2, Trash2, PiggyBank, BarChart3, History, Home, ArrowUpRight, Building2 } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { WealthItemCard } from './WealthItemCard';
import { PropertySimulator } from './PropertySimulator';
import { ShadowPurchaseCalculator } from './ShadowPurchaseCalculator';
import { NetWorthChart } from './NetWorthChart';

// DebtAnalytics Component for LVR visualization
const DebtAnalytics: React.FC<{ items: WealthItem[], formatCurrency: (v: number) => string }> = ({ items, formatCurrency }) => {
    const propertyItems = items.filter(i => i.loanAmount && i.loanAmount > 0);

    if (propertyItems.length === 0) return null;

    const avgLvr = propertyItems.reduce((acc, i) => acc + ((i.loanAmount || 0) / i.value), 0) / propertyItems.length * 100;
    const totalEquity = propertyItems.reduce((acc, i) => acc + (i.value - (i.loanAmount || 0)), 0);
    const annualGrowth = propertyItems.reduce((acc, i) => acc + (i.value * (i.estimatedGrowth || 0) / 100), 0);

    return (
        <div className="mt-8 p-6 bg-theme-tertiary/20 rounded-2xl border border-theme">
            <h3 className="text-xl font-bold text-theme-primary mb-6 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-theme-accent" />
                Leverage & Risk Analysis
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LVR Bar Chart */}
                <div className="lg:col-span-2 h-64 flex items-end gap-4 px-4 border-b border-l border-theme/50 relative">
                    {/* 80% threshold line */}
                    <div
                        className="absolute left-0 right-4 border-t-2 border-dashed border-rose-500/50"
                        style={{ bottom: '80%' }}
                    >
                        <span className="absolute -top-4 right-0 text-[10px] text-rose-500 font-bold">80% LVR</span>
                    </div>

                    {propertyItems.map(item => {
                        const lvr = ((item.loanAmount || 0) / item.value) * 100;
                        return (
                            <div key={item.id} className="flex-1 flex flex-col items-center group relative">
                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-theme-primary border border-theme px-2 py-1 rounded text-xs font-bold z-10 whitespace-nowrap shadow-lg">
                                    {lvr.toFixed(1)}% LVR
                                </div>
                                <div
                                    className={`w-full rounded-t-lg transition-all duration-500 ${lvr > 80 ? 'bg-rose-500/80' : lvr > 60 ? 'bg-amber-500/80' : 'bg-blue-500/80'}`}
                                    style={{ height: `${Math.min(lvr, 100)}%` }}
                                />
                                <span className="text-[9px] font-bold text-theme-secondary mt-2 truncate w-full text-center uppercase tracking-tighter">
                                    {item.name.length > 12 ? item.name.slice(0, 12) + '...' : item.name}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Global Stats */}
                <div className="space-y-4">
                    <div className="p-4 bg-theme-primary border border-theme rounded-xl shadow-sm">
                        <p className="text-xs text-theme-secondary font-bold uppercase mb-1">Average Portfolio LVR</p>
                        <p className={`text-3xl font-black ${avgLvr > 80 ? 'text-rose-500' : avgLvr > 60 ? 'text-amber-500' : 'text-theme-primary'}`}>
                            {avgLvr.toFixed(1)}%
                        </p>
                    </div>
                    <div className="p-4 bg-theme-primary border border-theme rounded-xl shadow-sm">
                        <p className="text-xs text-theme-secondary font-bold uppercase mb-1">Total Property Equity</p>
                        <p className="text-2xl font-bold text-emerald-500">
                            {formatCurrency(totalEquity)}
                        </p>
                    </div>
                    {annualGrowth > 0 && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                            <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Est. Annual Growth</p>
                            <p className="text-xl font-bold text-emerald-500">
                                +{formatCurrency(annualGrowth)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export function WealthTracker() {
    const {
        wealthItems,
        loadWealthItems,
        loadWealthHistory,
        getWealthItemHistory,
        addWealthItem,
        updateWealthItem,
        removeWealthItem,
        getTotalNetWorth,
        getLiquidAssets,
        getTotalDebt,
        getSuperannuation,
        stories,
        setCurrentView,
    } = useTimelineStore();

    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<WealthItem | null>(null);
    const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        category: 'savings' as WealthItem['category'],
        name: '',
        value: '',
        isLiquid: true,
        loanAmount: '',
        interestRate: '',
        repaymentAmount: '',
        repaymentFrequency: 'monthly' as 'weekly' | 'fortnightly' | 'monthly',
        estimatedGrowth: '',
        propertyType: 'primary' as 'primary' | 'investment' | 'commercial',
        debtType: 'neutral' as 'productive' | 'destructive' | 'neutral',
    });

    useEffect(() => {
        loadWealthItems();
        loadWealthHistory();
    }, [loadWealthItems, loadWealthHistory]);

    // Calculate real estate equity from wealth items
    const getRealEstateEquity = () => {
        const realEstateItems = wealthItems.filter(item => item.category === 'real-estate');
        if (realEstateItems.length === 0) return 0;

        return realEstateItems.reduce((total, item) => {
            const equity = item.value - (item.loanAmount || 0);
            return total + equity;
        }, 0);
    };

    // Calculate days since last update
    const daysSinceLastUpdate = useMemo(() => {
        if (wealthItems.length === 0) return null;
        const mostRecent = wealthItems.reduce((latest, item) =>
            new Date(item.lastUpdated).getTime() > new Date(latest.lastUpdated).getTime() ? item : latest
        );
        return Math.floor((Date.now() - new Date(mostRecent.lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
    }, [wealthItems]);

    const getUpdateStatusColor = (days: number | null) => {
        if (days === null) return 'gray';
        if (days <= 7) return 'green';
        if (days <= 30) return 'yellow';
        return 'red';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsedValue = parseFloat(formData.value);

        // Validation
        if (isNaN(parsedValue) || parsedValue < 0) {
            alert('Please enter a valid positive number for the value');
            return;
        }

        const itemData: Partial<WealthItem> = {
            category: formData.category,
            name: formData.name.trim(),
            value: parsedValue,
            isLiquid: formData.category === 'superannuation' || formData.category === 'real-estate' ? false : formData.isLiquid,
        };

        // Add loan details if provided (for real-estate or any asset with a loan)
        if (formData.loanAmount && parseFloat(formData.loanAmount) > 0) {
            itemData.loanAmount = parseFloat(formData.loanAmount);
        }
        if (formData.interestRate && parseFloat(formData.interestRate) > 0) {
            itemData.interestRate = parseFloat(formData.interestRate);
        }
        if (formData.repaymentAmount && parseFloat(formData.repaymentAmount) > 0) {
            itemData.repaymentAmount = parseFloat(formData.repaymentAmount);
            itemData.repaymentFrequency = formData.repaymentFrequency;
        }
        if (formData.estimatedGrowth && parseFloat(formData.estimatedGrowth) > 0) {
            itemData.estimatedGrowth = parseFloat(formData.estimatedGrowth);
        }
        if (formData.category === 'real-estate') {
            itemData.propertyType = formData.propertyType;
        }
        if (formData.category === 'debt') {
            itemData.debtType = formData.debtType;
        }

        if (editingItem) {
            await updateWealthItem(editingItem.id, itemData);
        } else {
            await addWealthItem(itemData as Omit<WealthItem, 'id' | 'lastUpdated'>);
        }

        // Reload to ensure state is fresh
        await loadWealthItems();

        // Reset form
        setFormData({
            category: 'savings',
            name: '',
            value: '',
            isLiquid: true,
            loanAmount: '',
            interestRate: '',
            repaymentAmount: '',
            repaymentFrequency: 'monthly',
            estimatedGrowth: '',
            propertyType: 'primary',
            debtType: 'neutral',
        });
        setShowForm(false);
        setEditingItem(null);
    };

    const handleEdit = (item: WealthItem) => {
        setEditingItem(item);
        setFormData({
            category: item.category,
            name: item.name,
            value: item.value.toString(),
            isLiquid: item.isLiquid,
            loanAmount: item.loanAmount?.toString() || '',
            interestRate: item.interestRate?.toString() || '',
            repaymentAmount: item.repaymentAmount?.toString() || '',
            repaymentFrequency: item.repaymentFrequency || 'monthly',
            estimatedGrowth: item.estimatedGrowth?.toString() || '',
            propertyType: item.propertyType || 'primary',
            debtType: item.debtType || 'neutral',
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this wealth item?')) {
            await removeWealthItem(id);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const netWorth = getTotalNetWorth();
    const liquidAssets = getLiquidAssets();
    const debt = getTotalDebt();
    const super_ = getSuperannuation();
    const realEstate = getRealEstateEquity();

    // Debt breakdown by type
    const debtBreakdown = useMemo(() => {
        const debtItems = wealthItems.filter(i => i.category === 'debt');
        return {
            productive: debtItems.filter(i => i.debtType === 'productive').reduce((sum, i) => sum + i.value, 0),
            destructive: debtItems.filter(i => i.debtType === 'destructive').reduce((sum, i) => sum + i.value, 0),
            neutral: debtItems.filter(i => i.debtType === 'neutral' || !i.debtType).reduce((sum, i) => sum + i.value, 0),
        };
    }, [wealthItems]);

    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <PiggyBank className="w-10 h-10 text-green-600 dark:text-green-500" />
                        Wealth Tracker
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Track your assets, investments, and liabilities
                    </p>
                </div>
                <button
                    onClick={() => setCurrentView({ type: 'experimental' })}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                    <BarChart3 className="w-5 h-5" />
                    Compare with Benchmarks →
                </button>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Net Worth Card */}
                <div className={`p-6 rounded-2xl shadow-lg ${netWorth >= 0
                    ? 'bg-gradient-to-br from-green-500 to-green-600'
                    : 'bg-gradient-to-br from-red-500 to-red-600'
                    } text-white`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold opacity-90">Net Worth</h3>
                            <Tooltip content="Total value of your assets minus your debts. A snapshot of your overall financial position." />
                        </div>
                        <TrendingUp className="w-5 h-5 opacity-80" />
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(netWorth)}</p>
                    <p className="text-xs opacity-75 mt-2">Total Assets - Total Debt</p>
                </div>

                {/* Liquid Runway Card */}
                <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold opacity-90">Liquid Runway</h3>
                            <Tooltip content="How many months you can survive on your liquid assets (cash, savings) at $5k/month. Your emergency fund buffer." />
                        </div>
                        <DollarSign className="w-5 h-5 opacity-80" />
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(liquidAssets)}</p>
                    <p className="text-xs opacity-75 mt-2">
                        {liquidAssets > 0 ? `~${Math.floor(liquidAssets / 5000)} months at $5k/month` : 'No liquid assets'}
                    </p>
                </div>

                {/* Superannuation Card */}
                <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold opacity-90">Superannuation</h3>
                            <Tooltip content="Retirement savings locked until preservation age (typically 60). Cannot be accessed early except in hardship." />
                        </div>
                        <Lock className="w-5 h-5 opacity-80" />
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(super_)}</p>
                    <p className="text-xs opacity-75 mt-2">Locked until retirement</p>
                </div>

                {/* Total Debt Card */}
                <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold opacity-90">Total Debt</h3>
                            <Tooltip content="Productive debt builds wealth (mortgages). Destructive debt diminishes it (credit cards)." />
                        </div>
                        <AlertCircle className="w-5 h-5 opacity-80" />
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(debt)}</p>
                    {debt > 0 && (
                        <div className="mt-3 space-y-1.5">
                            {debtBreakdown.productive > 0 && (
                                <div className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-green-300 rounded-full"></span>
                                        Productive
                                    </span>
                                    <span className="font-semibold">{formatCurrency(debtBreakdown.productive)}</span>
                                </div>
                            )}
                            {debtBreakdown.destructive > 0 && (
                                <div className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-red-300 rounded-full"></span>
                                        Destructive
                                    </span>
                                    <span className="font-semibold">{formatCurrency(debtBreakdown.destructive)}</span>
                                </div>
                            )}
                            {debtBreakdown.neutral > 0 && (
                                <div className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                                        Neutral
                                    </span>
                                    <span className="font-semibold">{formatCurrency(debtBreakdown.neutral)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Real Estate Equity Card */}
                <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold opacity-90">Real Estate Equity</h3>
                            <Tooltip content="The portion of your property you truly own (market value minus mortgage). Calculated from your real estate wealth items." />
                        </div>
                        <Home className="w-5 h-5 opacity-80" />
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(realEstate)}</p>
                    <p className="text-xs opacity-75 mt-2">
                        {wealthItems.filter(i => i.category === 'real-estate').length} properties
                    </p>
                </div>
            </div>

            {/* Net Worth Chart */}
            <NetWorthChart />

            {/* Debt Analytics / LVR Visualization */}
            <DebtAnalytics items={wealthItems} formatCurrency={formatCurrency} />

            {/* Property Strategy Simulator */}
            <PropertySimulator items={wealthItems} formatCurrency={formatCurrency} />

            {/* Shadow Purchase Calculator */}
            <ShadowPurchaseCalculator wealthItems={wealthItems} formatCurrency={formatCurrency} />

            {/* Last Updated Indicator */}
            {daysSinceLastUpdate !== null && (
                <div className={`mb-6 p-4 rounded-xl border-2 ${getUpdateStatusColor(daysSinceLastUpdate) === 'green'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700'
                    : getUpdateStatusColor(daysSinceLastUpdate) === 'yellow'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-700'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-700'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getUpdateStatusColor(daysSinceLastUpdate) === 'green' ? 'bg-green-500'
                                : getUpdateStatusColor(daysSinceLastUpdate) === 'yellow' ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}></div>
                            <div>
                                <p className={`font-semibold ${getUpdateStatusColor(daysSinceLastUpdate) === 'green' ? 'text-green-900 dark:text-green-300'
                                    : getUpdateStatusColor(daysSinceLastUpdate) === 'yellow' ? 'text-yellow-900 dark:text-yellow-300'
                                        : 'text-red-900 dark:text-red-300'
                                    }`}>
                                    Last Updated: {daysSinceLastUpdate === 0 ? 'Today' : `${daysSinceLastUpdate} day${daysSinceLastUpdate === 1 ? '' : 's'} ago`}
                                </p>
                                <p className={`text-xs ${getUpdateStatusColor(daysSinceLastUpdate) === 'green' ? 'text-green-700 dark:text-green-400'
                                    : getUpdateStatusColor(daysSinceLastUpdate) === 'yellow' ? 'text-yellow-700 dark:text-yellow-400'
                                        : 'text-red-700 dark:text-red-400'
                                    }`}>
                                    {daysSinceLastUpdate <= 7
                                        ? '✓ Data is fresh'
                                        : daysSinceLastUpdate <= 30
                                            ? 'Consider updating your values'
                                            : '⚠ Values may be outdated'}
                                </p>
                            </div>
                        </div>
                        {daysSinceLastUpdate > 30 && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                                Update Now
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Add Item Button */}
            <div className="mb-6">
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingItem(null);
                        setFormData({
                            category: 'savings',
                            name: '',
                            value: '',
                            isLiquid: true,
                            loanAmount: '',
                            interestRate: '',
                            repaymentAmount: '',
                            repaymentFrequency: 'monthly',
                            estimatedGrowth: '',
                            propertyType: 'primary',
                            debtType: 'neutral',
                        });
                    }}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    {showForm ? 'Cancel' : 'Add Wealth Item'}
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl mb-8 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {editingItem ? 'Edit Wealth Item' : 'Add New Wealth Item'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Category
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as WealthItem['category'] })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                >
                                    <option value="savings">Savings</option>
                                    <option value="investment">Investment</option>
                                    <option value="real-estate">Real Estate</option>
                                    <option value="business">Business</option>
                                    <option value="superannuation">Superannuation</option>
                                    <option value="debt">Debt</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={formData.category === 'real-estate' ? 'e.g., 123 Main St, Sydney' : 'e.g., Commonwealth Bank Savings'}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Value */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {formData.category === 'real-estate' ? 'Market Value (AUD)' : 'Value (AUD)'}
                                </label>
                                <input
                                    type="number"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                    placeholder={formData.category === 'real-estate' ? '850000' : '25000'}
                                    step="0.01"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Is Liquid */}
                            <div className="flex items-center">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isLiquid}
                                        onChange={(e) => setFormData({ ...formData, isLiquid: e.target.checked })}
                                        disabled={formData.category === 'superannuation' || formData.category === 'real-estate'}
                                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <span className="ml-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Liquid Asset
                                        {(formData.category === 'superannuation' || formData.category === 'real-estate') && (
                                            <span className="text-xs text-gray-500 ml-1">(Auto-disabled)</span>
                                        )}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Real Estate / Loan Fields */}
                        {(formData.category === 'real-estate' || formData.category === 'investment') && (
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                    <Home className="w-4 h-4" />
                                    Loan & Mortgage Details (Optional)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Loan Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Loan Balance
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.loanAmount}
                                            onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                                            placeholder="500000"
                                            step="0.01"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        />
                                    </div>

                                    {/* Interest Rate */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Interest Rate (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.interestRate}
                                            onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                                            placeholder="5.5"
                                            step="0.01"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        />
                                    </div>

                                    {/* Repayment Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Repayment Amount
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.repaymentAmount}
                                            onChange={(e) => setFormData({ ...formData, repaymentAmount: e.target.value })}
                                            placeholder="2800"
                                            step="0.01"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        />
                                    </div>

                                    {/* Repayment Frequency */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Repayment Frequency
                                        </label>
                                        <select
                                            value={formData.repaymentFrequency}
                                            onChange={(e) => setFormData({ ...formData, repaymentFrequency: e.target.value as 'weekly' | 'fortnightly' | 'monthly' })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        >
                                            <option value="weekly">Weekly</option>
                                            <option value="fortnightly">Fortnightly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>

                                    {/* Estimated Growth */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Est. Annual Growth (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.estimatedGrowth}
                                            onChange={(e) => setFormData({ ...formData, estimatedGrowth: e.target.value })}
                                            placeholder="3.5"
                                            step="0.1"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        />
                                    </div>

                                    {/* Property Type */}
                                    {formData.category === 'real-estate' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                Property Type
                                            </label>
                                            <select
                                                value={formData.propertyType}
                                                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as 'primary' | 'investment' | 'commercial' })}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                            >
                                                <option value="primary">Primary Residence</option>
                                                <option value="investment">Investment Property</option>
                                                <option value="commercial">Commercial</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Debt Type Classification */}
                        {formData.category === 'debt' && (
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Debt Classification
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                    Categorize your debt to help analyze productive vs destructive debt ratios.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.debtType === 'productive'
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="debtType"
                                            value="productive"
                                            checked={formData.debtType === 'productive'}
                                            onChange={(e) => setFormData({ ...formData, debtType: e.target.value as 'productive' | 'destructive' | 'neutral' })}
                                            className="sr-only"
                                        />
                                        <div className="font-semibold text-green-700 dark:text-green-400 mb-1">Productive</div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Mortgages, business loans, investment loans (asset-backed debt that builds wealth)
                                        </p>
                                    </label>

                                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.debtType === 'destructive'
                                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="debtType"
                                            value="destructive"
                                            checked={formData.debtType === 'destructive'}
                                            onChange={(e) => setFormData({ ...formData, debtType: e.target.value as 'productive' | 'destructive' | 'neutral' })}
                                            className="sr-only"
                                        />
                                        <div className="font-semibold text-rose-700 dark:text-rose-400 mb-1">Destructive</div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Credit cards, personal loans, BNPL (non-asset-backed, often high interest)
                                        </p>
                                    </label>

                                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.debtType === 'neutral'
                                        ? 'border-gray-500 bg-gray-50 dark:bg-gray-700/50'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="debtType"
                                            value="neutral"
                                            checked={formData.debtType === 'neutral'}
                                            onChange={(e) => setFormData({ ...formData, debtType: e.target.value as 'productive' | 'destructive' | 'neutral' })}
                                            className="sr-only"
                                        />
                                        <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Neutral</div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Car loans, HECS/HELP, other moderate-interest debt
                                        </p>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                            >
                                {editingItem ? 'Update' : 'Add'} Item
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingItem(null);
                                }}
                                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Wealth Items Grid */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your Wealth Items</h3>
                    <span className="text-sm text-theme-secondary">{wealthItems.length} items</span>
                </div>

                {wealthItems.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <PiggyBank className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg">No wealth items yet</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                            Click "Add Wealth Item" to start tracking your finances
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {wealthItems.map((item) => (
                            <div key={item.id} className="relative">
                                <WealthItemCard
                                    item={item}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    formatCurrency={formatCurrency}
                                />

                                {/* History Button Overlay */}
                                {getWealthItemHistory(item.id).length > 0 && (
                                    <button
                                        onClick={() => setExpandedHistory(expandedHistory === item.id ? null : item.id)}
                                        className="absolute top-3 right-3 p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 rounded-lg transition-colors"
                                        title="View History"
                                    >
                                        <History className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Expandable History Section */}
                                {expandedHistory === item.id && (
                                    <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                                        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                            <History className="w-4 h-4" />
                                            Value History
                                        </h5>
                                        {getWealthItemHistory(item.id).length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                No history yet. History is recorded when you update the value.
                                            </p>
                                        ) : (
                                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                                {getWealthItemHistory(item.id).slice(0, 10).map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"
                                                    >
                                                        <div>
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                {new Date(entry.timestamp).toLocaleDateString('en-AU', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                            </span>
                                                            {entry.note && (
                                                                <span className="ml-2 text-gray-400 dark:text-gray-500 italic">
                                                                    — {entry.note}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                {formatCurrency(entry.previousValue)}
                                                            </span>
                                                            <span className="text-gray-400">→</span>
                                                            <span className={`font-semibold ${entry.changeAmount >= 0
                                                                ? 'text-green-600 dark:text-green-400'
                                                                : 'text-red-600 dark:text-red-400'
                                                                }`}>
                                                                {formatCurrency(entry.newValue)}
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${entry.changeAmount >= 0
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                }`}>
                                                                {entry.changeAmount >= 0 ? '+' : ''}{formatCurrency(entry.changeAmount)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
