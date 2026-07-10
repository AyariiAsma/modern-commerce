import React from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';

export default function CategoryCard({ category }) {
    // Dynamically resolve icon from name
    const IconComponent = Icons[category.icon] || Icons.HelpCircle;

    return (
        <Link
            to={`/catalog?category=${category.slug}`}
            className="group relative flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-2xl hover:border-indigo-500 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
        >
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-slate-50 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors duration-300">
                <IconComponent className="h-8 w-8" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">
                {category.name}
            </h3>
            <p className="mt-1 text-slate-400 text-xs text-center line-clamp-1 px-2">
                {category.description}
            </p>
        </Link>
    );
}
