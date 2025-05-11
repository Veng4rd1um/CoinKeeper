import React, { useState, useCallback } from 'react'; // Импортируем useCallback
import Sidebar from './Sidebar.jsx';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const AppLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Оборачиваем toggleSidebar в useCallback
    // Массив зависимостей пуст, так как функция не зависит от внешних переменных,
    // которые могут меняться и требовать пересоздания функции.
    // setIsSidebarOpen предоставляется React и гарантированно стабильна.
    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prevIsOpen => !prevIsOpen);
    }, []); // Пустой массив зависимостей

    return (
        <div className="flex h-screen bg-background dark:bg-background-dark text-text dark:text-text-dark">
            {/* Overlay for mobile when sidebar is open */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
                    onClick={toggleSidebar}
                    aria-hidden="true"
                ></div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-surface dark:bg-surface-dark shadow-lg border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                 <Sidebar closeSidebar={toggleSidebar} /> {/* Передаем стабильную функцию */}
            </div>


            {/* Main content area */}
            <div className="flex-1 flex flex-col lg:ml-64 overflow-x-hidden">
                {/* Mobile Header with Burger Menu */}
                <header className="sticky top-0 z-10 lg:hidden bg-surface dark:bg-surface-dark shadow-sm p-3 border-b border-slate-200 dark:border-slate-700 flex items-center">
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 text-text dark:text-text-dark rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary dark:focus:ring-primary-dark"
                    >
                        <span className="sr-only">Open sidebar</span>
                        {isSidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                    </button>
                     <div className="ml-4 flex items-center">
                        <img src="/free-icon-coin-4153647.png" alt="CoinKeeper Logo" className="h-7 w-7 mr-1.5" />
                        <span className="text-xl font-semibold text-text dark:text-text-dark">CoinKeeper</span>
                    </div>
                </header>
                
                <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppLayout;