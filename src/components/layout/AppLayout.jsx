// src/components/layout/AppLayout.jsx
import React from 'react';
import Sidebar from './Sidebar.jsx';

const AppLayout = ({ children }) => { // Принимает children
    return (
        <div className="flex h-screen bg-background dark:bg-background-dark text-text dark:text-text-dark">
            <Sidebar />
            <div className="flex-1 flex flex-col ml-64 overflow-x-hidden"> {/* ml-64 to offset fixed sidebar, overflow-x-hidden */}
                <main className="flex-1 p-4 sm:p-6 overflow-y-auto"> {/* Добавлены sm:p-6 для больших экранов */}
                    {children} {/* Отображаем то, что передано как children (это будет <Outlet /> из ProtectedRoute) */}
                </main>
            </div>
        </div>
    );
};

export default AppLayout;