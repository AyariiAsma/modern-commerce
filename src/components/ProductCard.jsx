import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { useCart } from '../store/CartContext';
import { useDatabase } from '../store/DatabaseContext';
import { useLanguage } from '../store/LanguageContext';

export default function ProductCard({ product }) {
    const { addToCart } = useCart();
    const { settings } = useDatabase();
    const { t } = useLanguage();

    const isOutOfStock = product.stock <= 0;
    const originalPrice = product.price;
    const isDiscounted = product.discountPrice !== null;
    const curPrice = isDiscounted ? product.discountPrice : originalPrice;

    // Use current store currency
    const currency = settings?.currency || '$';

    const handleAddToCart = (e) => {
        e.preventDefault(); // Prevent navigating to detail page when clicking the button
        if (!isOutOfStock) {
            addToCart(product, 1);
        }
    };

    return (
        <Link
            to={`/product/${product.id}`}
            className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-indigo-500 hover:shadow-lg transition-all duration-300 flex flex-col h-full"
        >
            {/* Product Image */}
            <div className="relative aspect-square w-full overflow-hidden bg-slate-150">
                <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />

                {/* Promo badges */}
                {isDiscounted && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                        Sale
                    </span>
                )}

                {isOutOfStock && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-white text-xs font-bold uppercase tracking-widest px-3 py-1 border border-white rounded-full">
                            {t('outOfStock')}
                        </span>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                    {/* Category */}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        {product.category}
                    </span>
                    {/* Name */}
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 group-hover:text-indigo-650 transition-colors">
                        {product.name}
                    </h3>
                </div>

                {/* Price and Action */}
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div>
                        {/* Rating */}
                        <div className="flex items-center space-x-1 mb-1">
                            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-[11px] font-bold text-slate-550">{product.rating}</span>
                        </div>

                        {/* Pricing */}
                        <div className="flex items-baseline space-x-2">
                            <span className="text-base font-bold text-slate-900">
                                {currency}{curPrice.toFixed(2)}
                            </span>
                            {isDiscounted && (
                                <span className="text-xs text-slate-400 line-through">
                                    {currency}{originalPrice.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Cart add button */}
                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`p-2.5 rounded-full transition-all text-white ${isOutOfStock
                            ? 'bg-slate-200 cursor-not-allowed text-slate-400'
                            : 'bg-indigo-600 hover:bg-slate-900 shadow-md hover:shadow-lg transform active:scale-95'
                            }`}
                        title="Add to Cart"
                    >
                        <ShoppingCart className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </Link>
    );
}
