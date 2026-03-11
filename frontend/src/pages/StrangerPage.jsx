import { useEffect, useRef, useState } from 'react';
import { useStrangerStore } from '../context/useStrangerStore';
import { useAuthStore } from '../context/useAuthStore';
import { Compass, Loader2, Send, XCircle, Search, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const StrangerPage = () => {
    const { status, messages, joinQueue, leaveQueue, nextMatch, sendMessage } = useStrangerStore();
    const { authUser } = useAuthStore();
    const [text, setText] = useState('');
    const messageEndRef = useRef(null);

    // Auto scroll
    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Cleanup on unmount
    useEffect(() => {
        return () => leaveQueue();
    }, [leaveQueue]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() || status !== 'matched') return;

        await sendMessage(text.trim());
        setText('');
    };

    // Renders

    if (status === 'idle') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-16 bg-background/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-rose-500/5 to-transparent backdrop-blur-3xl -z-10 blur-[100px]" />

                <div className="max-w-md text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="flex justify-center gap-4 mb-8">
                        <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center animate-bounce shadow-xl shadow-rose-500/20 border border-rose-500/20 glass">
                            <Compass className="w-10 h-10 text-rose-500" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-extrabold tracking-tight">Stranger Connect</h2>
                    <p className="text-muted-foreground">Talk to random people anonymously. Your identity is completely hidden.</p>

                    <button
                        onClick={joinQueue}
                        className="mt-8 bg-rose-600 hover:bg-rose-700 text-white font-medium py-3 px-8 rounded-xl shadow-lg shadow-rose-500/30 transition-all hover:scale-105"
                    >
                        Find a Stranger
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'waiting') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-16 bg-background/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-rose-500/5 to-transparent backdrop-blur-3xl -z-10 blur-[100px]" />

                <div className="max-w-md text-center space-y-8 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                        {/* Radar Pulse Effect */}
                        <div className="absolute inset-0 border-[3px] border-rose-500/30 rounded-full animate-ping" />
                        <div className="absolute inset-0 border-[2px] border-rose-400/20 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
                        <div className="w-24 h-24 rounded-full bg-rose-500/20 flex flex-col items-center justify-center border-2 border-rose-500/50 glass shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                            <Search className="w-8 h-8 text-rose-500 animate-pulse" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">Looking for someone...</h2>
                        <p className="text-muted-foreground animate-pulse">Matching you with a random stranger globally</p>
                    </div>

                    <button
                        onClick={leaveQueue}
                        className="mt-8 flex items-center justify-center gap-2 bg-card border border-border hover:bg-white/5 text-foreground py-2 px-6 rounded-lg transition-all"
                    >
                        <XCircle className="size-4" /> Stop Searching
                    </button>
                </div>
            </div>
        )
    }

    // MATCHED VIEW
    return (
        <div className="flex flex-col h-full bg-background/50 relative w-full border-l border-border/50">
            {/* Top Header */}
            <div className="px-6 py-4 glass border-b border-white/5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="size-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white font-bold shadow-md border-2 border-background">
                            ?
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold">Stranger</h3>
                        <p className="text-xs text-green-500 animate-pulse">Connected</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={nextMatch}
                        className="bg-card border border-border hover:bg-white/5 text-sm font-medium py-1.5 px-4 rounded-lg flex items-center gap-2 transition"
                    >
                        <RefreshCw className="size-4" /> Next
                    </button>
                    <button
                        onClick={leaveQueue}
                        className="bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm font-medium py-1.5 px-4 rounded-lg flex items-center gap-2 transition"
                    >
                        <XCircle className="size-4" /> Stop
                    </button>
                </div>
            </div>

            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="text-center my-4">
                    <span className="bg-white/5 text-xs text-muted-foreground font-medium py-1 px-3 rounded-full border border-white/10">
                        You are now chatting with a random stranger. Say Hi!
                    </span>
                </div>

                {messages.map((message) => {
                    const isMine = message.senderId === authUser.id;
                    return (
                        <div key={message.id} className={clsx("flex w-full", isMine ? "justify-end" : "justify-start")}>
                            <div className={clsx(
                                "max-w-[70%] rounded-2xl p-4 shadow-sm backdrop-blur-sm",
                                isMine ? "bg-rose-600 font-medium text-white border border-rose-500/50 rounded-br-none"
                                    : "bg-zinc-800 text-zinc-100 border border-zinc-700/50 rounded-bl-none"
                            )}>
                                <p className="text-[15px] leading-relaxed break-words">{message.content}</p>
                                <p className={clsx("text-[10px] mt-2 text-right opacity-70", isMine ? "text-rose-200" : "text-zinc-400")}>
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
                        placeholder="Message stranger..."
                        className="flex-1 bg-input/20 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!text.trim()}
                        className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 flex items-center justify-center transition"
                    >
                        <Send className="size-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StrangerPage;
