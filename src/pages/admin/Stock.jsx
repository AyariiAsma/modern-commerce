import React, { useState, useEffect } from 'react';
import { stockService } from '../../services/api';
import { useDatabase } from '../../store/DatabaseContext';
import { Package, Plus, Minus, History, X, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';

export default function Stock() {
    const { products, loading } = useDatabase();
    const { isRtl } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [movements, setMovements] = useState([]);
    const [loadingMovements, setLoadingMovements] = useState(false);
    
    // Refresh stock data by re-fetching context products, since we merged stock_quantity in product query
    const { refetchProducts } = useDatabase();

    const [adjustForm, setAdjustForm] = useState({
        movement_type: 'addition',
        quantity: 1,
        reason: ''
    });

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.SKU?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdjustOpen = (product) => {
        setSelectedProduct(product);
        setAdjustForm({ movement_type: 'addition', quantity: 1, reason: '' });
        setIsAdjustModalOpen(true);
    };

    const handleHistoryOpen = async (product) => {
        setSelectedProduct(product);
        setIsHistoryModalOpen(true);
        setLoadingMovements(true);
        try {
            const res = await stockService.getMovements(product.id);
            setMovements(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMovements(false);
        }
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        try {
            await stockService.adjustStock({
                product_id: selectedProduct.id,
                location_id: 1, // Hardcoded to GLOBAL for now
                quantity: parseInt(adjustForm.quantity, 10),
                movement_type: adjustForm.movement_type,
                reason: adjustForm.reason
            });
            await refetchProducts();
            setIsAdjustModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to adjust stock');
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><RefreshCw className="h-6 w-6 animate-spin text-slate-400" /></div>;
    }

    return (
        <div className={`space-y-6 ${isRtl ? 'text-right' : ''}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Package className="h-6 w-6 text-indigo-600" />
                        Stock Management
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Manage global inventory levels and track stock movements.</p>
                </div>
                
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                <th className="p-4">Product</th>
                                <th className="p-4">SKU</th>
                                <th className="p-4 text-center">Real Stock</th>
                                <th className="p-4 text-center">Reserved</th>
                                <th className="p-4 text-center">Available</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                            {filteredProducts.map(product => {
                                const real = product.real_stock || 0;
                                const reserved = product.reserved_stock || 0;
                                const available = real - reserved;
                                
                                return (
                                    <tr key={product.id} className="hover:bg-slate-50/50 transition">
                                        <td className="p-4 flex items-center gap-3">
                                            {product.image ? (
                                                <img src={product.image} alt="" className="h-10 w-10 rounded-xl object-cover border border-slate-100" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                                                    <Package className="h-4 w-4 text-slate-300" />
                                                </div>
                                            )}
                                            <span className="font-bold text-slate-800">{product.name}</span>
                                        </td>
                                        <td className="p-4 font-mono text-slate-500">{product.SKU}</td>
                                        <td className="p-4 text-center font-bold">{real}</td>
                                        <td className="p-4 text-center font-bold text-orange-500">{reserved}</td>
                                        <td className={`p-4 text-center font-extrabold ${available <= 5 ? 'text-red-500' : 'text-emerald-600'}`}>
                                            {available}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleAdjustOpen(product)}
                                                    className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition"
                                                    title="Adjust Stock"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleHistoryOpen(product)}
                                                    className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white rounded-lg transition"
                                                    title="View History"
                                                >
                                                    <History className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs">No products found.</div>
                    )}
                </div>
            </div>

            {/* Adjust Modal */}
            {isAdjustModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Package className="h-4 w-4 text-indigo-600" /> Adjust Stock: {selectedProduct?.name}
                            </h3>
                            <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200"><X className="h-4 w-4" /></button>
                        </div>
                        <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Movement Type</label>
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button 
                                            type="button"
                                            onClick={() => setAdjustForm({...adjustForm, movement_type: 'addition'})}
                                            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition ${adjustForm.movement_type === 'addition' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Plus className="h-3 w-3" /> Add
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setAdjustForm({...adjustForm, movement_type: 'deduction'})}
                                            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition ${adjustForm.movement_type === 'deduction' ? 'bg-white shadow text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Minus className="h-3 w-3" /> Deduct
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Quantity</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        required
                                        value={adjustForm.quantity}
                                        onChange={(e) => setAdjustForm({...adjustForm, quantity: e.target.value})}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-xs" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Reason</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. Supplier delivery, damaged goods..."
                                    value={adjustForm.reason}
                                    onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-xs" 
                                />
                            </div>
                            
                            {adjustForm.movement_type === 'deduction' && selectedProduct && (selectedProduct.real_stock - adjustForm.quantity < selectedProduct.reserved_stock) && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl flex items-start gap-2 text-[10px] mt-4">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>Warning: Deducting this amount will fall below reserved stock limits ({selectedProduct.reserved_stock}). Operation will fail.</span>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <button type="submit" className="bg-indigo-600 hover:bg-slate-900 text-white font-bold py-2.5 px-6 rounded-full transition shadow-md active:scale-95 text-xs">
                                    Confirm Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <History className="h-4 w-4 text-indigo-600" /> Stock Movements: {selectedProduct?.name}
                            </h3>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="p-0 max-h-[60vh] overflow-y-auto">
                            {loadingMovements ? (
                                <div className="p-12 flex justify-center"><RefreshCw className="h-6 w-6 animate-spin text-slate-400" /></div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 sticky top-0 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                                        <tr>
                                            <th className="p-4">Date</th>
                                            <th className="p-4 text-center">Change</th>
                                            <th className="p-4">Reason</th>
                                            <th className="p-4 text-right">New Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {movements.map(m => (
                                            <tr key={m.id} className="hover:bg-slate-50/50">
                                                <td className="p-4 text-slate-500">{new Date(m.created_at).toLocaleString()}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 font-bold px-2 py-1 rounded-md ${m.movement_type === 'addition' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        {m.movement_type === 'addition' ? '+' : '-'}{m.quantity}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-medium text-slate-800">{m.reason}</div>
                                                    {m.reference_type && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{m.reference_type}: {m.reference_id}</div>}
                                                </td>
                                                <td className="p-4 text-right font-bold text-slate-700">
                                                    {m.new_real_stock}
                                                </td>
                                            </tr>
                                        ))}
                                        {movements.length === 0 && (
                                            <tr><td colSpan="4" className="p-8 text-center text-slate-400">No movements recorded yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
