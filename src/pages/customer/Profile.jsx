import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import { addressService, orderService, loyaltyService } from '../../services/api';
import { Package, Calendar, MapPin, ShieldAlert, Sparkles, Home, Phone, Plus, Trash2, Edit2, Check, Star, ArrowLeft, Gift } from 'lucide-react';

export default function Profile() {
    const { user } = useAuth();
    const { settings } = useDatabase();
    const { t, isRtl } = tFunctionSafe();

    if (!user) return <Navigate to="/login" replace />;

    const currency = settings?.currency || '$';
    
    // Tab switching state
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'addresses'
    
    // API states
    const [userOrders, setUserOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [addressesLoading, setAddressesLoading] = useState(true);

    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Loyalty
    const [loyaltyData, setLoyaltyData] = useState(null);
    const [loyaltyLoading, setLoyaltyLoading] = useState(false);

    // Form/Modal states
    const [showForm, setShowForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        postal_code: '',
        country: 'Algeria',
        additional_information: '',
        is_default: false
    });

    const loadOrders = async () => {
        try {
            setOrdersLoading(true);
            const res = await orderService.getAll();
            setUserOrders(res.data);
        } catch (err) {
            console.error('Failed to load user orders:', err);
        } finally {
            setOrdersLoading(false);
        }
    };

    const loadAddresses = async () => {
        try {
            setAddressesLoading(true);
            const res = await addressService.getAll();
            setAddresses(res.data);
        } catch (err) {
            console.error('Failed to load user addresses:', err);
        } finally {
            setAddressesLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        loadAddresses();
        loadLoyalty();
    }, [user]);

    const loadLoyalty = async () => {
        setLoyaltyLoading(true);
        try {
            const res = await loyaltyService.getMyLoyaltyStatus();
            setLoyaltyData(res.data?.data || null);
        } catch (err) {
            console.error('Failed to load loyalty:', err);
        } finally {
            setLoyaltyLoading(false);
        }
    };

    // Safe translation helper
    function tFunctionSafe() {
        const { t, isRtl } = useLanguage();
        return { t, isRtl };
    }

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleOpenAdd = () => {
        setEditingAddress(null);
        setFormData({
            first_name: '',
            last_name: '',
            phone: '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            postal_code: '',
            country: 'Algeria',
            additional_information: '',
            is_default: addresses.length === 0 // Default if it's the first address
        });
        setShowForm(true);
    };

    const handleOpenEdit = (addr) => {
        setEditingAddress(addr);
        setFormData({
            first_name: addr.first_name,
            last_name: addr.last_name,
            phone: addr.phone,
            address_line_1: addr.address_line_1,
            address_line_2: addr.address_line_2 || '',
            city: addr.city,
            postal_code: addr.postal_code,
            country: addr.country,
            additional_information: addr.additional_information || '',
            is_default: addr.is_default === 1
        });
        setShowForm(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAddress) {
                await addressService.update(editingAddress.id, formData);
            } else {
                await addressService.create(formData);
            }
            setShowForm(false);
            loadAddresses();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save address.');
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!confirm('Are you sure you want to delete this address?')) return;
        try {
            await addressService.delete(id);
            loadAddresses();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete address.');
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await addressService.setDefault(id);
            loadAddresses();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to set default address.');
        }
    };

    const handleViewOrder = async (orderId) => {
        setDetailsLoading(true);
        setSelectedOrderDetails(null);
        try {
            const res = await orderService.getById(orderId);
            setSelectedOrderDetails(res.data);
        } catch (err) {
            console.error('Failed to load order details', err);
        } finally {
            setDetailsLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 text-amber-800';
            case 'Confirmed': return 'bg-blue-100 text-blue-800';
            case 'Preparing': return 'bg-purple-100 text-purple-800';
            case 'Shipped': return 'bg-indigo-100 text-indigo-800';
            case 'Delivered': return 'bg-emerald-100 text-emerald-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className={`space-y-8 pb-12 ${isRtl ? 'text-right' : ''}`}>
            
            {/* Profile header */}
            <section className={`bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-2xl flex items-center justify-center border-2 border-indigo-600 shadow-md">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
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
                    <p className="text-xs text-slate-500">Registered member account</p>
                </div>
            </section>

            {/* Profile Navigation Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => { setActiveTab('orders'); setShowForm(false); }}
                    className={`pb-4 px-6 text-sm font-bold border-b-2 transition ${
                        activeTab === 'orders'
                            ? 'border-indigo-650 text-indigo-650'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    {t('orderHistory') || 'Order History'}
                </button>
                <button
                    onClick={() => { setActiveTab('addresses'); setShowForm(false); }}
                    className={`pb-4 px-6 text-sm font-bold border-b-2 transition ${
                        activeTab === 'addresses'
                            ? 'border-indigo-650 text-indigo-650'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    My Addresses
                </button>
                <button
                    onClick={() => setActiveTab('loyalty')}
                    className={`pb-4 px-6 text-sm font-bold border-b-2 transition flex items-center gap-1 ${
                        activeTab === 'loyalty'
                            ? 'border-amber-500 text-amber-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Star className="h-3.5 w-3.5" /> Loyalty
                </button>
            </div>

            {/* Tab: Orders */}
            {activeTab === 'orders' && (
                <section className="space-y-6">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 flex items-center">
                            <Package className="h-5 w-5 text-slate-700 mr-2" /> {t('orderHistory')}
                        </h2>
                        <p className="text-slate-400 text-xs mt-1">Review and track your historical platform orders</p>
                    </div>

                    {ordersLoading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                        </div>
                    ) : userOrders.length > 0 ? (
                        <div className="space-y-6">
                            {userOrders.map((order) => {
                                const orderAddr = order.shipping_address_line_1 
                                    ? `${order.shipping_first_name} ${order.shipping_last_name}, ${order.shipping_address_line_1}, ${order.shipping_city}, ${order.shipping_country}`
                                    : order.shippingAddress || '';

                                return (
                                    <div key={order.id} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                                        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                                <div>
                                                    <p className="text-slate-400 font-bold uppercase tracking-wider">{t('datePlaced')}</p>
                                                    <p className="font-semibold text-slate-700 mt-1 flex items-center">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-400 mr-1" />
                                                        {new Date(order.created_at || order.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 font-bold uppercase tracking-wider">{t('totalValue')}</p>
                                                    <p className="font-bold text-slate-900 mt-1">{currency}{(order.total || order.totalAmount || 0).toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 font-bold uppercase tracking-wider">{t('orderRef')}</p>
                                                    <p className="font-mono text-slate-500 mt-1">{order.order_number || order.id}</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <button 
                                                        onClick={() => handleViewOrder(order.id)}
                                                        className="text-indigo-600 hover:text-indigo-800 font-bold underline"
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>

                                        <div className="p-6 divide-y divide-slate-100 text-xs sm:text-sm">
                                            {order.items && order.items.map((item, idx) => (
                                                <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0 text-sm">
                                                    <img src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'} alt={item.product_name || item.name} className="h-14 w-14 rounded-lg bg-slate-50 object-cover border border-slate-100" />
                                                    <div className="flex-1 space-y-1">
                                                        <h4 className="font-bold text-slate-800 line-clamp-1">{item.product_name || item.name}</h4>
                                                        <p className="text-xs text-slate-450">Quantity: {item.quantity} × {currency}{(item.unit_price || item.price || 0).toFixed(2)}</p>
                                                    </div>
                                                    <span className="font-bold text-slate-900">{currency}{((item.unit_price || item.price || 0) * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className="pt-4 text-xs text-slate-500 flex items-start">
                                                <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5 mr-1" />
                                                <span><span className="font-semibold text-slate-600">{t('deliverTo') || 'Deliver To'}: </span>{orderAddr}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-100 rounded-3xl py-12 px-4 shadow-sm text-center space-y-4">
                            <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-400">
                                <ShieldAlert className="h-8 w-8 text-indigo-400" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800">{t('noOrdersTitle')}</h3>
                            <p className="text-xs text-slate-450 max-w-xs mx-auto">{t('noOrdersDesc')}</p>
                        </div>
                    )}
                    
                    {/* Order Details Modal */}
                    {(selectedOrderDetails || detailsLoading) && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                                    <h3 className="font-bold text-slate-800 text-lg">Order Details</h3>
                                    <button onClick={() => setSelectedOrderDetails(null)} className="text-slate-400 hover:text-slate-600">
                                        <Trash2 className="h-4 w-4 hidden" /> Close
                                    </button>
                                </div>
                                {detailsLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Timeline */}
                                        <div>
                                            <h4 className="font-bold text-slate-700 mb-4">Timeline</h4>
                                            <div className="space-y-4 border-l-2 border-indigo-100 ml-2 pl-4">
                                                {selectedOrderDetails.history?.map((hist, i) => (
                                                    <div key={i} className="relative">
                                                        <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-indigo-600 border-2 border-white"></div>
                                                        <p className="text-xs text-slate-400">{new Date(hist.created_at).toLocaleString()}</p>
                                                        <p className="text-sm font-bold text-slate-800">Status changed to <span className={`px-2 py-0.5 rounded-md text-[10px] ${getStatusColor(hist.new_status)}`}>{hist.new_status}</span></p>
                                                        {hist.comment && <p className="text-xs text-slate-500 italic mt-1">{hist.comment}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Documents */}
                                        {selectedOrderDetails.invoices?.length > 0 && (
                                            <div className="border-t border-slate-100 pt-4">
                                                <h4 className="font-bold text-slate-700 mb-3">Documents</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {selectedOrderDetails.invoices.map((inv, i) => (
                                                        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-800">Invoice {inv.invoice_number}</p>
                                                                <p className="text-[10px] text-slate-500">{new Date(inv.invoice_date).toLocaleDateString()}</p>
                                                            </div>
                                                            {inv.pdf_path && (
                                                                <a 
                                                                    href={`http://localhost:5001${inv.pdf_path}`} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-slate-900 transition"
                                                                >
                                                                    Download PDF
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Items */}
                                        <div className="border-t border-slate-100 pt-4">
                                            <h4 className="font-bold text-slate-700 mb-3">Items Ordered</h4>
                                            <div className="divide-y divide-slate-50 text-xs">
                                                {selectedOrderDetails.items?.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between py-2">
                                                        <span>{item.quantity}x {item.product_name}</span>
                                                        <span className="font-bold">{currency}{item.total_price.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Tab: Addresses */}
            {activeTab === 'addresses' && (
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900 flex items-center">
                                <MapPin className="h-5 w-5 text-slate-700 mr-2" /> Saved Addresses
                            </h2>
                            <p className="text-slate-400 text-xs mt-1">Configure your default shipping destinations</p>
                        </div>
                        {!showForm && (
                            <button
                                onClick={handleOpenAdd}
                                className="inline-flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-full transition shadow active:scale-95"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Add Address</span>
                            </button>
                        )}
                    </div>

                    {showForm ? (
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-xl">
                            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-850 text-sm">
                                    {editingAddress ? 'Modify Address Profile' : 'Register New Address'}
                                </h3>
                                <button 
                                    onClick={() => setShowForm(false)}
                                    className="text-xs font-semibold text-slate-400 hover:text-indigo-600 flex items-center"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                                </button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block">First Name</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleFormChange}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Last Name</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleFormChange}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Phone Number</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleFormChange}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Country</label>
                                        <input
                                            type="text"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleFormChange}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Street Address</label>
                                    <input
                                        type="text"
                                        name="address_line_1"
                                        value={formData.address_line_1}
                                        onChange={handleFormChange}
                                        placeholder="Address Line 1"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="text"
                                        name="address_line_2"
                                        value={formData.address_line_2}
                                        onChange={handleFormChange}
                                        placeholder="Apartment, suite, unit, etc (optional)"
                                        className="w-full mt-2 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleFormChange}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Postal Code</label>
                                        <input
                                            type="text"
                                            name="postal_code"
                                            value={formData.postal_code}
                                            onChange={handleFormChange}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Additional Instructions (optional)</label>
                                    <textarea
                                        name="additional_information"
                                        value={formData.additional_information}
                                        onChange={handleFormChange}
                                        rows="2"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    />
                                </div>

                                <label className="flex items-center space-x-2.5 cursor-pointer pt-2">
                                    <input
                                        type="checkbox"
                                        name="is_default"
                                        checked={formData.is_default}
                                        onChange={handleFormChange}
                                        disabled={addresses.length === 0 || (editingAddress && editingAddress.is_default === 1)}
                                        className="h-4.5 w-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                                    />
                                    <span className="text-xs font-bold text-slate-500">Set as default shipping address</span>
                                </label>

                                <div className="pt-4 flex items-center gap-3">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center font-bold px-6 py-2.5 bg-indigo-600 hover:bg-slate-900 text-white text-xs rounded-full transition shadow"
                                    >
                                        Save Address
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="inline-flex items-center justify-center font-bold px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs rounded-full transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : addressesLoading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                        </div>
                    ) : addresses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {addresses.map(addr => (
                                <div 
                                    key={addr.id}
                                    className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 transition ${
                                        addr.is_default === 1 ? 'border-indigo-600 bg-indigo-50/5' : 'border-slate-100'
                                    }`}
                                >
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-800 text-sm flex items-center">
                                                <Home className="h-4 w-4 text-slate-400 mr-2" />
                                                {addr.first_name} {addr.last_name}
                                            </p>
                                            {addr.is_default === 1 && (
                                                <span className="inline-flex text-[8px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-1 text-slate-500 pl-6">
                                            <p>{addr.address_line_1}</p>
                                            {addr.address_line_2 && <p>{addr.address_line_2}</p>}
                                            <p>{addr.city}, {addr.postal_code}, {addr.country}</p>
                                            <p className="flex items-center text-slate-400 mt-1">
                                                <Phone className="h-3 w-3 mr-1" /> {addr.phone}
                                            </p>
                                            {addr.additional_information && (
                                                <p className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-2">
                                                    Note: {addr.additional_information}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 border-t border-slate-50 pt-4 text-xs">
                                        {addr.is_default === 0 && (
                                            <button
                                                onClick={() => handleSetDefault(addr.id)}
                                                className="inline-flex items-center space-x-1 text-indigo-650 hover:underline font-semibold"
                                            >
                                                <Star className="h-3.5 w-3.5 text-indigo-650" />
                                                <span>Set Default</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleOpenEdit(addr)}
                                            className="inline-flex items-center space-x-1 text-slate-400 hover:text-indigo-600 pl-2 font-semibold"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAddress(addr.id)}
                                            className="inline-flex items-center space-x-1 text-slate-400 hover:text-red-600 ml-auto font-semibold"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-100 rounded-3xl py-12 px-4 shadow-sm text-center space-y-4">
                            <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-400">
                                <MapPin className="h-8 w-8 text-indigo-400" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800">No Saved Addresses</h3>
                            <p className="text-xs text-slate-450 max-w-xs mx-auto">You have not registered any delivery address yet. Add one to expedite checkout.</p>
                            <button
                                onClick={handleOpenAdd}
                                className="inline-flex items-center justify-center font-bold px-5 py-2 bg-indigo-650 hover:bg-slate-900 text-white text-xs rounded-full transition shadow"
                            >
                                Add Your First Address
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* Tab: Loyalty */}
            {activeTab === 'loyalty' && (
                <section className="space-y-6">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 flex items-center">
                            <Star className="h-5 w-5 text-amber-500 mr-2" /> My Loyalty Rewards
                        </h2>
                        <p className="text-slate-400 text-xs mt-1">Earn reward codes by completing eligible orders</p>
                    </div>

                    {loyaltyLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
                    ) : loyaltyData ? (
                        <>
                            {/* Dual-Condition Progress Card */}
                            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                                <p className="text-xs text-amber-700 font-bold uppercase tracking-widest mb-4">Your Loyalty Progress</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Orders condition */}
                                    <div className="bg-white/70 border border-amber-100 rounded-2xl p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs font-bold text-slate-600">Qualifying Orders</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                (loyaltyData.eligible_orders_count || 0) >= (loyaltyData.required_orders_for_next || 5)
                                                    ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {(loyaltyData.eligible_orders_count || 0) >= (loyaltyData.required_orders_for_next || 5) ? '✓ Done' : 'In Progress'}
                                            </span>
                                        </div>
                                        <p className="text-3xl font-extrabold text-slate-800">
                                            {loyaltyData.eligible_orders_count || 0}
                                            <span className="text-slate-400 text-xl font-medium"> / {loyaltyData.required_orders_for_next || '?'}</span>
                                        </p>
                                        <div className="mt-2 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min(100, ((loyaltyData.eligible_orders_count || 0) / (loyaltyData.required_orders_for_next || 5)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    {/* Amount condition */}
                                    <div className="bg-white/70 border border-amber-100 rounded-2xl p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs font-bold text-slate-600">Total Spent</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                (loyaltyData.qualifying_amount || 0) >= (loyaltyData.required_amount_for_next || 150)
                                                    ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {(loyaltyData.qualifying_amount || 0) >= (loyaltyData.required_amount_for_next || 150) ? '✓ Done' : 'In Progress'}
                                            </span>
                                        </div>
                                        <p className="text-3xl font-extrabold text-slate-800">
                                            {currency}{(loyaltyData.qualifying_amount || 0).toFixed(2)}
                                            <span className="text-slate-400 text-xl font-medium"> / {loyaltyData.required_amount_for_next || '?'}</span>
                                        </p>
                                        <div className="mt-2 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min(100, ((loyaltyData.qualifying_amount || 0) / (loyaltyData.required_amount_for_next || 150)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-4 italic">
                                    Both conditions must be met within the same cycle to earn a reward.
                                </p>
                            </div>

                            {/* Codes */}
                            <div>
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <Gift className="h-4 w-4 text-amber-500" /> Your Reward Codes
                                </h3>
                                {(loyaltyData.available_codes || loyaltyData.codes || []).length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {(loyaltyData.available_codes || loyaltyData.codes || []).map(code => {
                                            const isActive = code.status === 'active';
                                            const isExpired = code.expiration_date && new Date(code.expiration_date) < new Date();
                                            return (
                                                <div
                                                    key={code.id || code.code}
                                                    className={`border rounded-2xl p-5 flex flex-col gap-2 ${isActive && !isExpired ? 'bg-white border-amber-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive && !isExpired ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {isExpired ? 'Expired' : (code.status || 'active').toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="font-mono text-2xl font-extrabold tracking-widest text-amber-700">{code.code}</p>
                                                    {code.expiration_date && (
                                                        <p className="text-[10px] text-slate-400">
                                                            Expires: <span className="font-medium">{new Date(code.expiration_date).toLocaleDateString()}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 border border-slate-100 rounded-3xl py-8 px-4 text-center text-slate-400 text-xs">
                                        No reward codes earned yet. Keep ordering!
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="bg-white border border-slate-100 rounded-3xl py-12 text-center space-y-4 shadow-sm">
                            <Star className="h-12 w-12 text-amber-300 mx-auto" />
                            <h3 className="font-bold text-slate-800">No loyalty data found</h3>
                            <p className="text-xs text-slate-400">Complete your first delivery to start earning rewards.</p>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

// Dummy loader component in case it's not imported globally
function Loader2({ className }) {
    return (
        <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );
}
