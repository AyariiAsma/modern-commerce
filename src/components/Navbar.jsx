import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { useLanguage } from '../store/LanguageContext';
import { ShoppingBag, User, Search, Menu, X, LogOut, Shield, Globe } from 'lucide-react';

export default function Navbar() {
    const { cartCount } = useCart();
    const { user, logout, isAdmin } = useAuth();
    const { language, setLanguage, t, isRtl } = useLanguage();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setMobileMenuOpen(false);
        }
    };

    return (
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`flex justify-between h-16 items-center ${isRtl ? 'flex-row-reverse' : ''}`}>

                    {/* Logo & Name */}
                    <div className={`flex items-center space-x-2 ${isRtl ? 'space-x-reverse' : ''}`}>
                        <Link to="/" className="flex items-center space-x-2">
                            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                                AURA
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-widest hidden sm:inline">
                                Shop
                            </span>
                        </Link>
                    </div>

                    {/* Search Bar - Desktop */}
                    <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-8 relative">
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full bg-slate-50 border border-slate-200 text-slate-805 text-sm rounded-full py-2 ${isRtl ? 'pr-4 pl-10 text-right' : 'pl-4 pr-10'}`}
                        />
                        <button type="submit" className={`absolute top-2.5 text-slate-400 hover:text-slate-655 ${isRtl ? 'left-3' : 'right-3'}`}>
                            <Search className="h-4 w-4" />
                        </button>
                    </form>

                    {/* Nav Actions */}
                    <div className={`hidden md:flex items-center space-x-6 ${isRtl ? 'space-x-reverse' : ''}`}>
                        <Link to="/catalog" className="text-sm font-bold text-slate-600 hover:text-indigo-650 transition-colors">
                            {t('catalog')}
                        </Link>

                        {/* Language Selector Dropdown */}
                        <div className="flex items-center space-x-1.5 align-middle">
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

                        {/* Cart Badge */}
                        <Link to="/cart" className="relative group p-2 text-slate-600 hover:text-indigo-600 transition-all">
                            <ShoppingBag className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white`}>
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* User Account Controls */}
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                    className={`flex items-center focus:outline-none group ${isRtl ? 'space-x-reverse space-x-2' : 'space-x-2'}`}
                                >
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="h-8 w-8 rounded-full border border-slate-200 object-cover group-hover:border-indigo-505 transition-all"
                                    />
                                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-650 transition-colors">
                                        {user.name.split(' ')[0]}
                                    </span>
                                </button>

                                {userDropdownOpen && (
                                    <div className={`absolute mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl py-1 z-50 ${isRtl ? 'left-0' : 'right-0'}`}>
                                        {isAdmin && (
                                            <Link
                                                to="/admin"
                                                onClick={() => setUserDropdownOpen(false)}
                                                className={`flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors ${isRtl ? 'flex-row-reverse text-right' : ''}`}
                                            >
                                                <Shield className={`h-4 w-4 text-indigo-600 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                                                {t('adminDashboard')}
                                            </Link>
                                        )}
                                        <Link
                                            to="/profile"
                                            onClick={() => setUserDropdownOpen(false)}
                                            className={`flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors ${isRtl ? 'flex-row-reverse text-right' : ''}`}
                                        >
                                            <User className={`h-4 w-4 text-slate-400 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                                            {t('profile')}
                                        </Link>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setUserDropdownOpen(false);
                                            }}
                                            className={`flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors ${isRtl ? 'flex-row-reverse text-right' : ''}`}
                                        >
                                            <LogOut className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                                            {t('logout')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-650 transition-all duration-150"
                            >
                                {t('signIn')}
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Action Toggles */}
                    <div className={`flex md:hidden items-center ${isRtl ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                        {/* Mobile Language Picker */}
                        <div className="flex items-center space-x-1">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="text-[10px] font-extrabold bg-slate-50 border border-slate-205 text-slate-700 rounded-xl px-1.5 py-1 focus:outline-none"
                            >
                                <option value="en">EN</option>
                                <option value="fr">FR</option>
                                <option value="ar">AR</option>
                            </select>
                        </div>

                        <Link to="/cart" className="relative p-2 text-slate-600 hover:text-indigo-600 transition-all">
                            <ShoppingBag className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-slate-600 focus:outline-none"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>

                </div>
            </div>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
                <div className={`md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-3 ${isRtl ? 'text-right' : ''}`}>
                    <form onSubmit={handleSearchSubmit} className="relative w-full">
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full bg-slate-50 border border-slate-200 text-slate-805 text-sm rounded-full py-2 ${isRtl ? 'pr-4 pl-10 text-right' : 'pl-4 pr-10'}`}
                        />
                        <button type="submit" className={`absolute top-2.5 text-slate-400 ${isRtl ? 'left-3' : 'right-3'}`}>
                            <Search className="h-4 w-4" />
                        </button>
                    </form>

                    <Link
                        to="/catalog"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 rounded-lg text-base font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                    >
                        {t('catalog')}
                    </Link>

                    {user ? (
                        <>
                            {isAdmin && (
                                <Link
                                    to="/admin"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-3 py-2 rounded-lg text-base font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                                >
                                    {t('adminDashboard')}
                                </Link>
                            )}
                            <Link
                                to="/profile"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-2 rounded-lg text-base font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                            >
                                {t('profile')}
                            </Link>
                            <button
                                onClick={() => {
                                    logout();
                                    setMobileMenuOpen(false);
                                }}
                                className={`block w-full px-3 py-2 rounded-lg text-base font-bold text-red-655 hover:bg-red-50 ${isRtl ? 'text-right' : 'text-left'}`}
                            >
                                {t('logout')}
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block text-center rounded-lg bg-slate-900 px-4 py-2.5 text-base font-bold text-white hover:bg-indigo-650"
                        >
                            {t('signIn')}
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
}
