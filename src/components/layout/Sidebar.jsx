import React, { useState, useEffect } from 'react'; // Убрали useCallback, он не нужен здесь
import { NavLink, useLocation } from 'react-router-dom';
import {
    ChartBarIcon,
    Cog6ToothIcon,
    HomeIcon,
    BanknotesIcon, 
    ArrowLeftOnRectangleIcon,
    MoonIcon, SunIcon, XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';

const navigationLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Accounts', href: '/accounts', icon: BanknotesIcon }, 
    { name: 'Statistics', href: '/stats', icon: ChartBarIcon },
    { name: 'Categories', href: '/settings', icon: Cog6ToothIcon },
];

const Sidebar = ({ closeSidebar }) => { 
    const { user, logout } = useAuth();
    const location = useLocation();
    const [darkMode, setDarkMode] = useState(() => {
        const theme = localStorage.getItem('theme');
        if (theme) return theme === 'dark';
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

    // Закрывать сайдбар при смене маршрута на мобильных
    useEffect(() => {
        // Проверяем, что closeSidebar существует и является функцией
        if (typeof closeSidebar === 'function' && window.innerWidth < 1024) { 
            closeSidebar();
        }
    }, [location, closeSidebar]); // closeSidebar теперь стабильна благодаря useCallback в AppLayout


    return (
        <div className="flex flex-col h-full"> 
            <div className="h-20 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center">
                    <img src="/free-icon-coin-4153647.png" alt="CoinKeeper Logo" className="h-8 w-8 mr-2" />
                    <span className="text-2xl font-semibold text-text dark:text-text-dark">CoinKeeper</span>
                </div>
                {typeof closeSidebar === 'function' && ( // Добавляем проверку, что closeSidebar - функция
                    <button onClick={closeSidebar} className="lg:hidden p-1 text-text-muted dark:text-text-dark_muted hover:text-text dark:hover:text-text-dark">
                        <XMarkIcon className="h-6 w-6"/>
                    </button>
                )}
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                {navigationLinks.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        // onClick убран, так как useEffect выше обрабатывает закрытие при смене location
                        className={({ isActive }) =>
                            `group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                         ${isActive
                                ? 'sidebar-link-active'
                                : 'text-text-muted dark:text-text-dark_muted hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-text dark:hover:text-text-dark'
                            }`
                        }
                    >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center justify-start px-3 py-2 text-sm font-medium rounded-md text-text-muted dark:text-text-dark_muted hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-text dark:hover:text-text-dark transition-colors"
                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {darkMode ? <SunIcon className="h-5 w-5 mr-3"/> : <MoonIcon className="h-5 w-5 mr-3"/>}
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                {user && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-text-muted dark:text-slate-500 px-3 mb-1">Logged in as:</p>
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
                            Log Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;