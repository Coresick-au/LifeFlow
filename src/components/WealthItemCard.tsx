import React, { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { Home, TrendingUp, Percent, Calculator, Building2, Landmark, PiggyBank, CreditCard } from 'lucide-react';
import { WealthItem } from '../types';

interface WealthItemCardProps {
    item: WealthItem;
    onEdit?: (item: WealthItem) => void;
    onDelete?: (id: string) => void;
    formatCurrency: (value: number) => string;
}

export const WealthItemCard: React.FC<WealthItemCardProps> = ({
    item,
    onEdit,
    onDelete,
    formatCurrency
}) => {
    const loan = item.loanAmount || 0;
    const equity = item.value - loan;
    const lvr = item.value > 0 ? (loan / item.value) * 100 : 0;

    // Get category icon and colors
    const getCategoryConfig = () => {
        switch (item.category) {
            case 'real-estate':
                return {
                    icon: Home,
                    bg: 'bg-blue-500/10',
                    text: 'text-blue-500',
                    border: 'border-blue-500/30'
                };
            case 'investment':
                return {
                    icon: TrendingUp,
                    bg: 'bg-emerald-500/10',
                    text: 'text-emerald-500',
                    border: 'border-emerald-500/30'
                };
            case 'business':
                return {
                    icon: Building2,
                    bg: 'bg-purple-500/10',
                    text: 'text-purple-500',
                    border: 'border-purple-500/30'
                };
            case 'superannuation':
                return {
                    icon: Landmark,
                    bg: 'bg-indigo-500/10',
                    text: 'text-indigo-500',
                    border: 'border-indigo-500/30'
                };
            case 'savings':
                return {
                    icon: PiggyBank,
                    bg: 'bg-green-500/10',
                    text: 'text-green-500',
                    border: 'border-green-500/30'
                };
            case 'debt':
                return {
                    icon: CreditCard,
                    bg: 'bg-rose-500/10',
                    text: 'text-rose-500',
                    border: 'border-rose-500/30'
                };
            default:
                return {
                    icon: TrendingUp,
                    bg: 'bg-slate-500/10',
                    text: 'text-slate-500',
                    border: 'border-slate-500/30'
                };
        }
    };

    const config = getCategoryConfig();
    const Icon = config.icon;

    // Calculate Performance Metrics
    const performance = useMemo(() => {
        if (!item.purchasePrice || !item.purchaseDate || item.purchasePrice === 0) return null;

        const purchasePrice = item.purchasePrice;
        const currentValue = item.value;
        const totalGain = currentValue - purchasePrice;
        const roi = (totalGain / purchasePrice) * 100;

        const purchaseDate = new Date(item.purchaseDate);
        const now = new Date();
        const daysHeld = differenceInDays(now, purchaseDate);
        const yearsHeld = daysHeld / 365.25;

        // CAGR Formula: (End Value / Start Value) ^ (1 / n) - 1
        let cagr = 0;
        if (yearsHeld > 1 && purchasePrice > 0 && currentValue > 0) {
            cagr = (Math.pow(currentValue / purchasePrice, 1 / yearsHeld) - 1) * 100;
        }

        return {
            totalGain,
            roi,
            cagr,
            yearsHeld
        };
    }, [item.purchasePrice, item.purchaseDate, item.value]);

    return (
        <div className={`bg-theme-primary border ${config.border} rounded-xl p-5 shadow-sm hover:shadow-lg transition-all group`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${config.bg} ${config.text}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-theme-primary">{item.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-theme-secondary font-mono uppercase tracking-tighter">{item.category}</span>
                            {item.propertyType && (
                                <span className="text-[10px] px-2 py-0.5 bg-theme-tertiary rounded-full text-theme-secondary">
                                    {item.propertyType}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-theme-secondary uppercase font-medium">Market Value</p>
                    <p className={`text-xl font-bold ${item.category === 'debt' ? 'text-rose-500' : 'text-theme-primary'}`}>
                        {item.category === 'debt' ? '-' : ''}{formatCurrency(item.value)}
                    </p>
                </div>
            </div>

            {/* Performance Metrics (ROI / CAGR) */}
            {performance && (
                <div className="mb-4 pb-4 border-b border-theme/50">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <div className={`p-3 rounded-lg border border-theme/50 ${performance.totalGain >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                            <span className="text-[10px] text-theme-secondary uppercase font-bold block mb-1">Total Gain/Loss</span>
                            <span className={`text-lg font-bold ${performance.totalGain >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {performance.totalGain >= 0 ? '+' : ''}{formatCurrency(performance.totalGain)}
                            </span>
                            <span className={`text-xs ml-1 font-medium ${performance.totalGain >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                                ({performance.roi.toFixed(1)}%)
                            </span>
                        </div>
                        <div className="p-3 bg-theme-tertiary/20 rounded-lg border border-theme/50 flex flex-col justify-center">
                            <span className="text-[10px] text-theme-secondary uppercase font-bold block mb-1">CAGR (Annual Return)</span>
                            <span className="text-lg font-bold text-theme-primary">
                                {performance.yearsHeld < 1 ? 'N/A (<1yr)' : `${performance.cagr.toFixed(1)}%`}
                            </span>
                            <span className="text-[10px] text-theme-tertiary">
                                Over {performance.yearsHeld.toFixed(1)} years
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Loan/Mortgage Details */}
            {item.loanAmount !== undefined && item.loanAmount > 0 && (
                <div className="space-y-4 border-t border-theme pt-4">
                    {/* Equity & LVR Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-theme-tertiary/40 rounded-lg border border-theme/50">
                            <span className="text-[10px] text-theme-secondary uppercase font-bold block mb-1">Equity</span>
                            <span className={`text-lg font-bold ${equity >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {formatCurrency(equity)}
                            </span>
                        </div>
                        <div className="p-3 bg-theme-tertiary/40 rounded-lg border border-theme/50">
                            <span className="text-[10px] text-theme-secondary uppercase font-bold block mb-1">LVR Ratio</span>
                            <span className={`text-lg font-bold ${lvr > 80 ? 'text-rose-500' : lvr > 60 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {lvr.toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    {/* Loan Details */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 bg-theme-tertiary/20 rounded-lg">
                            <span className="text-[10px] text-theme-secondary uppercase block">Loan Balance</span>
                            <span className="text-sm font-semibold text-rose-500">{formatCurrency(loan)}</span>
                        </div>
                        {item.interestRate !== undefined && (
                            <div className="p-2 bg-theme-tertiary/20 rounded-lg">
                                <span className="text-[10px] text-theme-secondary uppercase block">Interest Rate</span>
                                <span className="text-sm font-semibold text-theme-primary">{item.interestRate}% p.a.</span>
                            </div>
                        )}
                    </div>

                    {/* Repayment Info */}
                    {item.repaymentAmount !== undefined && item.repaymentFrequency && (
                        <div className="flex items-center justify-between text-sm px-1 py-2 bg-theme-tertiary/20 rounded-lg">
                            <div className="flex items-center gap-2 text-theme-secondary">
                                <Calculator className="w-4 h-4" />
                                <span>Repayments</span>
                            </div>
                            <span className="font-bold text-theme-primary">
                                {formatCurrency(item.repaymentAmount)} / {item.repaymentFrequency}
                            </span>
                        </div>
                    )}

                    {/* LVR Visualizer Bar */}
                    <div className="relative pt-1">
                        <div className="flex justify-between text-[10px] text-theme-tertiary mb-1 uppercase font-bold">
                            <span>Debt: {formatCurrency(loan)}</span>
                            <span>Value: {formatCurrency(item.value)}</span>
                        </div>
                        <div className="w-full bg-theme-tertiary h-3 rounded-full overflow-hidden relative">
                            <div
                                className={`h-full transition-all duration-700 rounded-full ${lvr > 80 ? 'bg-rose-500' : lvr > 60 ? 'bg-amber-500' : 'bg-blue-500'
                                    }`}
                                style={{ width: `${Math.min(lvr, 100)}%` }}
                            />
                            {/* 80% marker */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-rose-600/50"
                                style={{ left: '80%' }}
                                title="80% LVR threshold"
                            />
                        </div>
                        <div className="flex justify-end mt-1">
                            <span className="text-[9px] text-theme-tertiary">80% threshold</span>
                        </div>
                    </div>

                    {/* Estimated Growth */}
                    {item.estimatedGrowth !== undefined && item.estimatedGrowth > 0 && (
                        <div className="flex items-center justify-between text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                            <span className="text-emerald-600 font-medium">Est. Annual Growth</span>
                            <span className="font-bold text-emerald-600">
                                +{formatCurrency(item.value * item.estimatedGrowth / 100)} ({item.estimatedGrowth}%)
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Actions (visible on hover) */}
            {(onEdit || onDelete) && (
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-theme opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(item)}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg transition-colors"
                        >
                            Edit
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(item.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg transition-colors"
                        >
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
