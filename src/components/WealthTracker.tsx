import React, { useState, useEffect, useMemo } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { WealthItem } from '../types';
import { DollarSign, TrendingUp, Lock, AlertCircle, Plus, Edit2, Trash2, PiggyBank, BarChart3, History } from 'lucide-react';
import { Tooltip } from './Tooltip';

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
    });

    useEffect(() => {
        loadWealthItems();
        loadWealthHistory();
    }, [loadWealthItems, loadWealthHistory]);

    // Calculate real estate equity from HouseTracker
    const getRealEstateEquity = () => {
        const homeEvents = stories.filter(s =>
            s.tags.some(tag =>
                ['home', 'house', 'property', 'renovation'].includes(tag.toLowerCase())
            )
        );
        if (homeEvents.length === 0) return 0;

        // Get most recent home - just verify it exists
        const [latestHome] = homeEvents.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        if (!latestHome) return 0;

        // Extract property value from metadata (if exists)
        // This is a simplified calculation - in reality would need purchase price and current value
        return 0; // Placeholder - would need proper HouseTracker integration
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

        const itemData = {
            category: formData.category,
            name: formData.name.trim(),
            value: parsedValue,
            isLiquid: formData.category === 'superannuation' ? false : formData.isLiquid,
        };

        if (editingItem) {
            await updateWealthItem(editingItem.id, itemData);
        } else {
            await addWealthItem(itemData);
        }

        // Reload to ensure state is fresh
        await loadWealthItems();

        // Reset form
        setFormData({
            category: 'savings',
            name: '',
            value: '',
            isLiquid: true,
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
                            <Tooltip content="All money you owe - mortgages, loans, credit cards, etc. Aim to reduce this over time." />
                        </div>
                        <AlertCircle className="w-5 h-5 opacity-80" />
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(debt)}</p>
                    <p className="text-xs opacity-75 mt-2">Liabilities</p>
                </div>

                {/* Real Estate Equity Card */}
                <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold opacity-90">Real Estate Equity</h3>
                            <Tooltip content="The portion of your property you truly own (value minus mortgage). Read-only, calculated from Home Tracker." />
                        </div>
                        <Lock className="w-5 h-5 opacity-80" />
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(realEstate)}</p>
                    <p className="text-xs opacity-75 mt-2">From Home Tracker (Read-only)</p>
                </div>
            </div>

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
                        setFormData({ category: 'savings', name: '', value: '', isLiquid: true });
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
                                    placeholder="e.g., Commonwealth Bank Savings"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Value */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Value (AUD)
                                </label>
                                <input
                                    type="number"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                    placeholder="25000"
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
                                        disabled={formData.category === 'superannuation'}
                                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <span className="ml-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Liquid Asset
                                        {formData.category === 'superannuation' && (
                                            <span className="text-xs text-gray-500 ml-1">(Auto-disabled for super)</span>
                                        )}
                                    </span>
                                </label>
                            </div>
                        </div>

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

            {/* Wealth Items List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your Wealth Items</h3>
                </div>

                {wealthItems.length === 0 ? (
                    <div className="p-12 text-center">
                        <PiggyBank className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg">No wealth items yet</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                            Click "Add Wealth Item" to start tracking your finances
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {wealthItems.map((item) => (
                            <div
                                key={item.id}
                                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.category === 'debt'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : item.category === 'superannuation'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                            </span>
                                            {!item.isLiquid && (
                                                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <Lock className="w-3 h-3" />
                                                    Locked
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                            {item.name}
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Last updated: {new Date(item.lastUpdated).toLocaleDateString('en-AU')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-2xl font-bold ${item.category === 'debt'
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-green-600 dark:text-green-400'
                                            }`}>
                                            {item.category === 'debt' ? '-' : ''}{formatCurrency(item.value)}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setExpandedHistory(expandedHistory === item.id ? null : item.id)}
                                                className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${getWealthItemHistory(item.id).length > 0
                                                    ? 'text-purple-600 dark:text-purple-400'
                                                    : 'text-gray-400'
                                                    }`}
                                                title="View History"
                                            >
                                                <History className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable History Section */}
                                {expandedHistory === item.id && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                            <History className="w-4 h-4" />
                                            Value History
                                        </h5>
                                        {getWealthItemHistory(item.id).length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                No history yet. History is recorded when you update the value.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
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
