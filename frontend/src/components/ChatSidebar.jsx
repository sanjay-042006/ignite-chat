import { useChatStore } from '../context/useChatStore';
import { useSocketStore } from '../context/useSocketStore';
import { MessageSquare, Search, UserPlus, UserCheck, Clock, Check, X } from 'lucide-react';
import clsx from 'clsx';
import { useState, useMemo } from 'react';

const ChatSidebar = () => {
    const { users, selectedUser, setSelectedUser, isUsersLoading, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useChatStore();
    const { onlineUsers } = useSocketStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('friends');

    const { friends, requests, addUsers } = useMemo(() => ({
        friends: users.filter(u => u.friendshipStatus === 'FRIEND'),
        requests: users.filter(u => u.friendshipStatus === 'PENDING_RECEIVED' || u.friendshipStatus === 'PENDING_SENT'),
        addUsers: users.filter(u => u.friendshipStatus === 'NONE'),
    }), [users]);

    const currentList = activeTab === 'friends' ? friends : activeTab === 'requests' ? requests : addUsers;
    const filteredList = currentList.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const incomingCount = requests.filter(r => r.friendshipStatus === 'PENDING_RECEIVED').length;

    if (isUsersLoading) return (
        <div className="w-72 lg:w-80 border-r border-white/5 h-full flex flex-col">
            <div className="p-3 space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="size-9 rounded-full bg-white/5" />
                        <div className="flex-1 space-y-1.5"><div className="h-3 w-20 bg-white/5 rounded" /><div className="h-2 w-14 bg-white/[0.03] rounded" /></div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full md:w-72 lg:w-80 flex flex-col h-full border-r border-white/5 overflow-hidden"
            style={{ background: 'linear-gradient(180deg, rgba(59,130,246,0.02) 0%, transparent 40%)' }}>

            {/* Header */}
            <div className="p-3 md:p-3 pb-2 border-b border-white/5">
                <div className="flex items-center justify-between mb-2.5">
                    <h2 className="text-lg md:text-base font-bold flex items-center gap-2">
                        <div className="size-8 md:size-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm shadow-blue-500/30">
                            <MessageSquare className="size-4 md:size-3.5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Chats</span>
                    </h2>
                    <span className="text-xs md:text-[9px] font-bold text-muted-foreground/60">{friends.length} friends</span>
                </div>

                {/* Tabs */}
                <div className="flex gap-0.5 bg-black/20 rounded-lg p-0.5 mb-2.5">
                    {[
                        { key: 'friends', label: 'Friends', icon: UserCheck },
                        { key: 'requests', label: 'Requests', icon: Clock, badge: incomingCount },
                        { key: 'add', label: 'Add', icon: UserPlus },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
                            className={clsx(
                                "flex-1 flex items-center justify-center gap-1.5 py-2.5 md:py-1.5 rounded-md text-sm md:text-[11px] font-semibold transition-all duration-200 relative",
                                activeTab === tab.key
                                    ? "bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white shadow-sm shadow-blue-500/20"
                                    : "text-muted-foreground hover:text-white/80"
                            )}
                        >
                            <tab.icon className="size-3" />
                            {tab.label}
                            {tab.badge > 0 && (
                                <span className="absolute -top-1 -right-0.5 min-w-[14px] h-[14px] bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold shadow-sm shadow-red-500/50">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 md:py-1.5 pl-8 pr-3 text-sm md:text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition placeholder:text-muted-foreground/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {filteredList.length === 0 && (
                    <div className="text-center text-muted-foreground mt-10 text-xs">
                        {activeTab === 'friends' ? 'No friends yet' : activeTab === 'requests' ? 'No pending requests' : 'No users to add'}
                    </div>
                )}

                {filteredList.map((user) => (
                    <div
                        key={user.id}
                        className={clsx(
                            "w-full flex items-center gap-3 p-3 md:p-2.5 rounded-xl transition-all duration-200 text-left group",
                            activeTab === 'friends' && selectedUser?.id === user.id
                                ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/[0.06] border border-blue-500/20 shadow-sm"
                                : "hover:bg-white/[0.04] border border-transparent",
                            activeTab === 'friends' ? "cursor-pointer" : ""
                        )}
                        onClick={() => { if (activeTab === 'friends') setSelectedUser(user); }}
                    >
                        <div className="relative shrink-0">
                            <div className="size-11 md:size-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-base md:text-sm shadow-sm ring-2 ring-blue-500/10 overflow-hidden">
                                {user.profilePic ? (
                                    <img src={user.profilePic} alt={user.username} className="w-full h-full object-cover" />
                                ) : (
                                    user.username.charAt(0).toUpperCase()
                                )}
                            </div>
                            {activeTab === 'friends' && (
                                <span className={clsx("absolute -bottom-0.5 -right-0.5 size-2.5 border-2 border-background rounded-full",
                                    onlineUsers.includes(user.id) ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-zinc-600"
                                )} />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <p className="font-semibold text-sm md:text-xs truncate">{user.username}</p>
                                {user.storyStreak !== undefined && <span className="text-[9px] text-fuchsia-400 font-bold bg-fuchsia-500/10 px-1 rounded flex items-center gap-0.5 border border-fuchsia-500/20" title="Story Streak">{user.storyStreak}🔥</span>}
                                {user.loveStreak !== undefined && <span className="text-[9px] text-pink-400 font-bold bg-pink-500/10 px-1 rounded flex items-center gap-0.5 border border-pink-500/20" title="Love Streak">{user.loveStreak}m💕</span>}
                            </div>
                            {activeTab === 'friends' && (
                                <p className={clsx("text-[10px] truncate font-medium", onlineUsers.includes(user.id) ? "text-emerald-400/70" : "text-muted-foreground/50")}>
                                    {onlineUsers.includes(user.id) ? "Online" : "Offline"}
                                </p>
                            )}
                            {activeTab === 'requests' && user.friendshipStatus === 'PENDING_SENT' && (
                                <p className="text-[10px] text-amber-400/70 font-medium">Sent</p>
                            )}
                            {activeTab === 'requests' && user.friendshipStatus === 'PENDING_RECEIVED' && (
                                <p className="text-[10px] text-blue-400/70 font-medium">Wants to connect</p>
                            )}
                        </div>

                        {/* Actions */}
                        {activeTab === 'requests' && user.friendshipStatus === 'PENDING_RECEIVED' && (
                            <div className="flex gap-1.5 shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); acceptFriendRequest(user.requestId); }} className="size-7 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center transition">
                                    <Check className="size-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); rejectFriendRequest(user.requestId); }} className="size-7 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 flex items-center justify-center transition">
                                    <X className="size-3.5" />
                                </button>
                            </div>
                        )}
                        {activeTab === 'add' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); sendFriendRequest(user.id); }}
                                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white text-[10px] font-bold hover:from-blue-600 hover:to-cyan-600 shadow-sm shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <UserPlus className="size-3" />
                                Add
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatSidebar;
