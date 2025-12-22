import { WealthItem } from '../store/timelineStore';

/**
 * Generate realistic Australian wealth test data
 * Represents a typical Australian household in their 30s living in a major city
 */
export function generateAustralianWealthSeedData(): Omit<WealthItem, 'id' | 'lastUpdated'>[] {
    return [
        // Liquid Assets
        {
            category: 'savings',
            name: 'Commonwealth Bank Savings',
            value: 25000,
            isLiquid: true,
        },
        {
            category: 'savings',
            name: 'Emergency Fund (Ubank)',
            value: 8000,
            isLiquid: true,
        },
        {
            category: 'investment',
            name: 'Vanguard Index Fund (VAS)',
            value: 15000,
            isLiquid: true,
        },

        // Superannuation (Locked)
        {
            category: 'superannuation',
            name: 'HostPlus Superannuation',
            value: 85000,
            isLiquid: false,
        },

        // Debts
        {
            category: 'debt',
            name: 'HECS-HELP Debt',
            value: 18000, // Stored as positive, will be treated as negative in calculations
            isLiquid: false,
        },

        // Optional: Add more realistic items
        {
            category: 'investment',
            name: 'Spaceship Voyager',
            value: 4500,
            isLiquid: true,
        },
    ];
}

/**
 * Calculate net worth from seed data
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

    const super_ = items
        .filter(i => i.category === 'superannuation')
        .reduce((sum, i) => sum + i.value, 0);

    const debt = items
        .filter(i => i.category === 'debt')
        .reduce((sum, i) => sum + i.value, 0);

    const netWorth = calculateSeedNetWorth();

    return {
        liquidAssets: liquid,
        superannuation: super_,
        totalDebt: debt,
        netWorth,
        itemCount: items.length,
    };
}
