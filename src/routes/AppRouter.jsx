// src/routes/AppRouter.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/Auth/LoginPage.jsx';
import RegisterPage from '../pages/Auth/RegisterPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import StatsPage from '../pages/StatsPage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const AppRouter = () => {
    const { isAuthenticated, isLoadingAuth } = useAuth();

    if (isLoadingAuth && !localStorage.getItem('authToken')) { // Показываем лоадер только при первой загрузке, если нет токена
        return (
            <div className="flex justify-center items-center h-screen bg-background-dark">
                <p className="text-xl text-text-dark">Загрузка приложения...</p>
            </div>
        );
    }
    // Если isLoadingAuth все еще true, но токен есть, ProtectedRoute сам покажет лоадер авторизации

    return (
        <Routes>
            <Route
                path="/login"
                element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />}
            />
            <Route
                path="/register"
                element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" replace />}
            />

            {/* Защищенные маршруты */}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} /> {/* Главная по умолчанию */}
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="stats" element={<StatsPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Если пользователь авторизован и вводит несуществующий путь, редирект на дашборд.
           Если не авторизован - на логин. */}
            <Route
                path="*"
                element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
            />
        </Routes>
    );
};

export default AppRouter;