import { useEffect, useRef, useState } from 'react';
import { useLoveStore } from '../context/useLoveStore';
import { useAuthStore } from '../context/useAuthStore';
import { useSocketStore } from '../context/useSocketStore';
import { Loader2, Send, Heart, Sparkles, Timer, HeartCrack, ShieldCheck, XCircle, ArrowLeft } from 'lucide-react';
import MessageInput from './chat/MessageInput';
import { MediaAttachment } from './chat/MediaAttachment';
import clsx from 'clsx';

const LoveChatContainer = () => {
    const {
        messages, getMessages, isMessagesLoading, selectedConnection, setSelectedConnection,
        subscribeToMessages, unsubscribeFromMessages, sendMessage,
        triggerAIChat, isAIChatActive, aiTimeRemaining,
        initiateBreakup, acceptBreakup, cancelBreakup
    } = useLoveStore();
    const { authUser } = useAuthStore();
    const { onlineUsers } = useSocketStore();
    const [text, setText] = useState('');
    const messageEndRef = useRef(null);

    const partner = selectedConnection?.partner;
    const isBreakingUp = selectedConnection?.status === 'BREAKING_UP';
    const iInitiated = selectedConnection?.breakupInitiatedBy === authUser.id;
    const breakupDeadline = selectedConnection?.breakupInitiatedAt
        ? new Date(new Date(selectedConnection.breakupInitiatedAt).getTime() + 5 * 24 * 60 * 60 * 1000)
        : null;

    // Days remaining
    const daysLeft = breakupDeadline ? Math.max(0, Math.ceil((breakupDeadline - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

    useEffect(() => {
        if (selectedConnection) {
            getMessages(selectedConnection.id);
            subscribeToMessages();
        }
        return () => unsubscribeFromMessages();
    }, [selectedConnection?.id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);



    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full" style={{ background: 'linear-gradient(180deg, rgba(236,72,153,0.02), transparent)' }}>
                <Loader2 className="size-8 animate-spin text-pink-500" />
            </div>
        );
    }

    if (!selectedConnection) return null;

    return (
        <div className="flex flex-col h-full relative" style={{ background: 'linear-gradient(180deg, rgba(236,72,153,0.02), transparent 30%)' }}>

            {/* Compact Header */}
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl"
                style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSelectedConnection(null)}
                        className="md:hidden size-8 shrink-0 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                    >
                        <ArrowLeft className="size-4" />
                    </button>
                    <div className="relative shrink-0">
                        <div className="size-9 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-pink-500/20 ring-2 ring-pink-500/20 shrink-0">
                            {partner.username.charAt(0).toUpperCase()}
                        </div>
                        <span className={clsx("absolute -bottom-0.5 -right-0.5 size-2.5 border-2 border-background rounded-full",
                            onlineUsers.includes(partner.id) ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-zinc-500"
                        )} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">{partner.username}</h3>
                        <p className={clsx("text-[10px] font-medium", isBreakingUp ? "text-red-400" : "text-pink-400/70")}>
                            {isBreakingUp ? `💔 ${daysLeft} days left` : '💕 Love Connection'}
                        </p>
                    </div>
                </div>

                {/* Action buttons row */}
                <div className="flex items-center gap-1.5">
                    {/* AI Chat */}
                    {isAIChatActive ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/20 animate-pulse">
                            <Sparkles className="size-3 text-purple-400" />
                            <span className="text-[11px] font-bold text-purple-300">{aiTimeRemaining}s</span>
                        </div>
                    ) : (
                        <button
                            onClick={triggerAIChat}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold shadow-md shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Sparkles className="size-3" />
                            AI Chat
                        </button>
                    )}

                    {/* Breakup / Cancel buttons in header */}
                    {isBreakingUp ? (
                        iInitiated ? (
                            <button
                                onClick={cancelBreakup}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-[10px] font-bold transition"
                                title="Cancel breakup"
                            >
                                <ShieldCheck className="size-3" />
                                Stay
                            </button>
                        ) : (
                            <button
                                onClick={() => { if (confirm('Accept the breakup? This ends the connection permanently. 💔')) acceptBreakup(); }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-[10px] font-bold transition"
                                title="Accept breakup"
                            >
                                <XCircle className="size-3" />
                                Accept
                            </button>
                        )
                    ) : (
                        <button
                            onClick={() => { if (confirm('Initiate a breakup? Your partner has 5 days to respond. 💔')) initiateBreakup(); }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground/50 hover:text-red-400 transition"
                            title="Breakup"
                        >
                            <HeartCrack className="size-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Breakup Banner (compact) */}
            {isBreakingUp && (
                <div className="px-4 py-2 border-b border-red-500/10 flex items-center gap-2"
                    style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.06), rgba(249,115,22,0.04))' }}>
                    <HeartCrack className="size-3.5 text-red-400 shrink-0" />
                    <p className="text-[11px] text-red-300/80 font-medium">
                        {iInitiated
                            ? `You initiated a breakup · ${daysLeft} days until auto-disconnect`
                            : `${partner.username} wants to break up · ${daysLeft} days left to convince them`
                        }
                    </p>
                </div>
            )}

            {/* AI Chat Banner (compact) */}
            {isAIChatActive && (
                <div className="px-4 py-1.5 border-b border-purple-500/10 text-center"
                    style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.06), rgba(236,72,153,0.06))' }}>
                    <p className="text-[10px] font-medium text-purple-300/80">
                        ✨ AI is chatting as both of you — watch the magic! ✨
                    </p>
                </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="size-14 rounded-full bg-pink-500/5 flex items-center justify-center mb-3">
                            <Heart className="size-7 text-pink-500/20 fill-pink-500/10" />
                        </div>
                        <p className="text-xs text-muted-foreground">Start chatting or try ✨ AI Chat!</p>
                    </div>
                )}

                {messages.map((message) => {
                    const isMine = message.senderId === authUser.id;
                    const senderName = message.sender?.username || '?';
                    return (
                        <div key={message.id} className={clsx("flex w-full gap-2", isMine ? "justify-end" : "justify-start")}>
                            {!isMine && (
                                <div className={clsx(
                                    "size-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-auto shrink-0",
                                    message.isAI ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-sm shadow-purple-500/30" : "bg-gradient-to-br from-pink-500 to-rose-600"
                                )}>
                                    {message.isAI ? '✨' : senderName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className={clsx(
                                "max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm relative",
                                isMine
                                    ? message.isAI
                                        ? "bg-gradient-to-br from-purple-600/90 to-pink-600/90 text-white rounded-br-sm"
                                        : "bg-gradient-to-br from-pink-600/90 to-rose-600/90 text-white rounded-br-sm"
                                    : message.isAI
                                        ? "bg-purple-500/10 border border-purple-500/15 text-card-foreground rounded-bl-sm"
                                        : "bg-white/5 border border-white/5 text-card-foreground rounded-bl-sm"
                            )}>
                                {message.isAI && (
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <Sparkles className={clsx("size-2.5", isMine ? "text-purple-200/80" : "text-purple-400/60")} />
                                        <span className={clsx("text-[9px] font-semibold", isMine ? "text-purple-200/80" : "text-purple-400/60")}>
                                            AI · {senderName}
                                        </span>
                                    </div>
                                )}
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
                {isAIChatActive ? (
                    <div className="text-center py-2 text-[11px] text-purple-300/60 bg-purple-500/5 rounded-xl border border-purple-500/10">
                        <Sparkles className="size-3 inline mr-1 text-purple-400/50" />
                        AI is chatting... sit back and enjoy! ✨
                    </div>
                ) : (
                    <MessageInput onSendMessage={sendMessage} placeholder="Type a message... 💕" disabled={isAIChatActive} />
                )}
            </div>
        </div>
    );
};

export default LoveChatContainer;
