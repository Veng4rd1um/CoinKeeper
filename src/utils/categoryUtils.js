import { defaultCategoryIconName } from '../components/ui/CategoryIcons.jsx';

const defaultTailwindColor = 'bg-slate-500'; // Consistent default Tailwind color

// This map helps convert HEX colors (potentially from default/legacy categories.json)
// to the Tailwind CSS classes used throughout the frontend.
const hexToTailwindMap = {
    '#22c55e': 'bg-green-500', // Salary
    '#3b82f6': 'bg-blue-500',   // Freelance
    '#eab308': 'bg-yellow-500', // Gifts
    '#f97316': 'bg-orange-500', // Groceries
    '#0ea5e9': 'bg-sky-500',    // Transport
    '#a855f7': 'bg-purple-500', // Entertainment
    '#ef4444': 'bg-red-500',     // Utilities
    // Add more mappings if your default categories.json uses other hex codes
};

export function normalizeCategoryProperties(category) {
    if (!category) return null; 

    let color = category.color;

    if (!color) {
        color = defaultTailwindColor;
    } else if (color.startsWith('#')) { 
        color = hexToTailwindMap[color.toLowerCase()] || defaultTailwindColor;
    } else if (!color.startsWith('bg-')) { 
        color = defaultTailwindColor;
    }

    return {
        ...category,
        color: color, 
        icon: category.icon || defaultCategoryIconName 
    };
}