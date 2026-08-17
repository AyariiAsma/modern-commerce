import React, { useState, useEffect } from 'react';
import { warehouseService } from '../../services/api';
import { Truck, ChevronRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OrderPreparation() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        warehouseService.getPendingOrders()
            .then(res => setOrders(res.data))
            .catch(() => setError('Failed to load orders.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-5 pt-2">
            <div>
                <h1 className="text-2xl font-black text-slate-900">Order Packing</h1>
                <p className="text-slate-400 text-sm mt-0.5">Select an order to start packing</p>
            </div>

            {error && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-2xl p-4">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                    <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
            )}

            {orders.length === 0 && !error && (
                <div className="text-center py-16">
                    <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                    <p className="font-bold text-slate-700">All clear!</p>
                    <p className="text-slate-400 text-sm">No orders need to be packed right now.</p>
                </div>
            )}

            <div className="space-y-3">
                {orders.map(order => {
                    const isProcessing = order.status === 'Processing';
                    return (
                        <Link
                            key={order.id}
                            to={'/warehouse/orders/' + order.id}
                            className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition"
                        >
                            <div className={`p-2.5 rounded-xl ${isProcessing ? 'bg-blue-50' : 'bg-amber-50'}`}>
                                <Truck className={`h-5 w-5 ${isProcessing ? 'text-blue-500' : 'text-amber-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900 text-sm">{order.order_number}</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        isProcessing ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-xs mt-0.5 truncate">
                                    {order.shipping_first_name} {order.shipping_last_name} — {order.shipping_city}
                                </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
