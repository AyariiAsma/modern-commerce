import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../store/AuthContext';
import { useLanguage } from '../../store/LanguageContext';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const { t, isRtl } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const from = location.state?.from?.pathname || '/';

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        setApiError('');
        await new Promise(resolve => setTimeout(resolve, 800));
        const result = await login(data.email, data.password);
        setLoading(false);
        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setApiError(result.error || 'Invalid credentials');
        }
    };

    return (
        <div className={`max-w-md mx-auto space-y-6 ${isRtl ? 'text-right' : ''}`}>
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">

                <div className="text-center space-y-1.5">
                    <h1 className="text-2xl font-black text-slate-900 leading-tight">{t('welcomeBack')}</h1>
                    <p className="text-slate-450 text-xs">{t('signInDesc')}</p>
                </div>

                {apiError && (
                    <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl p-3.5 text-xs font-semibold text-center select-none">
                        {apiError}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('emailAddress')}</label>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="you@example.com"
                                {...register('email', {
                                    required: t('emailReq'),
                                    pattern: { value: /^\S+@\S+$/i, message: t('emailPattern') }
                                })}
                                className={`w-full bg-slate-50 border border-slate-205 text-slate-805 text-sm rounded-xl py-2.5 ${isRtl ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            />
                            <Mail className={`absolute top-3.5 h-4 w-4 text-slate-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                        </div>
                        {errors.email && <p className="text-[11px] text-red-540 font-semibold">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('password')}</label>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="••••••••"
                                {...register('password', {
                                    required: t('passwordReq'),
                                    minLength: { value: 6, message: t('passwordMin') }
                                })}
                                className={`w-full bg-slate-50 border border-slate-205 text-slate-805 text-sm rounded-xl py-2.5 ${isRtl ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            />
                            <Lock className={`absolute top-3.5 h-4 w-4 text-slate-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                        </div>
                        {errors.password && <p className="text-[11px] text-red-540 font-semibold">{errors.password.message}</p>}
                    </div>

                    {/* Quick Mock Login helpers */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-[10px] text-slate-500">
                        <p className="font-bold text-slate-700 uppercase tracking-widest text-[9px] mb-1">{t('quickLogins')}:</p>
                        <div>Admin: <span className="font-semibold text-slate-700">admin@example.com</span> / adminpassword</div>
                        <div>Customer: <span className="font-semibold text-slate-700">alice@example.com</span> / password123</div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full inline-flex items-center justify-center space-x-2 font-bold px-6 py-3.5 bg-slate-900 hover:bg-indigo-650 text-white rounded-full transition transform active:scale-95 shadow-md disabled:bg-slate-350 disabled:cursor-not-allowed ${isRtl ? 'space-x-reverse' : ''}`}
                    >
                        {loading ? (
                            <><Loader2 className="h-4 w-4 animate-spin text-white" /><span>...</span></>
                        ) : (
                            <><span>{t('signIn')}</span><ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} /></>
                        )}
                    </button>
                </form>

                <div className="text-center pt-2 text-xs text-slate-400">
                    <span>{t('noAccount')} </span>
                    <Link to="/register" className="font-bold text-indigo-650 hover:underline">{t('registerHere')}</Link>
                </div>
            </div>
        </div>
    );
}
