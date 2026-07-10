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
        reset({ name: '', icon: 'Laptop', description: '' });
        setModalOpen(true);
    };

    const handleOpenEdit = (cat) => {
        setEditingCategory(cat);
        reset({ name: cat.name, icon: cat.icon, description: cat.description });
        setModalOpen(true);
    };

    const onSubmit = (data) => {
        if (editingCategory) {
            updateCategory(editingCategory.id, data);
        } else {
            addCategory(data);
        }
        setModalOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete category?')) deleteCategory(id);
    };

    const iconOptions = ['Laptop', 'Shirt', 'Sparkles', 'Home', 'Activity', 'Watch', 'ShoppingBag', 'CreditCard', 'Coffee', 'BookOpen'];

    return (
        <div className={`space-y-6 ${isRtl ? 'text-right' : ''}`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
                <div>
                    <h1 className="text-xl font-extrabold text-slate-905">{t('taxoCategoriesTitle')}</h1>
                    <p className="text-slate-500 text-xs">{t('taxoCategoriesDesc')}</p>
                </div>
                <button onClick={handleOpenAdd} className={`inline-flex items-center justify-center font-bold px-4 py-2.5 bg-indigo-600 hover:bg-slate-900 text-white text-xs rounded-xl shadow transition gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Plus className="h-4 w-4" /> {t('createCategory')}
                </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase tracking-widest font-bold">
                                <th className="p-4">{t('deptTitle')}</th>
                                <th className="p-4">Slug</th>
                                <th className="p-4">Description</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-655 font-medium">
                            {categories.map((cat) => {
                                const IconComponent = Icons[cat.icon] || Icons.HelpCircle;
                                return (
                                    <tr key={cat.id} className="hover:bg-slate-50/20">
                                        <td className={`p-4 flex items-center space-x-3 pr-6 ${isRtl ? 'space-x-reverse' : ''}`}>
                                            <div className="p-2 rounded-lg bg-slate-50 text-slate-600">
                                                <IconComponent className="h-4 w-4" />
                                            </div>
                                            <span className="font-bold text-slate-805 block">{cat.name}</span>
                                        </td>
                                        <td className="p-4 font-mono text-indigo-650">{cat.slug}</td>
                                        <td className="p-4 max-w-xs truncate text-slate-500">{cat.description}</td>
                                        <td className="p-4 text-center space-x-2">
                                            <button onClick={() => handleOpenEdit(cat)} className="p-1.5 border border-slate-100 hover:border-indigo-150 hover:bg-indigo-50/20 text-slate-440 hover:text-indigo-650 rounded-lg transition">
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(cat.id)} className="p-1.5 border border-slate-100 hover:border-red-150 hover:bg-red-50/20 text-slate-440 hover:text-red-500 rounded-lg transition">
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs font-semibold text-slate-655">
                    <div className="space-y-1">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('deptTitle')}</label>
                        <input type="text" {...register('name', { required: true })} className="w-full bg-slate-55 border border-slate-205 py-2 px-3 rounded-lg text-slate-800 outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px]">{t('visualIcon')}</label>
                        <select {...register('icon')} className="w-full bg-slate-55 border border-slate-205 py-2 px-3 rounded-lg text-slate-800 outline-none">
                            {iconOptions.map(icon => (<option key={icon} value={icon}>{icon}</option>))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-slate-400 uppercase tracking-widest text-[10px]">Description</label>
                        <textarea rows="3" {...register('description', { required: true })} className="w-full bg-slate-55 border border-slate-205 py-2 px-3 rounded-lg text-slate-800 outline-none resize-none"></textarea>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex gap-4">
                        <button type="button" onClick={() => setModalOpen(false)} className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-655 rounded-xl transition">
                            {t('cancel')}
                        </button>
                        <button type="submit" className="w-1/2 py-2.5 bg-indigo-650 hover:bg-slate-900 text-white rounded-xl transition shadow">
                            {editingCategory ? t('saveDept') : t('activateDept')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
