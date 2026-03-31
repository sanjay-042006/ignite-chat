import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStoryStore } from '../context/useStoryStore';
import { useAuthStore } from '../context/useAuthStore';
import { Loader2, ArrowLeft, Trophy, BookOpen, Clock, CalendarDays, User, Send, Timer, Users, PenLine, UserPlus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useChatStore } from '../context/useChatStore';
import toast from 'react-hot-toast';

const StoryDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchStoryDetails, focusedStory, isFocusedLoading, activeStory, contribute, isContributing, getCurrentTurnUserId, getCurrentTurnUsername, deleteStoryGroup } = useStoryStore();
    const { authUser } = useAuthStore();
    const { sendFriendRequest } = useChatStore();
    const [text, setText] = useState('');

    useEffect(() => { 
        if (id) fetchStoryDetails(id); 
    }, [id, fetchStoryDetails]);

    // Handle sudden deletion from websockets
    useEffect(() => {
        if (!isFocusedLoading && !focusedStory) {
            // Because if it got deleted, `focusedStory` is set to null in Zustand hook.
            const timeout = setTimeout(() => navigate('/library'), 100);
            return () => clearTimeout(timeout);
        }
    }, [focusedStory, isFocusedLoading, navigate]);

    // Countdown timer for active stories
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
        if (!focusedStory || focusedStory.status !== 'ACTIVE') return;

        const updateTimer = () => {
            const end = new Date(focusedStory.endDate).getTime();
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft('Completing...');
                return;
            }

            const hours = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            
            if (hours > 0) {
                setTimeLeft(`${hours}h ${mins}m`);
            } else {
                setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [focusedStory]);

    const handleContribute = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        await contribute(text.trim());
        setText('');
    };

    if (isFocusedLoading || !focusedStory) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full">
                <Loader2 className="size-8 animate-spin text-fuchsia-500 mb-3" />
                <p className="text-xs text-muted-foreground animate-pulse">Loading story...</p>
            </div>
        );
    }

    const isActive = focusedStory.status === 'ACTIVE';
    const isEvaluating = focusedStory.status === 'EVALUATING';
    const isCompleted = focusedStory.status === 'COMPLETED';
    const isMyActiveStory = activeStory?.id === focusedStory.id;
    const winnerResult = focusedStory.results?.[0];
    const globalResult = focusedStory.globalResults?.[0];

    // Turn logic
    const currentTurnUserId = isMyActiveStory ? getCurrentTurnUserId() : null;
    const currentTurnUsername = isMyActiveStory ? getCurrentTurnUsername() : null;
    const isMyTurn = currentTurnUserId && authUser?.id === currentTurnUserId;

    // Members list (for showing order)
    const members = isMyActiveStory ? activeStory.members : focusedStory.members;
    const entries = isMyActiveStory ? activeStory.entries : focusedStory.entries;

    // Permissions
    const isCreator = members && members.length > 0 && members[0].userId === authUser?.id;

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to permanently delete this story group?")) return;
        const success = await deleteStoryGroup(focusedStory.id);
        if (success) navigate('/library');
    };

    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden pb-16 md:pb-0">
            <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-fuchsia-500/[0.04] rounded-full blur-[100px] animate-glow-pulse" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-pink-500/[0.03] rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '1s' }} />

            {/* Header */}
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <button onClick={() => navigate('/library')}
                    className="flex items-center gap-1.5 text-muted-foreground/70 hover:text-foreground text-xs font-medium transition px-2.5 py-1.5 rounded-lg hover:bg-white/5">
                    <ArrowLeft className="size-3.5" /> Library
                </button>
                <div className="flex items-center gap-1.5">
                    {focusedStory.isGlobalWinner && (
                        <span className="bg-amber-500/15 text-amber-400 text-[9px] font-bold py-1 px-2.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                            <Trophy className="size-2.5" /> Winner
                        </span>
                    )}
                    {isActive && timeLeft && (
                        <span className={clsx("text-[9px] font-bold py-1 px-2.5 rounded-full border flex items-center gap-1",
                            timeLeft === 'Completing...' ? "bg-amber-500/10 text-amber-400 border-amber-500/15 animate-pulse" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/15"
                        )}>
                            <Timer className="size-2.5" /> {timeLeft}
                        </span>
                    )}
                    <span className={clsx("text-[9px] font-bold py-1 px-2.5 rounded-full border flex items-center gap-1",
                        isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15"
                            : isEvaluating ? "bg-amber-500/10 text-amber-400 border-amber-500/15"
                                : "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/15"
                    )}>
                        <Clock className="size-2.5" /> {focusedStory.status}
                    </span>
                    {isCreator && (
                        <button 
                            onClick={handleDelete}
                            className="ml-1 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors shadow-sm"
                            title="Delete Story Group"
                        >
                            <Trash2 className="size-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full relative z-10">
                <div className="max-w-3xl mx-auto p-5 lg:p-8 space-y-8 animate-slide-up">

                    {/* Story Header */}
                    <div className="text-center space-y-4 pt-2">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center mx-auto shadow-lg shadow-fuchsia-500/20">
                            <BookOpen className="size-6 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{focusedStory.title || "The Unwritten Tale"}</h1>
                        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5">
                                <span className="size-1.5 rounded-full bg-fuchsia-400 animate-pulse" /> {focusedStory.genre}
                            </span>
                            <span className="flex items-center gap-1 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5">
                                <CalendarDays className="size-3" /> {new Date(focusedStory.startDate).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Member Order — shows the writing rotation */}
                    {members && members.length > 0 && isActive && (
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-xs font-bold mb-3 flex items-center gap-1.5 text-fuchsia-400/80">
                                <Users className="size-3.5" /> Writing Order
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {members.map((member, idx) => {
                                    const isTurn = currentTurnUserId === member.user.id;
                                    const isMe = authUser?.id === member.user.id;
                                    return (
                                        <div key={member.id}
                                            className={clsx(
                                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all",
                                                isTurn
                                                    ? "bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30 text-fuchsia-300 shadow-md shadow-fuchsia-500/10 scale-105"
                                                    : "bg-white/[0.02] border-white/5 text-muted-foreground/60"
                                            )}>
                                            <span className={clsx(
                                                "size-5 rounded-full flex items-center justify-center text-[9px] font-bold",
                                                isTurn ? "bg-fuchsia-500 text-white" : "bg-white/10 text-muted-foreground/50"
                                            )}>{idx + 1}</span>
                                            <span className="flex items-center gap-1 group/friend">
                                                {member.user.username}
                                                {!isMe && (
                                                    <button onClick={(e) => {
                                                        e.stopPropagation();
                                                        sendFriendRequest(member.userId);
                                                        toast.success(`Friend request sent to ${member.user.username}!`);
                                                    }} className="opacity-0 group-hover/friend:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10 text-fuchsia-300" title="Add Friend">
                                                        <UserPlus className="size-3" />
                                                    </button>
                                                )}
                                            </span>
                                            {isMe && <span className="text-[8px] text-fuchsia-400/60">(you)</span>}
                                            {isTurn && <PenLine className="size-3 text-fuchsia-400 animate-pulse" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Global AI Review */}
                    {globalResult && (
                        <div className="p-5 rounded-2xl border border-amber-500/15 relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(249,115,22,0.03))' }}>
                            <Trophy className="absolute top-3 right-3 size-12 text-amber-500/[0.06]" />
                            <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                                <Trophy className="size-3.5" /> Global Judging
                            </h3>
                            <p className="text-xs text-foreground/60 italic mb-3 leading-relaxed">"{globalResult.aiExplanation}"</p>
                            <span className="bg-amber-500/15 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                Score: {globalResult.storyScore}/100
                            </span>
                        </div>
                    )}

                    {/* Full Story */}
                    {isCompleted && focusedStory.formattedStory && (
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-fuchsia-400">
                                <BookOpen className="size-4" /> The Complete Story
                            </h3>
                            <div className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">
                                {focusedStory.formattedStory}
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-px before:bg-gradient-to-b before:from-transparent before:via-white/[0.06] before:to-transparent">
                        {(entries || []).map((entry) => {
                            const isWinningEntry = winnerResult && winnerResult.winnerUserId === entry.userId;
                            return (
                                <div key={entry.id} className="relative flex gap-4 pl-2">
                                    <div className={clsx(
                                        "size-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 z-10 shadow-md",
                                        isWinningEntry ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20" : "bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-fuchsia-500/20"
                                    )}>
                                        {entry.dayNumber}
                                    </div>
                                    <div className={clsx("flex-1 p-4 rounded-2xl bg-white/[0.02] border transition hover:bg-white/[0.04]",
                                        isWinningEntry ? "border-amber-500/20" : "border-white/5"
                                    )}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="flex items-center gap-1 text-[10px] font-semibold text-fuchsia-400/70 bg-fuchsia-500/10 px-2 py-0.5 rounded-md group/timeline">
                                                <User className="size-2.5" /> {entry.user?.username || 'Anonymous'}
                                                {entry.userId !== authUser?.id && (
                                                    <button onClick={(e) => {
                                                        e.stopPropagation();
                                                        sendFriendRequest(entry.userId);
                                                        toast.success(`Friend request sent to ${entry.user?.username || 'them'}!`);
                                                    }} className="opacity-0 group-hover/timeline:opacity-100 transition-opacity ml-1 hover:text-fuchsia-300" title="Add Friend">
                                                        <UserPlus className="size-2.5" />
                                                    </button>
                                                )}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground/60">Entry {entry.dayNumber}</span>
                                        </div>
                                        <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                                        {isWinningEntry && (
                                            <div className="mt-3 p-3 rounded-xl border border-amber-500/15" style={{ background: 'rgba(245,158,11,0.05)' }}>
                                                <p className="text-amber-400 font-bold text-[10px] mb-1 flex items-center gap-1"><Trophy className="size-3" /> Best Contributor</p>
                                                <p className="text-[10px] text-amber-400/60 italic">"{winnerResult.aiExplanation}"</p>
                                                {winnerResult.bestTurningPoint && <p className="text-[10px] font-medium text-amber-400/80 mt-1">✨ {winnerResult.bestTurningPoint}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Status indicators */}
                    <div className="flex justify-center py-6">
                        {isEvaluating && (
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 animate-pulse">
                                <Loader2 className="size-4 text-amber-400 animate-spin" />
                                <div><p className="text-amber-400 font-bold text-xs">Evaluating...</p><p className="text-[10px] text-muted-foreground/50">AI is formatting your story</p></div>
                            </div>
                        )}
                        {isCompleted && !winnerResult && (
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                <BookOpen className="size-4 text-emerald-400" />
                                <div><p className="text-emerald-400 font-bold text-xs">Completed</p><p className="text-[10px] text-muted-foreground/50">Story has been finalized</p></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Input — only visible to the member whose turn it is */}
            {isMyActiveStory && isActive && (
                <div className="p-3 border-t border-white/5 backdrop-blur-xl z-20" style={{ background: 'rgba(0,0,0,0.15)' }}>
                    {isMyTurn ? (
                        <form onSubmit={handleContribute} className="max-w-3xl mx-auto flex gap-2">
                            <textarea
                                placeholder="It's your turn! Continue the story..."
                                className="flex-1 min-h-[44px] max-h-[120px] bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-500/40 transition resize-none placeholder:text-muted-foreground/30"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleContribute(e); } }}
                            />
                            <button type="submit" disabled={!text.trim() || isContributing}
                                className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 disabled:opacity-30 text-white rounded-xl px-3.5 flex items-center justify-center shadow-md shadow-fuchsia-500/20 transition-all h-auto min-h-[44px]">
                                {isContributing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                            </button>
                        </form>
                    ) : (
                        <div className="max-w-3xl mx-auto text-center py-2">
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/60">
                                <Loader2 className="size-3.5 animate-spin text-fuchsia-400/50" />
                                <span>Waiting for <strong className="text-fuchsia-400/80">{currentTurnUsername}</strong> to write...</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StoryDetailPage;
