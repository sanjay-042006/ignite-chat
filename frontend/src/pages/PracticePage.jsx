import { useEffect, useRef, useState } from 'react';
import { usePracticeStore } from '../context/usePracticeStore';
import { useAuthStore } from '../context/useAuthStore';
import { BookOpen, Search, XCircle, RefreshCw, Send, CheckCircle2, Sparkles, UserPlus, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { useChatStore } from '../context/useChatStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PracticePage = () => {
    const { status, messages, joinPracticeQueue, leavePracticeQueue, sendMessage, nextMatch, partnerUsername, partnerId } = usePracticeStore();
    const { authUser } = useAuthStore();
    const { sendFriendRequest } = useChatStore();
    const [text, setText] = useState('');
    const messageEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (messageEndRef.current && messages) messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    useEffect(() => { return () => leavePracticeQueue(); }, [leavePracticeQueue]);

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
                <div className="space-y-1.5">
                    <div className="text-[13px] leading-relaxed break-words">{parsed.original}</div>
                    {hasCorrection && (
                        <div className={clsx("text-[12px] p-2 rounded-lg border",
                            isMine ? "bg-white/10 border-white/15" : "bg-sky-500/10 border-sky-500/15 text-sky-300"
                        )}>
                            <div className="flex items-center gap-1 mb-0.5 text-[9px] opacity-70">
                                <CheckCircle2 className="size-2.5" />
                                <span className="font-semibold">AI Corrected</span>
                            </div>
                            <p>{parsed.corrected}</p>
                        </div>
                    )}
                </div>
            );
        } catch (e) {
            return <p className="text-[13px] leading-relaxed break-words">{contentStr}</p>;
        }
    };

    // IDLE
    if (status === 'idle') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
                {/* Back Button */}
                <button onClick={() => navigate('/')}
                    className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-muted-foreground/70 hover:text-foreground text-xs font-medium transition px-2.5 py-1.5 rounded-lg hover:bg-white/5">
                    <ArrowLeft className="size-4" /> Back
                </button>

                <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-sky-500/[0.06] rounded-full blur-[100px] animate-glow-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/[0.04] rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '1s' }} />

                <div className="max-w-sm text-center space-y-6 animate-slide-up relative z-10">
                    <div className="flex justify-center">
                        <div className="size-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-xl shadow-sky-500/20 animate-float">
                            <BookOpen className="size-8 text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-sky-300 to-blue-300 bg-clip-text text-transparent">English Practice</h2>
                        <p className="text-base md:text-sm text-muted-foreground mt-2">Improve your English with real conversations. AI monitors your grammar and provides instant corrections as you chat with a practice partner.</p>
                    </div>
                    <button onClick={joinPracticeQueue}
                        className="w-full py-4 md:py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-base md:text-sm font-bold shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <BookOpen className="size-4 inline mr-1.5 -mt-0.5" />
                        Start Practicing
                    </button>
                </div>
            </div>
        );
    }

    // WAITING
    if (status === 'waiting') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
                {/* Back Button */}
                <button onClick={() => { leavePracticeQueue(); navigate('/'); }}
                    className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-muted-foreground/70 hover:text-foreground text-xs font-medium transition px-2.5 py-1.5 rounded-lg hover:bg-white/5">
                    <ArrowLeft className="size-4" /> Back
                </button>

                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.04] to-transparent" />
                <div className="max-w-sm text-center space-y-6 flex flex-col items-center animate-slide-up relative z-10">
                    <div className="relative">
                        <div className="absolute inset-0 border-2 border-sky-500/30 rounded-full animate-ping" />
                        <div className="size-20 rounded-full bg-sky-500/10 flex items-center justify-center border-2 border-sky-500/30 shadow-[0_0_30px_rgba(14,165,233,0.2)]">
                            <Search className="size-8 text-sky-500 animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Finding a partner...</h2>
                        <p className="text-sm text-muted-foreground mt-1 animate-pulse">Matching you to practice English</p>
                    </div>
                    <button onClick={leavePracticeQueue}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/5 text-sm hover:bg-white/[0.08] transition">
                        <XCircle className="size-4" /> Stop
                    </button>
                </div>
            </div>
        );
    }

    // MATCHED
    return (
        <div className="flex flex-col h-full relative" style={{ background: 'linear-gradient(180deg, rgba(14,165,233,0.02), transparent 30%)' }}>
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="flex items-center gap-3">
                    {/* Back Button */}
                    <button onClick={() => { leavePracticeQueue(); navigate('/'); }}
                        className="size-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition">
                        <ArrowLeft className="size-4" />
                    </button>
                    <div className="size-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-[10px] shadow-md shadow-sky-500/20 ring-2 ring-sky-500/10">
                        {partnerUsername ? partnerUsername.substring(0,2).toUpperCase() : <BookOpen className="size-4" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{partnerUsername || 'Practice Partner'}</h3>
                            {partnerId && (
                                <button onClick={() => {
                                    sendFriendRequest(partnerId);
                                    toast.success(`Friend request sent to ${partnerUsername || 'them'}!`);
                                }} className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition" title="Add Friend">
                                    <UserPlus className="size-3.5" />
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-sky-400/60 font-medium animate-pulse">AI Active ✨</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={nextMatch}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600/80 to-blue-600/80 text-white text-[10px] font-bold shadow-sm transition-all hover:scale-105 active:scale-95">
                        <RefreshCw className="size-3" /> Next
                    </button>
                    <button onClick={leavePracticeQueue}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition">
                        <XCircle className="size-3" /> Stop
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <div className="text-center my-2">
                    <span className="bg-sky-500/5 text-sky-400/60 text-[10px] font-medium py-1 px-3 rounded-full border border-sky-500/10">
                        Grammar auto-corrected by AI ✨
                    </span>
                </div>

                {messages.map((message) => {
                    const isMine = message.senderId === authUser.id;
                    return (
                        <div key={message.id} className={clsx("flex w-full gap-2", isMine ? "justify-end" : "justify-start")}>
                            <div className={clsx("max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm",
                                isMine ? "bg-gradient-to-br from-sky-600/90 to-blue-600/90 text-white rounded-br-sm"
                                    : "bg-white/5 border border-white/5 text-card-foreground rounded-bl-sm"
                            )}>
                                {renderMessageContent(message.content, isMine)}
                                <p className={clsx("text-[9px] mt-1 text-right", isMine ? "text-white/40" : "text-muted-foreground/40")}>
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messageEndRef} />
            </div>

            <div className="p-3 border-t border-white/5 backdrop-blur-xl" style={{ background: 'rgba(0,0,0,0.15)' }}>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input type="text" placeholder="Type in English..."
                        className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/20 transition placeholder:text-muted-foreground/30"
                        value={text} onChange={(e) => setText(e.target.value)} autoFocus />
                    <button type="submit" disabled={!text.trim()}
                        className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl px-3.5 flex items-center justify-center shadow-md shadow-sky-500/20 transition-all disabled:shadow-none">
                        <Send className="size-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PracticePage;
