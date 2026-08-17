import React, { useState } from 'react';
import { warehouseService } from '../../services/api';
import BarcodeScanner from '../../components/BarcodeScanner';
import { ScanLine, Package, CheckCircle2, AlertCircle, Plus, Minus, Loader2 } from 'lucide-react';

export default function StockImport() {
    const [showScanner, setShowScanner] = useState(false);
    const [product, setProduct] = useState(null);
    const [lookupCode, setLookupCode] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleScan = async (code) => {
        setShowScanner(false);
        setLookupCode(code);
        await lookupProduct(code);
    };

    const lookupProduct = async (code) => {
        if (!code.trim()) return;
        setLookupLoading(true);
        setProduct(null);
        setError('');
        setSuccess('');
        try {
            const res = await warehouseService.lookupProduct(code.trim());
            setProduct(res.data);
            setQuantity(1);
        } catch (err) {
            setError(err.response?.data?.message || 'Product not found.');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleImport = async () => {
        if (!product || quantity <= 0) return;
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await warehouseService.importStock(product.id, quantity);
            setSuccess(`✓ Imported ${quantity} units. New stock: ${res.data.newStock}`);
            setProduct(prev => ({ ...prev, real_stock: res.data.newStock }));
            setQuantity(1);
        } catch (err) {
            setError(err.response?.data?.message || 'Import failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setProduct(null);
        setLookupCode('');
        setQuantity(1);
        setError('');
        setSuccess('');
    };

    return (
        <div className="space-y-5 pt-2">
            <div>
                <h1 className="text-2xl font-black text-slate-900">Stock Import</h1>
                <p className="text-slate-400 text-sm mt-0.5">Scan or enter a product reference to add stock</p>
            </div>

            {/* Scan Button */}
            <button
                onClick={() => setShowScanner(true)}
                className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl text-sm transition shadow-md"
            >
                <ScanLine className="h-5 w-5" />
                Scan Barcode / QR Code
            </button>

            {/* Manual lookup */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && lookupProduct(lookupCode)}
                    placeholder="Enter Reference or Barcode…"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    onClick={() => lookupProduct(lookupCode)}
                    disabled={lookupLoading || !lookupCode.trim()}
                    className="bg-slate-800 hover:bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold text-sm transition disabled:opacity-50"
                >
                    {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find'}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-2xl p-4">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                    <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <p className="text-emerald-700 text-sm font-semibold">{success}</p>
                </div>
            )}

            {/* Product Card */}
            {product && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex gap-4 p-4 border-b border-slate-100">
                        {product.image && (
                            <img src={product.image} alt={product.name} className="h-16 w-16 object-cover rounded-xl bg-slate-50 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-slate-900 text-base leading-tight">{product.name}</h2>
                            <p className="text-slate-400 text-xs mt-1 font-mono">SKU: {product.SKU}</p>
                            {product.barcode && <p className="text-slate-400 text-xs font-mono">Barcode: {product.barcode}</p>}
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Current Stock */}
                        <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-semibold text-slate-600">Current Stock</span>
                            </div>
                            <span className="font-black text-slate-900 text-lg">{product.real_stock ?? 'N/A'}</span>
                        </div>

                        {/* Quantity Selector */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Import Quantity</label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="h-11 w-11 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition"
                                >
                                    <Minus className="h-4 w-4 text-slate-600" />
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="flex-1 text-center text-xl font-black text-slate-900 border border-slate-200 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="h-11 w-11 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition"
                                >
                                    <Plus className="h-4 w-4 text-slate-600" />
                                </button>
                            </div>
                            <p className="text-center text-xs text-slate-400 mt-2">
                                New stock after import: <span className="font-bold text-indigo-600">{(product.real_stock ?? 0) + quantity}</span>
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleReset}
                                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-sm transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={loading}
                                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                Confirm Import
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner Modal */}
            {showScanner && (
                <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
            )}
        </div>
    );
}
