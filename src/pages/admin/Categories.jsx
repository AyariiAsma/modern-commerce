import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDatabase } from '../../store/DatabaseContext';
import { useLanguage } from '../../store/LanguageContext';
import Modal from '../../components/Modal';
import * as Icons from 'lucide-react';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function Categories() {
    const { categories, addCategory, updateCategory, deleteCategory } = useDatabase();
    const { t, isRtl } = useLanguage();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const handleOpenAdd = () => {
        setEditingCategory(null);
        reset({ name: '', parent_id: '', description: '', sort_order: 0, status: 'active' });
        setModalOpen(true);
    };

    const handleOpenEdit = (cat) => {
        setEditingCategory(cat);
        reset({
            name: cat.name,
            parent_id: cat.parent_id || '',
            description: cat.description || '',
            sort_order: cat.sort_order || 0,
            status: cat.status || 'active',
            thumbnail: cat.thumbnail || '',
            alt_text: cat.alt_text || ''
        });
        setModalOpen(true);
    };

    const onSubmit = async (data) => {
        const formattedData = {
            name: data.name,
            parent_id: data.parent_id ? parseInt(data.parent_id, 10) : null,
            description: data.description,
            sort_order: parseInt(data.sort_order, 10) || 0,
            status: data.status || 'active',
            thumbnail: data.thumbnail || null,
            alt_text: data.alt_text || null
        };

        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, formattedData);
            } else {
                await addCategory(formattedData);
            }
            setModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save category.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete category? All subcategories will be unlinked.')) {
            try {
                await deleteCategory(id);
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete category.');
            }
        }
    };

    // Flatten categories tree for the management table list
    const flattenCategories = (cats, list = [], depth = 0) => {
        cats.forEach(c => {
            list.push({ ...c, depth });
            if (c.subcategories && c.subcategories.length > 0) {
                flattenCategories(c.subcategories, list, depth + 1);
            }
        });
        return list;
    };

    const flatCategories = flattenCategories(categories);

    // Filter parent selection options to prevent circular links
    const parentOptions = flatCategories.filter(c => {
        if (editingCategory) {
            // Cannot select self or any of self's subcategories as parent
            if (c.id === editingCategory.id || c.parent_id === editingCategory.id) {
                return false;
            }
        }
        return c.depth === 0; // limit nested depth to 1 level (parent -> child)
    });

    return (
        <div className={`space-y-6 ${isRtl ? 'text-right' : ''}`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
                <div>
                    <h1 className="text-xl font-extrabold text-slate-900">{t('taxoCategoriesTitle')}</h1>
                    <p className="text-slate-500 text-xs">{t('taxoCategoriesDesc')}</p>
                </div>
                <button onClick={handleOpenAdd} className={`inline-flex items-center justify-center font-bold px-4 py-2.5 bg-indigo-650 hover:bg-slate-900 text-white text-xs rounded-xl shadow transition gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Plus className="h-4 w-4" /> {t('createCategory')}
                </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase tracking-widest font-bold">
                                <th className="p-4">Image</th>
                                <th className="p-4">{t('deptTitle')}</th>
                                <th className="p-4">Slug</th>
                                <th className="p-4">Sort Order</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                            {flatCategories.map((cat) => {
                                return (
                                    <tr key={cat.id} className="hover:bg-slate-50/20">
                                        <td className="p-4">
                                            {cat.thumbnail ? (
                                                <img src={cat.thumbnail} alt={cat.alt_text || cat.name} className="h-10 w-16 object-cover rounded-lg border border-slate-100" />
                                            ) : (
                                                <div className="h-10 w-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                                                    <span className="text-[9px] text-slate-400 font-bold">NO IMG</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className={`p-4 flex items-center pr-6 ${isRtl ? 'space-x-reverse' : ''}`}>
                                            {cat.depth > 0 && <span className="text-slate-300 font-normal mr-2">↳</span>}
                                            <span className={`font-bold text-slate-800 ${cat.depth > 0 ? 'text-slate-550 font-semibold' : ''}`}>
                                                {cat.name}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-indigo-600">{cat.slug}</td>
                                        <td className="p-4">{cat.sort_order}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                                cat.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {cat.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center space-x-2">
                                            <button onClick={() => handleOpenEdit(cat)} className="p-1.5 border border-slate-100 hover:border-indigo-650 hover:bg-indigo-50/20 text-slate-400 hover:text-indigo-650 rounded-lg transition">
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(cat.id)} className="p-1.5 border border-slate-100 hover:border-red-100 hover:bg-red-50/20 text-slate-400 hover:text-red-550 rounded-lg transition">
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

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCategory ? t('editCategory') : t('createCategory')}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs font-semibold text-slate-600">
                    <div className="space-y-1">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('deptTitle')}</label>
                        <input type="text" {...register('name', { required: true })} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[10px]">Parent Category</label>
                            <select {...register('parent_id')} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none">
                                <option value="">None (Top-Level)</option>
                                {parentOptions.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[10px]">Sort Order</label>
                            <input type="number" {...register('sort_order')} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[10px]">Publish Status</label>
                            <select {...register('status')} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px]">Description</label>
                        <textarea rows="3" {...register('description', { required: true })} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none resize-none"></textarea>
                    </div>

                    <div className="space-y-1">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px]">Thumbnail URL</label>
                        <input type="url" {...register('thumbnail')} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none" placeholder="https://..." />
                    </div>

                    <div className="space-y-1">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px]">Image Alt Text</label>
                        <input type="text" {...register('alt_text')} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg text-slate-800 outline-none" placeholder="Describe the image..." />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex gap-4">
                        <button type="button" onClick={() => setModalOpen(false)} className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition">
                            {t('cancel')}
                        </button>
                        <button type="submit" className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow">
                            {editingCategory ? t('saveDept') : t('activateDept')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
