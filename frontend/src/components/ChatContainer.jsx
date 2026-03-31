import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../context/useChatStore';
import { useAuthStore } from '../context/useAuthStore';
import { useSocketStore } from '../context/useSocketStore';
import { Loader2, Send, UserPlus, Reply, ArrowLeft } from 'lucide-react';
import MessageInput from './chat/MessageInput';
import { MediaAttachment } from './chat/MediaAttachment';
import SwipeableMessage from './chat/SwipeableMessage';
import ProfilePhotoViewer from './chat/ProfilePhotoViewer';
import { resolveUrl } from '../lib/utils';
import clsx from 'clsx';

const ChatContainer = () => {
    const { messages, getMessages, isMessagesLoading, selectedUser, setSelectedUser, subscribeToMessages, unsubscribeFromMessages, sendMessage } = useChatStore();
    const { authUser } = useAuthStore();
    const { onlineUsers } = useSocketStore();
    const [text, setText] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [viewingPhoto, setViewingPhoto] = useState(null);
    const messageEndRef = useRef(null);

    // Find the last read message sent by me
    const lastReadMessageId = [...messages].reverse().find(m => m.senderId === authUser.id && m.isRead)?.id;

    useEffect(() => {
        getMessages(selectedUser.id);
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [selectedUser.id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full">
                <Loader2 className="size-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative" style={{ background: 'linear-gradient(180deg, rgba(59,130,246,0.02), transparent 30%)' }}>

            {/* Profile Photo Viewer */}
            {viewingPhoto && (
                <ProfilePhotoViewer
                    src={viewingPhoto.src}
                    alt={viewingPhoto.alt}
                    onClose={() => setViewingPhoto(null)}
                />
            )}

            {/* Header */}
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-3 sticky top-0 z-10 backdrop-blur-xl"
                style={{ background: 'rgba(0,0,0,0.2)' }}>
                <button
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden size-8 shrink-0 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                >
                    <ArrowLeft className="size-4" />
                </button>
                <div
                    className="relative cursor-pointer shrink-0"
                    onClick={() => selectedUser.profilePic && setViewingPhoto({ src: resolveUrl(selectedUser.profilePic), alt: selectedUser.username })}
                >
                    <div className="size-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20 ring-2 ring-blue-500/10 overflow-hidden">
                        {selectedUser.profilePic ? (
                            <img src={resolveUrl(selectedUser.profilePic)} alt={selectedUser.username} className="w-full h-full object-cover" />
                        ) : (
                            selectedUser.username.charAt(0).toUpperCase()
                        )}
                    </div>
                    <span className={clsx("absolute -bottom-0.5 -right-0.5 size-2.5 border-2 border-background rounded-full",
                        onlineUsers.includes(selectedUser.id) ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-zinc-600"
                    )} />
                </div>
                <div>
                    <h3 className="font-semibold text-sm">{selectedUser.username}</h3>
                    <p className={clsx("text-[10px] font-medium", onlineUsers.includes(selectedUser.id) ? "text-emerald-400/70" : "text-muted-foreground/50")}>
                        {onlineUsers.includes(selectedUser.id) ? 'Online' : 'Offline'}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="size-12 rounded-full bg-blue-500/5 flex items-center justify-center mb-3">
                            <Send className="size-5 text-blue-500/20" />
                        </div>
                        <p className="text-xs text-muted-foreground">Start chatting with {selectedUser.username}!</p>
                    </div>
                )}

                {messages.map((message) => {
                    const isMine = message.senderId === authUser.id;
                    return (
                        <SwipeableMessage
                            key={message.id}
                            isMine={isMine}
                            onReply={() => setReplyTo(message)}
                        >
                            <div className={clsx("flex w-full gap-2", isMine ? "justify-end" : "justify-start")}>
                                {!isMine && (
                                    <div
                                        className="size-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-[10px] font-bold mt-auto shrink-0 overflow-hidden cursor-pointer"
                                        onClick={() => selectedUser.profilePic && setViewingPhoto({ src: resolveUrl(selectedUser.profilePic), alt: selectedUser.username })}
                                    >
                                        {selectedUser.profilePic ? (
                                            <img src={resolveUrl(selectedUser.profilePic)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            selectedUser.username.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                )}
                                <div className={clsx(
                                    "max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm",
                                    isMine
                                        ? "bg-gradient-to-br from-blue-600/90 to-cyan-600/90 text-white rounded-br-sm"
                                        : "bg-white/5 border border-white/5 text-card-foreground rounded-bl-sm"
                                )}>
                                    {/* Reply-to preview */}
                                    {message.replyTo && (
                                        <div className={clsx(
                                            "flex items-start gap-1.5 mb-1.5 pb-1.5 border-b",
                                            isMine ? "border-white/20" : "border-white/10"
                                        )}>
                                            <Reply className={clsx("size-3 mt-0.5 shrink-0", isMine ? "text-blue-200/60" : "text-blue-400/50")} />
                                            <p className={clsx("text-[11px] truncate", isMine ? "text-blue-100/60" : "text-muted-foreground/60")}>
                                                {message.replyTo.content || (message.replyTo.mediaUrl ? '📎 Media' : '...')}
                                            </p>
                                        </div>
                                    )}
                                    <MediaAttachment message={message} />
                                    {message.content && <p className="text-[13px] leading-relaxed break-words">{message.content}</p>}
                                    <p className={clsx("text-[9px] mt-1 text-right", isMine ? "text-white/40" : "text-muted-foreground/40")}>
                                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            {isMine && message.id === lastReadMessageId && (
                                <div className="flex justify-end pr-1 mt-0.5 animate-in fade-in slide-in-from-top-1">
                                    <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                                        <ArrowLeft className="size-2.5 rotate-180" /> Seen
                                    </span>
                                </div>
                            )}
                        </SwipeableMessage>
                    );
                })}
                <div ref={messageEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5 backdrop-blur-xl" style={{ background: 'rgba(0,0,0,0.15)' }}>
                {selectedUser.friendshipStatus === 'FRIEND' ? (
                    <MessageInput
                        onSendMessage={sendMessage}
                        placeholder="Type a message..."
                        replyTo={replyTo}
                        onCancelReply={() => setReplyTo(null)}
                    />
                ) : selectedUser.friendshipStatus === 'PENDING_SENT' ? (
                    <div className="text-center py-2 text-[11px] text-muted-foreground/60 bg-white/[0.02] rounded-xl border border-white/5">
                        Friend request pending...
                    </div>
                ) : selectedUser.friendshipStatus === 'PENDING_RECEIVED' ? (
                    <div className="flex gap-2 justify-center py-1.5">
                        <button onClick={() => useChatStore.getState().acceptFriendRequest(selectedUser.requestId)}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            Accept Request
                        </button>
                        <button onClick={() => useChatStore.getState().rejectFriendRequest(selectedUser.requestId)}
                            className="bg-red-500/10 text-red-400 text-xs font-semibold py-2 px-4 rounded-xl hover:bg-red-500/20 transition">
                            Reject
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-center py-1.5">
                        <button onClick={() => useChatStore.getState().sendFriendRequest(selectedUser.id)}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-semibold py-2 px-5 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <UserPlus className="size-3.5" />
                            Add Friend
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatContainer;
