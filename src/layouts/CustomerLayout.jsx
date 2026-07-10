import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CustomerLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Target Nav */}
            <Navbar />

            {/* Central Content */}
            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            {/* Target Footer */}
            <Footer />
        </div>
    );
}
