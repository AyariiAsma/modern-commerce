import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCart } from '../../store/CartContext';
import { useAuth } from '../../store/AuthContext';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import { addressService } from '../../services/api';
import { CheckCircle2, CreditCard, ShoppingBag, ArrowLeft, Loader2, Sparkles, MapPin, Plus, User, Phone, Home } from 'lucide-react';
import FidelityBanner from '../../components/FidelityBanner';

export default function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { cart, cartTotal, cartTotalHt, cartTotalTva, checkout } = useCart();
    const { user } = useAuth();
    const { settings } = useDatabase();
    const { t, isRtl } = useLanguage();

    const discountPercent = location.state?.discountPercent || 0;
    const appliedCode = location.state?.appliedCode || '';
    const currency = settings?.currency || '$';
    const configuredShippingFee = settings?.shippingFee !== undefined ? settings.shippingFee : 15.00;
    const cashOnly = settings?.cashOnDeliveryOnly || false;

    const shippingCost = cartTotal > 150 || cartTotal === 0 ? 0 : configuredShippingFee;
    const discountAmount = cartTotal * discountPercent;
    const finalSubtotal = cartTotal - discountAmount + shippingCost;

    const [loading, setLoading] = useState(false);
    const [successOrder, setSuccessOrder] = useState(null);

    // Live address states
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [useNewAddress, setUseNewAddress] = useState(false);

    // Fetch user saved addresses
    useEffect(() => {
        if (user) {
            addressService.getAll()
                .then(res => {
                    setSavedAddresses(res.data);
                    const defaultAddr = res.data.find(a => a.is_default === 1);
                    if (defaultAddr) {
                        setSelectedAddressId(defaultAddr.id);
                    } else if (res.data.length > 0) {
                        setSelectedAddressId(res.data[0].id);
                    } else {
                        setUseNewAddress(true);
                    }
                })
                .catch(err => {
                    console.error('Failed to retrieve customer addresses:', err);
                    setUseNewAddress(true);
                });
        } else {
            setUseNewAddress(true);
        }
    }, [user]);

    // Setup form validation for new address
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: user?.phone || '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            zipCode: '',
            country: 'Algeria',
            saveAddress: true,
            paymentMethod: cashOnly ? 'cod' : 'creditCard'
        }
    });

    const onSubmit = async (data) => {
        setLoading(true);

        let billingMethod = 'Credit Card';
        if (data.paymentMethod === 'paypal') billingMethod = 'PayPal';
        else if (data.paymentMethod === 'cod') billingMethod = 'Cash On Delivery';

        let checkoutData = {
            payment_method: billingMethod,
            discount: discountAmount,
            shipping_cost: shippingCost,
            promo_code: appliedCode
        };

        if (useNewAddress) {
            checkoutData.address_details = {
                first_name: data.firstName,
                last_name: data.lastName,
                phone: data.phone,
                address_line_1: data.addressLine1,
                address_line_2: data.addressLine2 || null,
                city: data.city,
                postal_code: data.zipCode,
                country: data.country,
                additional_information: data.additionalInfo || null
            };
            checkoutData.save_address = data.saveAddress;
        } else {
            checkoutData.address_id = selectedAddressId;
        }

        const result = await checkout(checkoutData);
        setLoading(false);

        if (result.success) {
            setSuccessOrder(result.order);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert(result.error || 'Failed to place order.');
        }
    };

    if (cart.length === 0 && !successOrder) {
        return (
            <div className="text-center py-16 space-y-4">
                <h2 className="text-xl font-bold text-slate-800">{t('emptyCartTitle')}</h2>
                <p className="text-slate-400 text-sm">{t('emptyCartDesc')}</p>
                <Link to="/catalog" className="inline-flex items-center text-sm font-bold text-indigo-600 hover:underline">
                    <ArrowLeft className="h-4 w-4 mr-2" /> {t('backToCatalog')}
                </Link>
            </div>
        );
    }

    if (successOrder) {
        const orderAddr = successOrder.shipping_address_line_1 
            ? `${successOrder.shipping_first_name} ${successOrder.shipping_last_name}, ${successOrder.shipping_address_line_1}, ${successOrder.shipping_city}, ${successOrder.shipping_country}`
            : successOrder.shippingAddress || '';

        return (
            <div className={`max-w-md mx-auto bg-white border border-slate-100 rounded-3xl p-8 py-10 shadow-lg text-center space-y-6 ${isRtl ? 'text-right' : ''}`}>
                <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-500 mx-auto">
                    <CheckCircle2 className="h-12 w-12 animate-bounce" />
                </div>

                <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">{t('orderSuccessTitle')}</h2>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        {t('orderRef')}: {successOrder.orderNumber || successOrder.id}
                    </p>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed text-center">
                    {t('orderSuccessDesc')}
                </p>

                <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 text-slate-600 border border-slate-100 text-left">
                    <p><span className="font-bold text-slate-700">{t('totalValue')}:</span> {currency}{(successOrder.total || successOrder.totalAmount || 0).toFixed(2)}</p>
                    <p><span className="font-bold text-slate-700">{t('tva')}:</span> {currency}{(successOrder.total_tva || successOrder.totalTva || 0).toFixed(2)}</p>
                    <p><span className="font-bold text-slate-700">{t('paymentMethod')}:</span> {successOrder.payment_method || successOrder.paymentMethod}</p>
                    <p><span className="font-bold text-slate-700">{t('deliverTo')}:</span> {orderAddr}</p>
                </div>

                <div className="space-y-3 pt-2 text-center">
                    <Link
                        to={user ? "/profile" : "/catalog"}
                        className="w-full inline-flex items-center justify-center font-bold px-6 py-3.5 bg-indigo-650 hover:bg-slate-900 text-white rounded-full transition shadow-md"
                    >
                        {user ? t('viewHistory') : t('continueShopping')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-5 gap-8 ${isRtl ? 'text-right' : ''}`}>
            
            {/* Checkout Form - Left */}
            <div className="lg:col-span-3 space-y-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    
                    {/* Delivery Address Card */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                        <div className="pb-4 border-b border-slate-100">
                            <h2 className={`text-xl font-bold text-slate-900 flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <MapPin className={`h-5 w-5 text-indigo-600 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                                <span>{t('shippingSettings')}</span>
                            </h2>
                            <p className="text-slate-400 text-xs mt-1">{t('deliveryDest')}</p>
                        </div>

                        {/* Saved Addresses List (only for logged-in user) */}
                        {user && savedAddresses.length > 0 && (
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Use a Saved Address</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {savedAddresses.map(addr => (
                                        <div 
                                            key={addr.id}
                                            onClick={() => {
                                                setSelectedAddressId(addr.id);
                                                setUseNewAddress(false);
                                            }}
                                            className={`p-4 border rounded-2xl cursor-pointer transition flex items-start justify-between ${
                                                !useNewAddress && selectedAddressId === addr.id
                                                    ? 'border-indigo-600 bg-indigo-50/20'
                                                    : 'border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="space-y-1 text-xs">
                                                <p className="font-bold text-slate-800 flex items-center">
                                                    <Home className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
                                                    {addr.first_name} {addr.last_name}
                                                    {addr.is_default === 1 && (
                                                        <span className="ml-2 text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">
                                                            DEFAULT
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-slate-500">{addr.address_line_1}{addr.address_line_2 ? `, ${addr.address_line_2}` : ''}</p>
                                                <p className="text-slate-500">{addr.city}, {addr.postal_code}, {addr.country}</p>
                                                <p className="text-slate-400">Phone: {addr.phone}</p>
                                            </div>
                                            <input 
                                                type="radio" 
                                                name="selected_address"
                                                checked={!useNewAddress && selectedAddressId === addr.id}
                                                onChange={() => {}}
                                                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500" 
                                            />
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setUseNewAddress(true);
                                        setSelectedAddressId(null);
                                    }}
                                    className={`w-full py-3 border border-dashed rounded-2xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-400 transition flex items-center justify-center ${
                                        useNewAddress ? 'border-indigo-600 text-indigo-650 bg-indigo-50/10' : ''
                                    }`}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add a new shipping address
                                </button>
                            </div>
                        )}

                        {/* New Address Form Fields */}
                        {useNewAddress && (
                            <div className="space-y-4 pt-2 border-t border-slate-50">
                                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">New Shipping Address</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">First Name</label>
                                        <input
                                            type="text"
                                            {...register('firstName', { required: useNewAddress ? 'First name is required' : false })}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {errors.firstName && <p className="text-[11px] text-red-500 font-semibold">{errors.firstName.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Last Name</label>
                                        <input
                                            type="text"
                                            {...register('lastName', { required: useNewAddress ? 'Last name is required' : false })}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {errors.lastName && <p className="text-[11px] text-red-500 font-semibold">{errors.lastName.message}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Phone Number</label>
                                        <input
                                            type="text"
                                            {...register('phone', { required: useNewAddress ? 'Phone is required' : false })}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {errors.phone && <p className="text-[11px] text-red-500 font-semibold">{errors.phone.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Country</label>
                                        <input
                                            type="text"
                                            {...register('country', { required: useNewAddress ? 'Country is required' : false })}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {errors.country && <p className="text-[11px] text-red-500 font-semibold">{errors.country.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('streetAddress')}</label>
                                    <input
                                        type="text"
                                        {...register('addressLine1', { required: useNewAddress ? 'Street address is required' : false })}
                                        placeholder="Address Line 1"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.addressLine1 && <p className="text-[11px] text-red-500 font-semibold">{errors.addressLine1.message}</p>}
                                    
                                    <input
                                        type="text"
                                        {...register('addressLine2')}
                                        placeholder="Apartment, suite, unit, building (optional)"
                                        className="w-full mt-2 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('city')}</label>
                                        <input
                                            type="text"
                                            {...register('city', { required: useNewAddress ? 'City is required' : false })}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {errors.city && <p className="text-[11px] text-red-500 font-semibold">{errors.city.message}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('zipCode')}</label>
                                        <input
                                            type="text"
                                            {...register('zipCode', { required: useNewAddress ? 'ZIP code is required' : false })}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {errors.zipCode && <p className="text-[11px] text-red-500 font-semibold">{errors.zipCode.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Additional Delivery Notes (optional)</label>
                                    <textarea
                                        rows="2"
                                        {...register('additionalInfo')}
                                        placeholder="e.g. Leave package by the garage door, gate code 1234, etc."
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 resize-none"
                                    />
                                </div>

                                {/* Save this address checkbox for authenticated customers */}
                                {user && (
                                    <label className="flex items-center space-x-2.5 cursor-pointer pt-2">
                                        <input
                                            type="checkbox"
                                            {...register('saveAddress')}
                                            className="h-4.5 w-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-bold text-slate-500">Save this address for future orders</span>
                                    </label>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Payment Settings Card */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                        <div className="pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center">
                                <CreditCard className="h-5 w-5 text-indigo-600 mr-2" />
                                <span>{t('paymentMethod')}</span>
                            </h2>
                            <p className="text-slate-400 text-xs mt-1">Select your preferred payment option</p>
                        </div>

                        {cashOnly ? (
                            <div className="p-4 border rounded-2xl bg-indigo-50/45 border-indigo-100 space-y-2">
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        value="cod"
                                        checked
                                        readOnly
                                        className="h-4.5 w-4.5 text-indigo-650 focus:ring-indigo-500"
                                    />
                                    <span className="font-bold text-xs text-indigo-900 block ml-3">
                                        {t('cashOnDelivery')} ({t('freeDelivery')} / Pay on Delivery Only)
                                    </span>
                                </div>
                                <p className="text-[10px] text-indigo-550 leading-relaxed">
                                    *Our store settings currently restrict payments strictly to delivery collections. No pre-payment is required!
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <label className="flex items-center p-4 border rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition border-slate-200">
                                    <input
                                        type="radio"
                                        value="creditCard"
                                        {...register('paymentMethod')}
                                        className="h-4.5 w-4.5 text-indigo-650"
                                    />
                                    <span className="font-semibold text-xs text-slate-700 block ml-3">{t('creditCard')}</span>
                                </label>

                                <label className="flex items-center p-4 border rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition border-slate-200">
                                    <input
                                        type="radio"
                                        value="paypal"
                                        {...register('paymentMethod')}
                                        className="h-4.5 w-4.5 text-indigo-650"
                                    />
                                    <span className="font-semibold text-xs text-slate-700 block ml-3">{t('paypal')}</span>
                                </label>

                                <label className="flex items-center p-4 border rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition border-slate-200">
                                    <input
                                        type="radio"
                                        value="cod"
                                        {...register('paymentMethod')}
                                        className="h-4.5 w-4.5 text-indigo-650"
                                    />
                                    <span className="font-semibold text-xs text-slate-700 block ml-3">{t('cashOnDelivery')}</span>
                                </label>
                            </div>
                        )}

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading || (!useNewAddress && !selectedAddressId)}
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
                    </div>
                </form>
            </div>

            {/* Cart Summary - Right */}
            <div className="lg:col-span-2 space-y-6">
                <FidelityBanner currentCartTotal={finalSubtotal} />
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                    <h3 className={`font-bold text-slate-800 text-base pb-3 border-b border-slate-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <span className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <ShoppingBag className={`h-4 w-4 text-slate-400 ${isRtl ? 'ml-1.5' : 'mr-1.5'}`} />
                            <span>{t('shoppingBag')}</span>
                        </span>
                        <Link to="/cart" className="text-xs font-semibold text-indigo-600 hover:underline">{t('back')}</Link>
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
                            <span>{t('subtotal')} (HT)</span>
                            <span className="font-semibold text-slate-800">{currency}{(cartTotalHt || 0).toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-slate-500">
                            <span>{t('tva')}</span>
                            <span className="font-semibold text-slate-800">{currency}{(cartTotalTva || 0).toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-50 border-dashed">
                            <span>Total (TTC)</span>
                            <span className="font-semibold text-slate-800">{currency} {(cartTotal || 0).toFixed(2)}</span>
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

                        <div className="border-t border-slate-100 pt-3 flex justify-between font-extrabold text-slate-900 text-sm">
                            <span>{t('netPay')}</span>
                            <span>{currency}{finalSubtotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
