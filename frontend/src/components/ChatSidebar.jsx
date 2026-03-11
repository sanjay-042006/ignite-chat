import { useChatStore } from '../context/useChatStore';
import { useSocketStore } from '../context/useSocketStore';
import { Users2, Search, UserPlus, UserCheck, Clock, Check, X } from 'lucide-react';
import clsx from 'clsx';
import { useState, useMemo } from 'react';

const TABS = [
    { key: 'friends', label: 'Friends', icon: UserCheck },
    { key: 'requests', label: 'Requests', icon: Clock },
    { key: 'add', label: 'Add Users', icon: UserPlus },
];

const ChatSidebar = () => {
    const { users, selectedUser, setSelectedUser, isUsersLoading, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useChatStore();
    const { onlineUsers } = useSocketStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('friends');

    // Split users into categories based on friendshipStatus
    const { friends, requests, addUsers } = useMemo(() => {
        const friends = users.filter(u => u.friendshipStatus === 'FRIEND');
        const requests = users.filter(u => u.friendshipStatus === 'PENDING_RECEIVED' || u.friendshipStatus === 'PENDING_SENT');
        const addUsers = users.filter(u => u.friendshipStatus === 'NONE');
        return { friends, requests, addUsers };
    }, [users]);

    const currentList = activeTab === 'friends' ? friends : activeTab === 'requests' ? requests : addUsers;
    const filteredList = currentList.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));

    // Badge count for requests tab
    const incomingCount = requests.filter(r => r.friendshipStatus === 'PENDING_RECEIVED').length;

    if (isUsersLoading) return (
        <div className="w-72 lg:w-80 border-r border-border h-full flex flex-col glass">
            <div className="p-4 flex items-center gap-3 animate-pulse">
                <div className="size-10 rounded-full bg-border" />
                <div className="h-4 w-24 bg-border rounded" />
            </div>
        </div>
    );

    return (
        <div className="w-full md:w-72 lg:w-96 flex flex-col h-full glass transition-all duration-200 hide-scrollbar overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users2 className="size-5 text-indigo-400" />
                        Chats
                    </h2>
                </div>

                {/* Tab Bar */}
                <div className="flex gap-1 bg-background/50 rounded-xl p-1 border border-white/5">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
                            className={clsx(
                                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 relative",
                                activeTab === tab.key
                                    ? "bg-indigo-500/20 text-indigo-400 shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            <tab.icon className="size-3.5" />
                            <span className="hidden lg:inline">{tab.label}</span>
                            {tab.key === 'requests' && incomingCount > 0 && (
                                <span className="absolute -top-1 -right-1 size-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
                                    {incomingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search Input */}
                <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab === 'friends' ? 'friends' : activeTab === 'requests' ? 'requests' : 'users'}...`}
                        className="w-full bg-input/20 border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto space-y-1 p-3">
                {filteredList.length === 0 && (
                    <div className="text-center text-muted-foreground mt-8 text-sm">
                        {activeTab === 'friends' ? 'No friends yet. Add some users!' : activeTab === 'requests' ? 'No pending requests.' : 'No users to add.'}
                    </div>
                )}

                {filteredList.map((user) => (
                    <div
                        key={user.id}
                        className={clsx(
                            "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 text-left relative",
                            activeTab === 'friends' && selectedUser?.id === user.id
                                ? "bg-indigo-500/20 shadow-sm border border-indigo-500/30"
                                : "hover:bg-white/5 border border-transparent",
                            activeTab === 'friends' ? "cursor-pointer" : ""
                        )}
                        onClick={() => { if (activeTab === 'friends') setSelectedUser(user); }}
                    >
                        {/* Avatar */}
                        <div className="relative">
                            <div className="size-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-background flex-shrink-0">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            {activeTab === 'friends' && (
                                onlineUsers.includes(user.id) ? (
                                    <span className="absolute bottom-0 right-0 size-3.5 bg-green-500 border-2 border-background rounded-full drop-shadow-sm" />
                                ) : (
                                    <span className="absolute bottom-0 right-0 size-3.5 bg-zinc-500 border-2 border-background rounded-full drop-shadow-sm" />
                                )
                            )}
                        </div>

                        {/* User Info */}
                        <div className="min-w-0 hidden md:block flex-1">
                            <p className="font-semibold text-sm truncate">{user.username}</p>
                            {activeTab === 'friends' && (
                                <p className="text-xs text-muted-foreground truncate">
                                    {onlineUsers.includes(user.id) ? "Online" : "Offline"}
                                </p>
                            )}
                            {activeTab === 'requests' && user.friendshipStatus === 'PENDING_SENT' && (
                                <p className="text-xs text-amber-400/80 truncate">Request sent</p>
                            )}
                            {activeTab === 'requests' && user.friendshipStatus === 'PENDING_RECEIVED' && (
                                <p className="text-xs text-indigo-400/80 truncate">Wants to connect</p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {activeTab === 'requests' && user.friendshipStatus === 'PENDING_RECEIVED' && (
                            <div className="flex gap-2 ml-auto shrink-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); acceptFriendRequest(user.requestId); }}
                                    className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition"
                                    title="Accept"
                                >
                                    <Check className="size-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); rejectFriendRequest(user.requestId); }}
                                    className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                                    title="Reject"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        )}

                        {activeTab === 'add' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); sendFriendRequest(user.id); }}
                                className="ml-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 text-xs font-semibold transition"
                            >
                                <UserPlus className="size-3.5" />
                                <span className="hidden lg:inline">Add</span>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatSidebar;
