import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import ProductCard from '../../components/ProductCard';
import CategoryCard from '../../components/CategoryCard';
import BannerSlider from '../../components/BannerSlider';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

export default function Home() {
    const { products, categories, settings } = useDatabase();
    const { t, isRtl } = useLanguage();

    const currency = settings?.currency || '$';
    const featured = products.filter(p => p.featured).slice(0, 4);

    return (
        <div className={`space-y-16 pb-12 ${isRtl ? 'text-right' : ''}`}>

            {/* Dynamic Banner Carousel Slider */}
            <BannerSlider />


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
