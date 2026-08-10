import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import { orderService } from '../../services/api';
import Modal from '../../components/Modal';
import { Eye, Calendar, DollarSign, MapPin, CreditCard, Inbox, Loader2 } from 'lucide-react';

export default function Orders() {
    const { settings } = useDatabase();
    const { t, isRtl } = useLanguage();

    const currency = settings?.currency || '$';

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const res = await orderService.getAll();
            setOrders(res.data);
        } catch (err) {
            console.error('Failed to load orders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleOpenDetail = async (ord) => {
        try {
            // Load full details including items and snapshot address
            const res = await orderService.getById(ord.id);
            setSelectedOrder(res.data);
            setModalOpen(true);
        } catch (err) {
            alert('Failed to load order details.');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await orderService.updateStatus(id, newStatus);
            if (selectedOrder && selectedOrder.id === id) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            }
            loadOrders();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status.');
        }
    };

    const statusOptions = ['Pending', 'Confirmed', 'Preparing', 'Shipped', 'Delivered', 'Cancelled'];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Confirmed': return 'bg-blue-105 text-blue-800 border-blue-200';
            case 'Preparing': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className={`space-y-6 ${isRtl ? 'text-right' : ''}`}>
            <div>
                <h1 className="text-xl font-extrabold text-slate-900">{t('ordersManagerTitle')}</h1>
                <p className="text-slate-500 text-xs">{t('ordersManagerDesc')}</p>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-650" />
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                    {orders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase tracking-widest font-bold">
                                        <th className="p-4">Order Ref</th>
                                        <th className="p-4">Customer Details</th>
                                        <th className="p-4">Billing Method</th>
                                        <th className="p-4">{t('totalValue')}</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">{t('datePlaced')}</th>
                                        <th className="p-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                                    {orders.map((ord) => {
                                        const customerName = `${ord.shipping_first_name} ${ord.shipping_last_name}`;
                                        const totalAmount = ord.total !== undefined ? ord.total : ord.totalAmount;
                                        const orderRef = ord.order_number || ord.id;

                                        return (
                                            <tr key={ord.id} className="hover:bg-slate-50/20">
                                                <td className="p-4 font-mono font-bold text-slate-800">{orderRef}</td>
                                                <td className="p-4 pr-6">
                                                    <span className="font-bold text-slate-800 block">{customerName}</span>
                                                    <span className="text-[10px] text-slate-400 font-semibold">Phone: {ord.shipping_phone}</span>
                                                </td>
                                                <td className="p-4 text-slate-500 font-semibold">{ord.payment_method}</td>
                                                <td className="p-4 font-bold text-slate-900">{currency}{parseFloat(totalAmount).toFixed(2)}</td>
                                                <td className="p-4">
                                                    <select
                                                        value={ord.status}
                                                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                                                        className={`text-[10px] font-extrabold uppercase border px-2.5 py-1 rounded-full outline-none cursor-pointer ${getStatusColor(ord.status)}`}
                                                    >
                                                        {statusOptions.map(s => (<option key={s} value={s} className="bg-white text-slate-800">{s}</option>))}
                                                    </select>
                                                </td>
                                                <td className="p-4 text-slate-400">
                                                    {new Date(ord.created_at || ord.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => handleOpenDetail(ord)} className={`inline-flex items-center px-2 py-1.5 border border-slate-100 hover:border-slate-350 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-lg gap-1.5 transition text-[10px] ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                        <Eye className="h-3.5 w-3.5" /> View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16 space-y-4">
                            <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-400">
                                <Inbox className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">{t('noOrdersTitle')}</h3>
                        </div>
                    )}
                </div>
            )}

            {selectedOrder && (
                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Invoice Details: ${selectedOrder.order_number || selectedOrder.id}`}>
                    <div className="space-y-6 text-xs text-slate-600 font-semibold text-left">
                        <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t('invoiceStatus')}</p>
                                <p className="mt-1 text-xs font-bold text-slate-800">{t('adjustDispatchStatus')}</p>
                            </div>
                            <select value={selectedOrder.status} onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)} className={`text-xs font-extrabold uppercase border px-3 py-1.5 rounded-full outline-none cursor-pointer ${getStatusColor(selectedOrder.status)}`}>
                                {statusOptions.map(s => (<option key={s} value={s} className="bg-white text-slate-800">{s}</option>))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-slate-400 uppercase tracking-widest text-[9px] flex items-center">
                                    <Calendar className="h-3.5 w-3.5 mr-1" /> {t('datePlaced')}
                                </p>
                                <p className="text-slate-800 text-xs font-bold">{new Date(selectedOrder.created_at || selectedOrder.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-400 uppercase tracking-widest text-[9px] flex items-center">
                                    <DollarSign className="h-3.5 w-3.5 mr-1" /> {t('totalValue')}
                                </p>
                                <p className="text-slate-900 text-base font-black">{currency}{(selectedOrder.total || selectedOrder.totalAmount || 0).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="space-y-1">
                                <p className="text-slate-400 uppercase tracking-widest text-[9px] flex items-center">
                                    <CreditCard className="h-3.5 w-3.5 mr-1" /> {t('paymentMethod')}
                                </p>
                                <p className="text-slate-800 text-xs font-semibold">
                                    {selectedOrder.shipping_first_name} {selectedOrder.shipping_last_name}
                                </p>
                                <p className="text-slate-500 text-[10px]">Payment: {selectedOrder.payment_method} ({selectedOrder.payment_status || 'Pending'})</p>
                            </div>
                            <div className="space-y-1 pt-2">
                                <p className="text-slate-400 uppercase tracking-widest text-[9px] flex items-center">
                                    <MapPin className="h-3.5 w-3.5 mr-1" /> {t('deliverTo')}
                                </p>
                                <p className="text-slate-800 text-xs font-semibold leading-relaxed">
                                    {selectedOrder.shipping_first_name} {selectedOrder.shipping_last_name}, <br />
                                    {selectedOrder.shipping_address_line_1} {selectedOrder.shipping_address_line_2 ? `, ${selectedOrder.shipping_address_line_2}` : ''} <br />
                                    {selectedOrder.shipping_city}, {selectedOrder.shipping_postal_code}, {selectedOrder.shipping_country}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="divide-y divide-slate-50 max-h-[30vh] overflow-y-auto pr-1">
                                {selectedOrder.items && selectedOrder.items.map((item, idx) => {
                                    const nameVal = item.product_name || item.name;
                                    const priceVal = item.unit_price !== undefined ? item.unit_price : item.price;
                                    const totalVal = item.total_price !== undefined ? item.total_price : (priceVal * item.quantity);

                                    return (
                                        <div key={idx} className="flex justify-between items-center py-2.5 text-xs text-slate-805 font-bold">
                                            <div className="flex items-center space-x-2">
                                                <img src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'} alt={nameVal} className="h-9 w-9 rounded object-cover bg-slate-50 border border-slate-100" />
                                                <div>
                                                    <span className="line-clamp-1 max-w-[150px] font-semibold text-slate-800">{nameVal}</span>
                                                    <span className="text-[10px] text-slate-400">Qty: {item.quantity} × {currency}{parseFloat(priceVal).toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <span className="text-slate-900">{currency}{parseFloat(totalVal).toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 text-center">
                            <button onClick={() => setModalOpen(false)} className="px-6 py-2.5 bg-indigo-650 hover:bg-slate-900 text-white rounded-xl transition text-xs shadow-md font-bold">
                                {t('closeDetails') || 'Close'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
