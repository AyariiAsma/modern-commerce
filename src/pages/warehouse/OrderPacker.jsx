import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { warehouseService } from '../../services/api';
import BarcodeScanner from '../../components/BarcodeScanner';
import { ScanLine, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Package } from 'lucide-react';

export default function OrderPacker() {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [scanError, setScanError] = useState('');
    const [scanSuccess, setScanSuccess] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchOrder = () => {
        setLoading(true);
        warehouseService.getOrderDetails(orderId)
            .then(res => setOrder(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchOrder(); }, [orderId]);

    const handleScan = async (code) => {
        setShowScanner(false);
        setScanError('');
        setScanSuccess('');

        if (!order) return;

        // Find item in order by barcode or SKU
        const matchedItem = order.items.find(
            item => item.barcode === code || item.SKU === code
        );

        if (!matchedItem) {
            setScanError(`"${code}" — this product does not belong to this order.`);
            return;
        }

        if (matchedItem.prepared_quantity >= matchedItem.quantity) {
            setScanError(`${matchedItem.product_name} — already fully packed (${matchedItem.quantity}/${matchedItem.quantity}).`);
            return;
        }

        // Export 1 unit
        setProcessing(true);
        try {
            const res = await warehouseService.exportStock(orderId, matchedItem.product_id, 1);
            setScanSuccess(`✓ ${matchedItem.product_name} — scanned ${res.data.newPreparedQty}/${matchedItem.quantity}`);
            fetchOrder();
            if (res.data.isFullyPrepared) {
                setTimeout(() => navigate('/warehouse/orders'), 1500);
            }
        } catch (err) {
            setScanError(err.response?.data?.message || 'Export failed.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
    );

    if (!order) return <p className="text-center text-red-500 py-10">Order not found.</p>;

    const allPacked = order.items?.every(i => i.prepared_quantity >= i.quantity);

    return (
        <div className="space-y-5 pt-2">
            {/* Header */}
            <div>
                <button onClick={() => navigate('/warehouse/orders')} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm mb-3 font-semibold">
                    <ArrowLeft className="h-4 w-4" />
                    Back to orders
                </button>
                <h1 className="text-xl font-black text-slate-900">{order.order_number}</h1>
                <p className="text-slate-400 text-sm">{order.shipping_first_name} {order.shipping_last_name}</p>
            </div>

            {/* Status Banner */}
            {allPacked ? (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                    <div>
                        <p className="font-bold text-emerald-800 text-sm">Order fully packed!</p>
                        <p className="text-emerald-600 text-xs">All items have been scanned and exported.</p>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowScanner(true)}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl text-sm transition shadow-md disabled:opacity-60"
                >
                    {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanLine className="h-5 w-5" />}
                    {processing ? 'Processing…' : 'Scan Next Item'}
                </button>
            )}

            {/* Feedback Messages */}
            {scanError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-2xl p-4">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm font-semibold">{scanError}</p>
                </div>
            )}
            {scanSuccess && (
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <p className="text-emerald-700 text-sm font-semibold">{scanSuccess}</p>
                </div>
            )}

            {/* Order Items Checklist */}
            <div>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Items to Pack</h2>
                <div className="space-y-3">
                    {order.items?.map(item => {
                        const packed = item.prepared_quantity >= item.quantity;
                        const progress = (item.prepared_quantity / item.quantity) * 100;
                        return (
                            <div key={item.id} className={`bg-white rounded-2xl border shadow-sm p-4 ${packed ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-xl mt-0.5 ${packed ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                        {packed
                                            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                            : <Package className="h-4 w-4 text-slate-400" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm ${packed ? 'text-emerald-800' : 'text-slate-800'}`}>{item.product_name}</p>
                                        {item.SKU && <p className="text-slate-400 text-xs font-mono mt-0.5">SKU: {item.SKU}</p>}
                                        <div className="flex items-center justify-between mt-2">
                                            <span className={`text-sm font-black ${packed ? 'text-emerald-700' : 'text-indigo-600'}`}>
                                                {item.prepared_quantity} / {item.quantity}
                                            </span>
                                            {packed && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Done</span>}
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                                            <div
                                                className={`h-1.5 rounded-full transition-all ${packed ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Scanner */}
            {showScanner && (
                <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
            )}
        </div>
    );
}
