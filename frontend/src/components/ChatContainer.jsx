import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../context/useChatStore';
import { useAuthStore } from '../context/useAuthStore';
import { useSocketStore } from '../context/useSocketStore';
import { Loader2, Send } from 'lucide-react';
import clsx from 'clsx';

const ChatContainer = () => {
    const { messages, getMessages, isMessagesLoading, selectedUser, subscribeToMessages, unsubscribeFromMessages, sendMessage } = useChatStore();
    const { authUser } = useAuthStore();
    const { onlineUsers } = useSocketStore();
    const [text, setText] = useState('');
    const messageEndRef = useRef(null);

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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        await sendMessage({ text: text.trim() });
        setText('');
    };

    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-background/50 h-full">
                <Loader2 className="size-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background/50 relative">
            {/* Top Header */}
            <div className="px-6 py-4 glass border-b border-white/5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="size-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md border-2 border-background">
                            {selectedUser.username.charAt(0).toUpperCase()}
                        </div>
                        {onlineUsers.includes(selectedUser.id) && (
                            <span className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-background rounded-full drop-shadow-sm"></span>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold">{selectedUser.username}</h3>
                        <p className="text-xs text-muted-foreground">{onlineUsers.includes(selectedUser.id) ? 'Online' : 'Offline'}</p>
                    </div>
                </div>
            </div>

            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((message) => {
                    const isMine = message.senderId === authUser.id;
                    return (
                        <div key={message.id} className={clsx("flex w-full", isMine ? "justify-end" : "justify-start")}>
                            {!isMine && (
                                <div className="size-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-auto">
                                    {selectedUser.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className={clsx(
                                "max-w-[70%] rounded-2xl p-4 shadow-sm backdrop-blur-sm",
                                isMine ? "bg-indigo-600 font-medium text-white border border-indigo-500/50 rounded-br-none"
                                    : "bg-card text-card-foreground border border-border/50 rounded-bl-none"
                            )}>
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

            {/* Input Area or Friendship Action */}
            <div className="p-4 bg-background border-t border-border/50 backdrop-blur-lg">
                {selectedUser.friendshipStatus === 'FRIEND' ? (
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Type a message..."
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
                ) : selectedUser.friendshipStatus === 'PENDING_SENT' ? (
                    <div className="text-center py-2 text-muted-foreground bg-white/5 rounded-xl border border-white/5">
                        Friend request pending...
                    </div>
                ) : selectedUser.friendshipStatus === 'PENDING_RECEIVED' ? (
                    <div className="flex gap-4 justify-center py-2">
                        <button
                            onClick={() => useChatStore.getState().acceptFriendRequest(selectedUser.requestId)}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-xl transition shadow-lg shadow-green-500/20"
                        >
                            Accept Request
                        </button>
                        <button
                            onClick={() => useChatStore.getState().rejectFriendRequest(selectedUser.requestId)}
                            className="bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium py-2 px-6 rounded-xl transition"
                        >
                            Reject
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-center py-2">
                        <button
                            onClick={() => useChatStore.getState().sendFriendRequest(selectedUser.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-8 rounded-xl transition shadow-lg shadow-indigo-500/30"
                        >
                            Add Friend to Chat
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatContainer;
