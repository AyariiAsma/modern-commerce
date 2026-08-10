import React, { useState, useEffect } from 'react';
import { promotionsService } from '../../services/api';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import { Tag, Plus, Edit2, Trash2, Clock, CheckCircle, Search, X } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function Promotions() {
    const { isRtl } = useLanguage();
    const { products, categories, refetchProducts } = useDatabase();
    
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form setup
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
    const watchType = watch('type', 'promotion');
    const watchDiscountType = watch('discount_type', 'percentage');
    const watchTargets = watch('targets', []); // Store targets as array of {type, id, name}

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        setLoading(true);
        try {
            const res = await promotionsService.getAll();
            setPromotions(res.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch promotions', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        reset({
            name: '',
            description: '',
            type: 'promotion',
            status: 'active',
            discount_type: 'percentage',
            discount_value: '',
            priority: 0,
            targets: []
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this promotion?')) return;
        try {
            await promotionsService.delete(id);
            await fetchPromotions();
            await refetchProducts(); // Prices might change immediately
        } catch (err) {
            alert('Failed to delete promotion');
        }
    };

    const onSubmit = async (data) => {
        try {
            // Format dates
            if (data.start_datetime) data.start_datetime = new Date(data.start_datetime).toISOString();
            if (data.end_datetime) data.end_datetime = new Date(data.end_datetime).toISOString();

            await promotionsService.create(data);
            setIsModalOpen(false);
            await fetchPromotions();
            await refetchProducts(); // Prices might change immediately
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create promotion');
        }
    };

    // Helper to add target to array
    const addTarget = (type, id, name) => {
        const current = watchTargets;
        if (!current.some(t => t.type === type && t.id === id)) {
            setValue('targets', [...current, { type, id, name }]);
        }
    };

    const removeTarget = (index) => {
        const current = [...watchTargets];
        current.splice(index, 1);
        setValue('targets', current);
    };

    return (
        <div className={`space-y-6 ${isRtl ? 'text-right' : ''}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Tag className="h-6 w-6 text-indigo-600" />
                        Promotions & Happy Hours
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Manage discounts, happy hours, and price overrides.</p>
                </div>
                <button 
                    onClick={handleOpenCreate}
                    className="bg-indigo-600 hover:bg-slate-900 text-white font-bold py-2.5 px-5 rounded-full transition shadow-md active:scale-95 text-xs flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" /> Create Promotion
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map(promo => {
                    const isActive = promo.status === 'active';
                    const isUpcoming = isActive && new Date(promo.start_datetime) > new Date();
                    const isExpired = new Date(promo.end_datetime) < new Date();
                    const stateLabel = isExpired ? 'Expired' : (isUpcoming ? 'Upcoming' : (isActive ? 'Active' : 'Inactive'));
                    const stateColor = isExpired ? 'bg-slate-100 text-slate-500' : (isUpcoming ? 'bg-amber-100 text-amber-700' : (isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'));

                    return (
                        <div key={promo.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative group overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${stateColor}`}>
                                        {stateLabel}
                                    </div>
                                    <h3 className="font-extrabold text-slate-800 text-lg">{promo.name}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleDelete(promo.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 line-clamp-2 h-8">{promo.description}</p>
                            
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                                <span className="text-slate-500">Discount:</span>
                                <span className="font-bold text-indigo-600 text-sm">
                                    {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : 
                                     promo.discount_type === 'fixed' ? `-$${promo.discount_value}` : 
                                     `$${promo.discount_value} Special`}
                                </span>
                            </div>

                            <div className="mt-2 text-[10px] text-slate-400 font-mono space-y-1">
                                <div className="flex justify-between">
                                    <span>Type:</span> <span className="uppercase text-slate-600">{promo.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Priority:</span> <span className="text-slate-600">{promo.priority}</span>
                                </div>
                                {promo.start_datetime && (
                                    <div className="flex justify-between mt-2 pt-2 border-t border-slate-50">
                                        <span>Starts:</span> <span>{new Date(promo.start_datetime).toLocaleString()}</span>
                                    </div>
                                )}
                                {promo.end_datetime && (
                                    <div className="flex justify-between">
                                        <span>Ends:</span> <span>{new Date(promo.end_datetime).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {promotions.length === 0 && !loading && (
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-12 text-center">
                    <Tag className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-slate-800 font-bold mb-1">No promotions found</h3>
                    <p className="text-slate-500 text-xs">Create your first promotion, happy hour, or flash sale.</p>
                </div>
            )}

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Plus className="h-4 w-4 text-indigo-600" /> Create Promotion
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200"><X className="h-4 w-4" /></button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                            
                            {/* Basics */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Basic Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Name</label>
                                        <input type="text" {...register('name', { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Summer Flash Sale" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Type</label>
                                        <select {...register('type')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                                            <option value="promotion">General Promotion</option>
                                            <option value="happy_hour">Happy Hour</option>
                                            <option value="flash_sale">Flash Sale</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Description</label>
                                        <input type="text" {...register('description')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Short description..." />
                                    </div>
                                </div>
                            </div>

                            {/* Discount Logic */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Discount Rules</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Discount Type</label>
                                        <select {...register('discount_type')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount</option>
                                            <option value="special_price">Override Special Price</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Value</label>
                                        <input type="number" step="0.01" {...register('discount_value', { required: true, min: 0 })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Priority (Higher overrides lower)</label>
                                        <input type="number" {...register('priority', { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" defaultValue="0" />
                                    </div>
                                </div>
                            </div>

                            {/* Schedule */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Schedule</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Start Time</label>
                                        <input type="datetime-local" {...register('start_datetime')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-500">End Time</label>
                                        <input type="datetime-local" {...register('end_datetime')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Targets */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Targets (Products / Categories)</h4>
                                
                                <div className="flex gap-2 mb-4">
                                    <select 
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer flex-1"
                                        onChange={(e) => {
                                            if (!e.target.value) return;
                                            const [type, id, name] = e.target.value.split('|');
                                            addTarget(type, parseInt(id), name);
                                            e.target.value = ''; // reset
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Add a target...</option>
                                        <optgroup label="Categories">
                                            {categories.map(c => <option key={`c-${c.id}`} value={`category|${c.id}|${c.name}`}>Category: {c.name}</option>)}
                                        </optgroup>
                                        <optgroup label="Products">
                                            {products.map(p => <option key={`p-${p.id}`} value={`product|${p.id}|${p.name}`}>Product: {p.name}</option>)}
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {watchTargets.length === 0 && <span className="text-xs text-slate-400 italic">No targets selected (Applies to nothing yet)</span>}
                                    {watchTargets.map((t, index) => (
                                        <div key={index} className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-medium">
                                            {t.type === 'category' ? '📁' : '📦'} {t.name}
                                            <button type="button" onClick={() => removeTarget(index)} className="hover:bg-indigo-200 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <button type="submit" className="bg-indigo-600 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-full transition shadow-md active:scale-95 text-xs">
                                    Save Promotion
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
