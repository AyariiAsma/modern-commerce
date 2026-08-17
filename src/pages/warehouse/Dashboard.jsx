import React, { useState, useEffect } from 'react';
import { warehouseService } from '../../services/api';
import { Package, Truck, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WarehouseDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        warehouseService.getPendingOrders()
            .then(res => setOrders(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const pending = orders.filter(o => o.status === 'Pending');
    const processing = orders.filter(o => o.status === 'Processing');

    return (
        <div className="space-y-5 pt-2">
            <div>
                <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
                <p className="text-slate-400 text-sm mt-0.5">Overview of warehouse operations</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-amber-50 p-1.5 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{loading ? '—' : pending.length}</p>
                    <p className="text-slate-400 text-xs mt-1">orders to prepare</p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-50 p-1.5 rounded-lg">
                            <Truck className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Progress</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{loading ? '—' : processing.length}</p>
                    <p className="text-slate-400 text-xs mt-1">orders being packed</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Quick Actions</h2>
                <Link to="/warehouse/import" className="flex items-center justify-between bg-indigo-600 text-white p-4 rounded-2xl shadow-md hover:bg-indigo-700 transition">
                    <div className="flex items-center gap-3">
                        <Package className="h-5 w-5" />
                        <div>
                            <p className="font-bold text-sm">Stock Import</p>
                            <p className="text-indigo-200 text-xs">Scan and add incoming products</p>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-70" />
                </Link>

                <Link to="/warehouse/orders" className="flex items-center justify-between bg-white text-slate-800 p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition">
                    <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-indigo-500" />
                        <div>
                            <p className="font-bold text-sm">Order Packing</p>
                            <p className="text-slate-400 text-xs">Prepare and scan items for orders</p>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                </Link>
            </div>

            {/* Recent Orders */}
            {!loading && orders.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Orders Queue</h2>
                    <div className="space-y-2">
                        {orders.slice(0, 5).map(order => (
                            <Link
                                key={order.id}
                                to={'/warehouse/orders/' + order.id}
                                className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition"
                            >
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{order.order_number}</p>
                                    <p className="text-slate-400 text-xs mt-0.5">{order.shipping_first_name} {order.shipping_last_name}</p>
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                    order.status === 'Processing' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {order.status}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {!loading && orders.length === 0 && (
                <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                    <p className="font-bold text-slate-700">All caught up!</p>
                    <p className="text-slate-400 text-sm">No pending orders to prepare.</p>
                </div>
            )}
        </div>
    );
}
