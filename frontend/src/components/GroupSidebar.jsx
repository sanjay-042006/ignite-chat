import { useGroupStore } from '../context/useGroupStore';
import { useAuthStore } from '../context/useAuthStore';
import { useChatStore } from '../context/useChatStore';
import { Users, Search, Plus, X, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { resolveUrl } from '../lib/utils';
import clsx from 'clsx';

const GroupSidebar = () => {
    const { groups, selectedGroup, setSelectedGroup, isGroupsLoading, createGroup, getGroups, deleteGroup } = useGroupStore();
    const { users, getUsers } = useChatStore();
    const { authUser } = useAuthStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => { getGroups(); }, [getGroups]);

    const filteredGroups = groups.filter((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim() || selectedMembers.length === 0) return;
        const success = await createGroup(newGroupName, selectedMembers);
        if (success) { setIsCreating(false); setNewGroupName(''); setSelectedMembers([]); }
    };

    const toggleMember = (userId) => {
        setSelectedMembers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    if (isGroupsLoading) return (
        <div className="w-72 lg:w-80 border-r border-white/5 h-full flex flex-col">
            <div className="p-3 space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="size-9 rounded-xl bg-white/5" />
                        <div className="flex-1 space-y-1.5"><div className="h-3 w-20 bg-white/5 rounded" /><div className="h-2 w-14 bg-white/[0.03] rounded" /></div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full md:w-72 lg:w-80 flex flex-col h-full border-r border-white/5 overflow-hidden"
            style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.03) 0%, transparent 40%)' }}>

            <div className="p-3 pb-2 border-b border-white/5">
                <div className="flex items-center justify-between mb-2.5">
                    <h2 className="text-base font-bold flex items-center gap-1.5">
                        <div className="size-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shadow-violet-500/30">
                            <Users className="size-3.5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Groups</span>
                    </h2>
                    <button
                        onClick={() => { setIsCreating(!isCreating); if (!users.length) getUsers(); }}
                        className={clsx("size-7 rounded-lg flex items-center justify-center transition",
                            isCreating ? "bg-red-500/15 text-red-400" : "bg-violet-500/15 text-violet-400 hover:bg-violet-500/25"
                        )}
                    >
                        {isCreating ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
                    </button>
                </div>

                {!isCreating && (
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            className="w-full bg-white/5 border border-white/5 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/30 transition placeholder:text-muted-foreground/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {isCreating ? (
                    <form onSubmit={handleCreateGroup} className="space-y-3 p-1 animate-slide-up">
                        <div>
                            <label className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider ml-0.5">Group Name</label>
                            <input
                                type="text"
                                placeholder="E.g., Weekend Plans"
                                className="w-full mt-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider ml-0.5">Members</label>
                            <div className="mt-1 space-y-0.5 max-h-44 overflow-y-auto border border-white/5 rounded-xl p-1 bg-black/10">
                                {users.filter(u => u.id !== authUser.id && u.friendshipStatus === 'FRIEND').map(user => (
                                    <div key={user.id} onClick={() => toggleMember(user.id)}
                                        className={clsx(
                                            "flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition text-xs",
                                            selectedMembers.includes(user.id) ? "bg-violet-500/15 border border-violet-500/20" : "hover:bg-white/[0.04] border border-transparent"
                                        )}>
                                        {user.profilePic ? (
                                            <img src={resolveUrl(user.profilePic)} alt={user.username} className="size-7 rounded-full object-cover border border-white/10 shrink-0" />
                                        ) : (
                                            <div className="size-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="font-medium">{user.username}</span>
                                        {selectedMembers.includes(user.id) && <div className="ml-auto size-2 bg-violet-400 rounded-full" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button type="submit" disabled={!newGroupName.trim() || selectedMembers.length === 0}
                            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-30 text-white py-2 rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 transition-all">
                            Create Group
                        </button>
                    </form>
                ) : (
                    <>
                        {filteredGroups.length === 0 && <div className="text-center text-muted-foreground mt-10 text-xs">No groups found</div>}
                        {filteredGroups.map((group) => {
                            const amAdmin = group.members?.some(m => m.userId === authUser.id && m.isAdmin);
                            return (
                                <div key={group.id} onClick={() => setSelectedGroup(group)}
                                    className={clsx(
                                        "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 text-left cursor-pointer group/item",
                                        selectedGroup?.id === group.id
                                            ? "bg-gradient-to-r from-violet-500/10 to-purple-500/[0.06] border border-violet-500/20 shadow-sm"
                                            : "hover:bg-white/[0.04] border border-transparent"
                                    )}>
                                    {group.profilePic ? (
                                        <img src={resolveUrl(group.profilePic)} alt={group.name} className="size-9 rounded-xl object-cover shadow-sm ring-2 ring-violet-500/10 shrink-0" />
                                    ) : (
                                        <div className="size-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-sm ring-2 ring-violet-500/10 shrink-0">
                                            <Users className="size-4 text-white/80" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <p className="font-semibold text-xs truncate">{group.name}</p>
                                            {group.unreadCount > 0 && (
                                                <span className="text-[9px] font-bold text-violet-400 shrink-0">
                                                    {group.unreadCount === 1 ? "New message" : `${group.unreadCount} new messages`}
                                                </span>
                                            )}
                                        </div>
                                        <p className={clsx("text-[10px] font-medium", group.unreadCount > 0 ? "text-violet-400 font-bold" : "text-muted-foreground/50")}>
                                            {group.unreadCount > 0 ? "New message in group" : `${group.members?.length || 0} members`}
                                        </p>
                                    </div>
                                    {amAdmin && (
                                        <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${group.name}"?`)) deleteGroup(group.id); }}
                                            className="hidden group-hover/item:flex size-7 rounded-lg hover:bg-red-500/15 text-muted-foreground/30 hover:text-red-400 items-center justify-center transition shrink-0">
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
};

export default GroupSidebar;
