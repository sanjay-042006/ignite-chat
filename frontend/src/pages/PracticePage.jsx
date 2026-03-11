import { useEffect, useRef, useState } from 'react';
import { usePracticeStore } from '../context/usePracticeStore';
import { useAuthStore } from '../context/useAuthStore';
import { BookOpen, Search, XCircle, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

const PracticePage = () => {
    const { status, messages, joinPracticeQueue, leavePracticeQueue, sendMessage, nextMatch } = usePracticeStore();
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
        return () => leavePracticeQueue();
    }, [leavePracticeQueue]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() || status !== 'matched') return;

        await sendMessage(text.trim());
        setText('');
    };

    const renderMessageContent = (contentStr, isMine) => {
        try {
            const parsed = JSON.parse(contentStr);
            const hasCorrection = parsed.original !== parsed.corrected || parsed.corrected.includes('✨ [AI Corrected]');

            return (
                <div className="space-y-2">
                    {/* Original Text */}
                    <div className="text-[15px] leading-relaxed break-words opacity-90">
                        {parsed.original}
                    </div>

                    {/* AI Correction */}
                    {hasCorrection && (
                        <div className={clsx(
                            "text-[14px] mt-2 p-2 rounded-lg border",
                            isMine ? "bg-white/10 border-white/20" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        )}>
                            <div className="flex items-center gap-1.5 mb-1 text-xs opacity-70">
                                <CheckCircle2 className="size-3" />
                                <span className="font-semibold">{isMine ? "AI Correction" : "Corrected"}</span>
                            </div>
                            <p>{parsed.corrected}</p>
                        </div>
                    )}
                </div>
            )
        } catch (e) {
            // Fallback if not json
            return <p className="text-[15px] leading-relaxed break-words">{contentStr}</p>
        }
    }

    // Renders

    if (status === 'idle') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-16 bg-background/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent backdrop-blur-3xl -z-10 blur-[100px]" />

                <div className="max-w-md text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="flex justify-center gap-4 mb-8">
                        <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-xl shadow-emerald-500/20 border border-emerald-500/20 glass hover:scale-105 transition-transform cursor-default">
                            <BookOpen className="w-10 h-10 text-emerald-400" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-extrabold tracking-tight">English Practice Mode</h2>
                    <p className="text-muted-foreground">Chat with others to improve your English. Our AI will automatically correct your grammar in real-time.</p>

                    <button
                        onClick={joinPracticeQueue}
                        className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                    >
                        Start Practicing
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'waiting') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-16 bg-background/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent backdrop-blur-3xl -z-10 blur-[100px]" />

                <div className="max-w-md text-center space-y-8 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                        <div className="absolute inset-0 border-[3px] border-emerald-500/30 rounded-full animate-ping" />
                        <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex flex-col items-center justify-center border-2 border-emerald-500/50 glass shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <Search className="w-8 h-8 text-emerald-500 animate-pulse" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">Finding a partner...</h2>
                        <p className="text-muted-foreground animate-pulse">Matching you with someone to practice English</p>
                    </div>

                    <button
                        onClick={leavePracticeQueue}
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
                        <div className="size-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-md border-2 border-background">
                            <BookOpen className="size-5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold">Practice Partner</h3>
                        <p className="text-xs text-emerald-500 animate-pulse">Connected - AI Active</p>
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
                        onClick={leavePracticeQueue}
                        className="bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm font-medium py-1.5 px-4 rounded-lg flex items-center gap-2 transition"
                    >
                        <XCircle className="size-4" /> Stop
                    </button>
                </div>
            </div>

            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-emerald-950/5">
                <div className="text-center my-4">
                    <span className="bg-emerald-500/10 text-emerald-500 text-xs font-medium py-1.5 px-4 rounded-full border border-emerald-500/20">
                        You are now connected. Grammar mistakes will be auto-corrected.
                    </span>
                </div>

                {messages.map((message) => {
                    const isMine = message.senderId === authUser.id;
                    return (
                        <div key={message.id} className={clsx("flex w-full block", isMine ? "justify-end" : "justify-start")}>
                            <div className={clsx(
                                "max-w-[75%] md:max-w-[60%] rounded-2xl p-4 shadow-sm backdrop-blur-sm",
                                isMine ? "bg-emerald-600 font-medium text-white border border-emerald-500/50 rounded-br-none"
                                    : "bg-card text-card-foreground border border-border/50 rounded-bl-none"
                            )}>
                                {renderMessageContent(message.content, isMine)}
                                <p className={clsx("text-[10px] mt-2 text-right opacity-70", isMine ? "text-emerald-200" : "text-muted-foreground")}>
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
                        placeholder="Type in English..."
                        className="flex-1 bg-input/20 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!text.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 flex items-center justify-center transition"
                    >
                        <Send className="size-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PracticePage;
