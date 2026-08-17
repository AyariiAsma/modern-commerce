import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../store/AuthContext';
import { useLanguage } from '../../store/LanguageContext';
import { Lock, Mail, User, Loader2, ArrowRight } from 'lucide-react';

export default function Register() {
    const { register: authRegister } = useAuth();
    const { t, isRtl } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        setApiError('');
        await new Promise(resolve => setTimeout(resolve, 800));
        const result = await authRegister(data.name, data.email, data.password);
        setLoading(false);
        if (result.success) {
            navigate('/');
        } else {
            setApiError(result.error || 'Registration failed');
        }
    };

    return (
        <div className={`max-w-md mx-auto space-y-6 ${isRtl ? 'text-right' : ''}`}>
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">

                <div className="text-center space-y-1.5">
                    <h1 className="text-2xl font-black text-slate-900 leading-tight">{t('createAccount')}</h1>
                    <p className="text-slate-450 text-xs">{t('joinAura')}</p>
                </div>

                {apiError && (
                    <div className="bg-red-50 border border-red-100 text-red-505 rounded-xl p-3.5 text-xs font-semibold text-center select-none">
                        {apiError}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('fullName')}</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Alice Johnson"
                                {...register('name', { required: t('fullNameReq') })}
                                className={`w-full bg-slate-50 border border-slate-205 text-slate-805 text-sm rounded-xl py-2.5 ${isRtl ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            />
                            <User className={`absolute top-3.5 h-4 w-4 text-slate-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                        </div>
                        {errors.name && <p className="text-[11px] text-red-540 font-semibold">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('emailAddress')}</label>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="alice@example.com"
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

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full inline-flex items-center justify-center space-x-2 font-bold px-6 py-3.5 bg-slate-900 hover:bg-indigo-650 text-white rounded-full transition transform active:scale-95 shadow-md disabled:bg-slate-350 disabled:cursor-not-allowed ${isRtl ? 'space-x-reverse' : ''}`}
                    >
                        {loading ? (
                            <><Loader2 className="h-4 w-4 animate-spin text-white" /><span>...</span></>
                        ) : (
                            <><span>{t('signUp')}</span><ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} /></>
                        )}
                    </button>
                </form>

                <div className="text-center pt-2 text-xs text-slate-400">
                    <span>{t('alreadyAccount')} </span>
                    <Link to="/login" className="font-bold text-indigo-650 hover:underline">{t('signIn')}</Link>
                </div>
            </div>
        </div>
    );
}
