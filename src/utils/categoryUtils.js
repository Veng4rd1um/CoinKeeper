import { defaultCategoryIconName } from '../components/ui/CategoryIcons.jsx';

const defaultTailwindColor = 'bg-slate-500'; // Consistent default Tailwind color

// This map helps convert HEX colors (potentially from default/legacy categories.json)
// to the Tailwind CSS classes used throughout the frontend.
const hexToTailwindMap = {
    '#22c55e': 'bg-green-500',
    '#3b82f6': 'bg-blue-500',
    '#eab308': 'bg-yellow-500',
    '#f97316': 'bg-orange-500',
    '#0ea5e9': 'bg-sky-500',
    '#a855f7': 'bg-purple-500',
    '#ef4444': 'bg-red-500',
    // Add more mappings if your default categories.json uses other hex codes
};

export function normalizeCategoryProperties(category) {
    if (!category) return null; // Should not happen if data structure is { income: [], expense: [] }

    let color = category.color;

    if (!color) {
        color = defaultTailwindColor;
    } else if (color.startsWith('#')) { // If color is HEX (e.g., from default categories.json)
        color = hexToTailwindMap[color.toLowerCase()] || defaultTailwindColor;
    } else if (!color.startsWith('bg-')) { // If color is something else (not empty, not HEX, not Tailwind class)
        color = defaultTailwindColor;
    }
    // If color is already a 'bg-' class, it's considered valid.

    return {
        ...category,
        color: color, // Ensures color is a Tailwind class
        icon: category.icon || defaultCategoryIconName // Ensures icon name exists
    };
}
