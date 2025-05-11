import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import apiClient from '../api/index.js';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('authUser')));
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const setAuthData = useCallback((newToken, userData) => {
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('authUser', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        if (apiClient.defaults.headers) { 
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        } else {
            apiClient.defaults.headers = { common: { 'Authorization': `Bearer ${newToken}` } };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setToken(null);
        setUser(null);
        if (apiClient.defaults.headers?.common) { 
            delete apiClient.defaults.headers.common['Authorization'];
        }
        navigate('/login', { replace: true });
    }, [navigate]);

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = JSON.parse(localStorage.getItem('authUser'));

        if (storedToken && storedUser) {
            if (apiClient.defaults.headers) {
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            } else {
                apiClient.defaults.headers = { common: { 'Authorization': `Bearer ${storedToken}` } };
            }

            import('../api/index.js').then(apiModule => { 
                apiModule.fetchTransactions() // Using fetchTransactions to validate token
                    .then(() => {
                        setToken(storedToken);
                        setUser(storedUser);
                    })
                    .catch((error) => {
                        console.warn("Token validation failed (AuthContext):", error.response?.data?.message || error.message);
                        logout();
                    })
                    .finally(() => {
                        setIsLoadingAuth(false);
                    });
            }).catch(err => {
                console.error("Failed to dynamically import api/index.js in AuthContext", err);
                setIsLoadingAuth(false); 
            });
        } else {
            setIsLoadingAuth(false);
        }
    }, [logout]); 

    const login = async (email, password) => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            const { token: newToken, userId, email: userEmail } = response.data;
            setAuthData(newToken, { id: userId, email: userEmail });
            const from = location.state?.from?.pathname || "/dashboard";
            navigate(from, { replace: true });
            return { success: true };
        } catch (error) {
            console.error("Login failed:", error.response?.data?.message || error.message);
            return { success: false, message: error.response?.data?.message || "Login failed. Please check your credentials." };
        }
    };

    const register = async (email, password) => {
        try {
            const response = await apiClient.post('/auth/register', { email, password });
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error("Registration failed:", error.response?.data?.message || error.message);
            return { success: false, message: error.response?.data?.message || "Registration failed. Please try a different email." };
        }
    };

    const value = {
        token,
        user,
        isAuthenticated: !!token,
        isLoadingAuth,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoadingAuth && children}
            {isLoadingAuth && ( 
                <div className="fixed inset-0 flex justify-center items-center bg-background-dark z-[9999]">
                    <p className="text-xl text-text-dark">Loading...</p>
                </div>
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};