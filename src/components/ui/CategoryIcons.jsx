// frontend/src/components/ui/CategoryIcons.jsx
import React from 'react';
import {
    ShoppingCartIcon, // Продукты
    BuildingLibraryIcon, // Зарплата (или BriefcaseIcon)
    TruckIcon, // Транспорт
    TicketIcon, // Развлечения (или FilmIcon)
    HomeModernIcon, // Коммунальные платежи (или BuildingOfficeIcon)
    AcademicCapIcon, // Образование
    GiftIcon, // Подарки
    HeartIcon, // Здоровье
    CurrencyDollarIcon, // Инвестиции, Общее
    SparklesIcon, // Хобби
    WrenchScrewdriverIcon, // Ремонт
    GlobeAltIcon, // Путешествия
    PhoneIcon, // Связь
    ComputerDesktopIcon, // Фриланс, Техника
    BanknotesIcon, // Сбережения
    QuestionMarkCircleIcon, // Другое (Placeholder)
    BriefcaseIcon, // Работа
    ReceiptPercentIcon, // Налоги, Скидки
    CreditCardIcon, // Кредиты, Карты
    ScaleIcon, // Законы, Штрафы
    UserGroupIcon, // Семья
    // Добавьте еще по необходимости
} from '@heroicons/react/24/outline';

export const iconMap = {
    ShoppingCartIcon,
    BuildingLibraryIcon,
    TruckIcon,
    TicketIcon,
    HomeModernIcon,
    AcademicCapIcon,
    GiftIcon,
    HeartIcon,
    CurrencyDollarIcon,
    SparklesIcon,
    WrenchScrewdriverIcon,
    GlobeAltIcon,
    PhoneIcon,
    ComputerDesktopIcon,
    BanknotesIcon,
    QuestionMarkCircleIcon,
    BriefcaseIcon,
    ReceiptPercentIcon,
    CreditCardIcon,
    ScaleIcon,
    UserGroupIcon,
};

export const defaultCategoryIconName = 'QuestionMarkCircleIcon'; // Иконка по умолчанию

// Компонент для рендеринга иконки по имени
export const CategoryIcon = ({ iconName, className = "h-5 w-5", ...props }) => {
    const IconComponent = iconMap[iconName] || iconMap[defaultCategoryIconName];
    return <IconComponent className={className} {...props} />;
};

// Список доступных иконок для выбора
export const availableIconsForPicker = Object.keys(iconMap).map(name => ({
    name,
    Component: iconMap[name]
}));

// Цветовая палитра для выбора (соответствует вашим скриншотам, можно настроить)
export const availableColorsForPicker = [
    // Яркие и пастельные цвета
    'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-yellow-400', 'bg-lime-400',
    'bg-green-400', 'bg-emerald-400', 'bg-teal-400', 'bg-cyan-400', 'bg-sky-400',
    'bg-blue-400', 'bg-indigo-400', 'bg-violet-400', 'bg-purple-400', 'bg-fuchsia-400',
    'bg-pink-400', 'bg-rose-400',
    // Более темные/насыщенные
    'bg-red-600', 'bg-orange-600', 'bg-green-600', 'bg-blue-600', 'bg-purple-600',
    // Нейтральные
    'bg-slate-500', 'bg-gray-500',
];
// Эти цвета уже есть в вашем `SettingsPage.jsx`, можно их оттуда импортировать или оставить здесь
// Это просто для примера, чтобы показать откуда берутся `availableColorsForPicker`
// Если у вас `availableColors` в `SettingsPage.jsx`, то просто используйте его.