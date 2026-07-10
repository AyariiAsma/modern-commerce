import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../store/LanguageContext';

export default function Footer() {
    const { t, isRtl } = useLanguage();

    return (
        <footer className={`border-t border-slate-100 bg-white ${isRtl ? 'text-right' : ''}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="space-y-3">
                        <span className="text-xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                            AURA
                        </span>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                            {t('heroSubtitle')}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            {t('catalog')}
                        </h4>
                        <ul className="space-y-2">
                            <li><Link to="/catalog" className="text-xs text-slate-500 hover:text-indigo-650 transition-colors">{t('viewAll')}</Link></li>
                            <li><Link to="/cart" className="text-xs text-slate-500 hover:text-indigo-650 transition-colors">{t('cart')}</Link></li>
                        </ul>
                    </div>

                    {/* Account */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            {t('profile')}
                        </h4>
                        <ul className="space-y-2">
                            <li><Link to="/login" className="text-xs text-slate-500 hover:text-indigo-650 transition-colors">{t('login')}</Link></li>
                            <li><Link to="/register" className="text-xs text-slate-500 hover:text-indigo-650 transition-colors">{t('register')}</Link></li>
                            <li><Link to="/profile" className="text-xs text-slate-500 hover:text-indigo-650 transition-colors">{t('orderHistory')}</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Support
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-500">
                            <li>{t('warranty')}</li>
                            <li>{t('returns')}</li>
                            <li>{t('freeDelivery')}</li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-slate-100 mt-10 pt-6 text-center">
                    <p className="text-[11px] text-slate-400 font-medium">
                        © 2026 AURA Store. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
