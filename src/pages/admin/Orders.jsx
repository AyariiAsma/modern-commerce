import React, { useState } from 'react';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import Modal from '../../components/Modal';
import { Eye, Calendar, DollarSign, MapPin, CreditCard, Inbox } from 'lucide-react';

export default function Orders() {
    const { orders, settings, updateOrderStatus } = useDatabase();
    const { t, isRtl } = useLanguage();

    const currency = settings?.currency || '$';

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const handleOpenDetail = (ord) => { setSelectedOrder(ord); setModalOpen(true); };

    const handleStatusChange = (id, newStatus) => {
        updateOrderStatus(id, newStatus);
        if (selectedOrder && selectedOrder.id === id) {
            setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
    };

    const statusOptions = ['Pending', 'Confirmed', 'Shipping', 'Delivered', 'Cancelled'];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Shipping': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'Delivered': return 'bg-emerald-100 text-emerald-808 border-emerald-200';
            case 'Cancelled': return 'bg-red-150 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className={`space-y-6 ${isRtl ? 'text-right' : ''}`}>
            <div>
                <h1 className="text-xl font-extrabold text-slate-905">{t('ordersManagerTitle')}</h1>
                <p className="text-slate-500 text-xs">{t('ordersManagerDesc')}</p>
            </div>

            <div className="bg-white border border-slate-101 rounded-3xl shadow-sm overflow-hidden">
                {orders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase tracking-widest font-bold">
                                    <th className="p-4">ID</th>
                                    <th className="p-4">{t('fullName')}</th>
                                    <th className="p-4">{t('totalValue')}</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">{t('datePlaced')}</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-655 font-medium">
                                {orders.map((ord) => (
                                    <tr key={ord.id} className="hover:bg-slate-50/20">
                                        <td className="p-4 font-mono font-bold text-slate-850">{ord.id}</td>
                                        <td className="p-4 pr-6">
                                            <span className="font-bold text-slate-805 block">{ord.customerName}</span>
                                            <span className="text-[10px] text-slate-400 font-semibold">{ord.customerEmail}</span>
                                        </td>
                                        <td className="p-4 font-bold text-slate-900">{currency}{ord.totalAmount.toFixed(2)}</td>
                                        <td className="p-4">
                                            <select
                                                value={ord.status}
                                                onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                                                className={`text-[10px] font-extrabold uppercase border px-2.5 py-1 rounded-full outline-none cursor-pointer ${getStatusColor(ord.status)}`}
                                            >
                                                {statusOptions.map(s => (<option key={s} value={s} className="bg-white text-slate-800">{s}</option>))}
                                            </select>
                                        </td>
                                        <td className="p-4 text-slate-450">
                                            {new Date(ord.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleOpenDetail(ord)} className={`inline-flex items-center px-2 py-1.5 border border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-lg gap-1.5 transition text-[10px] ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <Eye className="h-3.5 w-3.5" /> {t('invoiceDetails')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16 space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-350">
                            <Inbox className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">{t('noOrdersTitle')}</h3>
                    </div>
                )}
            </div>

            {selectedOrder && (
                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`${t('invoiceDetails')}: ${selectedOrder.id}`}>
                    <div className="space-y-6 text-xs text-slate-655 font-semibold">
                        <div className={`flex justify-between items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t('invoiceStatus')}</p>
                                <p className="mt-1 text-xs font-bold text-slate-805">{t('adjustDispatchStatus')}</p>
                            </div>
                            <select value={selectedOrder.status} onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)} className={`text-xs font-extrabold uppercase border px-3 py-1.5 rounded-full outline-none cursor-pointer ${getStatusColor(selectedOrder.status)}`}>
                                {statusOptions.map(s => (<option key={s} value={s} className="bg-white text-slate-800">{s}</option>))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className={`text-slate-400 uppercase tracking-widest text-[9px] flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <Calendar className={`h-3.5 w-3.5 ${isRtl ? 'ml-1' : 'mr-1'}`} /> {t('datePlaced')}
                                </p>
                                <p className="text-slate-805 text-xs font-bold">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className={`text-slate-400 uppercase tracking-widest text-[9px] flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <DollarSign className={`h-3.5 w-3.5 ${isRtl ? 'ml-1' : 'mr-1'}`} /> {t('totalValue')}
                                </p>
                                <p className="text-slate-905 text-base font-black">{currency}{selectedOrder.totalAmount.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="space-y-1">
                                <p className={`text-slate-400 uppercase tracking-widest text-[9px] flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <CreditCard className={`h-3.5 w-3.5 ${isRtl ? 'ml-1' : 'mr-1'}`} /> {t('paymentMethod')}
                                </p>
                                <p className="text-slate-800 text-xs font-semibold">{selectedOrder.customerName} ({selectedOrder.customerEmail})</p>
                                <p className="text-slate-500 text-[10px]">{selectedOrder.paymentMethod}</p>
                            </div>
                            <div className="space-y-1 pt-2">
                                <p className={`text-slate-400 uppercase tracking-widest text-[9px] flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <MapPin className={`h-3.5 w-3.5 ${isRtl ? 'ml-1' : 'mr-1'}`} /> {t('deliverTo')}
                                </p>
                                <p className="text-slate-800 text-xs font-semibold leading-relaxed">{selectedOrder.shippingAddress}</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="divide-y divide-slate-50 max-h-[30vh] overflow-y-auto pr-1">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className={`flex justify-between items-center py-2.5 text-xs text-slate-800 font-bold ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <div className={`flex items-center space-x-2 ${isRtl ? 'space-x-reverse' : ''}`}>
                                            <img src={item.image} alt={item.name} className="h-9 w-9 rounded object-cover bg-slate-50" />
                                            <div>
                                                <span className="line-clamp-1 max-w-[150px] font-semibold text-slate-800">{item.name}</span>
                                                <span className="text-[10px] text-slate-400">Qty: {item.quantity} × {currency}{item.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <span className="text-slate-900">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 text-center">
                            <button onClick={() => setModalOpen(false)} className="px-6 py-2.5 bg-indigo-650 hover:bg-slate-900 text-white rounded-xl transition text-xs shadow-md font-bold">
                                {t('closeDetails')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
