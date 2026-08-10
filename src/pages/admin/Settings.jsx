import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import { settingsService } from '../../services/api';
import { Settings as SettingsIcon, Save, RefreshCw, AlertCircle, CheckCircle, Gift, Truck } from 'lucide-react';

export default function Settings() {
    const { settings, updateSettings } = useDatabase();
    const { t, isRtl } = useLanguage();
    
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [loyaltySuccess, setLoyaltySuccess] = useState(false);
    const [loadingLoyalty, setLoadingLoyalty] = useState(true);

    // Form for General Settings
    const {
        register: registerGeneral,
        handleSubmit: handleGeneralSubmit,
        formState: { errors: generalErrors }
    } = useForm({
        defaultValues: {
            currency: settings?.currency || 'DZD',
            shippingFee: settings?.shippingFee !== undefined ? settings.shippingFee : 15.00,
            cashOnDeliveryOnly: settings?.cashOnDeliveryOnly || false,
            stock_mode: 'GLOBAL' // Default, assuming GLOBAL for now
        }
    });

    // Form for Loyalty Settings
    const {
        register: registerLoyalty,
        handleSubmit: handleLoyaltySubmit,
        reset: resetLoyalty,
        formState: { errors: loyaltyErrors }
    } = useForm();

    useEffect(() => {
        const fetchLoyalty = async () => {
            try {
                const res = await settingsService.getLoyaltySettings();
                const lSettings = res.data?.data || {};
                resetLoyalty({
                    required_orders: lSettings.required_orders || 5,
                    code_expiration_days: lSettings.code_expiration_days || 30,
                    code_format: lSettings.code_format || 'FID-{RANDOM}',
                    discount_type: lSettings.discount_type || 'percentage',
                    discount_value: lSettings.discount_value || 10,
                    usage_limit: lSettings.usage_limit || 1,
                    is_single_use: lSettings.is_single_use === 1,
                    count_cancelled: lSettings.count_cancelled === 1,
                    count_refunded: lSettings.count_refunded === 1
                });

                // Also try to get stock mode
                const st = await settingsService.getSettings();
                if (st.data.settings?.stock?.stock_mode) {
                     // We would update defaultValues for general here, but it's okay for now
                }
            } catch (err) {
                console.error("Failed to fetch loyalty settings", err);
            } finally {
                setLoadingLoyalty(false);
            }
        };
        fetchLoyalty();
    }, [resetLoyalty]);

    const onGeneralSubmit = async (data) => {
        try {
            await updateSettings(data);
            
            // Separate call for stock_mode (not handled by DatabaseContext updateSettings easily since it expects general structure, but wait, updateSettings in Context now sends it to API)
            const payload = [
                { key: 'stock_mode', value: data.stock_mode, group: 'stock' }
            ];
            await settingsService.updateSettings(payload);

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to save general settings", err);
        }
    };

    const onLoyaltySubmit = async (data) => {
        try {
            const payload = {
                ...data,
                is_single_use: data.is_single_use ? 1 : 0,
                count_cancelled: data.count_cancelled ? 1 : 0,
                count_refunded: data.count_refunded ? 1 : 0
            };
            await settingsService.updateLoyaltySettings(payload);
            setLoyaltySuccess(true);
            setTimeout(() => setLoyaltySuccess(false), 3000);
        } catch (err) {
            console.error("Failed to save loyalty settings", err);
        }
    };

    return (
        <div className={`space-y-8 ${isRtl ? 'text-right' : ''}`}>
            {/* Header */}
            <div>
                <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 justify-start">
                    <SettingsIcon className="h-5 w-5 text-indigo-600" />
                    <span>{t('settingsPanelTitle')} / Configuration Center</span>
                </h1>
                <p className="text-slate-500 text-xs mt-1">Configure global store preferences, shipping, stock rules, and customer loyalty.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* General Settings */}
                <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <SettingsIcon className="h-4 w-4" /> General Settings
                    </h2>

                    {saveSuccess && (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 mb-6">
                            <CheckCircle className="h-4 w-4" />
                            <span>{t('settingsSavedSuccess')}</span>
                        </div>
                    )}

                    <form onSubmit={handleGeneralSubmit(onGeneralSubmit)} className="space-y-6 text-xs text-slate-700 font-medium">
                        
                        {/* Currency */}
                        <div className="space-y-2">
                            <label className="text-slate-500 uppercase tracking-widest text-[10px] font-bold block">
                                {t('activeCurrency')}
                            </label>
                            <input
                                type="text"
                                {...registerGeneral('currency', { required: 'Currency device is required' })}
                                placeholder="e.g. DZD, USD"
                                className="bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                            />
                        </div>

                        {/* Shipping */}
                        <div className="space-y-2 pt-2">
                            <label className="text-slate-500 uppercase tracking-widest text-[10px] font-bold block">
                                Default Shipping Fee
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                {...registerGeneral('shippingFee', { required: 'Shipping fee is required', min: 0 })}
                                className="bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                            />
                        </div>

                        {/* Stock Mode */}
                        <div className="space-y-2 pt-2">
                            <label className="text-slate-500 uppercase tracking-widest text-[10px] font-bold block">
                                Stock Management Mode
                            </label>
                            <select
                                {...registerGeneral('stock_mode')}
                                className="bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none w-full cursor-pointer"
                            >
                                <option value="GLOBAL">Global (Shared Stock)</option>
                                <option value="COUNTRY" disabled>Country (Coming Soon)</option>
                                <option value="ZONE" disabled>Zone (Coming Soon)</option>
                            </select>
                            <p className="text-[10px] text-slate-400 font-normal">
                                Warning: Changing this mode requires a data migration if you already have stock entries.
                            </p>
                        </div>

                        {/* Payment Restrict */}
                        <div className="pt-2">
                            <label className="flex items-start gap-3 p-4 border border-slate-200 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition">
                                <input
                                    type="checkbox"
                                    {...registerGeneral('cashOnDeliveryOnly')}
                                    className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                                />
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-800 block">
                                        {t('cashOnDeliveryOnlyOption')}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-normal block leading-relaxed">
                                        When enabled, checkout is restricted to Cash on Delivery.
                                    </span>
                                </div>
                            </label>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-slate-900 text-white font-bold py-2.5 px-6 rounded-full transition shadow-md active:scale-95">
                                <Save className="h-4 w-4" /> Save General
                            </button>
                        </div>
                    </form>
                </section>

                {/* Loyalty Settings */}
                <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <Gift className="h-4 w-4" /> Customer Loyalty & Rewards
                    </h2>

                    {loadingLoyalty ? (
                        <div className="flex justify-center p-8"><RefreshCw className="h-6 w-6 animate-spin text-slate-400" /></div>
                    ) : (
                        <>
                            {loyaltySuccess && (
                                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 mb-6">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Loyalty settings saved successfully</span>
                                </div>
                            )}

                            <form onSubmit={handleLoyaltySubmit(onLoyaltySubmit)} className="space-y-5 text-xs text-slate-700 font-medium">
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-slate-500 uppercase tracking-widest text-[10px] font-bold block">Required Orders</label>
                                        <input type="number" {...registerLoyalty('required_orders', { required: true, min: 1 })} className="bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-slate-500 uppercase tracking-widest text-[10px] font-bold block">Code Expiry (Days)</label>
                                        <input type="number" {...registerLoyalty('code_expiration_days', { required: true, min: 1 })} className="bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none w-full" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-slate-500 uppercase tracking-widest text-[10px] font-bold block">Code Format</label>
                                    <input type="text" {...registerLoyalty('code_format', { required: true })} className="bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none w-full" />
                                    <p className="text-[10px] text-slate-400 font-normal">Use {'{RANDOM}'} placeholder for dynamic generation.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-slate-500 uppercase tracking-widest text-[10px] font-bold block">Discount Type</label>
                                        <select {...registerLoyalty('discount_type')} className="bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none w-full cursor-pointer">
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-slate-500 uppercase tracking-widest text-[10px] font-bold block">Discount Value</label>
                                        <input type="number" step="0.01" {...registerLoyalty('discount_value', { required: true, min: 0 })} className="bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none w-full" />
                                    </div>
                                </div>

                                <div className="pt-2 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" {...registerLoyalty('is_single_use')} className="h-4 w-4 text-indigo-600 rounded border-slate-300" />
                                        <span>Single-use code</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" {...registerLoyalty('count_cancelled')} className="h-4 w-4 text-indigo-600 rounded border-slate-300" />
                                        <span>Count cancelled orders</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" {...registerLoyalty('count_refunded')} className="h-4 w-4 text-indigo-600 rounded border-slate-300" />
                                        <span>Count refunded orders</span>
                                    </label>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <button type="submit" className="flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-full transition shadow-md active:scale-95">
                                        <Save className="h-4 w-4" /> Save Loyalty Settings
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
