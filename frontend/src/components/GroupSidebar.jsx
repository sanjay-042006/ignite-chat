import { useGroupStore } from '../context/useGroupStore';
import { useAuthStore } from '../context/useAuthStore';
import { useChatStore } from '../context/useChatStore';
import { Users2, Search, Plus, X, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';

const GroupSidebar = () => {
    const { groups, selectedGroup, setSelectedGroup, isGroupsLoading, createGroup, getGroups, deleteGroup } = useGroupStore();
    const { users, getUsers } = useChatStore();
    const { authUser } = useAuthStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => {
        getGroups();
    }, [getGroups]);

    const filteredGroups = groups.filter((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim() || selectedMembers.length === 0) return;

        const success = await createGroup(newGroupName, selectedMembers);
        if (success) {
            setIsCreating(false);
            setNewGroupName('');
            setSelectedMembers([]);
        }
    };

    const toggleMember = (userId) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== userId));
        } else {
            setSelectedMembers([...selectedMembers, userId]);
        }
    };

    if (isGroupsLoading) return (
        <div className="w-72 lg:w-80 border-r border-border h-full flex flex-col glass">
            <div className="p-4 flex items-center gap-3 animate-pulse">
                <div className="size-10 rounded-full bg-border" />
                <div className="h-4 w-24 bg-border rounded" />
            </div>
        </div>
    )

    return (
        <div className="w-full md:w-72 lg:w-96 flex flex-col h-full glass transition-all duration-200 hide-scrollbar overflow-hidden">
            <div className="p-4 border-b border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users2 className="size-5 text-purple-400" />
                        Groups
                    </h2>
                    <button
                        onClick={() => {
                            setIsCreating(!isCreating);
                            if (!users.length) getUsers();
                        }}
                        className="p-2 hover:bg-white/10 rounded-full transition"
                    >
                        {isCreating ? <X className="size-5 text-muted-foreground" /> : <Plus className="size-5 text-indigo-400" />}
                    </button>
                </div>

                {/* Search Input */}
                {!isCreating && (
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            className="w-full bg-input/20 border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 p-3">
                {isCreating ? (
                    <form onSubmit={handleCreateGroup} className="space-y-4 animate-in fade-in slide-in-from-top-4">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground ml-1">Group Name</label>
                            <input
                                type="text"
                                placeholder="E.g., Weekend Plans"
                                className="w-full mt-1 bg-input/20 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-muted-foreground ml-1">Select Members</label>
                            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto border border-white/5 rounded-xl p-1 bg-background/50">
                                {users.filter(u => u.id !== authUser.id && u.friendshipStatus === 'FRIEND').map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleMember(user.id)}
                                        className={clsx(
                                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition",
                                            selectedMembers.includes(user.id) ? "bg-indigo-500/20 shadow-sm border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"
                                        )}
                                    >
                                        <div className="size-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs object-cover flex-shrink-0">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-sm">{user.username}</span>
                                        {selectedMembers.includes(user.id) && <div className="ml-auto size-2 bg-indigo-500 rounded-full" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!newGroupName.trim() || selectedMembers.length === 0}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-medium transition"
                        >
                            Create Group
                        </button>
                    </form>
                ) : (
                    <>
                        {filteredGroups.length === 0 && (
                            <div className="text-center text-muted-foreground mt-8 text-sm">No groups found.</div>
                        )}

                        {filteredGroups.map((group) => {
                            const amAdmin = group.members?.some(m => m.userId === authUser.id && m.isAdmin);
                            return (
                                <div
                                    key={group.id}
                                    onClick={() => setSelectedGroup(group)}
                                    className={clsx(
                                        "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 text-left relative cursor-pointer group/item",
                                        selectedGroup?.id === group.id ? "bg-purple-500/20 shadow-sm border border-purple-500/30" : "hover:bg-white/5 border border-transparent"
                                    )}
                                >
                                    <div className="size-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md border-[1.5px] border-white/10 flex-shrink-0">
                                        <Users2 className="size-6 text-white/80" />
                                    </div>

                                    <div className="min-w-0 hidden md:block flex-1">
                                        <div className="flex items-center justify-between w-full">
                                            <p className="font-semibold text-sm truncate">{group.name}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {group.members?.length || 0} members
                                        </p>
                                    </div>

                                    {amAdmin && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Delete group "${group.name}"?`)) deleteGroup(group.id);
                                            }}
                                            className="hidden group-hover/item:flex p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition shrink-0"
                                            title="Delete group"
                                        >
                                            <Trash2 className="size-4" />
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
