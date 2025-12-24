import { CareerEvent } from '../components/JobTracker';

export interface LoyaltyStatus {
    hasLoyaltyTax: boolean;
    companyName: string;
    tenureYears: number;
}

/**
 * Checks if the user is currently suffering from "Loyalty Tax".
 * Only considers the CURRENT active role (no end date).
 */
export const checkLoyaltyHealth = (events: CareerEvent[]): LoyaltyStatus | null => {
    // 1. Group by company to find the latest role for each
    const companyMap = new Map<string, CareerEvent[]>();

    events.forEach(event => {
        if (event.company && event.type === 'position') {
            if (!companyMap.has(event.company)) {
                companyMap.set(event.company, []);
            }
            companyMap.get(event.company)?.push(event);
        }
    });

    // 2. Iterate companies to find the ACTIVE one
    const entries = Array.from(companyMap.entries());
    for (const [company, companyEvents] of entries) {
        // Sort by date to get the latest role
        companyEvents.sort((a: CareerEvent, b: CareerEvent) => a.date.getTime() - b.date.getTime());
        const currentRole = companyEvents[companyEvents.length - 1];

        // CRITICAL FIX: If the role has an endDate, it's history. Skip it.
        if (currentRole.endDate) {
            continue;
        }

        // 3. Calculate tenure for the active role only
        const start = currentRole.date;
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const tenureYears = diffTime / (1000 * 60 * 60 * 24 * 365);

        // 4. Threshold check (e.g., > 3 years)
        if (tenureYears > 3) {
            return {
                hasLoyaltyTax: true,
                companyName: company,
                tenureYears
            };
        }
    }

    return null; // No active loyalty tax found
};
