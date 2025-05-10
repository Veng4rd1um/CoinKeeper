// src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    ChartBarIcon,
    Cog6ToothIcon,
    HomeIcon,
    CurrencyDollarIcon, // Лого
    ArrowLeftOnRectangleIcon, // Выход
    MoonIcon, SunIcon // Тема
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';

const navigationLinks = [
    { name: 'Дашборд', href: '/dashboard', icon: HomeIcon },
    { name: 'Статистика', href: '/stats', icon: ChartBarIcon },
    { name: 'Категории', href: '/settings', icon: Cog6ToothIcon }, // Изменил на "Категории" для ясности
];

const Sidebar = () => {
    const { user, logout } = useAuth();
    const [darkMode, setDarkMode] = useState(() => {
        const theme = localStorage.getItem('theme');
        if (theme) return theme === 'dark';
        // Если нет сохраненной темы, используем системные предпочтения
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(!darkMode);

    return (
        <div className="w-64 bg-surface dark:bg-surface-dark text-text dark:text-text-dark_muted flex flex-col fixed h-full shadow-lg border-r border-slate-200 dark:border-slate-700">
            {/* Logo */}
            <div className="h-20 flex items-center justify-center px-4 border-b border-slate-200 dark:border-slate-700">
                <CurrencyDollarIcon className="h-8 w-8 text-primary dark:text-primary-dark mr-2" />
                <span className="text-2xl font-semibold text-text dark:text-text-dark">CoinKeeper</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                {navigationLinks.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                            `group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                         ${isActive
                                ? 'sidebar-link-active' // Стили из index.css
                                : 'text-text-muted dark:text-text-dark_muted hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-text dark:hover:text-text-dark'
                            }`
                        }
                    >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            {/* Theme Toggle and User Info */}
            <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center justify-start px-3 py-2 text-sm font-medium rounded-md text-text-muted dark:text-text-dark_muted hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-text dark:hover:text-text-dark transition-colors"
                    title={darkMode ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
                >
                    {darkMode ? <SunIcon className="h-5 w-5 mr-3"/> : <MoonIcon className="h-5 w-5 mr-3"/>}
                    <span>{darkMode ? 'Светлая тема' : 'Темная тема'}</span>
                </button>

                {user && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-text-muted dark:text-slate-500 px-3 mb-1">Вошли как:</p>
                        <div className="px-3 mb-2">
                            <p className="text-sm font-medium text-text dark:text-text-dark truncate" title={user.email}>
                                {user.email}
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-start px-3 py-2.5 text-sm font-medium rounded-md text-text-muted dark:text-text-dark_muted bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-error/30 hover:text-error dark:hover:text-error-dark transition-colors"
                        >
                            <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
                            Выйти
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;