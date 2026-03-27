import { useEffect, useRef, useState } from 'react';
import { useInterestStore } from '../context/useInterestStore';
import { useAuthStore } from '../context/useAuthStore';
import { Ghost, Loader2, Send, LogOut, Code, Briefcase, Gamepad2, Heart, Music, Plane, UserPlus } from 'lucide-react';
import clsx from 'clsx';
import { useChatStore } from '../context/useChatStore';
import toast from 'react-hot-toast';
import MessageInput from '../components/chat/MessageInput';
import { MediaAttachment } from '../components/chat/MediaAttachment';

const TOPICS = [
    { id: 'Coding', icon: Code, color: 'from-blue-500 to-cyan-500' },
    { id: 'Business', icon: Briefcase, color: 'from-emerald-500 to-teal-500' },
    { id: 'Gaming', icon: Gamepad2, color: 'from-violet-500 to-purple-500' },
    { id: 'Dating', icon: Heart, color: 'from-pink-500 to-rose-500' },
    { id: 'Music', icon: Music, color: 'from-fuchsia-500 to-pink-500' },
    { id: 'Travel', icon: Plane, color: 'from-sky-500 to-blue-500' },
];

const InterestPage = () => {
    const { activeRoom, messages, isJoining, joinInterestRoom, leaveRoom, getMessages, subscribeToMessages, unsubscribeFromMessages, sendMessage, nextMatch } = useInterestStore();
    const { authUser } = useAuthStore();
    const { sendFriendRequest } = useChatStore();
    const [text, setText] = useState('');
    const messageEndRef = useRef(null);

    useEffect(() => {
        if (messageEndRef.current && messages) messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (activeRoom) { getMessages(activeRoom.roomId); subscribeToMessages(); }
        return () => unsubscribeFromMessages();
    }, [activeRoom?.roomId, getMessages, subscribeToMessages, unsubscribeFromMessages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() || !activeRoom) return;
        await sendMessage(text.trim());
        setText('');
    };

    // TOPIC SELECTION
    if (!activeRoom) {
        return (
            <div className="w-full h-full flex flex-col p-4 lg:p-10 relative overflow-y-auto pb-20 md:pb-8">
                <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-emerald-500/[0.04] rounded-full blur-[100px] animate-glow-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-teal-500/[0.03] rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '1s' }} />

                <div className="max-w-3xl mx-auto w-full space-y-8 animate-slide-up relative z-10 mt-6">
                    <div className="text-center space-y-3">
                        <div className="flex justify-center">
                            <div className="size-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-float">
                                <Ghost className="size-7 text-white" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Interest Rooms</h2>
                            <p className="text-base md:text-sm text-muted-foreground mt-2">Join topic-based rooms and chat anonymously with people who share your interests.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {TOPICS.map((topic) => (
                            <button key={topic.id} disabled={isJoining} onClick={() => joinInterestRoom(topic.id)}
                                className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50">
                                <div className={`size-12 rounded-xl bg-gradient-to-br ${topic.color} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                                    <topic.icon className="size-6 text-white" />
                                </div>
                                <h3 className="text-sm font-bold">{topic.id}</h3>
                                <p className="text-[10px] text-muted-foreground/50 mt-0.5">Join room</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ACTIVE ROOM
    return (
        <div className="flex flex-col h-full relative pb-16 md:pb-0" style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.02), transparent 30%)' }}>
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/10">
                        <Ghost className="size-4" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">{activeRoom.topic} Room</h3>
                        <p className="text-[10px] text-emerald-400/60 font-medium">Anonymous</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={nextMatch} disabled={isJoining}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600/80 to-teal-600/80 text-white text-[10px] font-bold shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
                        {isJoining ? <Loader2 className="size-3 animate-spin" /> : <Ghost className="size-3" />} Next
                    </button>
                    <button onClick={leaveRoom}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition">
                        <LogOut className="size-3" /> Leave
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <div className="text-center my-2">
                    <span className="bg-emerald-500/5 text-emerald-400/60 text-[10px] font-medium py-1 px-3 rounded-full border border-emerald-500/10">
                        Anonymous {activeRoom.topic} room 🎭
                    </span>
                </div>

                {messages.map((message) => {
                    const isMine = message.senderId === authUser.id;
                    const displayName = isMine ? 'You' : (message.sender?.username || 'Unknown');
                    return (
                        <div key={message.id} className={clsx("flex w-full gap-2", isMine ? "justify-end" : "justify-start")}>
                            {!isMine && (
                                <div className="size-6 rounded-full bg-zinc-700 flex items-center justify-center text-white mt-auto shrink-0 font-bold text-[8px]">
                                    {displayName.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div className={clsx("max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm",
                                isMine ? "bg-gradient-to-br from-emerald-600/90 to-teal-600/90 text-white rounded-br-sm"
                                    : "bg-white/5 border border-white/5 text-card-foreground rounded-bl-sm"
                            )}>
                                {!isMine && (
                                    <button onClick={() => {
                                        sendFriendRequest(message.senderId);
                                        toast.success(`Friend request sent to ${displayName}!`);
                                    }} className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400/80 hover:text-emerald-300 transition mb-0.5 group" title="Add Friend">
                                        {displayName}
                                        <UserPlus className="size-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
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

            <div className="p-3 border-t border-white/5 backdrop-blur-xl" style={{ background: 'rgba(0,0,0,0.15)' }}>
                <MessageInput onSendMessage={sendMessage} placeholder={`Message ${activeRoom.topic} anonymously...`} />
            </div>
        </div>
    );
};

export default InterestPage;
