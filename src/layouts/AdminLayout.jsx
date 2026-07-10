import React, { useState } from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useLanguage } from '../store/LanguageContext';
import {
    LayoutDashboard,
    ShoppingBag,
    Grid,
    ShoppingCart,
    ArrowLeft,
    LogOut,
    Menu,
    X,
    UserCheck,
    Settings,
    Globe
} from 'lucide-react';

export default function AdminLayout() {
    const { user, isAdmin, logout } = useAuth();
    const { language, setLanguage, t, isRtl } = useLanguage();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Authorization wall
    if (!user || !isAdmin) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const navItems = [
        { name: t('adminDashboardTitle'), path: '/admin', icon: LayoutDashboard },
        { name: t('invProductsTitle'), path: '/admin/products', icon: ShoppingBag },
        { name: t('taxoCategoriesTitle'), path: '/admin/categories', icon: Grid },
        { name: t('ordersManagerTitle'), path: '/admin/orders', icon: ShoppingCart },
        { name: t('settingsPanelTitle'), path: '/admin/settings', icon: Settings },
    ];

    return (
        <div className={`flex h-screen bg-slate-50 overflow-hidden ${isRtl ? 'flex-row-reverse' : ''}`}>
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar Container */}
            <aside
                className={`fixed inset-y-0 z-50 flex w-68 flex-col bg-slate-900 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${isRtl ? 'right-0' : 'left-0'
                    } ${sidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
                    <Link to="/" className="flex items-center space-x-2">
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            AURA Control
                        </span>
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-4 py-3 text-xs font-semibold rounded-xl transition-all duration-150 ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                    : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                                    } ${isRtl ? 'flex-row-reverse text-right' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
                                <span className="truncate">{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-800 space-y-2">
                    <Link
                        to="/"
                        className={`flex items-center w-full px-4 py-3 text-sm font-semibold text-slate-400 hover:bg-slate-850 hover:text-white rounded-xl transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                        <ArrowLeft className={`h-4 w-4 ${isRtl ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('home')}
                    </Link>
                    <button
                        onClick={logout}
                        className={`flex items-center w-full px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-xl transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                        <LogOut className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                        {t('logout')}
                    </button>
                </div>
            </aside>

            {/* Main Workspace Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Header */}
                <header className={`flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-1 rounded-md text-slate-500 hover:text-slate-655 lg:hidden"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Language picker + Connected User profile */}
                    <div className={`flex items-center space-x-4 ${isRtl ? 'space-x-reverse' : ''}`}>
                        {/* Language Selector */}
                        <div className="flex items-center space-x-1.5">
                            <Globe className="h-4 w-4 text-slate-400" />
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="text-xs font-bold bg-slate-50 border border-slate-205 text-slate-700 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                                <option value="en">🇺🇸 EN</option>
                                <option value="fr">🇫🇷 FR</option>
                                <option value="ar">🇩🇿 AR</option>
                            </select>
                        </div>

                        <div className={`flex items-center text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <UserCheck className={`h-3.5 w-3.5 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                            <span>{t('adminBadge')}</span>
                        </div>
                        <img
                            src={user?.avatar}
                            alt={user?.name}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-sm font-medium text-slate-700 hidden md:inline">
                            {user?.name}
                        </span>
                    </div>
                </header>

                {/* Content Container */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
