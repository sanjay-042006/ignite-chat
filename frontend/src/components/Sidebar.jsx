import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../context/useAuthStore';
import { useChatStore } from '../context/useChatStore';
import { useGroupStore } from '../context/useGroupStore';
import { useLoveStore } from '../context/useLoveStore';
import { LogOut, MessageSquare, Ghost, Users, Compass, BookOpen, Edit, Heart, Flame, Camera } from 'lucide-react';
import { resolveUrl } from '../lib/utils';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import ProfileModal from './ProfileModal';

const links = [
    { to: '/', icon: MessageSquare, label: 'Chat', color: 'from-blue-500 to-cyan-500' },
    { to: '/groups', icon: Users, label: 'Groups', color: 'from-violet-500 to-purple-500' },
    { to: '/love', icon: Heart, label: 'Love', color: 'from-pink-500 to-rose-500' },
    { to: '/stranger', icon: Compass, label: 'Stranger', color: 'from-amber-500 to-orange-500' },
    { to: '/interest', icon: Ghost, label: 'Interest', color: 'from-emerald-500 to-teal-500' },
    { to: '/practice', icon: Edit, label: 'Practice', color: 'from-sky-500 to-blue-500' },
    { to: '/library', icon: BookOpen, label: 'Stories', color: 'from-fuchsia-500 to-pink-500' },
];

const Sidebar = ({ className = '', isMobile = false }) => {
    const { authUser, logout } = useAuthStore();
    const { users, getUsers } = useChatStore();
    const { groups, getGroups } = useGroupStore();
    const { connections, getConnections } = useLoveStore();
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        if (authUser) {
            getUsers();
            getGroups();
            getConnections();
        }
    }, [authUser, getUsers, getGroups, getConnections]);

    const getUnreadCount = (label) => {
        if (label === 'Chat') return users.reduce((sum, u) => sum + (u.unreadCount || 0), 0);
        if (label === 'Groups') return groups.reduce((sum, g) => sum + (g.unreadCount || 0), 0);
        if (label === 'Love') return connections.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        return 0;
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            await useAuthStore.getState().updateProfile({ profilePic: reader.result });
        };
    };

    // ── MOBILE BOTTOM TAB BAR ──────────────────────────────────────────────
    if (isMobile) {
        return (
            <>
                <div className={`flex flex-col ${className}`}
                    style={{ background: 'rgba(5,7,14,0.97)', backdropFilter: 'blur(20px)' }}>
                    {/* Scrollable tab icons */}
                <div className="flex overflow-x-auto py-2 px-2 gap-1 w-full scrollbar-none">
                    {links.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) => clsx(
                                "flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 px-1 rounded-xl transition-all duration-200 shrink-0",
                                isActive ? "text-white" : "text-muted-foreground/60"
                            )}
                            title={item.label}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={clsx(
                                        "size-9 rounded-xl flex items-center justify-center transition-all relative",
                                        isActive ? `bg-gradient-to-br ${item.color} shadow-sm` : ""
                                    )}>
                                        <item.icon className="size-5" />
                                        {getUnreadCount(item.label) > 0 && (
                                            <div className="absolute -top-1 -right-1 size-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-[#05070e]">
                                                <span className="text-[8px] font-bold text-white">{getUnreadCount(item.label)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-semibold truncate leading-none mt-0.5">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                    {/* User Profile on mobile */}
                    <button 
                        onClick={() => setShowProfile(true)} 
                        className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 px-1 shrink-0 group cursor-pointer"
                    >
                        <div className="size-9 rounded-xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-[10px] shadow-sm group-hover:ring-1 group-hover:ring-purple-400">
                            {authUser?.profilePic ? (
                                <img src={resolveUrl(authUser.profilePic)} alt="Me" className="w-full h-full object-cover" />
                            ) : (
                                authUser?.username?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <span className="text-[9px] font-semibold text-muted-foreground/60 mt-0.5 group-hover:text-white transition-colors">Profile</span>
                    </button>

                    {/* Logout on mobile */}
                    <button
                        onClick={logout}
                        className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 px-1 text-muted-foreground/60 hover:text-red-400 transition-all shrink-0"
                    >
                        <div className="size-9 rounded-xl flex items-center justify-center">
                            <LogOut className="size-5" />
                        </div>
                        <span className="text-[9px] font-semibold mt-0.5">Exit</span>
                    </button>
                </div>
            </div>
            {/* Profile Modal for Mobile */}
            {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
        </>
    );
}

    // ── DESKTOP SIDEBAR ────────────────────────────────────────────────────
    return (
        <div className={`h-full flex flex-col justify-between py-4 items-center ${className}`}
            style={{ background: 'linear-gradient(180deg, rgba(12,17,32,0.97), rgba(5,7,14,0.99))' }}>

            {/* Logo */}
            <div className="flex flex-col items-center w-full space-y-5">
                <div className="relative group cursor-pointer">
                    <div className="size-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all group-hover:scale-105">
                        <Flame className="size-5" />
                    </div>
                    <span className="hidden lg:block text-center text-[9px] font-bold mt-1.5 bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent tracking-wider uppercase">Ignite</span>
                </div>

                <nav className="flex flex-col space-y-0.5 w-full px-2">
                    {links.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) => clsx(
                                "flex items-center lg:justify-start justify-center p-2.5 rounded-xl transition-all duration-200 relative group/link",
                                isActive ? "bg-white/[0.07] text-white" : "text-muted-foreground hover:bg-white/[0.04] hover:text-white/80"
                            )}
                            title={item.label}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-indigo-400 to-purple-400" />
                                    )}
                                    <div className={clsx(
                                        "size-8 rounded-lg flex items-center justify-center transition-all shrink-0 relative",
                                        isActive ? `bg-gradient-to-br ${item.color} shadow-sm` : "group-hover/link:bg-white/5"
                                    )}>
                                        <item.icon className="size-4" />
                                        {getUnreadCount(item.label) > 0 && (
                                            <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center border-2 border-[#0c1120]">
                                                <span className="text-[8px] font-black text-white">{getUnreadCount(item.label)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className={clsx("hidden lg:block ml-2.5 text-[13px] font-medium truncate", isActive && "font-semibold")}>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* User + Logout */}
            <div className="flex flex-col items-center w-full space-y-1 px-2">
                {authUser && (
                    <button 
                        onClick={() => setShowProfile(true)}
                        className="hidden lg:flex flex-col gap-2 w-full px-2.5 py-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors text-left"
                    >
                        <div className="flex items-center gap-2">
                            <div className="relative group shrink-0 block">
                                <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden border border-transparent group-hover:border-purple-400/50 transition-colors">
                                    {authUser.profilePic ? (
                                        <img src={resolveUrl(authUser.profilePic)} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        authUser.username?.charAt(0).toUpperCase()
                                    )}
                                </div>
                            </div>
                            <span className="text-xs font-medium text-foreground/80 truncate">{authUser.username}</span>
                        </div>
                        
                        {(authUser.storyStreak !== undefined || authUser.loveStreak !== undefined) && (
                            <div className="flex flex-col gap-1.5 mt-1 border-t border-white/5 pt-2">
                                {authUser.storyStreak !== undefined && (
                                    <div className="flex items-center justify-between text-[10px] px-1.5 rounded pb-0.5 pt-0.5">
                                        <span className="text-fuchsia-400/80 py-0.5 flex items-center gap-1 font-medium"><BookOpen className="size-3"/> Stories</span>
                                        <span className="text-fuchsia-400 font-bold">{authUser.storyStreak} 🔥</span>
                                    </div>
                                )}
                                {authUser.loveStreak !== undefined && (
                                    <div className="flex items-center justify-between text-[10px] px-1.5 rounded pb-0.5 pt-0.5">
                                        <span className="text-pink-400/80 py-0.5 flex items-center gap-1 font-medium"><Heart className="size-3"/> Love</span>
                                        <span className="text-pink-400 font-bold">{authUser.loveStreak}m 💕</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </button>
                )}
                <button onClick={logout}
                    className="p-2.5 w-full flex items-center justify-center lg:justify-start rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all"
                    title="Logout">
                    <LogOut className="size-4 shrink-0" />
                    <span className="hidden lg:block ml-2.5 text-[13px] font-medium">Logout</span>
                </button>
            </div>

            {/* Profile Modal */}
            {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
        </div>
    );
};

export default Sidebar;
