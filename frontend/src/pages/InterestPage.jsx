import { useEffect, useRef, useState } from 'react';
import { useInterestStore } from '../context/useInterestStore';
import { useAuthStore } from '../context/useAuthStore';
import { Ghost, Loader2, Send, LogOut, Code, Briefcase, Gamepad2, Heart, Music, Plane } from 'lucide-react';
import clsx from 'clsx';

const TOPICS = [
    { id: 'Coding', icon: Code, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'Business', icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'Gaming', icon: Gamepad2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'Dating', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { id: 'Music', icon: Music, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { id: 'Travel', icon: Plane, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
];

const InterestPage = () => {
    const { activeRoom, messages, isJoining, joinInterestRoom, leaveRoom, getMessages, subscribeToMessages, unsubscribeFromMessages, sendMessage, nextMatch } = useInterestStore();
    const { authUser } = useAuthStore();
    const [text, setText] = useState('');
    const messageEndRef = useRef(null);

    // Auto scroll
    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Handle active room mount/unmount subscriptions
    useEffect(() => {
        if (activeRoom) {
            getMessages(activeRoom.roomId);
            subscribeToMessages();
        }
        return () => unsubscribeFromMessages();
    }, [activeRoom?.roomId, getMessages, subscribeToMessages, unsubscribeFromMessages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() || !activeRoom) return;

        await sendMessage(text.trim());
        setText('');
    };

    // Renders

    if (!activeRoom) {
        return (
            <div className="w-full h-full flex flex-col p-6 lg:p-12 bg-background/50 relative overflow-y-auto">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-blue-500/5 to-transparent backdrop-blur-3xl -z-10 blur-[100px]" />

                <div className="max-w-4xl mx-auto w-full space-y-10 animate-in fade-in zoom-in duration-500 mt-10">
                    <div className="text-center space-y-4">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center shadow-xl shadow-cyan-500/20 border border-cyan-500/20 glass">
                                <Ghost className="w-10 h-10 text-cyan-400" />
                            </div>
                        </div>
                        <h2 className="text-4xl font-extrabold tracking-tight">Interest Rooms</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Join temporary, topic-based anonymous groups. Identities are hidden. Rooms expire after 1 hour of inactivity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {TOPICS.map((topic) => (
                            <button
                                key={topic.id}
                                disabled={isJoining}
                                onClick={() => joinInterestRoom(topic.id)}
                                className="group flex flex-col items-center justify-center p-8 rounded-3xl glass hover:bg-white/5 border border-white/5 hover:border-white/20 transition-all hover:scale-[1.02]"
                            >
                                <div className={clsx("w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110", topic.bg)}>
                                    <topic.icon className={clsx("w-8 h-8", topic.color)} />
                                </div>
                                <h3 className="text-xl font-bold">{topic.id}</h3>
                                <p className="text-sm text-muted-foreground mt-2">Join global chat</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ACTIVE ROOM VIEW
    return (
        <div className="flex flex-col h-full bg-background/50 relative w-full border-l border-border/50">
            {/* Top Header */}
            <div className="px-6 py-4 glass border-b border-white/5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md border-2 border-background">
                        <Ghost className="size-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">{activeRoom.topic} Room</h3>
                        <p className="text-xs text-cyan-400 animate-pulse">Anonymous Area</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={nextMatch}
                        disabled={isJoining}
                        className="bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 text-sm font-medium py-2 px-4 rounded-xl flex items-center gap-2 transition disabled:opacity-50"
                    >
                        {isJoining ? <Loader2 className="size-4 animate-spin" /> : <Ghost className="size-4" />} Next Group
                    </button>
                    <button
                        onClick={leaveRoom}
                        className="bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm font-medium py-2 px-4 rounded-xl flex items-center gap-2 transition"
                    >
                        <LogOut className="size-4" /> Leave
                    </button>
                </div>
            </div>

            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="text-center my-4">
                    <span className="bg-cyan-500/10 text-cyan-500 text-xs font-medium py-1.5 px-4 rounded-full border border-cyan-500/20">
                        You are now in the {activeRoom.topic} room. Everyone is anonymous.
                    </span>
                </div>

                {messages.map((message) => {
                    const isMine = message.senderId === authUser.id;

                    // We hide actual names in Interest mode unless we implemented Alias generation
                    const displayName = isMine ? 'You' : `Anonym_${message.senderId.substring(0, 4)}`;

                    return (
                        <div key={message.id} className={clsx("flex w-full", isMine ? "justify-end" : "justify-start")}>
                            {!isMine && (
                                <div className="size-8 rounded-full bg-zinc-700 flex items-center justify-center text-white text-xs font-bold mr-2 mt-auto" title={displayName}>
                                    <Ghost className="size-4 opacity-50" />
                                </div>
                            )}
                            <div className={clsx(
                                "max-w-[70%] rounded-2xl p-4 shadow-sm backdrop-blur-sm",
                                isMine ? "bg-cyan-600 font-medium text-white border border-cyan-500/50 rounded-br-none"
                                    : "bg-card text-card-foreground border border-border/50 rounded-bl-none"
                            )}>
                                {!isMine && (
                                    <p className="text-xs font-bold text-cyan-400 mb-1">{displayName}</p>
                                )}
                                <p className="text-[15px] leading-relaxed break-words">{message.content}</p>
                                <p className={clsx("text-[10px] mt-2 text-right opacity-70", isMine ? "text-cyan-200" : "text-muted-foreground")}>
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
                        placeholder={`Message ${activeRoom.topic} anonymously...`}
                        className="flex-1 bg-input/20 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!text.trim()}
                        className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 flex items-center justify-center transition"
                    >
                        <Send className="size-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InterestPage;
