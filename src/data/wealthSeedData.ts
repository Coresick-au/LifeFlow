import { WealthItem } from '../types';

/**
 * Generate realistic Australian wealth test data
 * Represents a Brisbane-based investor in their late 30s with 2 investment properties
 */
export function generateAustralianWealthSeedData(): Omit<WealthItem, 'id' | 'lastUpdated'>[] {
    return [
        // Investment Properties
        {
            category: 'investment',
            name: 'Investment Property 1 - Logan',
            value: 500000, // Property value
            isLiquid: false,
        },
        {
            category: 'debt',
            name: 'Mortgage - Logan Property',
            value: 150000, // Outstanding mortgage
            isLiquid: false,
        },
        {
            category: 'investment',
            name: 'Investment Property 2 - Springfield',
            value: 1000000, // Property value
            isLiquid: false,
        },
        {
            category: 'debt',
            name: 'Mortgage - Springfield Property',
            value: 400000, // Outstanding mortgage
            isLiquid: false,
        },

        // Liquid Assets
        {
            category: 'savings',
            name: 'Commonwealth Bank Savings',
            value: 35000,
            isLiquid: true,
        },
        {
            category: 'savings',
            name: 'Emergency Fund (UBank)',
            value: 15000,
            isLiquid: true,
        },
        {
            category: 'investment',
            name: 'Vanguard Index Fund (VAS)',
            value: 25000,
            isLiquid: true,
        },

        // Superannuation (Locked)
        {
            category: 'superannuation',
            name: 'Australian Super',
            value: 180000,
            isLiquid: false,
        },

        // Debts
        {
            category: 'debt',
            name: 'HECS-HELP Debt',
            value: 8000, // Mostly paid off
            isLiquid: false,
        },

        // Other investments
        {
            category: 'investment',
            name: 'Raiz Micro-Investing',
            value: 6500,
            isLiquid: true,
        },
    ];
}

/**
 * Calculate net worth from seed data
 * Net worth = Assets - Debts
 * Properties: $500k + $1M = $1.5M value, $150k + $400k = $550k mortgages
 * Liquid: $35k + $15k + $25k + $6.5k = $81.5k
 * Super: $180k
 * Debt: $8k HECS
 * Net worth should be approximately $1.2M+
 */
export function calculateSeedNetWorth(): number {
    const items = generateAustralianWealthSeedData();
    return items.reduce((total, item) => {
        if (item.category === 'debt') {
            return total - item.value;
        }
        return total + item.value;
    }, 0);
}

/**
 * Get seed data summary
 */
export function getSeedDataSummary() {
    const items = generateAustralianWealthSeedData();

    const liquid = items
        .filter(i => i.isLiquid && i.category !== 'debt')
        .reduce((sum, i) => sum + i.value, 0);

    const propertyValue = items
        .filter(i => i.category === 'investment' && !i.isLiquid)
        .reduce((sum, i) => sum + i.value, 0);

    const super_ = items
        .filter(i => i.category === 'superannuation')
        .reduce((sum, i) => sum + i.value, 0);

    const debt = items
        .filter(i => i.category === 'debt')
        .reduce((sum, i) => sum + i.value, 0);

    const netWorth = calculateSeedNetWorth();

    return {
        liquidAssets: liquid,
        propertyValue,
        superannuation: super_,
        totalDebt: debt,
        netWorth,
        itemCount: items.length,
    };
}
