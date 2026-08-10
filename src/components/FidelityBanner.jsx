import React, { useState, useEffect } from 'react';
import { loyaltyService } from '../services/api';
import { Gift, Sparkles } from 'lucide-react';
import { useLanguage } from '../store/LanguageContext';
import { useDatabase } from '../store/DatabaseContext';

export default function FidelityBanner({ currentCartTotal = 0 }) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isRtl } = useLanguage();
    const { settings } = useDatabase();
    const currency = settings?.currency || '$';

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await loyaltyService.getMyLoyaltyStatus();
                setStatus(res.data?.data);
            } catch (err) {
                // Silently fail — not all users are logged in
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    if (loading) return null;
    if (!status || !status.enabled) return null;

    const {
        eligible_orders_count, qualifying_amount,
        required_orders_for_next, required_amount_for_next,
        available_codes, discount_type, discount_value
    } = status;

    const hasAvailableCode = available_codes && available_codes.length > 0;
    const projectedOrders = (eligible_orders_count || 0) + 1;
    const projectedAmount = (qualifying_amount || 0) + currentCartTotal;
    const isProjectedToHitMilestone =
        projectedOrders >= required_orders_for_next &&
        projectedAmount >= required_amount_for_next;

    const ordersNeeded = Math.max(0, required_orders_for_next - (eligible_orders_count || 0));
    const amountNeeded = Math.max(0, required_amount_for_next - (qualifying_amount || 0));

    const discountLabel = discount_value + (discount_type === 'percentage' ? '%' : ` ${currency}`);

    // If they already have a code, remind them
    if (hasAvailableCode) {
        const nextCode = available_codes[0];
        return (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Gift className="h-16 w-16 text-amber-500 transform rotate-12" />
                </div>
                <div className={`flex items-start gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className="bg-amber-100 p-2 rounded-xl text-amber-600 shrink-0">
                        <Gift className="h-5 w-5" />
                    </div>
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                        <h4 className="font-bold text-amber-900 text-sm">You have an unused reward!</h4>
                        <p className="text-xs text-amber-700 mt-0.5">
                            Use code{' '}
                            <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200">
                                {nextCode.code}
                            </span>{' '}
                            at checkout for {discountLabel} off.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute -top-4 -right-4 p-4 opacity-10 pointer-events-none">
                <Sparkles className="h-24 w-24 text-indigo-500 transform rotate-12" />
            </div>
            <div className={`flex flex-col gap-3 relative z-10 ${isRtl ? 'text-right' : 'text-left'}`}>
                <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    <h4 className="font-bold text-indigo-900 text-sm">Fidelity Rewards</h4>
                </div>

                {isProjectedToHitMilestone && currentCartTotal > 0 ? (
                    <div className="bg-white/60 backdrop-blur-sm border border-indigo-200 rounded-xl p-3">
                        <p className="text-xs font-bold text-indigo-800">
                            Complete this order to unlock your {discountLabel} reward!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-xs text-indigo-700 font-medium">
                            You are on your way to a {discountLabel} reward!
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/50 border border-indigo-100 rounded-lg p-2 text-center">
                                <p className="text-[10px] uppercase font-bold text-indigo-400 mb-0.5">Orders Needed</p>
                                <p className="text-sm font-extrabold text-indigo-900">
                                    {ordersNeeded > 0 ? `${ordersNeeded} more` : 'Achieved!'}
                                </p>
                            </div>
                            <div className="bg-white/50 border border-indigo-100 rounded-lg p-2 text-center">
                                <p className="text-[10px] uppercase font-bold text-indigo-400 mb-0.5">Amount Needed</p>
                                <p className="text-sm font-extrabold text-indigo-900">
                                    {amountNeeded > 0 ? `${currency}${amountNeeded.toFixed(2)} more` : 'Achieved!'}
                                </p>
                            </div>
                        </div>
                        {currentCartTotal > 0 && amountNeeded > 0 && currentCartTotal < amountNeeded && (
                            <p className="text-[10px] text-indigo-600/80 font-medium">
                                Add {currency}{(amountNeeded - currentCartTotal).toFixed(2)} more to hit the amount milestone!
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
