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
                <p className="text-xl text-text-dark">Authorizing...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <AppLayout>
            <Outlet /> 
        </AppLayout>
    );
};

export default ProtectedRoute;