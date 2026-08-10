import React, { useState, useEffect } from 'react';
import { loyaltyService } from '../../services/api';
import { Star, Users, Gift, Ban, RefreshCw, CheckCircle, Clock, Settings } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function Loyalty() {
    const [activeTab, setActiveTab] = useState('settings');
    const [progress, setProgress] = useState([]);
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);

    const { register, handleSubmit, reset, watch } = useForm();
    const isEnabled = watch('fidelity_enabled');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [progressRes, codesRes, settingsRes] = await Promise.all([
                loyaltyService.getProgress(),
                loyaltyService.getCodes(),
                loyaltyService.getSettings()
            ]);
            setProgress(progressRes.data?.data || []);
            setCodes(codesRes.data?.data || []);

            if (settingsRes.data?.data) {
                const s = settingsRes.data.data;
                reset({
                    fidelity_enabled: s.fidelity_enabled === 1,
                    required_orders: s.required_orders || 5,
                    required_amount: s.required_amount || 150,
                    min_purchase_amount: s.min_purchase_amount || 0,
                    discount_type: s.discount_type || 'percentage',
                    discount_value: s.discount_value || 10,
                    amount_method: s.amount_method || 'total_ht_excl_shipping',
                    qualifying_statuses: Array.isArray(s.qualifying_statuses) ? s.qualifying_statuses.join(', ') : 'Delivered',
                    code_expiration_days: s.code_expiration_days || 30,
                    code_format: s.code_format || 'FID-{RANDOM}',
                    notify_days_before: Array.isArray(s.notify_days_before) ? s.notify_days_before.join(', ') : '3',
                    usage_limit: s.usage_limit || 1,
                    is_single_use: s.is_single_use === 1
                });
            }
        } catch (err) {
            console.error('Failed to fetch loyalty data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelCode = async (id) => {
        if (!window.confirm('Cancel this loyalty code?')) return;
        try {
            await loyaltyService.cancelCode(id);
            fetchData();
        } catch (err) {
            alert('Failed to cancel code');
        }
    };

    const onSaveSettings = async (data) => {
        try {
            const formattedData = {
                ...data,
                qualifying_statuses: data.qualifying_statuses.split(',').map(s => s.trim()).filter(Boolean),
                notify_days_before: data.notify_days_before.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
            };
            await loyaltyService.updateSettings(formattedData);
            alert('Settings updated successfully!');
            fetchData();
        } catch (err) {
            alert('Failed to update settings');
        }
    };

    const codeStatusConfig = {
        active: { label: 'Active', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700' },
        used: { label: 'Used', icon: CheckCircle, color: 'bg-slate-100 text-slate-600' },
        expired: { label: 'Expired', icon: Clock, color: 'bg-red-50 text-red-600' },
        cancelled: { label: 'Cancelled', icon: Ban, color: 'bg-red-100 text-red-700' },
    };

    const tabClass = (tab) =>
        `pb-3 px-5 text-sm font-bold border-b-2 transition ${activeTab === tab
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-400 hover:text-slate-600'}`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Star className="h-6 w-6 text-amber-500" />
                    Loyalty Program
                </h1>
                <p className="text-xs text-slate-500 mt-1">Track customer loyalty progress and manage fidelity reward codes.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                        <Users className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Enrolled Customers</p>
                        <p className="text-2xl font-extrabold text-slate-800">{progress.length}</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                        <Gift className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Active Codes</p>
                        <p className="text-2xl font-extrabold text-slate-800">{codes.filter(c => c.status === 'active').length}</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <Star className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Total Codes Issued</p>
                        <p className="text-2xl font-extrabold text-slate-800">{codes.length}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button onClick={() => setActiveTab('settings')} className={tabClass('settings')}>
                    <span className="flex items-center gap-2"><Settings className="h-4 w-4"/> Settings</span>
                </button>
                <button onClick={() => setActiveTab('progress')} className={tabClass('progress')}>
                    Customer Progress
                </button>
                <button onClick={() => setActiveTab('codes')} className={tabClass('codes')}>
                    Reward Codes
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                </div>
            ) : (
                <>
                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                            <form onSubmit={handleSubmit(onSaveSettings)} className="space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800">Fidelity Program Settings</h2>
                                        <p className="text-xs text-slate-500">Configure how customers earn rewards.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                                            <input type="checkbox" {...register('fidelity_enabled')} className="w-5 h-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-600" />
                                            Enable Program
                                        </label>
                                    </div>
                                </div>

                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-slate-800 text-sm">Milestone Requirements</h3>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Required Orders</label>
                                            <input type="number" {...register('required_orders', { valueAsNumber: true })} className="w-full rounded-lg border-slate-200 shadow-sm p-2 bg-slate-50 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Required Total Amount Spent</label>
                                            <input type="number" step="0.01" {...register('required_amount', { valueAsNumber: true })} className="w-full rounded-lg border-slate-200 shadow-sm p-2 bg-slate-50 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Amount Calculation Method</label>
                                            <select {...register('amount_method')} className="w-full rounded-lg border-slate-200 shadow-sm p-2 bg-slate-50 text-sm">
                                                <option value="total_ht_excl_shipping">Total HT (Excl. Shipping)</option>
                                                <option value="total_ttc">Total TTC</option>
                                                <option value="total_paid">Total Paid (Incl. Shipping)</option>
                                                <option value="total_paid_excl_shipping">Total Paid (Excl. Shipping)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Qualifying Order Statuses (Comma-separated)</label>
                                            <input type="text" {...register('qualifying_statuses')} placeholder="e.g. Delivered, Confirmed" className="w-full rounded-lg border-slate-200 shadow-sm p-2 bg-slate-50 text-sm" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-bold text-slate-800 text-sm">Reward Configuration</h3>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-1">Discount Type</label>
                                                <select {...register('discount_type')} className="w-full rounded-lg border-slate-200 shadow-sm p-2 bg-slate-50 text-sm">
                                                    <option value="percentage">Percentage (%)</option>
                                                    <option value="fixed">Fixed Amount</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-1">Discount Value</label>
                                                <input type="number" step="0.01" {...register('discount_value', { valueAsNumber: true })} className="w-full rounded-lg border-slate-200 shadow-sm p-2 bg-slate-50 text-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Minimum Purchase to Use Reward</label>
                                            <input type="number" step="0.01" {...register('min_purchase_amount', { valueAsNumber: true })} className="w-full rounded-lg border-slate-200 shadow-sm p-2 bg-slate-50 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Code Format (use RANDOM in braces)</label>
                                            <input type="text" {...register('code_format')} placeholder="e.g. FID-{RANDOM}" className="w-full rounded-lg border-slate-200 shadow-sm p-2 bg-slate-50 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Code Expiration (Days)</label>
                                            <input type="number" {...register('code_expiration_days', { valueAsNumber: true })} className="w-full rounded-lg border-slate-200 shadow-sm p-2 bg-slate-50 text-sm" />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition">
                                        Save Settings
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Progress Table */}
                    {activeTab === 'progress' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                            <th className="p-4">Customer</th>
                                            <th className="p-4 text-center">Milestones</th>
                                            <th className="p-4 text-center">Orders</th>
                                            <th className="p-4 text-center">Amount Spent</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                                        {progress.map(row => (
                                            <tr key={row.customer_id} className="hover:bg-slate-50/50 transition">
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-bold text-slate-800">{row.customer_name}</p>
                                                        <p className="text-slate-400 text-[10px]">{row.email}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="font-bold text-indigo-700 text-lg">{row.milestone_count || 0}</span>
                                                </td>
                                                <td className="p-4 text-center font-bold text-slate-700">
                                                    {row.eligible_orders_count || 0}
                                                </td>
                                                <td className="p-4 text-center font-bold text-slate-700">
                                                    {(row.qualifying_amount || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {progress.length === 0 && (
                                    <div className="p-12 text-center text-slate-400 text-sm">
                                        <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                        No loyalty data yet. Progress is tracked based on your settings.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Codes Table */}
                    {activeTab === 'codes' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                            <th className="p-4">Code</th>
                                            <th className="p-4">Customer</th>
                                            <th className="p-4">Qualifying Order</th>
                                            <th className="p-4 text-center">Status</th>
                                            <th className="p-4">Expires</th>
                                            <th className="p-4">Issued At</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                                        {codes.map(code => {
                                            const cfg = codeStatusConfig[code.status] || codeStatusConfig.active;
                                            const StatusIcon = cfg.icon;
                                            return (
                                                <tr key={code.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="p-4 font-mono font-extrabold text-amber-700 tracking-widest">{code.code}</td>
                                                    <td className="p-4">
                                                        <p className="font-bold">{code.customer_name}</p>
                                                        <p className="text-slate-400 text-[10px]">{code.email}</p>
                                                    </td>
                                                    <td className="p-4 font-mono text-slate-500">{code.qualifying_order_number || '—'}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>
                                                            <StatusIcon className="h-3 w-3" /> {cfg.label}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-slate-500">
                                                        {code.expiration_date ? new Date(code.expiration_date).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td className="p-4 text-slate-500">{new Date(code.created_at).toLocaleDateString()}</td>
                                                    <td className="p-4 text-right">
                                                        {code.status === 'active' && (
                                                            <button
                                                                onClick={() => handleCancelCode(code.id)}
                                                                className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition"
                                                                title="Cancel Code"
                                                            >
                                                                <Ban className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {codes.length === 0 && (
                                    <div className="p-12 text-center text-slate-400 text-sm">
                                        <Gift className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                        No reward codes have been generated yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
