import { useEffect, useRef, useState } from 'react';
import { useGroupStore } from '../context/useGroupStore';
import { useAuthStore } from '../context/useAuthStore';
import { useSocketStore } from '../context/useSocketStore';
import { Loader2, Send, Users, LogOut, Trash2, ChevronDown, ChevronUp, Crown } from 'lucide-react';
import clsx from 'clsx';

const GroupChatContainer = () => {
    const { groupMessages, getGroupMessages, isGroupMessagesLoading, selectedGroup, subscribeToGroupMessages, unsubscribeFromGroupMessages, sendGroupMessage, leaveGroup, deleteGroup } = useGroupStore();
    const { authUser } = useAuthStore();
    const { onlineUsers } = useSocketStore();
    const [text, setText] = useState('');
    const [showMembers, setShowMembers] = useState(false);
    const messageEndRef = useRef(null);

    const myMembership = selectedGroup?.members?.find(m => m.userId === authUser.id);
    const isAdmin = myMembership?.isAdmin || false;

    useEffect(() => {
        if (selectedGroup) {
            getGroupMessages(selectedGroup.id);
            subscribeToGroupMessages();
        }
        return () => unsubscribeFromGroupMessages();
    }, [selectedGroup?.id, getGroupMessages, subscribeToGroupMessages, unsubscribeFromGroupMessages]);

    useEffect(() => {
        if (messageEndRef.current && groupMessages) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [groupMessages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() || !selectedGroup) return;

        await sendGroupMessage(selectedGroup.id, text.trim());
        setText('');
    };

    const handleLeave = async () => {
        if (!confirm('Are you sure you want to leave this group?')) return;
        await leaveGroup(selectedGroup.id);
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this group? This cannot be undone.')) return;
        await deleteGroup(selectedGroup.id);
    };

    if (isGroupMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-background/50 h-full">
                <Loader2 className="size-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!selectedGroup) return null;

    return (
        <div className="flex flex-col h-full bg-background/50 relative">
            {/* Top Header */}
            <div className="px-6 py-4 glass border-b border-white/5 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md border-2 border-background">
                            <Users className="size-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold">{selectedGroup.name}</h3>
                            <p className="text-xs text-muted-foreground">{selectedGroup.members?.length || 0} members</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Toggle Members Panel */}
                        <button
                            onClick={() => setShowMembers(!showMembers)}
                            className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
                            title="View members"
                        >
                            <Users className="size-4" />
                            {showMembers ? <ChevronUp className="size-3 inline ml-0.5" /> : <ChevronDown className="size-3 inline ml-0.5" />}
                        </button>

                        {/* Leave Group */}
                        <button
                            onClick={handleLeave}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition"
                            title="Leave group"
                        >
                            <LogOut className="size-4" />
                        </button>

                        {/* Delete Group (admin only) */}
                        {isAdmin && (
                            <button
                                onClick={handleDelete}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition"
                                title="Delete group"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Members Panel (collapsible) */}
                {showMembers && (
                    <div className="mt-3 pt-3 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Members</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {selectedGroup.members?.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition">
                                    <div className="relative">
                                        <div className="size-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            {member.user?.username?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        {onlineUsers.includes(member.userId) ? (
                                            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 bg-green-500 border-2 border-background rounded-full" />
                                        ) : (
                                            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 bg-zinc-500 border-2 border-background rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm font-medium truncate">
                                            {member.user?.username || 'Unknown'}
                                        </span>
                                        {member.isAdmin && (
                                            <Crown className="size-3.5 text-amber-400 shrink-0" />
                                        )}
                                        {member.userId === authUser.id && (
                                            <span className="text-[10px] text-muted-foreground">(you)</span>
                                        )}
                                    </div>
                                    <span className="ml-auto text-[10px] text-muted-foreground">
                                        {onlineUsers.includes(member.userId) ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {groupMessages.map((message) => {
                    const isMine = message.senderId === authUser.id;
                    const senderName = message.sender?.username || 'Unknown';
                    return (
                        <div key={message.id} className={clsx("flex w-full", isMine ? "justify-end" : "justify-start")}>
                            {!isMine && (
                                <div className="size-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-auto" title={senderName}>
                                    {senderName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className={clsx(
                                "max-w-[70%] rounded-2xl p-4 shadow-sm backdrop-blur-sm",
                                isMine ? "bg-indigo-600 font-medium text-white border border-indigo-500/50 rounded-br-none"
                                    : "bg-card text-card-foreground border border-border/50 rounded-bl-none"
                            )}>
                                {/* Name Tag for Group Members */}
                                {!isMine && (
                                    <p className="text-xs font-bold text-indigo-400 mb-1">{senderName}</p>
                                )}
                                <p className="text-[15px] leading-relaxed break-words">{message.content}</p>
                                <p className={clsx("text-[10px] mt-2 text-right opacity-70", isMine ? "text-indigo-200" : "text-muted-foreground")}>
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messageEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background border-t border-border/50 backdrop-blur-lg">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Message group..."
                        className="flex-1 bg-input/20 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!text.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 flex items-center justify-center transition"
                    >
                        <Send className="size-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GroupChatContainer;
