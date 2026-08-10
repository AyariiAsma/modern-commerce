import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import { adminService, orderService } from '../../services/api';
import { ShoppingBag, Grid, ShoppingCart, Users, ArrowUpRight, DollarSign, Package, Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { products, categories, orders, settings } = useDatabase();
    const { t, isRtl } = useLanguage();

    const currency = settings?.currency || '$';
    
    // Live stats states
    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
        totalCategories: 0,
        activeBanners: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Fetch live KPI stats from server
                const statsRes = await adminService.getStats();
                setStats(statsRes.data.totals);
                
                // Fetch recent orders from server
                const ordersRes = await orderService.getAll();
                setRecentOrders(ordersRes.data.slice(0, 5));
            } catch (err) {
                console.error('Failed to retrieve admin stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [orders]);

    const kpiCards = [
        { name: t('totalSalesRev') || 'Total Sales', value: `${currency}${stats.totalSales.toFixed(2)}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
        { name: t('activeOrders') || 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
        { name: 'Pending Orders', value: stats.pendingOrders, icon: Package, color: 'bg-amber-50 text-amber-600' },
        { name: t('inventoryItems') || 'Products', value: stats.totalProducts, icon: ShoppingBag, color: 'bg-indigo-50 text-indigo-600' },
        { name: t('browseCategories') || 'Categories', value: stats.totalCategories, icon: Grid, color: 'bg-purple-50 text-purple-600' },
        { name: t('registeredCustomers') || 'Customers', value: stats.totalCustomers, icon: Users, color: 'bg-pink-50 text-pink-600' },
        { name: 'Active Banners', value: stats.activeBanners, icon: Sparkles, color: 'bg-teal-50 text-teal-600' }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 text-amber-800';
            case 'Confirmed': return 'bg-blue-100 text-blue-800';
            case 'Preparing': return 'bg-purple-100 text-purple-805';
            case 'Shipped': return 'bg-indigo-100 text-indigo-800';
            case 'Delivered': return 'bg-emerald-100 text-emerald-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className={`space-y-8 ${isRtl ? 'text-right' : ''}`}>
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('adminDashboardTitle')}</h1>
                <p className="text-slate-500 text-xs mt-1">{t('adminDashboardDesc')}</p>
            </div>

            {/* KPI Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {kpiCards.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                            <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.name}</span>
                                <div className={`p-2 rounded-xl ${stat.color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-slate-900 leading-tight">{stat.value}</p>
                        </div>
                    );
                })}
            </section>

            {/* Recent Orders + Stock Levels */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Recent Orders List */}
                <div className="xl:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className={`flex items-center justify-between pb-4 border-b border-slate-100 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <h3 className="font-extrabold text-slate-800 text-sm">{t('recentOrdersList')}</h3>
                        <Link to="/admin/orders" className={`text-xs font-bold text-indigo-600 flex items-center hover:underline ${isRtl ? 'flex-row-reverse' : ''}`}>
                            {t('manageOrders')} <ArrowUpRight className={`h-3.5 w-3.5 ${isRtl ? 'mr-1' : 'ml-1'}`} />
                        </Link>
                    </div>

                    {recentOrders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-widest font-bold">
                                        <th className="pb-3 pr-2">Order Ref</th>
                                        <th className="pb-3 pr-2">Method</th>
                                        <th className="pb-3 pr-2">{t('totalValue')}</th>
                                        <th className="pb-3 pr-2">Status</th>
                                        <th className="pb-3">{t('datePlaced')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-slate-600">
                                    {recentOrders.map((ord) => (
                                        <tr key={ord.id} className="hover:bg-slate-50/50">
                                            <td className="py-3 font-mono font-bold text-slate-800">{ord.order_number || ord.id}</td>
                                            <td className="py-3 pr-2 font-medium">{ord.payment_method}</td>
                                            <td className="py-3 pr-2 font-bold text-slate-900">{currency}{ord.total.toFixed(2)}</td>
                                            <td className="py-3 pr-2">
                                                <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full ${getStatusColor(ord.status)}`}>
                                                    {ord.status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-[10px] text-slate-400">{new Date(ord.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-xs">{t('noOrdersTitle')}</div>
                    )}
                </div>

                {/* Stock Level Checks */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="pb-4 border-b border-slate-100">
                        <h3 className={`font-extrabold text-slate-800 text-sm flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Package className={`h-4 w-4 text-rose-500 ${isRtl ? 'ml-2' : 'mr-2'}`} /> {t('stockLevelCheck')}
                        </h3>
                        <p className="text-slate-400 text-[10px] mt-0.5">{t('replenishRequired')}</p>
                    </div>
                    
                    <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
                        {products.slice(0, 8).map((prod) => (
                            <div key={prod.id} className={`flex justify-between items-center text-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <span className="font-medium text-slate-700 line-clamp-1 flex-1 pr-4">{prod.name}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                    prod.stock_quantity === 0 
                                        ? 'bg-rose-50 text-rose-600' 
                                        : prod.stock_quantity <= 5 
                                            ? 'bg-amber-50 text-amber-600' 
                                            : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {prod.stock_quantity === 0 ? t('outOfStock') : `${prod.stock_quantity} units`}
                                </span>
                            </div>
                        ))}
                    </div>
                    
                    <Link to="/admin/products" className="w-full inline-flex items-center justify-center font-bold px-4 py-2 border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/10 text-slate-500 hover:text-indigo-650 text-xs rounded-xl transition">
                        {t('verifyFullInv')}
                    </Link>
                </div>
            </section>
        </div>
    );
}
