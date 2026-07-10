import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCart } from '../../store/CartContext';
import { useAuth } from '../../store/AuthContext';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import { CheckCircle2, CreditCard, ShoppingBag, ArrowLeft, Loader2, Sparkles, MapPin } from 'lucide-react';

export default function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { cart, cartTotal, checkout } = useCart();
    const { user } = useAuth();
    const { settings } = useDatabase();
    const { t, isRtl } = useLanguage();

    // Retrieve promo discount details from router state
    const discountPercent = location.state?.discountPercent || 0;

    // Settings values configured in Admin Panel
    const currency = settings?.currency || '$';
    const configuredShippingFee = settings?.shippingFee !== undefined ? settings.shippingFee : 9.99;
    const cashOnly = settings?.cashOnDeliveryOnly || false;

    const shippingCost = cartTotal > 150 || cartTotal === 0 ? 0 : configuredShippingFee;
    const discountAmount = cartTotal * discountPercent;
    const finalSubtotal = cartTotal - discountAmount + shippingCost;

    const [loading, setLoading] = useState(false);
    const [successOrder, setSuccessOrder] = useState(null);

    // Setup form validation
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            fullName: user ? user.name : '',
            address: '',
            city: '',
            zipCode: '',
            // If payment restricted to Cash Only, default to 'cod', otherwise 'creditCard'
            paymentMethod: cashOnly ? 'cod' : 'creditCard'
        }
    });

    const onSubmit = async (data) => {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const addressString = `${data.address}, ${data.city}, ${data.zipCode}`;

        let billingMethod = 'Credit Card';
        if (data.paymentMethod === 'paypal') billingMethod = 'PayPal';
        else if (data.paymentMethod === 'cod') billingMethod = t('cashOnDelivery');

        const result = checkout(addressString, billingMethod);
        setLoading(false);

        if (result.success) {
            setSuccessOrder(result.order);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert(result.error || 'Failed to place order.');
        }
    };

    // If cart is empty and order has not been placed, redirect
    if (cart.length === 0 && !successOrder) {
        return (
            <div className="text-center py-16 space-y-4">
                <h2 className="text-xl font-bold text-slate-805">{t('emptyCartTitle')}</h2>
                <p className="text-slate-400 text-sm">{t('emptyCartDesc')}</p>
                <Link to="/catalog" className="inline-flex items-center text-sm font-bold text-indigo-650 hover:underline">
                    <ArrowLeft className="h-4 w-4 mr-2" /> {t('backToCatalog')}
                </Link>
            </div>
        );
    }

    // Success view
    if (successOrder) {
        return (
            <div className={`max-w-md mx-auto bg-white border border-slate-100 rounded-3xl p-8 py-10 shadow-lg text-center space-y-6 ${isRtl ? 'text-right' : ''}`}>
                <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-500 mx-auto">
                    <CheckCircle2 className="h-12 w-12 animate-bounce" />
                </div>

                <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-black text-slate-905 leading-tight">{t('orderSuccessTitle')}</h2>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        {t('orderRef')}: {successOrder.id}
                    </p>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed text-center">
                    {t('orderSuccessDesc')}
                </p>

                <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 text-slate-655 border border-slate-100">
                    <p><span className="font-bold text-slate-700">{t('totalValue')}:</span> {currency}{successOrder.totalAmount.toFixed(2)}</p>
                    <p><span className="font-bold text-slate-700">{t('paymentMethod')}:</span> {successOrder.paymentMethod}</p>
                    <p><span className="font-bold text-slate-700">{t('deliverTo')}:</span> {successOrder.shippingAddress}</p>
                </div>

                <div className="space-y-3 pt-2 text-center">
                    <Link
                        to={user ? "/profile" : "/catalog"}
                        className="w-full inline-flex items-center justify-center font-bold px-6 py-3.5 bg-indigo-650 hover:bg-slate-900 text-white rounded-full transition shadow-md"
                    >
                        {user ? t('viewHistory') : t('continueShopping')}
                    </Link>
                    {!user && (
                        <Link to="/register" className="text-xs font-semibold text-slate-400 hover:text-indigo-650 block transition">
                            {t('createAccountTrack')}
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-5 gap-8 ${isRtl ? 'text-right' : ''}`}>

            {/* Checkout Form - Left */}
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="pb-4 border-b border-slate-100">
                        <h2 className={`text-xl font-bold text-slate-900 flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <MapPin className={`h-5 w-5 text-indigo-650 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span>{t('shippingSettings')}</span>
                        </h2>
                        <p className="text-slate-400 text-xs mt-1">{t('deliveryDest')}</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Full Name */}
                        <div className="space-y-1.5 animate-slide-up">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('fullName')}</label>
                            <input
                                type="text"
                                {...register('fullName', { required: t('fullNameReq') })}
                                className="w-full bg-slate-50 border border-slate-205 text-slate-805 text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                            {errors.fullName && <p className="text-[11px] text-red-540 font-semibold">{errors.fullName.message}</p>}
                        </div>

                        {/* Address */}
                        <div className="space-y-1.5 animate-slide-up">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('streetAddress')}</label>
                            <input
                                type="text"
                                {...register('address', { required: t('streetAddressReq') })}
                                className="w-full bg-slate-50 border border-slate-205 text-slate-805 text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                            {errors.address && <p className="text-[11px] text-red-540 font-semibold">{errors.address.message}</p>}
                        </div>

                        {/* City & Zip Code */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 animate-slide-up">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('city')}</label>
                                <input
                                    type="text"
                                    {...register('city', { required: t('cityReq') })}
                                    className="w-full bg-slate-55 border border-slate-205 text-slate-805 text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {errors.city && <p className="text-[11px] text-red-540 font-semibold">{errors.city.message}</p>}
                            </div>

                            <div className="space-y-1.5 animate-slide-up">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('zipCode')}</label>
                                <input
                                    type="text"
                                    {...register('zipCode', { required: t('zipCodeReq') })}
                                    className="w-full bg-slate-55 border border-slate-205 text-slate-805 text-sm rounded-xl py-2.5 px-4 focus:outline-none"
                                />
                                {errors.zipCode && <p className="text-[11px] text-red-540 font-semibold">{errors.zipCode.message}</p>}
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('paymentMethod')}</label>

                            {cashOnly ? (
                                // Only Cash on Delivery supported is configured
                                <div className="p-4 border rounded-2xl bg-indigo-50/45 border-indigo-100 space-y-2">
                                    <div className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <input
                                            type="radio"
                                            value="cod"
                                            checked
                                            readOnly
                                            className="h-4.5 w-4.5 text-indigo-650 focus:ring-indigo-500"
                                        />
                                        <span className={`font-bold text-xs text-indigo-900 block ${isRtl ? 'mr-3' : 'ml-3'}`}>
                                            {t('cashOnDelivery')} ({t('freeDelivery')} / Pay on Delivery Only)
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-indigo-550 leading-relaxed">
                                        *Our store settings currently restrict payments strictly to delivery collections. No pre-payment is required!
                                    </p>
                                </div>
                            ) : (
                                // Display all payment options
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Card */}
                                    <label className={`flex items-center p-4 border rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition border-slate-200 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <input
                                            type="radio"
                                            value="creditCard"
                                            {...register('paymentMethod')}
                                            className="h-4.5 w-4.5 text-indigo-650"
                                        />
                                        <span className={`font-semibold text-xs text-slate-700 block ${isRtl ? 'mr-3' : 'ml-3'}`}>{t('creditCard')}</span>
                                    </label>

                                    {/* PayPal */}
                                    <label className={`flex items-center p-4 border rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition border-slate-200 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <input
                                            type="radio"
                                            value="paypal"
                                            {...register('paymentMethod')}
                                            className="h-4.5 w-4.5 text-indigo-650"
                                        />
                                        <span className={`font-semibold text-xs text-slate-700 block ${isRtl ? 'mr-3' : 'ml-3'}`}>{t('paypal')}</span>
                                    </label>

                                    {/* COD */}
                                    <label className={`flex items-center p-4 border rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition border-slate-200 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <input
                                            type="radio"
                                            value="cod"
                                            {...register('paymentMethod')}
                                            className="h-4.5 w-4.5 text-indigo-650"
                                        />
                                        <span className={`font-semibold text-xs text-slate-700 block ${isRtl ? 'mr-3' : 'ml-3'}`}>{t('cashOnDelivery')}</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Submit checkout buttons */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex items-center justify-center space-x-2 font-bold px-6 py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-full transition transform active:scale-95 shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                                        <span>Processing order dispatch...</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-4 w-4" />
                                        <span>{t('placeOrder')} ({currency}{finalSubtotal.toFixed(2)})</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Cart Summary - Right */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                    <h3 className={`font-bold text-slate-800 text-base pb-3 border-b border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <span className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <ShoppingBag className={`h-4 w-4 text-slate-400 ${isRtl ? 'ml-1.5' : 'mr-1.5'}`} />
                            <span>{t('shoppingBag')}</span>
                        </span>
                        <Link to="/cart" className="text-xs font-semibold text-indigo-650 hover:underline">{t('back')}</Link>
                    </h3>

                    {/* Miniature List items */}
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                        {cart.map((item) => (
                            <div key={item.productId} className={`flex gap-3 text-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <img src={item.image} alt={item.name} className="h-12 w-12 rounded bg-slate-50 object-cover flex-shrink-0" />
                                <div className="flex-1 space-y-0.5">
                                    <h4 className="font-semibold text-slate-850 line-clamp-1">{item.name}</h4>
                                    <p className="text-slate-400">Qty: {item.quantity} × {currency}{item.price.toFixed(2)}</p>
                                </div>
                                <span className="font-bold text-slate-905">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Pricing aggregates */}
                    <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-500">
                            <span>{t('subtotal')}</span>
                            <span className="font-semibold text-slate-800">{currency}{cartTotal.toFixed(2)}</span>
                        </div>

                        {discountPercent > 0 && (
                            <div className="flex justify-between text-red-500 font-semibold">
                                <span className="flex items-center"><Sparkles className="h-3 w-3 mr-1 ml-1" /> Discount</span>
                                <span>-{currency}{discountAmount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-slate-500">
                            <span>{t('estimatedShipping')}</span>
                            <span className="font-semibold text-slate-800">{shippingCost === 0 ? t('freeDelivery') : `${currency}${shippingCost}`}</span>
                        </div>

                        <div className="border-t border-slate-100 pt-3 flex justify-between font-extrabold text-slate-909 text-sm">
                            <span>{t('netPay')}</span>
                            <span>{currency}{finalSubtotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
