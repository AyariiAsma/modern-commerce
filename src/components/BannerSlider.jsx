import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { bannerService } from '../services/api';
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX, Sparkles, ArrowRight } from 'lucide-react';

export default function BannerSlider() {
    const [banners, setBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(true);

    const timerRef = useRef(null);
    const videoRefs = useRef({});

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await bannerService.getActive();
                setBanners(res.data);
            } catch (err) {
                console.error('Failed to load active homepage banners:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
    }, []);

    // Autoplay slider logic
    const startAutoplay = () => {
        stopAutoplay();
        // Skip autoplay loop if a video is currently playing
        const currentBanner = banners[currentIndex];
        if (currentBanner && currentBanner.type === 'video') {
            return; 
        }

        timerRef.current = setInterval(() => {
            handleNext();
        }, 6000); // 6 seconds slide duration
    };

    const stopAutoplay = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    useEffect(() => {
        if (banners.length > 1) {
            startAutoplay();
        }
        return () => stopAutoplay();
    }, [currentIndex, banners]);

    // Handle play/pause sync when switching slides
    useEffect(() => {
        if (banners.length === 0) return;
        
        // Pause all videos
        Object.keys(videoRefs.current).forEach(key => {
            const vid = videoRefs.current[key];
            if (vid) vid.pause();
        });

        // Play active video if current slide is a video
        const activeBanner = banners[currentIndex];
        if (activeBanner && activeBanner.type === 'video') {
            const activeVid = videoRefs.current[currentIndex];
            if (activeVid) {
                activeVid.currentTime = 0;
                activeVid.play().catch(err => console.log('Video autoplay blocked:', err));
            }
        }
    }, [currentIndex, banners]);

    const handlePrev = () => {
        setCurrentIndex(prev => (prev === 0 ? banners.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex(prev => (prev === banners.length - 1 ? 0 : prev + 1));
    };

    if (loading) {
        return (
            <div className="h-64 sm:h-96 rounded-3xl bg-slate-900/10 animate-pulse flex items-center justify-center">
                <span className="text-slate-400 text-xs">Loading store campaigns...</span>
            </div>
        );
    }

    if (banners.length === 0) {
        // Fallback banner if admin has not configured any banner yet
        return (
            <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-20 px-8 sm:px-12 lg:px-16">
                <div className="absolute inset-0 bg-cover bg-center opacity-15"></div>
                <div className="relative z-10 max-w-2xl space-y-6">
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full">
                        <Sparkles className="h-3 w-3 mr-1.5" /> Welcome to Modern Store
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
                        Discover Quality Products
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg">
                        Explore our new collections featuring top-tier audio, apparel, kitchenware, and smart accessories.
                    </p>
                    <Link to="/catalog" className="inline-flex items-center space-x-2 bg-white text-slate-900 font-bold px-6 py-3.5 rounded-full hover:bg-indigo-50 transition shadow-lg">
                        <span>Shop Now</span>
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white shadow-xl h-[450px] group">
            
            {/* Slider Content Wrapper */}
            <div className="relative w-full h-full flex items-center">
                {banners.map((banner, index) => {
                    const isActive = index === currentIndex;
                    return (
                        <div
                            key={banner.id}
                            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                            }`}
                        >
                            {/* Reusable Banner Component logic */}
                            <div className="absolute inset-0 bg-black/40 z-10"></div>
                            
                            {banner.type === 'video' ? (
                                <video
                                    ref={el => videoRefs.current[index] = el}
                                    src={banner.media_url}
                                    muted={isMuted}
                                    loop
                                    playsInline
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            ) : (
                                <img
                                    src={banner.media_url}
                                    alt={banner.title}
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            )}

                            {/* Floating details */}
                            <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 sm:px-16 md:px-24 max-w-3xl space-y-4">
                                {banner.subtitle && (
                                    <span className="inline-flex items-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-3.5 py-1 rounded-full self-start">
                                        <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                                        {banner.subtitle}
                                    </span>
                                )}
                                {banner.title && (
                                    <h2 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight drop-shadow-md">
                                        {banner.title}
                                    </h2>
                                )}
                                {banner.description && (
                                    <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-lg drop-shadow-sm font-medium">
                                        {banner.description}
                                    </p>
                                )}
                                {banner.button_text && banner.button_url && (
                                    <Link
                                        to={banner.button_url}
                                        className="inline-flex items-center space-x-2 bg-white hover:bg-indigo-550 hover:text-white text-slate-900 font-bold px-6 py-3.5 rounded-full transition shadow-lg active:scale-95 self-start text-xs sm:text-sm"
                                    >
                                        <span>{banner.button_text}</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                )}
                            </div>

                            {/* Mute/Unmute control for videos */}
                            {banner.type === 'video' && isActive && (
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="absolute bottom-6 right-6 z-30 p-2.5 bg-black/50 hover:bg-black/80 rounded-full transition border border-white/20 text-white active:scale-95"
                                >
                                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Slider Navigation Arrows */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/30 hover:bg-black/70 transition border border-white/10 opacity-0 group-hover:opacity-100 active:scale-90"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/30 hover:bg-black/70 transition border border-white/10 opacity-0 group-hover:opacity-100 active:scale-90"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </>
            )}

            {/* Navigation Dots / Indicators */}
            {banners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                    {banners.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                idx === currentIndex ? 'w-6 bg-indigo-500' : 'w-2 bg-white/40'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
