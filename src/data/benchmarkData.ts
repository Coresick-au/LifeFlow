/**
 * Australian Location-Based Financial Benchmarks (2024/2025)
 * Data sourced from ABS and financial reports
 */

/**
 * IMPORTANT: This data should be updated annually
 * Last updated: December 2024
 * Data represents 2024/2025 financial year estimates
 */
export const BENCHMARK_METADATA = {
    version: '2024-2025',
    lastUpdated: '2024-12-22',
    source: 'Australian Bureau of Statistics (ABS) & Financial Reports',
    nextUpdateDue: '2025-12-31',
    note: 'Benchmark data should be reviewed and updated annually to reflect current economic conditions',
};

export interface LocationBenchmark {
    medianNetWorth: number;
    medianHouseholdIncome: number;
    medianPropertyValue: number;
    costOfLivingIndex: number; // Sydney = 100 baseline
}

export type LocationKey = 'sydney' | 'melbourne' | 'brisbane' | 'perth' | 'adelaide' | 'regional' | 'australia';

export const locationBenchmarks: Record<LocationKey, LocationBenchmark> = {
    sydney: {
        medianNetWorth: 980000,
        medianHouseholdIncome: 125000,
        medianPropertyValue: 1150000,
        costOfLivingIndex: 100, // Baseline
    },
    melbourne: {
        medianNetWorth: 820000,
        medianHouseholdIncome: 110000,
        medianPropertyValue: 850000,
        costOfLivingIndex: 92,
    },
    brisbane: {
        medianNetWorth: 650000,
        medianHouseholdIncome: 98000,
        medianPropertyValue: 720000,
        costOfLivingIndex: 85,
    },
    perth: {
        medianNetWorth: 710000,
        medianHouseholdIncome: 105000,
        medianPropertyValue: 650000,
        costOfLivingIndex: 83,
    },
    adelaide: {
        medianNetWorth: 580000,
        medianHouseholdIncome: 92000,
        medianPropertyValue: 580000,
        costOfLivingIndex: 78,
    },
    regional: {
        medianNetWorth: 520000,
        medianHouseholdIncome: 75000,
        medianPropertyValue: 420000,
        costOfLivingIndex: 70,
    },
    australia: {
        medianNetWorth: 730000,
        medianHouseholdIncome: 98000,
        medianPropertyValue: 780000,
        costOfLivingIndex: 88,
    }
};

/**
 * Age-Based Wealth Benchmarks for Australia (2024/2025)
 * Useful for tracking wealth accumulation over time
 */
export interface AgeBenchmark {
    ageGroup: string;
    minAge: number;
    maxAge: number;
    medianNetWorth: number;
    medianIncome: number;
    medianSuperannuation: number;
}

export const ageBenchmarks: AgeBenchmark[] = [
    {
        ageGroup: '18-24',
        minAge: 18,
        maxAge: 24,
        medianNetWorth: 12000,
        medianIncome: 52000,
        medianSuperannuation: 8000,
    },
    {
        ageGroup: '25-34',
        minAge: 25,
        maxAge: 34,
        medianNetWorth: 125000,
        medianIncome: 78000,
        medianSuperannuation: 48000,
    },
    {
        ageGroup: '35-44',
        minAge: 35,
        maxAge: 44,
        medianNetWorth: 425000,
        medianIncome: 95000,
        medianSuperannuation: 125000,
    },
    {
        ageGroup: '45-54',
        minAge: 45,
        maxAge: 54,
        medianNetWorth: 720000,
        medianIncome: 105000,
        medianSuperannuation: 245000,
    },
    {
        ageGroup: '55-64',
        minAge: 55,
        maxAge: 64,
        medianNetWorth: 950000,
        medianIncome: 92000,
        medianSuperannuation: 385000,
    },
    {
        ageGroup: '65+',
        minAge: 65,
        maxAge: 100,
        medianNetWorth: 850000,
        medianIncome: 58000,
        medianSuperannuation: 420000,
    },
];

/**
 * Get user's age bracket based on birth date
 */
export function getUserAgeBracket(birthDate: Date): AgeBenchmark | null {
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return ageBenchmarks.find(b => age >= b.minAge && age <= b.maxAge) || null;
}


/**
 * Detect location from address string
 * @param address - Full address string from HouseTracker
 * @returns LocationKey corresponding to the detected city/region
 */
export function detectLocationFromAddress(address: string): LocationKey {
    if (!address) return 'australia';

    const lower = address.toLowerCase();

    // Check for major cities
    if (lower.includes('sydney') || lower.includes('nsw') || lower.includes('new south wales')) {
        return 'sydney';
    }
    if (lower.includes('melbourne') || lower.includes('vic') || lower.includes('victoria')) {
        return 'melbourne';
    }
    if (lower.includes('brisbane') || lower.includes('qld') || lower.includes('queensland')) {
        return 'brisbane';
    }
    if (lower.includes('perth') || lower.includes('wa') || lower.includes('western australia')) {
        return 'perth';
    }
    if (lower.includes('adelaide') || lower.includes('sa') || lower.includes('south australia')) {
        return 'adelaide';
    }

    // Default to regional if in Australia but not a major city
    if (lower.includes('australia') || lower.includes('tas') || lower.includes('nt') || lower.includes('act')) {
        return 'regional';
    }

    return 'australia'; // Fallback
}

/**
 * Calculate cost-of-living adjusted value
 * @param value - Original value
 * @param fromLocation - Source location
 * @param toLocation - Target location
 * @returns Adjusted value
 */
export function calculateCOLAdjustedValue(
    value: number,
    fromLocation: LocationKey,
    toLocation: LocationKey
): number {
    const fromCOL = locationBenchmarks[fromLocation].costOfLivingIndex;
    const toCOL = locationBenchmarks[toLocation].costOfLivingIndex;

    // Adjust value based on cost of living ratio
    return value * (toCOL / fromCOL);
}

/**
 * Get location display name
 */
export function getLocationDisplayName(location: LocationKey): string {
    const names: Record<LocationKey, string> = {
        sydney: 'Sydney',
        melbourne: 'Melbourne',
        brisbane: 'Brisbane',
        perth: 'Perth',
        adelaide: 'Adelaide',
        regional: 'Regional Australia',
        australia: 'Australia (Average)',
    };
    return names[location];
}

/**
 * Calculate percentile rank compared to location median
 * @param userValue - User's net worth
 * @param locationMedian - Location's median net worth
 * @returns Percentage difference (positive = above median, negative = below)
 */
export function calculatePercentileRank(userValue: number, locationMedian: number): number {
    return ((userValue - locationMedian) / locationMedian) * 100;
}
