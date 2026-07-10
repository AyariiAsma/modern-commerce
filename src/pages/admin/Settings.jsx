import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import { Settings as SettingsIcon, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function Settings() {
    const { settings, updateSettings } = useDatabase();
    const { t, isRtl } = useLanguage();
    const [saveSuccess, setSaveSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            currency: settings?.currency || 'DZD',
            shippingFee: settings?.shippingFee !== undefined ? settings.shippingFee : 15.00,
            cashOnDeliveryOnly: settings?.cashOnDeliveryOnly || false
        }
    });

    const onSubmit = (data) => {
        updateSettings(data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    return (
        <div className={`space-y-6 ${isRtl ? 'text-right' : ''}`}>
            {/* Header */}
            <div>
                <h1 className="text-xl font-extrabold text-slate-905 flex items-center gap-2 justify-start">
                    <SettingsIcon className="h-5 w-5 text-indigo-650" />
                    <span>{t('settingsPanelTitle')}</span>
                </h1>
                <p className="text-slate-500 text-xs">{t('settingsPanelDesc')}</p>
            </div>

            {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl p-4 text-xs font-semibold flex items-center gap-2 select-none justify-start">
                    <CheckCircle className="h-4 w-4" />
                    <span>{t('settingsSavedSuccess')}</span>
                </div>
            )}

            {/* Settings Form Card */}
            <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-xs text-slate-655 font-bold">

                    {/* Active currency selector */}
                    <div className="space-y-2">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px] block">
                            {t('activeCurrency')}
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                {...register('currency', { required: 'Currency device is required' })}
                                placeholder="e.g. DZD, TND, $, €"
                                className="bg-slate-50 border border-slate-205 py-2.5 px-4 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                            />
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        // Update value manually by updating state or let user input handle it
                                    }
                                }}
                                className="bg-slate-55 border border-slate-205 py-2.5 px-4 rounded-xl text-slate-500 outline-none w-full cursor-pointer"
                                defaultValue=""
                            >
                                <option value="" disabled>Common Defaults</option>
                                <option value="DZD">🇩🇿 DZD (Algerian Dinar)</option>
                                <option value="TND">🇹🇳 TND (Tunisian Dinar)</option>
                                <option value="MAD">🇲🇦 MAD (Moroccan Dirham)</option>
                                <option value="USD">🇺🇸 USD (US Dollar)</option>
                                <option value="EUR">🇪🇺 EUR (Euro)</option>
                            </select>
                        </div>
                        <p className="text-[10px] text-slate-450 font-normal">
                            *All pricing displays (Product lists, checkout totals, invoices) will update to use this device label automatically.
                        </p>
                    </div>

                    {/* Shipping Fee Charge */}
                    <div className="space-y-2 border-t border-slate-100 pt-5">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px] block">
                            {t('shippingCostConfig')} ({settings?.currency || '$'})
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('shippingFee', { required: 'Shipping fee is required', min: { value: 0, message: 'Fee must be positive' } })}
                            className="bg-slate-50 border border-slate-205 py-2.5 px-4 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none w-full max-w-xs"
                        />
                        <p className="text-[10px] text-slate-450 font-normal">
                            *Standard delivery cost added to customer checkout carts. Orders over 150 stay free automatically.
                        </p>
                    </div>

                    {/* Pay on Delivery restricts options */}
                    <div className="space-y-3 border-t border-slate-100 pt-5">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px] block">
                            Payment Restrict Gateways
                        </label>

                        <label className="flex items-start gap-3 p-4 border border-slate-150 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition">
                            <input
                                type="checkbox"
                                {...register('cashOnDeliveryOnly')}
                                className="mt-0.5 h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                            />
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-slate-800 block">
                                    {t('cashOnDeliveryOnlyOption')}
                                </span>
                                <span className="text-[10px] text-slate-450 font-normal block leading-relaxed">
                                    When enabled, all credit card and PayPal checkout routes are hidden, restricting checkout to Cash on Delivery (en livraison) collection only.
                                </span>
                            </div>
                        </label>
                    </div>

                    {/* Form Action */}
                    <div className="pt-6 border-t border-slate-100">
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 bg-indigo-650 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-full transition shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Save className="h-4 w-4" />
                            <span>{t('saveSettings')}</span>
                        </button>
                    </div>

                </form>
            </section>
        </div>
    );
}
