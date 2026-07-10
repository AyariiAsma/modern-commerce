import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDatabase } from './DatabaseContext';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const { users, addCustomer } = useDatabase();
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('ecomm_current_user');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('ecomm_current_user', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('ecomm_current_user');
        }
    }, [currentUser]);

    const login = (email, password) => {
        const foundUser = users.find(u => u.email === email && u.password === password);
        if (foundUser) {
            setCurrentUser({
                id: foundUser.id,
                name: foundUser.name,
                email: foundUser.email,
                role: foundUser.role,
                avatar: foundUser.avatar
            });
            return { success: true };
        }
        return { success: false, error: 'Invalid email or password' };
    };

    const register = (name, email, password) => {
        // Check if email already exists
        const emailExists = users.some(u => u.email === email);
        if (emailExists) {
            return { success: false, error: 'Email already registered' };
        }

        const newUser = addCustomer({ name, email, password });
        setCurrentUser({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            avatar: newUser.avatar
        });
        return { success: true };
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const value = {
        user: currentUser,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
