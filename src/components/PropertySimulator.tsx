import React, { useState, useMemo } from 'react';
import { WealthItem } from '../types';
import {
    TrendingUp, TrendingDown, Calculator, Percent,
    DollarSign, Calendar, AlertTriangle, ChevronDown, ChevronUp,
    Home, ArrowRight, Zap
} from 'lucide-react';

interface PropertySimulatorProps {
    items: WealthItem[];
    formatCurrency: (value: number) => string;
}

interface Scenario {
    id: string;
    name: string;
    rateChange: number; // e.g., +1.5 means rates go up 1.5%
    color: string;
}

const PRESET_SCENARIOS: Scenario[] = [
    { id: 'current', name: 'Current Rates', rateChange: 0, color: 'blue' },
    { id: 'rate-up-1', name: '+1% Rate Rise', rateChange: 1, color: 'amber' },
    { id: 'rate-up-2', name: '+2% Rate Rise', rateChange: 2, color: 'orange' },
    { id: 'rate-up-3', name: '+3% Rate Rise', rateChange: 3, color: 'rose' },
    { id: 'rate-down-1', name: '-1% Rate Cut', rateChange: -1, color: 'emerald' },
];

export const PropertySimulator: React.FC<PropertySimulatorProps> = ({ items, formatCurrency }) => {
    const [selectedScenario, setSelectedScenario] = useState<Scenario>(PRESET_SCENARIOS[0]);
    const [projectionYears, setProjectionYears] = useState(10);
    const [isExpanded, setIsExpanded] = useState(true);
    const [customRate, setCustomRate] = useState('');

    // Filter to only real estate with loans
    const propertyItems = useMemo(() =>
        items.filter(i => i.category === 'real-estate' && i.loanAmount && i.loanAmount > 0),
        [items]
    );

    if (propertyItems.length === 0) {
        return null;
    }

    // Calculate monthly repayment for a given loan amount, rate, and term (approximation)
    const calculateMonthlyRepayment = (principal: number, annualRate: number, termYears: number = 25) => {
        if (annualRate <= 0) return principal / (termYears * 12);
        const monthlyRate = annualRate / 100 / 12;
        const numPayments = termYears * 12;
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    };

    // Calculate repayment based on frequency
    const getPeriodicRepayment = (monthlyAmount: number, frequency: 'weekly' | 'fortnightly' | 'monthly' = 'monthly') => {
        switch (frequency) {
            case 'weekly': return monthlyAmount * 12 / 52;
            case 'fortnightly': return monthlyAmount * 12 / 26;
            default: return monthlyAmount;
        }
    };

    // Simulate cash flow impact
    const simulateCashFlow = (scenario: Scenario) => {
        let totalCurrentMonthly = 0;
        let totalNewMonthly = 0;

        propertyItems.forEach(item => {
            const currentRate = item.interestRate || 5;
            const newRate = currentRate + scenario.rateChange;
            const loan = item.loanAmount || 0;

            // Current repayment (use stored or calculate)
            const currentMonthly = item.repaymentAmount
                ? getPeriodicRepayment(item.repaymentAmount, item.repaymentFrequency) * (item.repaymentFrequency === 'weekly' ? 52 / 12 : item.repaymentFrequency === 'fortnightly' ? 26 / 12 : 1)
                : calculateMonthlyRepayment(loan, currentRate);

            // New repayment under scenario
            const newMonthly = calculateMonthlyRepayment(loan, Math.max(0.1, newRate));

            totalCurrentMonthly += currentMonthly;
            totalNewMonthly += newMonthly;
        });

        return {
            currentMonthly: totalCurrentMonthly,
            newMonthly: totalNewMonthly,
            difference: totalNewMonthly - totalCurrentMonthly,
            annualDifference: (totalNewMonthly - totalCurrentMonthly) * 12,
        };
    };

    // Project equity over time
    const projectEquity = (years: number, scenario: Scenario) => {
        const projections: { year: number; equity: number; propertyValue: number; loanBalance: number }[] = [];

        let totalPropertyValue = propertyItems.reduce((sum, i) => sum + i.value, 0);
        let totalLoanBalance = propertyItems.reduce((sum, i) => sum + (i.loanAmount || 0), 0);
        const avgGrowthRate = propertyItems.reduce((sum, i) => sum + (i.estimatedGrowth || 3), 0) / propertyItems.length / 100;

        // Average repayment per year (principal portion approximation)
        const avgRate = (propertyItems.reduce((sum, i) => sum + (i.interestRate || 5), 0) / propertyItems.length + scenario.rateChange) / 100;

        for (let year = 0; year <= years; year++) {
            projections.push({
                year,
                equity: totalPropertyValue - totalLoanBalance,
                propertyValue: totalPropertyValue,
                loanBalance: totalLoanBalance,
            });

            // Apply growth and principal reduction
            totalPropertyValue *= (1 + avgGrowthRate);

            // Principal reduction (simplified - assumes standard amortization)
            const yearlyInterest = totalLoanBalance * avgRate;
            const yearlyRepayment = propertyItems.reduce((sum, item) => {
                const monthly = calculateMonthlyRepayment(item.loanAmount || 0, (item.interestRate || 5) + scenario.rateChange);
                return sum + monthly * 12;
            }, 0);
            const principalPaydown = Math.max(0, yearlyRepayment - yearlyInterest);
            totalLoanBalance = Math.max(0, totalLoanBalance - principalPaydown);
        }

        return projections;
    };

    const cashFlow = simulateCashFlow(selectedScenario);
    const projections = projectEquity(projectionYears, selectedScenario);
    const finalEquity = projections[projections.length - 1]?.equity || 0;
    const currentEquity = projections[0]?.equity || 0;
    const equityGrowth = finalEquity - currentEquity;

    // Use custom rate if provided
    const effectiveScenario = customRate
        ? { ...selectedScenario, rateChange: parseFloat(customRate) - (propertyItems[0]?.interestRate || 5) }
        : selectedScenario;

    return (
        <div className="mt-8 bg-theme-primary border border-theme rounded-2xl overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-6 flex items-center justify-between hover:bg-theme-tertiary/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-lg">
                        <Zap className="w-6 h-6 text-violet-500" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-xl font-bold text-theme-primary">Property Strategy Simulator</h3>
                        <p className="text-sm text-theme-secondary">What-if scenarios for interest rates and equity projections</p>
                    </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {isExpanded && (
                <div className="px-6 pb-6 space-y-6">
                    {/* Scenario Selector */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {PRESET_SCENARIOS.map(scenario => (
                            <button
                                key={scenario.id}
                                onClick={() => {
                                    setSelectedScenario(scenario);
                                    setCustomRate('');
                                }}
                                className={`p-3 rounded-xl border-2 transition-all text-center ${selectedScenario.id === scenario.id && !customRate
                                        ? `border-${scenario.color}-500 bg-${scenario.color}-500/10`
                                        : 'border-theme hover:border-theme-accent/50'
                                    }`}
                            >
                                <span className={`text-sm font-bold ${scenario.rateChange > 0 ? 'text-rose-500' :
                                        scenario.rateChange < 0 ? 'text-emerald-500' : 'text-theme-primary'
                                    }`}>
                                    {scenario.name}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Custom Rate Input */}
                    <div className="flex items-center gap-4 p-4 bg-theme-tertiary/30 rounded-xl">
                        <Calculator className="w-5 h-5 text-theme-secondary" />
                        <span className="text-sm text-theme-secondary">Custom Rate:</span>
                        <input
                            type="number"
                            value={customRate}
                            onChange={(e) => setCustomRate(e.target.value)}
                            placeholder={`Current: ${propertyItems[0]?.interestRate || 5}%`}
                            step="0.1"
                            className="w-24 px-3 py-1.5 rounded-lg border border-theme bg-theme-primary text-theme-primary text-sm"
                        />
                        <span className="text-sm text-theme-secondary">% p.a.</span>
                    </div>

                    {/* Cash Flow Impact */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-theme-tertiary/30 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-theme-secondary" />
                                <span className="text-xs text-theme-secondary uppercase font-bold">Current Monthly</span>
                            </div>
                            <p className="text-2xl font-bold text-theme-primary">{formatCurrency(cashFlow.currentMonthly)}</p>
                        </div>

                        <div className={`p-4 rounded-xl ${cashFlow.difference > 0
                                ? 'bg-rose-500/10 border border-rose-500/30'
                                : cashFlow.difference < 0
                                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                                    : 'bg-theme-tertiary/30'
                            }`}>
                            <div className="flex items-center gap-2 mb-2">
                                {cashFlow.difference > 0 ? (
                                    <TrendingUp className="w-4 h-4 text-rose-500" />
                                ) : cashFlow.difference < 0 ? (
                                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <ArrowRight className="w-4 h-4 text-theme-secondary" />
                                )}
                                <span className="text-xs text-theme-secondary uppercase font-bold">Monthly Change</span>
                            </div>
                            <p className={`text-2xl font-bold ${cashFlow.difference > 0 ? 'text-rose-500' :
                                    cashFlow.difference < 0 ? 'text-emerald-500' : 'text-theme-primary'
                                }`}>
                                {cashFlow.difference >= 0 ? '+' : ''}{formatCurrency(cashFlow.difference)}
                            </p>
                            <p className="text-xs text-theme-secondary mt-1">
                                {formatCurrency(Math.abs(cashFlow.annualDifference))}/year
                            </p>
                        </div>

                        <div className="p-4 bg-theme-tertiary/30 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Calculator className="w-4 h-4 text-theme-secondary" />
                                <span className="text-xs text-theme-secondary uppercase font-bold">New Monthly</span>
                            </div>
                            <p className="text-2xl font-bold text-theme-primary">{formatCurrency(cashFlow.newMonthly)}</p>
                        </div>
                    </div>

                    {/* Warning for high rate increases */}
                    {cashFlow.difference > 500 && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-amber-600">Cash Flow Stress Warning</p>
                                <p className="text-sm text-amber-600/80">
                                    This scenario would increase your monthly payments by {formatCurrency(cashFlow.difference)}.
                                    Ensure you have sufficient buffer in your emergency fund.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Equity Projection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-theme-primary flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Equity Projection
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-theme-secondary">Projection:</span>
                                <select
                                    value={projectionYears}
                                    onChange={(e) => setProjectionYears(parseInt(e.target.value))}
                                    className="px-3 py-1 rounded-lg border border-theme bg-theme-primary text-theme-primary text-sm"
                                >
                                    <option value={5}>5 Years</option>
                                    <option value={10}>10 Years</option>
                                    <option value={15}>15 Years</option>
                                    <option value={20}>20 Years</option>
                                    <option value={25}>25 Years</option>
                                    <option value={30}>30 Years</option>
                                </select>
                            </div>
                        </div>

                        {/* Visual Projection Chart */}
                        <div className="h-48 flex items-end gap-1 px-2 border-b border-l border-theme/50 relative">
                            {/* Y-axis labels */}
                            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] text-theme-tertiary -ml-1 pr-1">
                                <span>{formatCurrency(Math.max(...projections.map(p => p.equity)))}</span>
                                <span>{formatCurrency(currentEquity)}</span>
                                <span>$0</span>
                            </div>

                            {projections.map((p, i) => {
                                const maxEquity = Math.max(...projections.map(pr => pr.equity));
                                const height = maxEquity > 0 ? (p.equity / maxEquity) * 100 : 0;
                                const isSelected = i === 0 || i === projections.length - 1 || i === Math.floor(projections.length / 2);

                                return (
                                    <div
                                        key={p.year}
                                        className="flex-1 flex flex-col items-center group relative"
                                        title={`Year ${p.year}: ${formatCurrency(p.equity)} equity`}
                                    >
                                        <div
                                            className={`w-full rounded-t transition-all duration-300 ${i === 0 ? 'bg-blue-500' :
                                                    i === projections.length - 1 ? 'bg-emerald-500' :
                                                        'bg-violet-500/60 group-hover:bg-violet-500'
                                                }`}
                                            style={{ height: `${Math.max(height, 2)}%` }}
                                        />
                                        {isSelected && (
                                            <span className="text-[8px] text-theme-tertiary mt-1 font-bold">
                                                Y{p.year}
                                            </span>
                                        )}

                                        {/* Tooltip on hover */}
                                        <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-theme-primary border border-theme px-2 py-1 rounded text-[10px] z-10 whitespace-nowrap shadow-lg">
                                            <div className="font-bold">Year {p.year}</div>
                                            <div>Equity: {formatCurrency(p.equity)}</div>
                                            <div className="text-theme-secondary">Value: {formatCurrency(p.propertyValue)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Projection Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <span className="text-[10px] text-blue-600 uppercase font-bold block">Today's Equity</span>
                                <span className="text-lg font-bold text-blue-600">{formatCurrency(currentEquity)}</span>
                            </div>
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                <span className="text-[10px] text-emerald-600 uppercase font-bold block">Year {projectionYears} Equity</span>
                                <span className="text-lg font-bold text-emerald-600">{formatCurrency(finalEquity)}</span>
                            </div>
                            <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                                <span className="text-[10px] text-violet-600 uppercase font-bold block">Total Growth</span>
                                <span className="text-lg font-bold text-violet-600">+{formatCurrency(equityGrowth)}</span>
                            </div>
                            <div className="p-3 bg-theme-tertiary/30 rounded-lg">
                                <span className="text-[10px] text-theme-secondary uppercase font-bold block">Avg Annual Growth</span>
                                <span className="text-lg font-bold text-theme-primary">
                                    +{formatCurrency(equityGrowth / projectionYears)}/yr
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Per-Property Breakdown */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-theme-primary flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            Property Breakdown
                        </h4>
                        <div className="space-y-2">
                            {propertyItems.map(item => {
                                const currentRate = item.interestRate || 5;
                                const newRate = currentRate + selectedScenario.rateChange;
                                const currentMonthly = item.repaymentAmount
                                    ? getPeriodicRepayment(item.repaymentAmount, item.repaymentFrequency) * (item.repaymentFrequency === 'weekly' ? 52 / 12 : item.repaymentFrequency === 'fortnightly' ? 26 / 12 : 1)
                                    : calculateMonthlyRepayment(item.loanAmount || 0, currentRate);
                                const newMonthly = calculateMonthlyRepayment(item.loanAmount || 0, Math.max(0.1, newRate));
                                const diff = newMonthly - currentMonthly;

                                return (
                                    <div key={item.id} className="p-4 bg-theme-tertiary/20 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-theme-primary">{item.name}</span>
                                            <span className={`text-sm font-bold ${diff > 0 ? 'text-rose-500' : diff < 0 ? 'text-emerald-500' : 'text-theme-secondary'}`}>
                                                {diff >= 0 ? '+' : ''}{formatCurrency(diff)}/mo
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 text-xs">
                                            <div>
                                                <span className="text-theme-tertiary block">Loan</span>
                                                <span className="text-theme-secondary">{formatCurrency(item.loanAmount || 0)}</span>
                                            </div>
                                            <div>
                                                <span className="text-theme-tertiary block">Current Rate</span>
                                                <span className="text-theme-secondary">{currentRate}%</span>
                                            </div>
                                            <div>
                                                <span className="text-theme-tertiary block">New Rate</span>
                                                <span className={newRate > currentRate ? 'text-rose-500' : newRate < currentRate ? 'text-emerald-500' : 'text-theme-secondary'}>
                                                    {newRate.toFixed(2)}%
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-theme-tertiary block">New Monthly</span>
                                                <span className="text-theme-secondary">{formatCurrency(newMonthly)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
