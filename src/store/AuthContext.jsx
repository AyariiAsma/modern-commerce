import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Persist login state using JWT
    useEffect(() => {
        const verifySession = async () => {
            const token = localStorage.getItem('ecomm_token');
            if (token) {
                try {
                    const response = await authService.getMe();
                    setCurrentUser(response.data);
                } catch (err) {
                    console.error('Session validation failed:', err);
                    localStorage.removeItem('ecomm_token');
                    setCurrentUser(null);
                }
            }
            setLoading(false);
        };
        verifySession();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await authService.login(email, password);
            const { user, token } = response.data;
            setCurrentUser(user);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Invalid email or password';
            return { success: false, error: message };
        }
    };

    const register = async (name, email, password, phone) => {
        try {
            const response = await authService.register(name, email, password, phone);
            const { user } = response.data;
            setCurrentUser(user);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Email already exists or invalid data';
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        await authService.logout();
        setCurrentUser(null);
    };

    const value = {
        user: currentUser,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        isWarehouse: currentUser?.role === 'warehouse' || currentUser?.role === 'admin',
        loading,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

