// src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AppLayout from '../components/layout/AppLayout.jsx';

const ProtectedRoute = () => {
    const { isAuthenticated, isLoadingAuth } = useAuth();
    const location = useLocation();

    if (isLoadingAuth) {
        return (
            <div className="flex justify-center items-center h-screen bg-background-dark">
                <p className="text-xl text-text-dark">Проверка авторизации...</p>
                {/* Здесь можно добавить красивый спиннер/лоадер */}
            </div>
        );
    }

    if (!isAuthenticated) {
        // Передаем текущий путь для редиректа обратно после логина
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <AppLayout>
            <Outlet /> {/* Outlet рендерит дочерние маршруты, определенные в AppRouter */}
        </AppLayout>
    );
};

export default ProtectedRoute;