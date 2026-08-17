import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Type } from 'lucide-react';

/**
 * BarcodeScanner — uses device camera to scan barcodes, with manual input fallback.
 * Props:
 *   onScan(code) — called when a barcode is found
 *   onClose()   — called when the user closes the scanner
 */
export default function BarcodeScanner({ onScan, onClose }) {
    const scannerRef = useRef(null);
    const html5QrRef = useRef(null);
    const [mode, setMode] = useState('camera'); // 'camera' | 'manual'
    const [manualCode, setManualCode] = useState('');
    const [cameraError, setCameraError] = useState('');

    useEffect(() => {
        if (mode !== 'camera') return;

        const scanner = new Html5Qrcode('warehouse-qr-reader');
        html5QrRef.current = scanner;

        const config = { fps: 10, qrbox: { width: 250, height: 150 } };

        scanner.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
                onScan(decodedText);
            },
            () => {}
        ).catch((err) => {
            console.warn('Camera scan error:', err);
            setCameraError('Camera not available. Please use manual entry.');
            setMode('manual');
        });

        return () => {
            scanner.stop().catch(() => {});
        };
    }, [mode]);

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualCode.trim()) {
            onScan(manualCode.trim().toUpperCase());
            setManualCode('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800 text-base">Scan Product</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMode(mode === 'camera' ? 'manual' : 'camera')}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50"
                        >
                            {mode === 'camera' ? <><Type className="h-3 w-3" /> Manual</> : <><Camera className="h-3 w-3" /> Camera</>}
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Scanner or Manual */}
                <div className="p-5">
                    {mode === 'camera' ? (
                        <div>
                            {cameraError && (
                                <p className="text-red-500 text-sm text-center mb-3">{cameraError}</p>
                            )}
                            <div id="warehouse-qr-reader" className="w-full rounded-xl overflow-hidden" />
                            <p className="text-center text-slate-400 text-xs mt-3">Point camera at product barcode</p>
                        </div>
                    ) : (
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Enter Barcode or Reference</label>
                                <input
                                    type="text"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    placeholder="e.g. REF-00125 or 6191234567890"
                                    autoFocus
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!manualCode.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                            >
                                Look Up Product
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
