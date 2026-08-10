import React, { useState, useEffect } from 'react';
import { invoiceService } from '../../services/api';
import { Receipt, FileText, X, Plus, Download, CreditCard, AlertCircle } from 'lucide-react';

export default function Invoices() {
    const [activeTab, setActiveTab] = useState('invoices');
    const [invoices, setInvoices] = useState([]);
    const [creditNotes, setCreditNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCNModalOpen, setIsCNModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [cnForm, setCnForm] = useState({ reason: '', amount: '' });
    const [cnError, setCnError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, cnRes] = await Promise.all([
                invoiceService.getAll(),
                invoiceService.getCreditNotes()
            ]);
            setInvoices(invRes.data?.data || []);
            setCreditNotes(cnRes.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch invoices', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCN = (invoice) => {
        setSelectedInvoice(invoice);
        setCnForm({ reason: '', amount: '' });
        setCnError('');
        setIsCNModalOpen(true);
    };

    const handleIssueCN = async (e) => {
        e.preventDefault();
        const amount = parseFloat(cnForm.amount);
        if (isNaN(amount) || amount <= 0 || amount > selectedInvoice.total) {
            setCnError(`Amount must be between 0.01 and ${selectedInvoice.total.toFixed(2)}`);
            return;
        }
        try {
            await invoiceService.issueCreditNote({
                invoice_id: selectedInvoice.id,
                reason: cnForm.reason,
                amount: amount
            });
            setIsCNModalOpen(false);
            fetchData();
        } catch (err) {
            setCnError(err.response?.data?.message || 'Failed to issue credit note');
        }
    };

    const statusBadge = (status) => {
        const map = {
            generated: 'bg-emerald-50 text-emerald-700',
            pending: 'bg-amber-50 text-amber-700',
            cancelled: 'bg-red-50 text-red-700',
            issued: 'bg-blue-50 text-blue-700',
            applied: 'bg-purple-50 text-purple-700',
        };
        return map[status] || 'bg-slate-100 text-slate-700';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Receipt className="h-6 w-6 text-indigo-600" />
                    Invoices & Credit Notes
                </h1>
                <p className="text-xs text-slate-500 mt-1">Manage order invoices and issue credit notes for amendments.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`pb-3 px-5 text-sm font-bold border-b-2 transition ${activeTab === 'invoices' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Invoices ({invoices.length})
                </button>
                <button
                    onClick={() => setActiveTab('credit_notes')}
                    className={`pb-3 px-5 text-sm font-bold border-b-2 transition ${activeTab === 'credit_notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Credit Notes ({creditNotes.length})
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12 text-slate-400 text-sm">Loading...</div>
            ) : (
                <>
                    {/* Invoices Table */}
                    {activeTab === 'invoices' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                            <th className="p-4">Invoice No.</th>
                                            <th className="p-4">Order</th>
                                            <th className="p-4">Customer</th>
                                            <th className="p-4 text-right">Total</th>
                                            <th className="p-4 text-center">Status</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                                        {invoices.map(inv => (
                                            <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                                                <td className="p-4 font-mono font-bold text-indigo-700">{inv.invoice_number}</td>
                                                <td className="p-4 font-mono text-slate-500">{inv.order_number}</td>
                                                <td className="p-4">{inv.customer_name || 'Guest'}</td>
                                                <td className="p-4 text-right font-bold">{inv.total?.toFixed(2)}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(inv.status)}`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                                                <td className="p-4">
                                                    <div className="flex justify-end gap-2">
                                                        {inv.pdf_path && (
                                                            <a
                                                                href={`http://localhost:5001${inv.pdf_path}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                                                                title="Download PDF"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => handleOpenCN(inv)}
                                                            className="p-2 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white rounded-lg transition"
                                                            title="Issue Credit Note"
                                                        >
                                                            <CreditCard className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {invoices.length === 0 && (
                                    <div className="p-12 text-center text-slate-400 text-sm">
                                        <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                        No invoices yet. Invoices are automatically generated when an order is Confirmed.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Credit Notes Table */}
                    {activeTab === 'credit_notes' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                            <th className="p-4">Credit Note No.</th>
                                            <th className="p-4">Related Invoice</th>
                                            <th className="p-4">Order</th>
                                            <th className="p-4 text-right">Amount</th>
                                            <th className="p-4 text-center">Status</th>
                                            <th className="p-4">Reason</th>
                                            <th className="p-4">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                                        {creditNotes.map(cn => (
                                            <tr key={cn.id} className="hover:bg-slate-50/50 transition">
                                                <td className="p-4 font-mono font-bold text-amber-700">{cn.credit_note_number}</td>
                                                <td className="p-4 font-mono text-slate-500">{cn.invoice_number}</td>
                                                <td className="p-4 font-mono text-slate-500">{cn.order_number}</td>
                                                <td className="p-4 text-right font-bold text-red-600">-{cn.amount?.toFixed(2)}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(cn.status)}`}>
                                                        {cn.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-600 max-w-xs truncate">{cn.reason}</td>
                                                <td className="p-4 text-slate-500">{new Date(cn.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {creditNotes.length === 0 && (
                                    <div className="p-12 text-center text-slate-400 text-sm">
                                        <CreditCard className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                        No credit notes issued yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Issue Credit Note Modal */}
            {isCNModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-amber-600" /> Issue Credit Note
                            </h3>
                            <button onClick={() => setIsCNModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleIssueCN} className="p-6 space-y-4">
                            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                                <div className="flex justify-between text-slate-500">
                                    <span>Invoice:</span>
                                    <span className="font-bold text-slate-700">{selectedInvoice.invoice_number}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Order:</span>
                                    <span className="font-bold text-slate-700">{selectedInvoice.order_number}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Invoice Total:</span>
                                    <span className="font-bold text-indigo-700">{selectedInvoice.total?.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Reason</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Returned item, wrong product delivered..."
                                    value={cnForm.reason}
                                    onChange={e => setCnForm({ ...cnForm, reason: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Credit Amount</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0.01"
                                    max={selectedInvoice.total}
                                    placeholder="0.00"
                                    value={cnForm.amount}
                                    onChange={e => setCnForm({ ...cnForm, amount: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            {cnError && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl flex items-start gap-2 text-[10px]">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>{cnError}</span>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <button type="submit" className="bg-amber-600 hover:bg-slate-900 text-white font-bold py-2.5 px-6 rounded-full transition shadow-md active:scale-95 text-xs">
                                    Issue Credit Note
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
