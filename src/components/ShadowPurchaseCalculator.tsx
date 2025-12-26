import React, { useState, useMemo } from 'react';
import { PlusCircle, Wallet, Scale, Landmark, Info, Home, TrendingUp, AlertTriangle, Calculator } from 'lucide-react';
import { WealthItem } from '../types';

interface ShadowPurchase {
    price: number;
    depositPercent: number;
    interestRate: number;
    rentPerWeek: number;
    state: 'nsw' | 'vic' | 'qld' | 'wa' | 'sa' | 'tas' | 'act' | 'nt';
    isFirstHome: boolean;
    isInvestment: boolean;
}

interface ShadowPurchaseCalculatorProps {
    wealthItems: WealthItem[];
    formatCurrency: (value: number) => string;
}

// Australian stamp duty rates by state (simplified - actual rates have more brackets)
const STAMP_DUTY_RATES: Record<string, { thresholds: number[]; rates: number[]; firstHomeConcession: number }> = {
    nsw: {
        thresholds: [0, 32000, 87000, 327000, 1089000],
        rates: [0.0125, 0.015, 0.0175, 0.035, 0.045],
        firstHomeConcession: 0.5 // 50% reduction for first home buyers up to certain value
    },
    vic: {
        thresholds: [0, 25000, 130000, 440000, 550000, 960000],
        rates: [0.014, 0.024, 0.05, 0.06, 0.055, 0.065],
        firstHomeConcession: 1.0 // Full exemption for first home under threshold
    },
    qld: {
        thresholds: [0, 5000, 75000, 540000, 1000000],
        rates: [0, 0.015, 0.035, 0.045, 0.0575],
        firstHomeConcession: 0.5
    },
    wa: {
        thresholds: [0, 80000, 100000, 250000, 500000],
        rates: [0.019, 0.0285, 0.038, 0.0475, 0.0515],
        firstHomeConcession: 0.5
    },
    sa: {
        thresholds: [0, 12000, 30000, 50000, 100000, 200000, 250000, 300000, 500000],
        rates: [0.01, 0.02, 0.03, 0.035, 0.04, 0.0425, 0.0475, 0.05, 0.055],
        firstHomeConcession: 0
    },
    tas: {
        thresholds: [0, 3000, 25000, 75000, 200000, 375000, 725000],
        rates: [0.017, 0.0225, 0.035, 0.04, 0.0425, 0.045, 0.0475],
        firstHomeConcession: 0.5
    },
    act: {
        thresholds: [0, 200000, 300000, 500000, 750000, 1000000, 1455000],
        rates: [0, 0.022, 0.034, 0.044, 0.055, 0.0465, 0.05],
        firstHomeConcession: 1.0
    },
    nt: {
        thresholds: [0, 525000, 3000000],
        rates: [0, 0.0495, 0.0575],
        firstHomeConcession: 0.5
    },
};

const STATE_NAMES: Record<string, string> = {
    nsw: 'New South Wales',
    vic: 'Victoria',
    qld: 'Queensland',
    wa: 'Western Australia',
    sa: 'South Australia',
    tas: 'Tasmania',
    act: 'ACT',
    nt: 'Northern Territory',
};

export const ShadowPurchaseCalculator: React.FC<ShadowPurchaseCalculatorProps> = ({
    wealthItems,
    formatCurrency
}) => {
    const [purchase, setPurchase] = useState<ShadowPurchase>({
        price: 650000,
        depositPercent: 20,
        interestRate: 6.2,
        rentPerWeek: 550,
        state: 'qld',
        isFirstHome: false,
        isInvestment: true,
    });

    // Calculate stamp duty based on state and purchase price
    const calculateStampDuty = (price: number, state: string, isFirstHome: boolean, isInvestment: boolean) => {
        const stateRates = STAMP_DUTY_RATES[state];
        if (!stateRates) return price * 0.04; // Fallback to 4%

        // Calculate base stamp duty using progressive rates
        let duty = 0;
        let previousThreshold = 0;

        for (let i = 0; i < stateRates.thresholds.length; i++) {
            const threshold = stateRates.thresholds[i];
            const rate = stateRates.rates[i];
            const nextThreshold = stateRates.thresholds[i + 1] || Infinity;

            if (price > threshold) {
                const taxableAmount = Math.min(price, nextThreshold) - threshold;
                duty += taxableAmount * rate;
            }
        }

        // Apply first home buyer concession (simplified)
        if (isFirstHome && !isInvestment && price < 800000) {
            duty *= (1 - stateRates.firstHomeConcession);
        }

        // Add foreign investor surcharge if applicable (not modeled here)

        return duty;
    };

    const calculations = useMemo(() => {
        const deposit = purchase.price * (purchase.depositPercent / 100);
        const loanAmount = purchase.price - deposit;
        const stampDuty = calculateStampDuty(purchase.price, purchase.state, purchase.isFirstHome, purchase.isInvestment);

        // Other costs (legal, inspections, LMI if <20% deposit)
        const legalCosts = 2500;
        const inspectionCosts = 1000;
        const lmi = purchase.depositPercent < 20 ? loanAmount * 0.02 : 0; // Rough LMI estimate

        const totalCashRequired = deposit + stampDuty + legalCosts + inspectionCosts + lmi;

        // Monthly repayment calculation (P&I over 30 years)
        const monthlyRate = purchase.interestRate / 100 / 12;
        const numPayments = 30 * 12;
        const monthlyRepayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

        const weeklyRepayment = monthlyRepayment * 12 / 52;
        const annualInterest = loanAmount * (purchase.interestRate / 100);
        const weeklyInterest = annualInterest / 52;

        // Cash flow calculations
        const grossRent = purchase.rentPerWeek;
        const managementFees = grossRent * 0.08; // 8% management
        const maintenanceAllowance = grossRent * 0.05; // 5% maintenance
        const insurance = 25; // ~$1300/year
        const councilRates = 35; // ~$1800/year
        const waterRates = 15; // ~$780/year

        const weeklyExpenses = weeklyInterest + managementFees + maintenanceAllowance + insurance + councilRates + waterRates;
        const netWeeklyCashflow = grossRent - weeklyExpenses;
        const netWeeklyCashflowAfterPrincipal = grossRent - weeklyRepayment - managementFees - maintenanceAllowance - insurance - councilRates - waterRates;

        // LVR impact on portfolio
        const currentTotalValue = wealthItems
            .filter(i => i.category === 'real-estate')
            .reduce((sum, i) => sum + i.value, 0);
        const currentTotalLoans = wealthItems
            .filter(i => i.category === 'real-estate' && i.loanAmount)
            .reduce((sum, i) => sum + (i.loanAmount || 0), 0);

        const currentPortfolioLVR = currentTotalValue > 0 ? (currentTotalLoans / currentTotalValue) * 100 : 0;
        const proposedPortfolioLVR = ((currentTotalLoans + loanAmount) / (currentTotalValue + purchase.price)) * 100;

        return {
            deposit,
            loanAmount,
            stampDuty,
            legalCosts,
            inspectionCosts,
            lmi,
            totalCashRequired,
            monthlyRepayment,
            weeklyRepayment,
            weeklyInterest,
            grossRent,
            weeklyExpenses,
            netWeeklyCashflow,
            netWeeklyCashflowAfterPrincipal,
            currentPortfolioLVR,
            proposedPortfolioLVR,
            lvr: (loanAmount / purchase.price) * 100,
        };
    }, [purchase, wealthItems]);

    return (
        <div className="mt-8 bg-theme-primary border-2 border-dashed border-violet-500/50 rounded-2xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-theme pb-4">
                <div className="p-2 bg-violet-500/10 rounded-lg">
                    <PlusCircle className="w-6 h-6 text-violet-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-theme-primary">Shadow Purchase Calculator</h3>
                    <p className="text-xs text-theme-secondary">Model your next acquisition before committing</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Side */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-theme-secondary">Purchase Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-tertiary">$</span>
                                <input
                                    type="number"
                                    value={purchase.price}
                                    onChange={(e) => setPurchase({ ...purchase, price: Number(e.target.value) })}
                                    className="w-full bg-theme-tertiary border border-theme rounded-lg p-2 pl-7 text-sm font-mono text-theme-primary"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-theme-secondary">Deposit %</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={purchase.depositPercent}
                                    onChange={(e) => setPurchase({ ...purchase, depositPercent: Number(e.target.value) })}
                                    className="w-full bg-theme-tertiary border border-theme rounded-lg p-2 pr-7 text-sm font-mono text-theme-primary"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-tertiary">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-theme-secondary">Interest Rate</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={purchase.interestRate}
                                    onChange={(e) => setPurchase({ ...purchase, interestRate: Number(e.target.value) })}
                                    className="w-full bg-theme-tertiary border border-theme rounded-lg p-2 pr-7 text-sm font-mono text-theme-primary"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-tertiary">%</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-theme-secondary">Est. Weekly Rent</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-tertiary">$</span>
                                <input
                                    type="number"
                                    value={purchase.rentPerWeek}
                                    onChange={(e) => setPurchase({ ...purchase, rentPerWeek: Number(e.target.value) })}
                                    className="w-full bg-theme-tertiary border border-theme rounded-lg p-2 pl-7 text-sm font-mono text-theme-primary"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-theme-secondary">State</label>
                            <select
                                value={purchase.state}
                                onChange={(e) => setPurchase({ ...purchase, state: e.target.value as ShadowPurchase['state'] })}
                                className="w-full bg-theme-tertiary border border-theme rounded-lg p-2 text-sm text-theme-primary"
                            >
                                {Object.entries(STATE_NAMES).map(([key, name]) => (
                                    <option key={key} value={key}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2 pt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={purchase.isFirstHome}
                                    onChange={(e) => setPurchase({ ...purchase, isFirstHome: e.target.checked })}
                                    className="w-4 h-4 text-violet-500 rounded"
                                />
                                <span className="text-xs text-theme-secondary">First Home Buyer</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={purchase.isInvestment}
                                    onChange={(e) => setPurchase({ ...purchase, isInvestment: e.target.checked })}
                                    className="w-4 h-4 text-violet-500 rounded"
                                />
                                <span className="text-xs text-theme-secondary">Investment Property</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Results Side */}
                <div className="bg-theme-tertiary/20 rounded-xl p-4 space-y-4 border border-theme">
                    {/* Upfront Costs */}
                    <div className="border-b border-theme/50 pb-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-theme-secondary uppercase flex items-center gap-2">
                                <Wallet className="w-4 h-4" /> Upfront Cash Required
                            </span>
                            <span className="text-xl font-black text-theme-primary">{formatCurrency(calculations.totalCashRequired)}</span>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-theme-secondary">Deposit ({purchase.depositPercent}%)</span>
                                <span className="font-mono">{formatCurrency(calculations.deposit)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-theme-secondary flex items-center gap-1">
                                    <Scale className="w-3 h-3" /> Stamp Duty ({STATE_NAMES[purchase.state]})
                                </span>
                                <span className="font-mono">{formatCurrency(calculations.stampDuty)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-theme-secondary">Legal & Conveyancing</span>
                                <span className="font-mono">{formatCurrency(calculations.legalCosts)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-theme-secondary">Building & Pest Inspections</span>
                                <span className="font-mono">{formatCurrency(calculations.inspectionCosts)}</span>
                            </div>
                            {calculations.lmi > 0 && (
                                <div className="flex justify-between text-amber-600">
                                    <span className="flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> LMI (Est.)
                                    </span>
                                    <span className="font-mono">{formatCurrency(calculations.lmi)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Loan Details */}
                    <div className="space-y-2 border-b border-theme/50 pb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-theme-secondary flex items-center gap-1"><Landmark className="w-3 h-3" /> Loan Amount</span>
                            <span className="font-mono font-semibold">{formatCurrency(calculations.loanAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-theme-secondary">LVR</span>
                            <span className={`font-mono font-semibold ${calculations.lvr > 80 ? 'text-rose-500' : 'text-theme-primary'}`}>
                                {calculations.lvr.toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-theme-secondary">Monthly Repayment (P&I)</span>
                            <span className="font-mono">{formatCurrency(calculations.monthlyRepayment)}</span>
                        </div>
                    </div>

                    {/* Cash Flow */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-theme-secondary">Gross Weekly Rent</span>
                            <span className="font-mono text-emerald-600">+{formatCurrency(calculations.grossRent)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-theme-secondary">Weekly Expenses (All-in)</span>
                            <span className="font-mono text-rose-500">-{formatCurrency(calculations.weeklyExpenses)}</span>
                        </div>

                        <div className={`flex justify-between p-3 rounded-lg ${calculations.netWeeklyCashflow >= 0
                                ? 'bg-emerald-500/10 border border-emerald-500/30'
                                : 'bg-rose-500/10 border border-rose-500/30'
                            }`}>
                            <span className="text-xs font-bold uppercase self-center">
                                Net Weekly (Interest Only)
                            </span>
                            <span className={`text-lg font-black font-mono ${calculations.netWeeklyCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                {calculations.netWeeklyCashflow >= 0 ? '+' : ''}{formatCurrency(calculations.netWeeklyCashflow)}
                            </span>
                        </div>

                        <div className={`flex justify-between p-3 rounded-lg ${calculations.netWeeklyCashflowAfterPrincipal >= 0
                                ? 'bg-emerald-500/10 border border-emerald-500/30'
                                : 'bg-amber-500/10 border border-amber-500/30'
                            }`}>
                            <span className="text-xs font-bold uppercase self-center">
                                Net Weekly (P&I Repayment)
                            </span>
                            <span className={`text-lg font-black font-mono ${calculations.netWeeklyCashflowAfterPrincipal >= 0 ? 'text-emerald-600' : 'text-amber-600'
                                }`}>
                                {calculations.netWeeklyCashflowAfterPrincipal >= 0 ? '+' : ''}{formatCurrency(calculations.netWeeklyCashflowAfterPrincipal)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Portfolio Impact */}
            {wealthItems.some(i => i.category === 'real-estate') && (
                <div className="mt-4 p-4 bg-theme-tertiary/30 rounded-xl border border-theme">
                    <h4 className="text-sm font-bold text-theme-primary mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Portfolio Impact
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-theme-primary rounded-lg border border-theme">
                            <span className="text-[10px] text-theme-secondary uppercase block">Current Portfolio LVR</span>
                            <span className="text-lg font-bold text-theme-primary">{calculations.currentPortfolioLVR.toFixed(1)}%</span>
                        </div>
                        <div className={`p-3 rounded-lg border ${calculations.proposedPortfolioLVR > 80
                                ? 'bg-rose-500/10 border-rose-500/30'
                                : 'bg-theme-primary border-theme'
                            }`}>
                            <span className="text-[10px] text-theme-secondary uppercase block">Proposed Portfolio LVR</span>
                            <span className={`text-lg font-bold ${calculations.proposedPortfolioLVR > 80 ? 'text-rose-500' : 'text-theme-primary'
                                }`}>
                                {calculations.proposedPortfolioLVR.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    {calculations.proposedPortfolioLVR > 80 && (
                        <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-rose-600">
                                <strong>High Leverage Warning:</strong> This purchase would push your portfolio LVR above 80%,
                                which may require Lender's Mortgage Insurance and increases your risk exposure.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Disclaimer */}
            <div className="mt-4 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10 flex gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700/70 dark:text-blue-400/70 leading-relaxed">
                    <strong>Note:</strong> This calculator provides estimates only. Actual costs may vary based on your
                    specific circumstances, lender requirements, and current rates. Stamp duty calculations are
                    simplified and may not reflect all concessions or surcharges. Always consult with a
                    financial advisor and conveyancer before making property decisions.
                </p>
            </div>
        </div>
    );
};
