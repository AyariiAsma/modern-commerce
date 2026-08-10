import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../store/CartContext';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag, TicketPercent, Globe, Loader2 } from 'lucide-react';
import { loyaltyService } from '../../services/api';
import FidelityBanner from '../../components/FidelityBanner';

export default function Cart() {
    const { cart, updateQuantity, removeFromCart, cartTotal, cartTotalHt, cartTotalTva } = useCart();
    const { settings } = useDatabase();
    const { t, isRtl } = useLanguage();
    const navigate = useNavigate();

    // Promo code discounts
    const [promoCode, setPromoCode] = useState('');
    const [activeDiscount, setActiveDiscount] = useState(0); // decimal like 0.15
    const [appliedCode, setAppliedCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [codeSuccess, setCodeSuccess] = useState('');
    const [validatingCode, setValidatingCode] = useState(false);

    // Loaded from Database Settings configured by Admin
    const currency = settings?.currency || '$';
    const configuredShippingFee = settings?.shippingFee !== undefined ? settings.shippingFee : 9.99;
    const shippingCost = cartTotal > 150 || cartTotal === 0 ? 0 : configuredShippingFee;

    const discountAmount = cartTotal * activeDiscount;
    const finalSubtotal = cartTotal - discountAmount + shippingCost;

    const handleApplyPromo = async (e) => {
        e.preventDefault();
        setCodeError('');
        setCodeSuccess('');

        const codeToValidate = promoCode.trim();
        if (!codeToValidate) return;

        setValidatingCode(true);
        try {
            const response = await loyaltyService.validateCode(codeToValidate);
            if (response.data.success) {
                const { discount_type, discount_value, code } = response.data;
                const discountDecimal = discount_type === 'percentage' ? (discount_value / 100) : (discount_value / cartTotal);
                setActiveDiscount(discountDecimal);
                setAppliedCode(code);
                setCodeSuccess(t('appliedPromo') + `: ${discount_value}${discount_type === 'percentage' ? '%' : ''}`);
                setPromoCode('');
            }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || t('promoError');
            setCodeError(errMsg);
        } finally {
            setValidatingCode(false);
        }
    };

    const handleProceedCheckout = () => {
        navigate('/checkout', { state: { discountPercent: activeDiscount, appliedCode: appliedCode } });
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
                <div className="bg-slate-50 p-6 rounded-full text-slate-400">
                    <ShoppingBag className="h-10 w-10 animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{t('emptyCartTitle')}</h2>
                <p className="text-slate-400 text-sm max-w-xs text-center">{t('emptyCartDesc')}</p>
                <Link
                    to="/catalog"
                    className="inline-flex items-center justify-center font-bold px-6 py-3 bg-indigo-650 hover:bg-slate-900 text-white text-xs rounded-full transition shadow"
                >
                    {t('exploreCatalog')}
                </Link>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${isRtl ? 'text-right' : ''}`}>
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('shoppingBag')}</h1>
                <p className="text-slate-500 text-sm mt-1">{t('reviewBag')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Items list - Left */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.map((item) => (
                        <div
                            key={item.productId}
                            className={`flex items-center gap-4 bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl shadow-sm hover:border-slate-205 transition-colors ${isRtl ? 'flex-row-reverse' : ''
                                }`}
                        >
                            {/* Product Photo */}
                            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg overflow-hidden bg-slate-50 border border-slate-50 flex-shrink-0">
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                            </div>

                            {/* Title & Actions */}
                            <div className={`flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
                                <div className="space-y-1 max-w-sm">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</span>
                                    <Link to={`/product/${item.productId}`} className="font-bold text-slate-808 text-sm hover:text-indigo-650 line-clamp-1 block transition-colors">
                                        {item.name}
                                    </Link>
                                    <p className="text-xs font-bold text-slate-900">{currency}{item.price.toFixed(2)}</p>
                                </div>

                                <div className={`flex items-center justify-between sm:justify-start gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    {/* Quantity selector */}
                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg">
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                            className="p-1.5 text-slate-500 hover:text-indigo-600 transition"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="px-3 text-xs font-semibold text-slate-800 w-8 text-center select-none">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                            className="p-1.5 text-slate-500 hover:text-indigo-600 transition"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>

                                    {/* Remove */}
                                    <button
                                        onClick={() => removeFromCart(item.productId)}
                                        className="p-2 border border-slate-101 hover:border-red-100 text-slate-400 hover:text-red-505 rounded-lg bg-white transition"
                                        title="Remove item"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals Summary - Right */}
                <aside className="space-y-6">
                    <FidelityBanner currentCartTotal={finalSubtotal} />
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                        <h3 className={`font-bold text-slate-800 text-base pb-3 border-b border-slate-100 ${isRtl ? 'text-right' : ''}`}>
                            {t('summary')}
                        </h3>

                        {/* Calculations items */}
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-slate-550">
                                <span>{t('subtotal')} (HT)</span>
                                <span className="font-semibold text-slate-800">{currency}{(cartTotalHt || 0).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between text-slate-550">
                                <span>{t('tva')}</span>
                                <span className="font-semibold text-slate-800">{currency}{(cartTotalTva || 0).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between text-slate-550 pt-2 border-t border-slate-50 border-dashed">
                                <span>Total (TTC)</span>
                                <span className="font-semibold text-slate-800">{currency}{(cartTotal || 0).toFixed(2)}</span>
                            </div>

                            {activeDiscount > 0 && (
                                <div className="flex justify-between text-red-500 font-medium">
                                    <span className="flex items-center">
                                        <TicketPercent className="h-4 w-4 mr-1.5 ml-1.5 font-bold" /> {t('appliedPromo')}
                                    </span>
                                    <span>-{currency}{discountAmount.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-slate-550">
                                <span>{t('estimatedShipping')}</span>
                                <span className="font-semibold text-slate-800">
                                    {shippingCost === 0 ? <span className="text-emerald-600">{t('freeDelivery')}</span> : `${currency}${shippingCost}`}
                                </span>
                            </div>

                            <div className="border-t border-slate-100 pt-4 flex justify-between font-extrabold text-slate-900 text-base">
                                <span>{t('netPay')}</span>
                                <span>{currency}{finalSubtotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Coupon Code Section */}
                        <div className="border-t border-slate-100 pt-5 space-y-2">
                            <form onSubmit={handleApplyPromo} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={t('promoPlaceholder')}
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value)}
                                    disabled={validatingCode}
                                    className="flex-1 bg-slate-50 border border-slate-205 text-slate-800 text-xs rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-semibold disabled:opacity-60"
                                />
                                <button
                                    type="submit"
                                    disabled={validatingCode || !promoCode.trim()}
                                    className="bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {validatingCode ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                    {t('applyCode')}
                                </button>
                            </form>
                            {codeError && <p className="text-[11px] text-red-500 font-semibold">{codeError}</p>}
                            {codeSuccess && <p className="text-[11px] text-emerald-600 font-semibold">{codeSuccess}</p>}
                        </div>

                        {/* Submit checkout */}
                        <button
                            onClick={handleProceedCheckout}
                            className={`w-full inline-flex items-center justify-center space-x-2 font-bold px-6 py-3.5 bg-indigo-600 hover:bg-slate-900 text-white rounded-full transition transform active:scale-95 shadow-md hover:shadow-lg ${isRtl ? 'space-x-reverse' : ''
                                }`}
                        >
                            <span>{t('proceedCheckout')}</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </aside>

            </div>
        </div>
    );
}
