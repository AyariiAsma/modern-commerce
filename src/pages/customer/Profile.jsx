import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import { Package, Calendar, MapPin, ShieldAlert, Sparkles } from 'lucide-react';

export default function Profile() {
    const { user } = useAuth();
    const { orders, settings } = useDatabase();
    const { t, isRtl } = useLanguage();

    if (!user) return <Navigate to="/login" replace />;

    const currency = settings?.currency || '$';
    const userOrders = orders.filter(o => o.userId === user.id);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 text-amber-800';
            case 'Confirmed': return 'bg-blue-105 text-blue-800';
            case 'Shipping': return 'bg-indigo-100 text-indigo-805';
            case 'Delivered': return 'bg-emerald-100 text-emerald-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className={`space-y-8 ${isRtl ? 'text-right' : ''}`}>
            {/* Profile header */}
            <section className={`bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
                <img src={user.avatar} alt={user.name} className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-indigo-650 object-cover" />
                <div className={`space-y-1 ${isRtl ? 'text-right' : 'text-center sm:text-left'}`}>
                    <div className={`flex flex-col sm:flex-row sm:items-center gap-2 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{user.name}</h1>
                        {user.role === 'admin' && (
                            <span className="inline-flex text-[10px] font-bold text-white bg-indigo-650 px-2 py-0.5 rounded-full uppercase tracking-widest self-center">
                                {t('adminBadge')}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-slate-500">{t('memberSince')}</p>
                </div>
            </section>

            {/* Order history */}
            <section className="space-y-6">
                <div>
                    <h2 className={`text-xl font-extrabold text-slate-900 flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Package className={`h-5 w-5 text-slate-700 ${isRtl ? 'ml-2' : 'mr-2'}`} /> {t('orderHistory')}
                    </h2>
                    <p className="text-slate-450 text-xs mt-1">{t('orderHistoryDesc')}</p>
                </div>

                {userOrders.length > 0 ? (
                    <div className="space-y-6">
                        {userOrders.map((order) => (
                            <div key={order.id} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                                <div className={`bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase tracking-wider">{t('datePlaced')}</p>
                                            <p className={`font-semibold text-slate-700 mt-1 flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <Calendar className={`h-3.5 w-3.5 text-slate-400 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase tracking-wider">{t('totalValue')}</p>
                                            <p className="font-bold text-slate-905 mt-1">{currency}{order.totalAmount.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase tracking-wider">{t('orderRef')}</p>
                                            <p className="font-mono text-slate-550 mt-1">{order.id}</p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="p-6 divide-y divide-slate-100">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className={`flex gap-4 py-4 first:pt-0 last:pb-0 text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <img src={item.image} alt={item.name} className="h-14 w-14 rounded-lg bg-slate-50 object-cover border border-slate-50" />
                                            <div className="flex-1 space-y-1">
                                                <h4 className="font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                                                <p className="text-xs text-slate-450">{t('quantity')}: {item.quantity} × {currency}{item.price.toFixed(2)}</p>
                                            </div>
                                            <span className="font-bold text-slate-900">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className={`pt-4 text-xs text-slate-500 flex items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <MapPin className={`h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                                        <span><span className="font-semibold text-slate-655">{t('deliverTo')}: </span>{order.shippingAddress}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-100 rounded-3xl py-12 px-4 shadow-sm text-center space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-400">
                            <ShieldAlert className="h-8 w-8 text-indigo-400" />
                        </div>
                        <h3 className="text-base font-bold text-slate-805">{t('noOrdersTitle')}</h3>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">{t('noOrdersDesc')}</p>
                        <Link to="/catalog" className={`inline-flex items-center justify-center font-bold px-5 py-2 bg-indigo-650 hover:bg-slate-900 text-white text-xs rounded-full transition shadow ${isRtl ? 'flex-row-reverse' : ''}`}>
                            {t('exploreCatalog')} <Sparkles className={`h-3 w-3 ${isRtl ? 'mr-1' : 'ml-1'}`} />
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
}
