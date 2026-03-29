import { useEffect, useRef, useState } from 'react';
import { useStrangerStore } from '../context/useStrangerStore';
import { useAuthStore } from '../context/useAuthStore';
import { Compass, Send, XCircle, Search, RefreshCw, Sparkles, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import { useChatStore } from '../context/useChatStore';
import toast from 'react-hot-toast';
import MessageInput from '../components/chat/MessageInput';
import { MediaAttachment } from '../components/chat/MediaAttachment';
import { useNavigate } from 'react-router-dom';

const StrangerPage = () => {
    const { status, messages, joinQueue, leaveQueue, nextMatch, sendMessage, partnerUsername, partnerId, iRevealed, partnerRevealed, revealIdentity } = useStrangerStore();
    const { authUser } = useAuthStore();
    const { sendFriendRequest } = useChatStore();
    const [text, setText] = useState('');
    const messageEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (messageEndRef.current && messages) messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    useEffect(() => { return () => leaveQueue(); }, [leaveQueue]);

    // Display name: hidden unless partner revealed
    const displayName = partnerRevealed ? partnerUsername : 'Stranger';
    const displayAvatar = partnerRevealed ? (partnerUsername?.substring(0, 2).toUpperCase() || '??') : '?';

    const handleReveal = () => {
        revealIdentity();
        toast.success('Your identity has been revealed to the stranger!', { icon: '👁️', duration: 3000 });
    };

    // IDLE
    if (status === 'idle') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <button onClick={() => navigate('/')}
                    className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-muted-foreground/70 hover:text-foreground text-xs font-medium transition px-2.5 py-1.5 rounded-lg hover:bg-white/5">
                    <ArrowLeft className="size-4" /> Back
                </button>

                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-orange-500/[0.04] rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '1s' }} />

                <div className="max-w-sm text-center space-y-6 animate-slide-up relative z-10">
                    <div className="flex justify-center">
                        <div className="size-20 md:size-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/20 animate-float">
                            <Compass className="size-8 text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">Stranger Connect</h2>
                        <p className="text-base md:text-sm text-muted-foreground mt-2">Connect with random strangers anonymously. Release your stress, share your thoughts, and make unexpected friendships. Your identity stays hidden until you choose to reveal it.</p>
                    </div>
                    <button onClick={joinQueue}
                        className="w-full py-4 md:py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-base md:text-sm font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <Compass className="size-4 inline mr-1.5 -mt-0.5" />
                        Find a Stranger
                    </button>
                </div>
            </div>
        );
    }

    // WAITING
    if (status === 'waiting') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <button onClick={() => { leaveQueue(); navigate('/'); }}
                    className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-muted-foreground/70 hover:text-foreground text-xs font-medium transition px-2.5 py-1.5 rounded-lg hover:bg-white/5">
                    <ArrowLeft className="size-4" /> Back
                </button>

                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] to-transparent" />
                <div className="max-w-sm text-center space-y-6 flex flex-col items-center animate-slide-up relative z-10">
                    <div className="relative">
                        <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full animate-ping" />
                        <div className="size-20 rounded-full bg-amber-500/10 flex items-center justify-center border-2 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                            <Search className="size-8 text-amber-500 animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Looking for someone...</h2>
                        <p className="text-sm text-muted-foreground mt-1 animate-pulse">Matching you globally</p>
                    </div>
                    <button onClick={leaveQueue}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/5 text-sm hover:bg-white/[0.08] transition">
                        <XCircle className="size-4" /> Stop
                    </button>
                </div>
            </div>
        );
    }

    // MATCHED
    return (
        <div className="flex flex-col h-full relative" style={{ background: 'linear-gradient(180deg, rgba(245,158,11,0.02), transparent 30%)' }}>
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="flex items-center gap-3">
                    <button onClick={() => { leaveQueue(); navigate('/'); }}
                        className="size-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition">
                        <ArrowLeft className="size-4" />
                    </button>
                    <div className="size-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-[10px] shadow-md shadow-amber-500/20 ring-2 ring-amber-500/10">
                        {displayAvatar}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{displayName}</h3>
                            {/* Show Add Friend button only if partner revealed */}
                            {partnerRevealed && partnerId && (
                                <button onClick={() => {
                                    sendFriendRequest(partnerId);
                                    toast.success(`Friend request sent to ${partnerUsername || 'them'}!`);
                                }} className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition" title="Add Friend">
                                    <UserPlus className="size-3.5" />
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-emerald-400/70 font-medium animate-pulse">
                            {partnerRevealed ? 'Identity Revealed' : 'Anonymous'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {/* Reveal Identity Toggle */}
                    <button onClick={handleReveal} disabled={iRevealed}
                        className={clsx(
                            "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all",
                            iRevealed
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 cursor-default"
                                : "bg-gradient-to-r from-violet-600/80 to-purple-600/80 text-white hover:scale-105 active:scale-95"
                        )}>
                        {iRevealed ? <><Eye className="size-3" /> Revealed</> : <><EyeOff className="size-3" /> Reveal Me</>}
                    </button>
                    <button onClick={nextMatch} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600/80 to-orange-600/80 text-white text-[10px] font-bold shadow-sm transition-all hover:scale-105 active:scale-95">
                        <RefreshCw className="size-3" /> Next
                    </button>
                    <button onClick={leaveQueue} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition">
                        <XCircle className="size-3" /> Stop
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <div className="text-center my-2">
                    <span className="bg-amber-500/5 text-amber-400/60 text-[10px] font-medium py-1 px-3 rounded-full border border-amber-500/10">
                        You're chatting anonymously. Tap "Reveal Me" to share your name 🎭
                    </span>
                </div>
                {messages.map((message) => {
                    const isMine = message.senderId === authUser.id;
                    return (
                        <div key={message.id} className={clsx("flex w-full gap-2", isMine ? "justify-end" : "justify-start")}>
                            {!isMine && (
                                <div className="size-6 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-white text-[10px] font-bold mt-auto shrink-0">?</div>
                            )}
                            <div className={clsx("max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                                isMine ? "bg-gradient-to-br from-amber-600/90 to-orange-600/90 text-white rounded-br-sm"
                                    : "bg-white/5 border border-white/5 text-card-foreground rounded-bl-sm"
                            )}>
                                <MediaAttachment message={message} />
                                {message.content && <p className="text-sm md:text-[13px] leading-relaxed break-words">{message.content}</p>}
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
                <MessageInput onSendMessage={sendMessage} placeholder="Message stranger..." />
            </div>
        </div>
    );
};

export default StrangerPage;
