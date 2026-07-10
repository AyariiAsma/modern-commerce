import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import ProductCard from '../../components/ProductCard';
import Pagination from '../../components/Pagination';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

export default function Catalog() {
    const { products, categories, settings } = useDatabase();
    const { t, isRtl } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();

    const currency = settings?.currency || '$';

    // State for filters
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [sortBy, setSortBy] = useState('default');
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // Update search from URL params
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        const urlCategory = searchParams.get('category') || '';
        setSearch(urlSearch);
        setSelectedCategory(urlCategory);
        setCurrentPage(1);
    }, [searchParams]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Search filter
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            );
        }

        // Category filter
        if (selectedCategory) {
            result = result.filter(p => p.category === selectedCategory);
        }

        // Price range filter
        result = result.filter(p => {
            const price = p.discountPrice !== null ? p.discountPrice : p.price;
            return price >= priceRange[0] && price <= priceRange[1];
        });

        // Sorting
        switch (sortBy) {
            case 'price_asc':
                result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
                break;
            case 'price_desc':
                result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
                break;
            case 'rating':
                result.sort((a, b) => b.rating - a.rating);
                break;
            default:
                break;
        }

        return result;
    }, [products, search, selectedCategory, sortBy, priceRange]);

    // Pagination
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleResetFilters = () => {
        setSearch('');
        setSelectedCategory('');
        setSortBy('default');
        setPriceRange([0, 1000]);
        setCurrentPage(1);
        setSearchParams({});
    };

    return (
        <div className={`space-y-8 ${isRtl ? 'text-right' : ''}`}>
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('catalog')}</h1>
                <p className="text-slate-500 text-sm mt-1">{filteredProducts.length} {t('inStock')}</p>
            </div>

            {/* Controls Bar */}
            <div className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-sm ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
                {/* Search */}
                <div className="relative flex-1 max-w-md w-full">
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className={`w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-full py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isRtl ? 'pr-4 pl-10 text-right' : 'pl-4 pr-10'}`}
                    />
                    <Search className={`absolute top-3 h-4 w-4 text-slate-400 ${isRtl ? 'left-3.5' : 'right-3.5'}`} />
                </div>

                <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value="default">{t('sortDefault')}</option>
                        <option value="price_asc">{t('sortPriceAsc')}</option>
                        <option value="price_desc">{t('sortPriceDesc')}</option>
                        <option value="rating">{t('sortRating')}</option>
                    </select>

                    {/* Toggle Filters */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1.5 bg-slate-900 hover:bg-indigo-650 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        <span>{t('filters')}</span>
                    </button>
                </div>
            </div>

            {/* Expandable Filters Panel */}
            {showFilters && (
                <div className={`bg-white border border-slate-100 p-6 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6 ${isRtl ? 'text-right' : ''}`}>
                    {/* Category */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('browseCategories')}</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl py-2.5 px-3 outline-none"
                        >
                            <option value="">{t('allCategories')}</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.slug}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('priceRange')}</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={priceRange[0]}
                                onChange={(e) => { setPriceRange([+e.target.value, priceRange[1]]); setCurrentPage(1); }}
                                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg py-2 px-3 outline-none"
                                placeholder="Min"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="number"
                                value={priceRange[1]}
                                onChange={(e) => { setPriceRange([priceRange[0], +e.target.value]); setCurrentPage(1); }}
                                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg py-2 px-3 outline-none"
                                placeholder="Max"
                            />
                        </div>
                    </div>

                    {/* Reset */}
                    <div className="flex items-end">
                        <button
                            onClick={handleResetFilters}
                            className={`flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-500 transition ${isRtl ? 'flex-row-reverse' : ''}`}
                        >
                            <X className="h-3.5 w-3.5" />
                            <span>{t('resetFilters')}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            {paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {paginatedProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 space-y-3">
                    <h3 className="text-base font-bold text-slate-800">{t('noProductsFound')}</h3>
                    <p className="text-xs text-slate-400">{t('resetFilters')}</p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
}
