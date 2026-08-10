import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDatabase } from '../../store/DatabaseContext';
import { useCart } from '../../store/CartContext';
import { useLanguage } from '../../store/LanguageContext';
import { productService } from '../../services/api';
import ProductCard from '../../components/ProductCard';
import { Star, ShoppingCart, Plus, Minus, ArrowLeft, Heart, Shield, RefreshCw, Loader2 } from 'lucide-react';

export default function ProductDetails() {
    const { id } = useParams();
    const { products, settings } = useDatabase();
    const { addToCart } = useCart();
    const { t, isRtl } = useLanguage();

    const currency = settings?.currency || '$';

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                // Fetch full detail from API (includes multiple images)
                const res = await productService.getById(id);
                setProduct(res.data);
                setActiveImage(res.data.image || '');
                setQuantity(1);
            } catch (err) {
                // Fallback: find in context products (handles both int and string ID matching)
                const prod = products.find(p => String(p.id) === String(id));
                setProduct(prod || null);
                if (prod) setActiveImage(prod.image || '');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, products]);

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-16 space-y-4">
                <h2 className="text-xl font-bold text-slate-800">{t('noProductsFound')}</h2>
                <Link to="/catalog" className={`inline-flex items-center text-sm font-bold text-indigo-600 hover:underline ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <ArrowLeft className={`h-4 w-4 ${isRtl ? 'ml-2 rotate-180' : 'mr-2'}`} /> {t('backToCatalog')}
                </Link>
            </div>
        );
    }

    // Support both DB and legacy field names
    const stockQty = product.stock_quantity !== undefined ? product.stock_quantity : (product.stock || 0);
    const discountPrice = product.discount_price !== undefined ? product.discount_price : product.discountPrice;
    const categoryLabel = product.category_name || product.category_slug || product.category || '';
    const rating = product.rating || 4.5;
    const reviewsCount = product.reviewsCount || product.reviews_count || 0;

    const isOutOfStock = stockQty <= 0;
    const isDiscounted = discountPrice !== null && discountPrice !== undefined && parseFloat(discountPrice) > 0;
    const price = isDiscounted ? parseFloat(discountPrice) : parseFloat(product.price);

    const relatedProducts = products
        .filter(p => {
            const pCat = p.category_name || p.category_slug || p.category || '';
            return pCat === categoryLabel && String(p.id) !== String(product.id);
        })
        .slice(0, 4);

    const productImages = product.images && product.images.length > 0
        ? product.images.filter(Boolean)
        : [product.image].filter(Boolean);

    const incrementQty = () => {
        if (quantity < stockQty) setQuantity(prev => prev + 1);
    };
    const decrementQty = () => {
        if (quantity > 1) setQuantity(prev => prev - 1);
    };

    const handleAddToCart = () => {
        if (!isOutOfStock) addToCart(product, quantity);
    };

    return (
        <div className={`space-y-12 pb-12 ${isRtl ? 'text-right' : ''}`}>
            {/* Back navigation */}
            <div>
                <Link to="/catalog" className={`inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <ArrowLeft className={`h-4 w-4 ${isRtl ? 'ml-1.5 rotate-180' : 'mr-1.5'}`} /> {t('backToCatalog')}
                </Link>
            </div>

            {/* Main product box */}
            <section className={`grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm`}>

                {/* Left: Photos gallery */}
                <div className="space-y-4">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <img src={activeImage} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                    {productImages.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {productImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(img)}
                                    className={`flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-indigo-600' : 'border-slate-100 opacity-60'}`}
                                >
                                    <img src={img} alt={`thumbnail-${idx}`} className="h-full w-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: details info */}
                <div className="flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full w-fit block">
                            {categoryLabel}
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            {product.name}
                        </h1>
                        <div className={`flex items-center space-x-3 ${isRtl ? 'space-x-reverse' : ''}`}>
                            <div className={`flex items-center space-x-1 ${isRtl ? 'space-x-reverse' : ''}`}>
                                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                <span className="text-sm font-bold text-slate-700">{rating}</span>
                            </div>
                            {reviewsCount > 0 && (
                                <>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-xs font-semibold text-slate-500">{reviewsCount} {t('verifiedReviews')}</span>
                                </>
                            )}
                            {product.SKU && (
                                <>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-xs font-mono text-slate-400">SKU: {product.SKU}</span>
                                </>
                            )}
                        </div>

                        {/* Pricing */}
                        <div className={`flex items-baseline space-x-3 py-2 ${isRtl ? 'space-x-reverse' : ''}`}>
                            <span className="text-3xl font-black text-slate-900">{currency}{price.toFixed(2)}</span>
                            {isDiscounted && (
                                <>
                                    <span className="text-base text-slate-400 line-through">{currency}{parseFloat(product.price).toFixed(2)}</span>
                                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
                                        -{currency}{(parseFloat(product.price) - parseFloat(discountPrice)).toFixed(2)}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Stock indicator */}
                        <div className={`flex items-center space-x-2 ${isRtl ? 'space-x-reverse' : ''}`}>
                            <span className={`h-2.5 w-2.5 rounded-full ${isOutOfStock ? 'bg-red-500' : stockQty < 8 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                {isOutOfStock ? t('outOfStock') : stockQty < 8 ? `${t('lowStock')}: ${stockQty}` : `${t('inStock')} / ${stockQty}`}
                            </span>
                        </div>

                        <p className="text-slate-500 text-sm leading-relaxed font-normal">{product.description}</p>
                    </div>

                    {/* Action Box */}
                    <div className="border-t border-slate-100 pt-6 space-y-4">
                        {!isOutOfStock && (
                            <div className={`flex items-center space-x-4 ${isRtl ? 'space-x-reverse' : ''}`}>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('quantity')}:</span>
                                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                                    <button onClick={decrementQty} className="p-2.5 hover:text-indigo-600 transition-colors">
                                        <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="px-4 text-sm font-bold text-slate-800 w-10 text-center select-none">{quantity}</span>
                                    <button onClick={incrementQty} className="p-2.5 hover:text-indigo-600 transition-colors">
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className={`flex-1 flex items-center justify-center space-x-2 font-bold px-6 py-3.5 rounded-full transition transform active:scale-95 shadow-md ${isRtl ? 'space-x-reverse' : ''} ${isOutOfStock ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-slate-900 text-white hover:shadow-lg'
                                    }`}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                <span>{isOutOfStock ? t('outOfStock') : t('addToCart')}</span>
                            </button>
                            <button className="p-3.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-colors">
                                <Heart className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Guarantee icons */}
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-6 text-[10px] text-slate-400 uppercase tracking-widest font-bold text-center">
                        <div className="flex flex-col items-center">
                            <Shield className="h-5 w-5 text-indigo-600 mb-1" />
                            <span>{t('warranty')}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <RefreshCw className="h-5 w-5 text-indigo-600 mb-1" />
                            <span>{t('returns')}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <ShoppingCart className="h-5 w-5 text-indigo-600 mb-1" />
                            <span>{t('freeDelivery')}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-900">{t('relatedProducts')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedProducts.map(prod => (
                            <ProductCard key={prod.id} product={prod} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
