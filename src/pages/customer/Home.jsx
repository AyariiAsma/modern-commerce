import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import ProductCard from '../../components/ProductCard';
import CategoryCard from '../../components/CategoryCard';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

export default function Home() {
    const { products, categories, settings } = useDatabase();
    const { t, isRtl } = useLanguage();

    const currency = settings?.currency || '$';
    const featured = products.filter(p => p.featured).slice(0, 4);

    return (
        <div className={`space-y-16 pb-12 ${isRtl ? 'text-right' : ''}`}>

            {/* Hero Banner */}
            <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-20 px-8 sm:px-12 lg:px-16">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop&q=60')] bg-cover bg-center opacity-15"></div>
                <div className="relative z-10 max-w-2xl space-y-6">
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full">
                        <Sparkles className="h-3 w-3 mr-1.5" /> Premium Collection 2026
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
                        {t('heroTitle')}
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg">
                        {t('heroSubtitle')}
                    </p>
                    <Link
                        to="/catalog"
                        className={`inline-flex items-center space-x-2 bg-white text-slate-900 font-bold px-6 py-3.5 rounded-full hover:bg-indigo-50 transition shadow-lg active:scale-95 ${isRtl ? 'space-x-reverse' : ''}`}
                    >
                        <span>{t('shopNow')}</span>
                        <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
                    </Link>
                </div>
            </section>

            {/* Categories Grid */}
            <section className="space-y-6">
                <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <h2 className="text-xl font-bold text-slate-900">{t('browseCategories')}</h2>
                    <Link to="/catalog" className={`text-xs font-bold text-indigo-650 hover:underline flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                        {t('viewAll')} <ArrowRight className={`h-3.5 w-3.5 ${isRtl ? 'mr-1 rotate-180' : 'ml-1'}`} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {categories.map(cat => (
                        <CategoryCard key={cat.id} category={cat} />
                    ))}
                </div>
            </section>

            {/* Featured Products */}
            {featured.length > 0 && (
                <section className="space-y-6">
                    <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <h2 className={`text-xl font-bold text-slate-900 flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <TrendingUp className={`h-5 w-5 text-indigo-650 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            {t('featuredProducts')}
                        </h2>
                        <Link to="/catalog" className={`text-xs font-bold text-indigo-650 hover:underline flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                            {t('viewAll')} <ArrowRight className={`h-3.5 w-3.5 ${isRtl ? 'mr-1 rotate-180' : 'ml-1'}`} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featured.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* Promotional Banner */}
            <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-white text-center space-y-4">
                <h2 className="text-2xl sm:text-3xl font-black">AURASTART</h2>
                <p className="text-indigo-100 text-sm max-w-md mx-auto">
                    {isRtl ? 'استخدم الكود "AURASTART" واحصل على خصم 15% على طلبك الأول!' :
                        t('language') === 'fr' ? 'Utilisez le code "AURASTART" pour obtenir 15% de réduction sur votre première commande !' :
                            'Use coupon code "AURASTART" at checkout and get 15% off your first order!'}
                </p>
            </section>
        </div>
    );
}
