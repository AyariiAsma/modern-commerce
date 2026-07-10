import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import Modal from '../../components/Modal';
import { Plus, Edit, Trash2, Sparkles, Check } from 'lucide-react';

export default function Products() {
    const { products, categories, settings, addProduct, updateProduct, deleteProduct } = useDatabase();
    const { t, isRtl } = useLanguage();

    const currency = settings?.currency || '$';

    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm();

    const handleOpenAdd = () => {
        setEditingProduct(null);
        reset({ name: '', description: '', price: '', discountPrice: '', stock: '', category: categories[0]?.slug || '', image: '', featured: false });
        setModalOpen(true);
    };

    const handleOpenEdit = (prod) => {
        setEditingProduct(prod);
        reset({ name: prod.name, description: prod.description, price: prod.price, discountPrice: prod.discountPrice || '', stock: prod.stock, category: prod.category, image: prod.image, featured: prod.featured });
        setModalOpen(true);
    };

    const onSubmit = (data) => {
        const formattedData = {
            ...data,
            price: parseFloat(data.price),
            discountPrice: data.discountPrice ? parseFloat(data.discountPrice) : null,
            stock: parseInt(data.stock, 10),
            featured: !!data.featured
        };
        if (editingProduct) {
            updateProduct(editingProduct.id, formattedData);
        } else {
            addProduct(formattedData);
        }
        setModalOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this product?')) deleteProduct(id);
    };

    return (
        <div className={`space-y-6 ${isRtl ? 'text-right' : ''}`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
                <div>
                    <h1 className="text-xl font-extrabold text-slate-905">{t('invProductsTitle')}</h1>
                    <p className="text-slate-500 text-xs">{t('invProductsDesc')}</p>
                </div>
                <button onClick={handleOpenAdd} className={`inline-flex items-center justify-center font-bold px-4 py-2.5 bg-indigo-600 hover:bg-slate-900 text-white text-xs rounded-xl shadow-md transition transform active:scale-95 gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Plus className="h-4 w-4" /> {t('createProduct')}
                </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase tracking-widest font-bold">
                                <th className="p-4">{t('productTitleLabel')}</th>
                                <th className="p-4">{t('categoryChannel')}</th>
                                <th className="p-4">{t('retailPrice')}</th>
                                <th className="p-4">{t('stockCountLabel')}</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-655 font-medium">
                            {products.map((prod) => (
                                <tr key={prod.id} className="hover:bg-slate-50/20">
                                    <td className={`p-4 flex items-center space-x-3 pr-6 ${isRtl ? 'space-x-reverse' : ''}`}>
                                        <img src={prod.image} alt={prod.name} className="h-10 w-10 rounded-lg object-cover bg-slate-50" />
                                        <div>
                                            <span className="font-bold text-slate-805 block line-clamp-1">{prod.name}</span>
                                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{prod.id}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 capitalize text-slate-550">{prod.category}</td>
                                    <td className="p-4">
                                        {prod.discountPrice !== null ? (
                                            <div className="space-x-1.5">
                                                <span className="font-bold text-slate-900">{currency}{prod.discountPrice.toFixed(2)}</span>
                                                <span className="text-[10px] text-slate-400 line-through">{currency}{prod.price.toFixed(2)}</span>
                                            </div>
                                        ) : (
                                            <span className="font-bold text-slate-900">{currency}{prod.price.toFixed(2)}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${prod.stock === 0 ? 'bg-rose-50 text-rose-600' : prod.stock <= 5 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                            {prod.stock === 0 ? t('outOfStock') : `${prod.stock}`}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center space-x-2">
                                        <button onClick={() => handleOpenEdit(prod)} className="p-1.5 border border-slate-100 hover:border-indigo-105 hover:bg-indigo-50/20 text-slate-440 hover:text-indigo-650 rounded-lg transition" title="Edit">
                                            <Edit className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => handleDelete(prod.id)} className="p-1.5 border border-slate-100 hover:border-red-105 hover:bg-red-50/20 text-slate-440 hover:text-red-500 rounded-lg transition" title="Delete">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? t('editProduct') : t('createProduct')}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs font-semibold text-slate-655">
                    <div className="space-y-1">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('productTitleLabel')}</label>
                        <input type="text" {...register('name', { required: true })} className="w-full bg-slate-50 border border-slate-205 py-2 px-3 rounded-lg text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('categoryChannel')}</label>
                            <select {...register('category')} className="w-full bg-slate-50 border border-slate-205 py-2 px-3 rounded-lg text-slate-800 outline-none">
                                {categories.map(cat => (<option key={cat.id} value={cat.slug}>{cat.name}</option>))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('stockCountLabel')}</label>
                            <input type="number" {...register('stock', { required: true, min: 0 })} className="w-full bg-slate-50 border border-slate-205 py-2 px-3 rounded-lg text-slate-855 outline-none" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px]">Description</label>
                        <textarea rows="3" {...register('description', { required: true })} className="w-full bg-slate-50 border border-slate-205 py-2 px-3 rounded-lg text-slate-800 outline-none resize-none"></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('retailPrice')} ({currency})</label>
                            <input type="number" step="0.01" {...register('price', { required: true, min: 0.1 })} className="w-full bg-slate-50 border border-slate-205 py-2 px-3 rounded-lg text-slate-800 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('discountPriceLabel')} ({currency})</label>
                            <input type="number" step="0.01" {...register('discountPrice')} placeholder="Optional" className="w-full bg-slate-50 border border-slate-205 py-2 px-3 rounded-lg text-slate-800 outline-none" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('assetUrl')}</label>
                        <input type="text" {...register('image', { required: true })} placeholder="https://..." className="w-full bg-slate-50 border border-slate-205 py-2 px-3 rounded-lg text-slate-800 outline-none" />
                    </div>
                    <div className="flex items-center pt-2 gap-2">
                        <input id="featured" type="checkbox" {...register('featured')} className="h-4 w-4 text-indigo-600 border-slate-300 rounded" />
                        <label htmlFor="featured" className={`text-slate-550 font-bold text-[11px] select-none cursor-pointer flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Sparkles className="h-3.5 w-3.5 text-indigo-650" /> {t('highlightFeatured')}
                        </label>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex gap-4">
                        <button type="button" onClick={() => setModalOpen(false)} className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition">
                            {t('cancel')}
                        </button>
                        <button type="submit" className="w-1/2 py-2.5 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl transition shadow">
                            {editingProduct ? t('saveChanges') : t('publishProduct')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
