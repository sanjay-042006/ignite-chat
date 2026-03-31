import { useState } from 'react';
import { X, Camera, Flame, Heart, BookOpen } from 'lucide-react';
import { useAuthStore } from '../context/useAuthStore';
import { resolveUrl } from '../lib/utils';
import clsx from 'clsx';

const ProfileModal = ({ onClose }) => {
    const { authUser, updateProfile } = useAuthStore();
    const [isHovered, setIsHovered] = useState(false);

    if (!authUser) return null;

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            await updateProfile({ profilePic: reader.result });
        };
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                >
                    <X className="size-4" />
                </button>

                <div className="flex flex-col items-center">
                    {/* Header Background Glow */}
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl -z-10" />

                    {/* Avatar with Upload */}
                    <label 
                        className="relative size-28 rounded-full cursor-pointer group mb-4"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <div className={clsx(
                            "w-full h-full rounded-full border-4 flex items-center justify-center text-4xl font-bold overflow-hidden transition-all duration-300",
                            isHovered ? "border-purple-400/80 shadow-[0_0_30px_rgba(168,85,247,0.4)]" : "border-white/10 shadow-xl",
                            !authUser.profilePic && "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                        )}>
                            {authUser.profilePic ? (
                                <img src={resolveUrl(authUser.profilePic)} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                authUser.username?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className={clsx(
                            "absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center transition-opacity duration-300",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}>
                            <Camera className="size-8 text-white mb-1" />
                            <span className="text-[10px] font-bold text-white tracking-widest uppercase">Change</span>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>

                    {/* User Info */}
                    <h2 className="text-2xl font-bold text-white mb-1 bg-gradient-to-r from-white to-white/60 bg-clip-text">
                        {authUser.username}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">{authUser.email}</p>

                    {/* Streaks Container */}
                    <div className="w-full grid grid-cols-2 gap-3 mb-2">
                        {/* Story Streak */}
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-white/[0.07] transition-colors relative overflow-hidden group">
                            <div className="absolute -inset-1 bg-gradient-to-br from-fuchsia-500/20 to-pink-500/0 blur opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative flex flex-col items-center">
                                <div className="text-3xl font-black text-fuchsia-400 drop-shadow-[0_0_15px_rgba(232,121,249,0.3)] mb-1">
                                    {(authUser.storyStreak || 0)} <span className="text-xl">🔥</span>
                                </div>
                                <div className="text-[11px] font-semibold text-fuchsia-400/70 uppercase tracking-widest flex items-center gap-1.5">
                                    <BookOpen className="size-3" /> Stories
                                </div>
                            </div>
                        </div>

                        {/* Love Streak */}
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-white/[0.07] transition-colors relative overflow-hidden group">
                            <div className="absolute -inset-1 bg-gradient-to-br from-pink-500/20 to-rose-500/0 blur opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative flex flex-col items-center">
                                <div className="text-3xl font-black text-pink-400 drop-shadow-[0_0_15px_rgba(244,114,182,0.3)] mb-1">
                                    {(authUser.loveStreak || 0)} <span className="text-xl">💕</span>
                                </div>
                                <div className="text-[11px] font-semibold text-pink-400/70 uppercase tracking-widest flex items-center gap-1.5">
                                    <Heart className="size-3" /> Love
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full text-center mt-6">
                        <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">
                            Member since {new Date(authUser.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
