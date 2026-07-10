import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { DatabaseProvider } from './store/DatabaseContext';
import { LanguageProvider } from './store/LanguageContext';
import { AuthProvider } from './store/AuthContext';
import { CartProvider } from './store/CartContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
    return (
        <BrowserRouter>
            <DatabaseProvider>
                <LanguageProvider>
                    <AuthProvider>
                        <CartProvider>
                            <AppRoutes />
                        </CartProvider>
                    </AuthProvider>
                </LanguageProvider>
            </DatabaseProvider>
        </BrowserRouter>
    );
}
