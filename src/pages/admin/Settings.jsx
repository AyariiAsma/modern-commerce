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

            </div>
        </div>
    );
}
