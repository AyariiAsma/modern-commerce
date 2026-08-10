import React, { useState, useEffect } from 'react';
import { bannerService, mediaService } from '../../services/api';
import { Plus, Edit2, Trash2, Calendar, Link as LinkIcon, Eye, Upload, Sparkles, Image, Video, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function Banners() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form management state
    const [showForm, setShowForm] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Form inputs state
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        type: 'image',
        media_url: '',
        button_text: '',
        button_url: '',
        status: 'active',
        sort_order: 0,
        start_date: '',
        end_date: ''
    });

    const loadBanners = async () => {
        try {
            setLoading(true);
            const res = await bannerService.getAll();
            setBanners(res.data);
        } catch (err) {
            console.error('Failed to load all banners:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBanners();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const res = await mediaService.upload(file);
            const fileUrl = res.data.url;
            const isVideo = file.type.startsWith('video/');

            setFormData(prev => ({
                ...prev,
                media_url: `http://localhost:5001${fileUrl}`, // bind to local server address
                type: isVideo ? 'video' : 'image'
            }));
        } catch (err) {
            alert('Failed to upload file. Make sure file size is under 50MB and format is supported.');
        } finally {
            setUploading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingBanner(null);
        setFormData({
            title: '',
            subtitle: '',
            description: '',
            type: 'image',
            media_url: '',
            button_text: '',
            button_url: '',
            status: 'active',
            sort_order: banners.length + 1,
            start_date: '',
            end_date: ''
        });
        setShowForm(true);
    };

    const handleOpenEdit = (b) => {
        setEditingBanner(b);
        setFormData({
            title: b.title || '',
            subtitle: b.subtitle || '',
            description: b.description || '',
            type: b.type,
            media_url: b.media_url,
            button_text: b.button_text || '',
            button_url: b.button_url || '',
            status: b.status,
            sort_order: b.sort_order,
            start_date: b.start_date || '',
            end_date: b.end_date || ''
        });
        setShowForm(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.media_url) {
            alert('Please select and upload a media file or provide a media URL.');
            return;
        }

        try {
            if (editingBanner) {
                await bannerService.update(editingBanner.id, formData);
            } else {
                await bannerService.create(formData);
            }
            setShowForm(false);
            loadBanners();
        } catch (err) {
            alert('Failed to save banner.');
        }
    };

    const handleDeleteBanner = async (id) => {
        if (!confirm('Are you sure you want to delete this banner campaign?')) return;
        try {
            await bannerService.delete(id);
            loadBanners();
        } catch (err) {
            alert('Failed to delete banner.');
        }
    };

    const handleStatusToggle = async (b) => {
        const nextStatus = b.status === 'active' ? 'inactive' : 'active';
        try {
            await bannerService.update(b.id, { ...b, status: nextStatus });
            loadBanners();
        } catch (err) {
            alert('Failed to update banner status.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Banners Management</h1>
                    <p className="text-slate-400 text-xs mt-1">Configure active promotional slides and media campaigns</p>
                </div>
                {!showForm && (
                    <button
                        onClick={handleOpenAdd}
                        className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-full transition shadow active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Slide Banner</span>
                    </button>
                )}
            </div>

            {showForm ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Input Form Column */}
                    <div className="lg:col-span-3 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-850 text-sm">
                                {editingBanner ? 'Edit Banner Details' : 'Design New Banner Slide'}
                            </h3>
                            <button 
                                onClick={() => setShowForm(false)}
                                className="text-xs font-semibold text-slate-400 hover:text-indigo-650 flex items-center"
                            >
                                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs sm:text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Banner Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 focus:outline-none"
                                        placeholder="e.g. Summer Clearance"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Subtitle Badge</label>
                                    <input
                                        type="text"
                                        name="subtitle"
                                        value={formData.subtitle}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 focus:outline-none"
                                        placeholder="e.g. Save up to 50%"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block">Short Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="2"
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 focus:outline-none resize-none"
                                    placeholder="Write a catchphrase that highlights this offer..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Button Text</label>
                                    <input
                                        type="text"
                                        name="button_text"
                                        value={formData.button_text}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 focus:outline-none"
                                        placeholder="e.g. Shop Now"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Button Link URL</label>
                                    <input
                                        type="text"
                                        name="button_url"
                                        value={formData.button_url}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 focus:outline-none"
                                        placeholder="e.g. /catalog?category=electronics"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 pt-2 border-t border-slate-50">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block">Media File (Image or Video)</label>
                                <div className="mt-1 flex items-center gap-3">
                                    <label className="cursor-pointer inline-flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-250 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition">
                                        <Upload className="h-4 w-4" />
                                        <span>{uploading ? 'Uploading...' : 'Choose File'}</span>
                                        <input
                                            type="file"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                            className="hidden"
                                            accept="image/*,video/*"
                                        />
                                    </label>
                                    <span className="text-slate-400 text-[10px]">Supports files up to 50MB</span>
                                </div>
                                <div className="mt-2.5">
                                    <input
                                        type="text"
                                        name="media_url"
                                        value={formData.media_url}
                                        onChange={handleInputChange}
                                        placeholder="Or paste an external media URL path..."
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 focus:outline-none text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Sort Order</label>
                                    <input
                                        type="number"
                                        name="sort_order"
                                        value={formData.sort_order}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Media Type Override</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 focus:outline-none"
                                    >
                                        <option value="image">Image</option>
                                        <option value="video">Video</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Start Publish Date</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 focus:outline-none text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block">End Publish Date</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 focus:outline-none text-xs"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="inline-flex items-center justify-center font-bold px-6 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs rounded-full transition shadow disabled:opacity-55"
                                >
                                    {uploading ? 'Processing File...' : 'Save Banner Slide'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="inline-flex items-center justify-center font-bold px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs rounded-full transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Preview Column */}
                    <div className="lg:col-span-2 space-y-4">
                        <h4 className="text-xs font-bold text-slate-455 uppercase tracking-wider">Live Banner Slide Preview</h4>
                        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 h-64 flex items-center shadow-lg text-white">
                            {formData.media_url ? (
                                <>
                                    <div className="absolute inset-0 bg-black/40 z-10"></div>
                                    {formData.type === 'video' ? (
                                        <video
                                            src={formData.media_url}
                                            autoPlay
                                            loop
                                            muted
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        <img
                                            src={formData.media_url}
                                            alt="preview"
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    )}
                                    <div className="absolute inset-0 z-20 flex flex-col justify-center p-6 space-y-2">
                                        {formData.subtitle && (
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full self-start">
                                                {formData.subtitle}
                                            </span>
                                        )}
                                        {formData.title && (
                                            <h3 className="text-xl font-black leading-tight tracking-tight drop-shadow-md">
                                                {formData.title}
                                            </h3>
                                        )}
                                        {formData.description && (
                                            <p className="text-slate-350 text-xs leading-relaxed max-w-[200px] font-medium">
                                                {formData.description}
                                            </p>
                                        )}
                                        {formData.button_text && (
                                            <span className="inline-flex items-center space-x-1 bg-white text-slate-900 font-bold px-4 py-2 rounded-full self-start text-[10px]">
                                                {formData.button_text}
                                            </span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center w-full space-y-2 text-slate-500 p-4">
                                    <Eye className="h-8 w-8 mx-auto text-slate-600" />
                                    <p className="text-xs">No media file uploaded yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : loading ? (
                <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-650" />
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Preview</th>
                                <th className="px-6 py-4">Title & Details</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Scheduling Range</th>
                                <th className="px-6 py-4">Order</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-slate-700">
                            {banners.map((b) => (
                                <tr key={b.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="h-10 w-16 rounded overflow-hidden bg-slate-900 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                                            {b.type === 'video' ? (
                                                <div className="relative w-full h-full">
                                                    <video src={b.media_url} className="w-full h-full object-cover" muted />
                                                    <div className="absolute top-1 right-1 bg-black/60 p-0.5 rounded text-[8px] text-white">VID</div>
                                                </div>
                                            ) : (
                                                <img src={b.media_url} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 space-y-0.5 max-w-[200px]">
                                        <p className="font-bold text-slate-800 truncate">{b.title || 'Untitled Banner'}</p>
                                        <p className="text-slate-400 text-[10px] truncate">{b.subtitle || 'No subtitle badge'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center space-x-1 font-semibold text-[10px] capitalize px-2 py-0.5 rounded-full ${
                                            b.type === 'video' ? 'bg-purple-100 text-purple-700' : 'bg-blue-105 text-blue-700'
                                        }`}>
                                            {b.type === 'video' ? <Video className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                                            <span>{b.type}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {b.start_date || b.end_date ? (
                                            <div className="flex items-center space-x-1.5 text-slate-500">
                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-[10px] font-medium">
                                                    {b.start_date ? b.start_date : 'Start'} to {b.end_date ? b.end_date : 'End'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">Always visible</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-800">
                                        {b.sort_order}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleStatusToggle(b)}
                                            className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-full transition active:scale-95 ${
                                                b.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-105 text-red-800'
                                            }`}
                                        >
                                            {b.status}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex gap-2">
                                            <button 
                                                onClick={() => handleOpenEdit(b)}
                                                className="p-1 text-slate-400 hover:text-indigo-650 transition"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteBanner(b.id)}
                                                className="p-1 text-slate-400 hover:text-red-600 transition"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
