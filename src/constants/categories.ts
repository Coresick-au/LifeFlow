/**
 * Life Categories Configuration
 * 
 * Centralized definitions for story categorization and theming.
 * This prevents hardcoded tag arrays scattered throughout components.
 */

export interface LifeCategory {
    id: string;
    name: string;
    tags: string[];
    color: {
        hex: string;      // For charts (recharts, etc.)
        tailwind: string; // For Tailwind CSS classes
    };
    icon: string; // Icon name from lucide-react
}

/**
 * Core life categories used throughout the app
 */
export const LIFE_CATEGORIES: Record<string, LifeCategory> = {
    career: {
        id: 'career',
        name: 'Career',
        tags: ['career', 'work', 'job', 'professional', 'business', 'promotion', 'promoted', 'achievement', 'award', 'certified'],
        color: {
            hex: '#2563eb', // blue-600
            tailwind: 'text-blue-600',
        },
        icon: 'Briefcase',
    },
    family: {
        id: 'family',
        name: 'Family',
        tags: ['child', 'kid', 'son', 'daughter', 'baby', 'first', 'milestone', 'development', 'parenting'],
        color: {
            hex: '#db2777', // pink-600
            tailwind: 'text-pink-600',
        },
        icon: 'Baby',
    },
    home: {
        id: 'home',
        name: 'Home',
        tags: ['home', 'house', 'renovation', 'maintenance', 'property', 'remodel', 'repair'],
        color: {
            hex: '#16a34a', // green-600
            tailwind: 'text-green-600',
        },
        icon: 'Home',
    },
    relationships: {
        id: 'relationships',
        name: 'Relationships',
        tags: ['relationship', 'friend', 'family', 'partner', 'love', 'parent', 'sibling'],
        color: {
            hex: '#dc2626', // red-600
            tailwind: 'text-red-600',
        },
        icon: 'Heart',
    },
};

/**
 * Get category for a story based on its tags
 */
export function getCategoryForStory(tags: string[]): string | null {
    const lowerTags = tags.map(t => t.toLowerCase());

    for (const [categoryId, category] of Object.entries(LIFE_CATEGORIES)) {
        if (lowerTags.some(tag => category.tags.includes(tag))) {
            return categoryId;
        }
    }
    return null;
}

/**
 * Check if a story belongs to a specific category
 */
export function isStoryInCategory(tags: string[], categoryId: string): boolean {
    const category = LIFE_CATEGORIES[categoryId];
    if (!category) return false;

    const lowerTags = tags.map(t => t.toLowerCase());
    return lowerTags.some(tag => category.tags.includes(tag));
}

/**
 * Get all category colors as an array (for charts)
 */
export function getCategoryColors(): string[] {
    return Object.values(LIFE_CATEGORIES).map(c => c.color.hex);
}

/**
 * People tags that indicate family relationships
 */
export const FAMILY_PEOPLE_TAGS = ['mom', 'dad', 'mother', 'father', 'brother', 'sister'];

/**
 * Default color for uncategorized stories
 */
export const DEFAULT_CATEGORY_COLOR = '#94a3b8'; // Slate 400

/**
 * Get color hex for a story based on its tags
 */
export function getCategoryColorForStory(tags: string[]): string {
    const categoryId = getCategoryForStory(tags);
    if (categoryId && LIFE_CATEGORIES[categoryId]) {
        return LIFE_CATEGORIES[categoryId].color.hex;
    }
    return DEFAULT_CATEGORY_COLOR;
}
