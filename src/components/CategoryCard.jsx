import React from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';

// Gradient palettes for fallback coloring when no thumbnail
const GRADIENTS = [
    'from-indigo-500 to-purple-600',
    'from-pink-500 to-rose-600',
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-600',
    'from-blue-500 to-cyan-600',
    'from-fuchsia-500 to-violet-600',
];

export default function CategoryCard({ category }) {
    const IconComponent = Icons[category.icon] || Icons.ShoppingBag;
    const gradient = GRADIENTS[category.id % GRADIENTS.length];

    if (category.thumbnail) {
        // Rich card with real thumbnail image
        return (
            <Link
                to={`/catalog?category=${category.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
                {/* Image */}
                <div className="relative h-32 overflow-hidden">
                    <img
                        src={category.thumbnail}
                        alt={category.alt_text || category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-extrabold text-white text-sm leading-tight line-clamp-1 drop-shadow-sm">
                            {category.name}
                        </h3>
                    </div>
                </div>
                {/* Footer */}
                <div className="bg-white px-3 py-2 flex justify-between items-center">
                    <p className="text-slate-400 text-[10px] line-clamp-1 font-medium flex-1 mr-2">
                        {category.description}
                    </p>
                    <Icons.ArrowRight className="h-3.5 w-3.5 text-indigo-500 shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
            </Link>
        );
    }

    // Fallback icon card (no thumbnail)
    return (
        <Link
            to={`/catalog?category=${category.slug}`}
            className="group relative flex flex-col items-center justify-center p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-500 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
        >
            <div className={`flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <IconComponent className="h-7 w-7" />
            </div>
            <h3 className="mt-3 font-bold text-slate-800 text-sm text-center group-hover:text-indigo-600 transition-colors leading-tight">
                {category.name}
            </h3>
            <p className="mt-1 text-slate-400 text-[10px] text-center line-clamp-1 px-2 font-medium">
                {category.description}
            </p>
        </Link>
    );
}
