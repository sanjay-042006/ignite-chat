import { useEffect, useRef, useState } from 'react';
import { useGroupStore } from '../context/useGroupStore';
import { useAuthStore } from '../context/useAuthStore';
import { useSocketStore } from '../context/useSocketStore';
import { Loader2, Send, Users, LogOut, Trash2, ChevronDown, ChevronUp, Crown, Camera, ArrowLeft } from 'lucide-react';
import MessageInput from './chat/MessageInput';
import { MediaAttachment } from './chat/MediaAttachment';
import clsx from 'clsx';

const GroupChatContainer = () => {
    const { groupMessages, getGroupMessages, isGroupMessagesLoading, selectedGroup, subscribeToGroupMessages, unsubscribeFromGroupMessages, sendGroupMessage, leaveGroup, deleteGroup, updateGroupProfilePic, setSelectedGroup } = useGroupStore();
    const { authUser } = useAuthStore();
    const { onlineUsers } = useSocketStore();
    const [text, setText] = useState('');
    const [showMembers, setShowMembers] = useState(false);
    const messageEndRef = useRef(null);

    const myMembership = selectedGroup?.members?.find(m => m.userId === authUser.id);
    const isAdmin = myMembership?.isAdmin || false;

    useEffect(() => {
        if (selectedGroup) { getGroupMessages(selectedGroup.id); subscribeToGroupMessages(); }
        return () => unsubscribeFromGroupMessages();
    }, [selectedGroup?.id, getGroupMessages, subscribeToGroupMessages, unsubscribeFromGroupMessages]);

    useEffect(() => {
        if (messageEndRef.current && groupMessages) messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [groupMessages]);



    if (isGroupMessagesLoading) return (
        <div className="flex-1 flex items-center justify-center h-full">
            <Loader2 className="size-8 animate-spin text-violet-500" />
        </div>
    );

    if (!selectedGroup) return null;

    return (
        <div className="flex flex-col h-full relative" style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.02), transparent 30%)' }}>

            {/* Header */}
            <div className="px-4 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))] border-b border-white/5 sticky top-0 z-10 backdrop-blur-xl"
                style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 lg:gap-3">
                        <button onClick={() => setSelectedGroup(null)} className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-white/5 text-muted-foreground mr-1">
                            <ArrowLeft className="size-4" />
                        </button>
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowMembers(!showMembers)}>
                        <div className="relative">
                            {selectedGroup.profilePic ? (
                                <img src={selectedGroup.profilePic} alt={selectedGroup.name} className="size-10 rounded-xl object-cover shadow-md shadow-violet-500/20 ring-2 ring-violet-500/10" />
                            ) : (
                                <div className="size-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20 ring-2 ring-violet-500/10">
                                    <Users className="size-5" />
                                </div>
                            )}
                            
                            {isAdmin && (
                                <label onClick={(e) => e.stopPropagation()} className="absolute -bottom-1 -right-1 size-5 bg-background text-muted-foreground hover:text-foreground rounded-full border border-white/10 shadow-sm flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <Camera className="w-2.5 h-2.5" />
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => updateGroupProfilePic(selectedGroup.id, reader.result);
                                            reader.readAsDataURL(file);
                                        }
                                    }} />
                                </label>
                            )}
                        </div>
                        <div className="flex flex-col items-start transition-opacity hover:opacity-80">
                            <h3 className="font-semibold text-sm flex items-center gap-1">
                                {selectedGroup.name}
                                {showMembers ? <ChevronUp className="size-3 text-muted-foreground" /> : <ChevronDown className="size-3 text-muted-foreground" />}
                            </h3>
                            <p className="text-[10px] text-muted-foreground/50 font-medium">{selectedGroup.members?.length || 0} members</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">

                        <button onClick={() => { if (confirm('Leave this group?')) leaveGroup(selectedGroup.id); }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground/50 hover:text-red-400 transition" title="Leave">
                            <LogOut className="size-3.5" />
                        </button>
                        {isAdmin && (
                            <button onClick={() => { if (confirm(`Delete "${selectedGroup.name}"?`)) deleteGroup(selectedGroup.id); }}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground/50 hover:text-red-400 transition" title="Delete">
                                <Trash2 className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Members Panel */}
                {showMembers && (
                    <div className="mt-2 pt-2 border-t border-white/5 animate-slide-up">
                        <p className="text-[9px] font-bold uppercase text-muted-foreground/40 tracking-widest mb-1.5 ml-0.5">Members</p>
                        <div className="space-y-0.5 max-h-36 overflow-y-auto">
                            {selectedGroup.members?.map((member) => (
                                <div key={member.id} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/[0.03] transition">
                                    <div className="relative shrink-0">
                                        {member.user?.profilePic ? (
                                            <img src={member.user.profilePic} alt={member.user.username} className="size-6 rounded-full object-cover border border-white/10" />
                                        ) : (
                                            <div className="size-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold">
                                                {member.user?.username?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                        )}
                                        <span className={clsx("absolute -bottom-0.5 -right-0.5 size-2 border border-background rounded-full",
                                            onlineUsers.includes(member.userId) ? "bg-emerald-400" : "bg-zinc-600"
                                        )} />
                                    </div>
                                    <span className="text-[11px] font-medium truncate">{member.user?.username || 'Unknown'}</span>
                                    {member.isAdmin && <Crown className="size-3 text-amber-400 shrink-0" />}
                                    {member.userId === authUser.id && <span className="text-[9px] text-muted-foreground/40">(you)</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {groupMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="size-12 rounded-xl bg-violet-500/5 flex items-center justify-center mb-3">
                            <Users className="size-5 text-violet-500/20" />
                        </div>
                        <p className="text-xs text-muted-foreground">Start chatting in {selectedGroup.name}!</p>
                    </div>
                )}

                {groupMessages.map((message) => {
                    const isMine = message.senderId === authUser.id;
                    const senderName = message.sender?.username || 'Unknown';
                    return (
                        <div key={message.id} className={clsx("flex w-full gap-2", isMine ? "justify-end" : "justify-start")}>
                            {!isMine && (
                                <div className="size-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold mt-auto shrink-0" title={senderName}>
                                    {senderName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className={clsx(
                                "max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm",
                                isMine
                                    ? "bg-gradient-to-br from-violet-600/90 to-purple-600/90 text-white rounded-br-sm"
                                    : "bg-white/5 border border-white/5 text-card-foreground rounded-bl-sm"
                            )}>
                                {!isMine && <p className="text-[10px] font-semibold text-violet-400/70 mb-0.5">{senderName}</p>}
                                <MediaAttachment message={message} />
                                {message.content && <p className="text-[13px] leading-relaxed break-words">{message.content}</p>}
                                <p className={clsx("text-[9px] mt-1 text-right", isMine ? "text-white/40" : "text-muted-foreground/40")}>
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messageEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5 backdrop-blur-xl" style={{ background: 'rgba(0,0,0,0.15)' }}>
                <MessageInput onSendMessage={(data) => sendGroupMessage(selectedGroup.id, data)} placeholder="Message group..." />
            </div>
        </div>
    );
};

export default GroupChatContainer;
