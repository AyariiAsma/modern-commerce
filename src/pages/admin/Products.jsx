import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import { mediaService } from '../../services/api';
import Modal from '../../components/Modal';
import { Plus, Edit, Trash2, Sparkles, Check, Upload, Loader2 } from 'lucide-react';

export default function Products() {
    const { products, categories, settings, addProduct, updateProduct, deleteProduct } = useDatabase();
    const { t, isRtl } = useLanguage();

    const currency = settings?.currency || '$';

    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [uploading, setUploading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm();

    const watchImage = watch('image');

    const handleOpenAdd = () => {
        setEditingProduct(null);
        reset({
            name: '',
            description: '',
            price: '',
            discountPrice: '',
            stock: '',
            category: categories[0]?.slug || '',
            image: '',
            SKU: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
            featured: false,
            tva_rate: 19
        });
        setModalOpen(true);
    };

    const handleOpenEdit = (prod) => {
        setEditingProduct(prod);
        
        // Find category slug using category_id
        const matchedCat = categories.find(c => c.id === prod.category_id);
        const categorySlug = matchedCat ? matchedCat.slug : prod.category_slug || '';

        reset({
            name: prod.name,
            description: prod.description,
            price: prod.price,
            discountPrice: prod.discount_price !== undefined ? prod.discount_price || '' : prod.discountPrice || '',
            stock: prod.stock_quantity !== undefined ? prod.stock_quantity : prod.stock,
            category: categorySlug,
            image: prod.image,
            SKU: prod.SKU || '',
            featured: prod.featured === 1 || prod.featured === true,
            tva_rate: prod.tva_rate !== undefined && prod.tva_rate !== null ? prod.tva_rate : 0
        });
        setModalOpen(true);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const res = await mediaService.upload(file);
            setValue('image', `http://localhost:5001${res.data.url}`);
        } catch (err) {
            alert('Failed to upload product image.');
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (data) => {
        const matchedCat = categories.find(c => c.slug === data.category);
        const formattedData = {
            name: data.name,
            category_id: matchedCat ? matchedCat.id : (categories[0]?.id || 1),
            stock_quantity: parseInt(data.stock, 10),
            description: data.description,
            price: parseFloat(data.price),
            discount_price: data.discountPrice ? parseFloat(data.discountPrice) : null,
            SKU: data.SKU || `SKU-${Date.now().toString().slice(-6)}`,
            images: [data.image], // pass primary image in images array
            featured: data.featured ? 1 : 0,
            tva_rate: data.tva_rate ? parseFloat(data.tva_rate) : 0,
            status: 'active'
        };

        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, formattedData);
            } else {
                await addProduct(formattedData);
            }
            setModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to commit product updates.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id);
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete product.');
            }
        }
    };

    return (
        <div className={`space-y-6 ${isRtl ? 'text-right' : ''}`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
                <div>
                    <h1 className="text-xl font-extrabold text-slate-900">{t('invProductsTitle')}</h1>
                    <p className="text-slate-500 text-xs">{t('invProductsDesc')}</p>
                </div>
                <button onClick={handleOpenAdd} className={`inline-flex items-center justify-center font-bold px-4 py-2.5 bg-indigo-650 hover:bg-slate-900 text-white text-xs rounded-xl shadow-md transition transform active:scale-95 gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
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
                                <th className="p-4">SKU</th>
                                <th className="p-4">{t('retailPrice')}</th>
                                <th className="p-4">TVA</th>
                                <th className="p-4">{t('stockCountLabel')}</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                            {products.map((prod) => {
                                const stockVal = prod.stock_quantity !== undefined ? prod.stock_quantity : prod.stock;
                                const discountPriceVal = prod.discount_price !== undefined ? prod.discount_price : prod.discountPrice;

                                return (
                                    <tr key={prod.id} className="hover:bg-slate-50/20">
                                        <td className={`p-4 flex items-center space-x-3 pr-6 ${isRtl ? 'space-x-reverse' : ''}`}>
                                            <img src={prod.image} alt={prod.name} className="h-10 w-10 rounded-lg object-cover bg-slate-50 border border-slate-100" />
                                            <div>
                                                <span className="font-bold text-slate-800 block line-clamp-1">{prod.name}</span>
                                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ref ID: {prod.id}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 capitalize text-slate-500">{prod.category_name || prod.category}</td>
                                        <td className="p-4 font-mono text-slate-500">{prod.SKU || 'N/A'}</td>
                                        <td className="p-4">
                                            {discountPriceVal !== null && discountPriceVal !== undefined ? (
                                                <div className="space-x-1.5">
                                                    <span className="font-bold text-slate-900">{currency}{parseFloat(discountPriceVal).toFixed(2)}</span>
                                                    <span className="text-[10px] text-slate-400 line-through">{currency}{parseFloat(prod.price).toFixed(2)}</span>
                                                </div>
                                            ) : (
                                                <span className="font-bold text-slate-900">{currency}{parseFloat(prod.price).toFixed(2)}</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-bold text-slate-500">{prod.tva_rate !== null ? prod.tva_rate : 0}%</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${stockVal === 0 ? 'bg-rose-50 text-rose-600' : stockVal <= 5 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                {stockVal === 0 ? t('outOfStock') : `${stockVal} units`}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center space-x-2">
                                            <button onClick={() => handleOpenEdit(prod)} className="p-1.5 border border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/20 text-slate-400 hover:text-indigo-650 rounded-lg transition" title="Edit">
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(prod.id)} className="p-1.5 border border-slate-100 hover:border-red-100 hover:bg-red-50/20 text-slate-400 hover:text-red-500 rounded-lg transition" title="Delete">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? t('editProduct') : t('createProduct')}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs font-semibold text-slate-600">
                    <div className="space-y-1">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('productTitleLabel')}</label>
                        <input type="text" {...register('name', { required: true })} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('categoryChannel')}</label>
                            <select {...register('category')} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none">
                                {categories.map(cat => (<option key={cat.id} value={cat.slug}>{cat.name}</option>))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('stockCountLabel')}</label>
                            <input type="number" {...register('stock', { required: true, min: 0 })} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[10px]">Product SKU</label>
                            <input type="text" {...register('SKU', { required: true })} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[10px]">Highlight Type</label>
                            <div className="flex items-center pt-2 gap-2">
                                <input id="featured" type="checkbox" {...register('featured')} className="h-4 w-4 text-indigo-600 border-slate-300 rounded" />
                                <label htmlFor="featured" className="text-slate-550 font-bold text-[10px] select-none cursor-pointer flex items-center gap-1">
                                    <Sparkles className="h-3.5 w-3.5 text-indigo-650" /> Featured Highlight
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px]">Description</label>
                        <textarea rows="3" {...register('description', { required: true })} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none resize-none"></textarea>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('retailPrice')} ({currency})</label>
                            <input type="number" step="0.01" {...register('price', { required: true, min: 0.1 })} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('discountPriceLabel')} ({currency})</label>
                            <input type="number" step="0.01" {...register('discountPrice')} placeholder="Optional" className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[10px]">TVA Rate (%)</label>
                            <input type="number" step="0.1" {...register('tva_rate')} placeholder="e.g. 19" className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none" />
                        </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-50">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('assetUrl')}</label>
                        <div className="mt-1 flex items-center gap-3">
                            <label className="cursor-pointer inline-flex items-center justify-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] px-3.5 py-2 rounded-xl border border-slate-200 transition">
                                <Upload className="h-3.5 w-3.5" />
                                <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </label>
                        </div>
                        <input type="text" {...register('image', { required: true })} placeholder="Or paste image URL link..." className="w-full mt-2 bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none" />
                        {watchImage && (
                            <img src={watchImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-200 mt-2 bg-slate-50" />
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex gap-4">
                        <button type="button" onClick={() => setModalOpen(false)} className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition">
                            {t('cancel')}
                        </button>
                        <button type="submit" disabled={uploading} className="w-1/2 py-2.5 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl transition shadow disabled:opacity-55">
                            {editingProduct ? t('saveChanges') : t('publishProduct')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
