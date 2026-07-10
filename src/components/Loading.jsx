import React from 'react';

// Loader spinner overlay for full screen states
export function SpinnerScreen() {
    return (
        <div className="min-h-[50vh] w-full flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
                <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-indigo-650 animate-spin"></div>
            </div>
            <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading experience...</p>
        </div>
    );
}

// Skeleton card placeholders for product listings
export function ProductSkeleton() {
    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4 animate-pulse">
            <div className="aspect-square w-full rounded-xl bg-slate-100"></div>
            <div className="h-4 bg-slate-100 rounded-full w-2/3"></div>
            <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
            <div className="flex justify-between items-center pt-2">
                <div className="h-6 bg-slate-100 rounded-full w-24"></div>
                <div className="h-10 bg-slate-100 rounded-full w-10"></div>
            </div>
        </div>
    );
}
