import { useLoveStore } from '../context/useLoveStore';
import { useChatStore } from '../context/useChatStore';
import { useAuthStore } from '../context/useAuthStore';
import { useSocketStore } from '../context/useSocketStore';
import { Heart, Search, Check, X, UserPlus, Clock, Sparkles, Quote } from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect, useMemo } from 'react';

const LOVE_FACTS = [
    "💝 Couples who laugh together tend to have stronger relationships.",
    "💖 Holding hands with someone you love can reduce stress and pain.",
    "💞 It takes only 4 minutes to decide if you like someone.",
    "💕 Being in love has a similar neurological effect to being on cocaine.",
    "💗 Cuddling releases natural painkillers — oxytocin!",
    "❤️ Your heart can literally sync with your partner's when you gaze into each other's eyes.",
    "💘 Couples who are too similar or too different tend not to last — balance is key!",
    "💝 A 20-second hug releases oxytocin, making you trust someone more.",
    "💖 Falling in love is biochemically the same as having OCD.",
    "💞 Expressing gratitude to your partner makes you both feel happier.",
    "💕 Love makes you do crazy things because it truly deactivates the brain's judgment center.",
    "💗 Long-distance relationships can build stronger communication and trust.",
];

const LoveSidebar = () => {
    const { connections, selectedConnection, setSelectedConnection, isLoading, getConnections, acceptRequest, rejectRequest, sendLoveRequest } = useLoveStore();
    const { users, getUsers, isUsersLoading } = useChatStore();
    const { authUser } = useAuthStore();
    const { onlineUsers } = useSocketStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('partners');

    useEffect(() => { getConnections(); }, [getConnections]);

    const { partners, pendingReceived, pendingSent } = useMemo(() => ({
        partners: connections.filter(c => c.status === 'ACCEPTED' || c.status === 'BREAKING_UP'),
        pendingReceived: connections.filter(c => c.status === 'PENDING' && c.direction === 'RECEIVED'),
        pendingSent: connections.filter(c => c.status === 'PENDING' && c.direction === 'SENT'),
    }), [connections]);

    const hasActiveConnection = partners.length > 0;
    const connectedUserIds = useMemo(() => new Set(connections.map(c => c.partner.id)), [connections]);
    const availableUsers = useMemo(() =>
        users.filter(u => u.id !== authUser.id && u.friendshipStatus === 'FRIEND' && !connectedUserIds.has(u.id)),
        [users, authUser.id, connectedUserIds]);
    const incomingCount = pendingReceived.length;
    const [factIndex] = useState(Math.floor(Math.random() * LOVE_FACTS.length));

    if (isLoading) return (
        <div className="w-72 lg:w-80 border-r border-border h-full flex flex-col glass">
            <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="size-10 rounded-full bg-pink-500/10" />
                        <div className="flex-1 space-y-1.5"><div className="h-3 w-20 bg-pink-500/10 rounded" /><div className="h-2 w-14 bg-pink-500/5 rounded" /></div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full md:w-72 lg:w-80 flex flex-col h-full border-r border-white/5 transition-all duration-200 overflow-hidden"
            style={{ background: 'linear-gradient(180deg, rgba(236,72,153,0.03) 0%, transparent 40%)' }}>

            {/* Compact Header */}
            <div className="p-3 pb-2 border-b border-white/5">
                <div className="flex items-center justify-between mb-2.5">
                    <h2 className="text-base font-bold flex items-center gap-1.5">
                        <div className="size-6 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-sm shadow-pink-500/30">
                            <Heart className="size-3.5 text-white fill-white" />
                        </div>
                        <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">My Love</span>
                    </h2>
                    {hasActiveConnection && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 border border-pink-500/20">
                            💕 In Love
                        </span>
                    )}
                </div>

                {/* Compact Tabs (hidden when in relationship) */}
                {!hasActiveConnection && (
                    <>
                        <div className="flex gap-0.5 bg-black/20 rounded-lg p-0.5 mb-2.5">
                            {[
                                { key: 'partners', label: 'Status', icon: Heart },
                                { key: 'requests', label: 'Requests', icon: Clock, badge: incomingCount },
                                { key: 'find', label: 'Find', icon: UserPlus },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setActiveTab(tab.key);
                                        setSearchTerm('');
                                        if (tab.key === 'find' && !users.length) getUsers();
                                    }}
                                    className={clsx(
                                        "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 relative",
                                        activeTab === tab.key
                                            ? "bg-gradient-to-r from-pink-600/80 to-rose-600/80 text-white shadow-sm shadow-pink-500/20"
                                            : "text-muted-foreground hover:text-white/80"
                                    )}
                                >
                                    <tab.icon className="size-3" />
                                    {tab.label}
                                    {tab.badge > 0 && (
                                        <span className="absolute -top-1 -right-0.5 min-w-[14px] h-[14px] bg-rose-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold shadow-sm shadow-rose-500/50">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {activeTab !== 'partners' && (
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full bg-white/5 border border-white/5 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500/30 transition placeholder:text-muted-foreground/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">

                {/* HAS A PARTNER */}
                {hasActiveConnection && partners.map(conn => (
                    <button
                        key={conn.id}
                        onClick={() => setSelectedConnection(conn)}
                        className={clsx(
                            "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 text-left group",
                            selectedConnection?.id === conn.id
                                ? "bg-gradient-to-r from-pink-500/15 to-rose-500/10 border border-pink-500/25 shadow-sm"
                                : "hover:bg-white/5 border border-transparent"
                        )}
                    >
                        <div className="relative shrink-0">
                            <div className="size-10 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-md shadow-pink-500/20 ring-2 ring-pink-500/20">
                                {conn.partner.username.charAt(0).toUpperCase()}
                            </div>
                            <span className={clsx("absolute -bottom-0.5 -right-0.5 size-3 border-2 border-background rounded-full",
                                onlineUsers.includes(conn.partner.id) ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-zinc-500"
                            )} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                                <p className="font-semibold text-sm truncate">{conn.partner.username}</p>
                                {conn.unreadCount > 0 && (
                                    <span className="text-[9px] font-bold text-pink-400 shrink-0">
                                        {conn.unreadCount === 1 ? "New message" : `${conn.unreadCount} new messages`}
                                    </span>
                                )}
                            </div>
                            <p className={clsx("text-[11px] truncate font-medium",
                                conn.status === 'BREAKING_UP' ? "text-red-400" : (conn.unreadCount > 0 ? "text-pink-400 font-bold" : "text-pink-400/70")
                            )}>
                                {conn.status === 'BREAKING_UP' ? '💔 Breakup pending' : (conn.unreadCount > 0 ? 'Sent a message' : '💕 Your Partner')}
                            </p>
                        </div>
                        <Heart className={clsx("size-4 shrink-0 transition-all",
                            selectedConnection?.id === conn.id
                                ? "text-pink-400 fill-pink-400"
                                : "text-pink-500/20 group-hover:text-pink-400/50 fill-pink-500/20 group-hover:fill-pink-400/50"
                        )} />
                    </button>
                ))}

                {/* SINGLE — Status Tab */}
                {!hasActiveConnection && activeTab === 'partners' && (
                    <div className="flex flex-col items-center px-3 py-6 space-y-5">
                        <div className="relative">
                            <div className="size-20 rounded-full bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/10 flex items-center justify-center">
                                <Heart className="size-10 text-pink-500/30 fill-pink-500/15" />
                            </div>
                            <Sparkles className="size-5 text-pink-400 absolute -top-0.5 -right-0.5 animate-pulse" />
                        </div>
                        <div className="text-center">
                            <p className="text-base font-bold bg-gradient-to-r from-pink-300 to-rose-300 bg-clip-text text-transparent">Single 💫</p>
                            <p className="text-[11px] text-muted-foreground mt-1">Find your special someone →</p>
                        </div>

                        <div className="w-full rounded-xl p-3.5 border border-pink-500/10 relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(168,85,247,0.06))' }}>
                            <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
                            <div className="flex items-start gap-2 relative">
                                <Quote className="size-4 text-pink-400/60 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-pink-400/60 tracking-widest">Love Fact</span>
                                    <p className="text-xs text-foreground/70 leading-relaxed mt-1">{LOVE_FACTS[factIndex]}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => { setActiveTab('find'); if (!users.length) getUsers(); }}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-bold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <UserPlus className="size-3.5 inline mr-1.5 -mt-0.5" />
                            Find Your Love
                        </button>
                    </div>
                )}

                {/* Requests Tab */}
                {!hasActiveConnection && activeTab === 'requests' && (
                    <>
                        {pendingReceived.length === 0 && pendingSent.length === 0 && (
                            <div className="text-center text-muted-foreground mt-10 text-xs">No pending requests</div>
                        )}
                        {pendingReceived.map(conn => (
                            <div key={conn.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition group">
                                <div className="size-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                                    {conn.partner.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-xs truncate">{conn.partner.username}</p>
                                    <p className="text-[10px] text-pink-400/70">💌 Wants to connect</p>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <button onClick={() => acceptRequest(conn.id)} className="size-7 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center transition">
                                        <Check className="size-3.5" />
                                    </button>
                                    <button onClick={() => rejectRequest(conn.id)} className="size-7 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 flex items-center justify-center transition">
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {pendingSent.map(conn => (
                            <div key={conn.id} className="flex items-center gap-3 p-2.5 rounded-xl opacity-60">
                                <div className="size-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                    {conn.partner.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-xs truncate">{conn.partner.username}</p>
                                    <p className="text-[10px] text-amber-400/70">Sent 💌</p>
                                </div>
                                <Clock className="size-3.5 text-amber-400/50 shrink-0" />
                            </div>
                        ))}
                    </>
                )}

                {/* Find Tab */}
                {!hasActiveConnection && activeTab === 'find' && (
                    <>
                        {isUsersLoading ? (
                            <div className="text-center text-muted-foreground mt-10 text-xs">Loading...</div>
                        ) : availableUsers.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                            <div className="text-center text-muted-foreground mt-10 text-xs">No friends available</div>
                        ) : (
                            availableUsers.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                                <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition group">
                                    <div className="size-9 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-xs truncate">{user.username}</p>
                                    </div>
                                    <button
                                        onClick={() => sendLoveRequest(user.id)}
                                        className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-pink-600/80 to-rose-600/80 text-white text-[10px] font-bold hover:from-pink-600 hover:to-rose-600 shadow-sm shadow-pink-500/20 hover:shadow-pink-500/40 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <Heart className="size-3 fill-current" />
                                        Send
                                    </button>
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default LoveSidebar;
