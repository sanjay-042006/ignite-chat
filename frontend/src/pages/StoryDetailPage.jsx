import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStoryStore } from '../context/useStoryStore';
import { Loader2, ArrowLeft, Trophy, BookOpen, Clock, CalendarDays, User, Send } from 'lucide-react';
import clsx from 'clsx';

const StoryDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchStoryDetails, focusedStory, isFocusedLoading, activeStory, contribute, isContributing } = useStoryStore();
    const [text, setText] = useState('');

    useEffect(() => {
        fetchStoryDetails(id);
    }, [id, fetchStoryDetails]);

    const handleContribute = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        await contribute(text.trim());
        setText('');
        // The socket listener handles adding it to `activeStory.entries`
    };

    if (isFocusedLoading || !focusedStory) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 h-full bg-background/50">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading story chapters...</p>
            </div>
        );
    }

    const isActive = focusedStory.status === 'ACTIVE';
    const isEvaluating = focusedStory.status === 'EVALUATING';
    const isCompleted = focusedStory.status === 'COMPLETED';
    const isMyActiveStory = activeStory?.id === focusedStory.id;

    const winnerResult = focusedStory.results?.[0]; // Group level winner
    const globalResult = focusedStory.globalResults?.[0];

    return (
        <div className="w-full h-full flex flex-col bg-background/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-background to-purple-500/10 backdrop-blur-3xl -z-10" />

            {/* Top Navigation Bar */}
            <div className="px-6 py-4 glass border-b border-white/5 flex items-center justify-between sticky top-0 z-20 shadow-sm backdrop-blur-xl">
                <button
                    onClick={() => navigate('/library')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl"
                >
                    <ArrowLeft className="size-4" /> Back to Library
                </button>

                <div className="flex items-center gap-2">
                    {focusedStory.isGlobalWinner && (
                        <span className="bg-amber-500/20 text-amber-500 text-xs font-bold py-1.5 px-4 rounded-full border border-amber-500/30 flex items-center gap-2 shadow-lg shadow-amber-500/10">
                            <Trophy className="size-3" /> Global Winner
                        </span>
                    )}
                    <span className={clsx("text-xs font-bold py-1.5 px-4 rounded-full border flex items-center gap-2",
                        isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            isEvaluating ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                                "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    )}>
                        <Clock className="size-3" /> {focusedStory.status}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full">
                <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* Story Header */}
                    <div className="text-center space-y-6 pt-4">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-xl shadow-indigo-500/10 mb-4">
                            <BookOpen className="size-8" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                            {focusedStory.title || "The Unwritten Tale"}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground font-medium">
                            <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> {focusedStory.genre}
                            </span>
                            <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                                <CalendarDays className="size-4" /> {new Date(focusedStory.startDate).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Global AI Review */}
                    {globalResult && (
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Trophy className="size-24 text-amber-500" />
                            </div>
                            <h3 className="text-xl font-bold text-amber-500 mb-2 flex items-center gap-2">
                                <Trophy className="size-5" /> Global Judging Panel
                            </h3>
                            <p className="text-foreground/90 leading-relaxed text-lg mb-4 italic">
                                "{globalResult.aiExplanation}"
                            </p>
                            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 font-black px-4 py-2 rounded-xl text-sm">
                                Score: {globalResult.storyScore} / 100
                            </div>
                        </div>
                    )}

                    {/* The Complete Story (when finished) */}
                    {isCompleted && focusedStory.formattedStory && (
                        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 shadow-2xl relative">
                            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-indigo-400">
                                <BookOpen className="size-6" /> The Complete Story
                            </h3>
                            <div className="prose prose-invert max-w-none prose-lg md:prose-xl prose-p:leading-relaxed text-foreground/90 whitespace-pre-wrap font-serif">
                                {focusedStory.formattedStory}
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">

                        {(isMyActiveStory ? activeStory.entries : focusedStory.entries).map((entry, idx) => {
                            const isWinningEntry = winnerResult && winnerResult.winnerUserId === entry.userId;

                            return (
                                <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Timeline dot */}
                                    <div className={clsx(
                                        "flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xl z-10 transition-transform duration-300 hover:scale-125",
                                        isWinningEntry ? "bg-amber-500" : "bg-indigo-500"
                                    )}>
                                        <span className="text-xs font-bold text-white">{entry.dayNumber}</span>
                                    </div>

                                    {/* Content Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl glass hover:bg-white/5 border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative"
                                        style={{ borderColor: isWinningEntry ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255,255,255,0.05)' }}>

                                        {/* Connector tail */}
                                        <div className={clsx(
                                            "absolute top-5 w-4 h-4 rotate-45 border-t border-r border-white/5 bg-card/50 backdrop-blur-md -z-10 hidden md:block",
                                            "group-odd:-left-2 group-odd:-border-l group-odd:border-r-0 group-odd:border-b",
                                            "group-even:-right-2"
                                        )} />

                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-sm text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-full w-fit">
                                                <User className="size-3" /> {entry.user?.username || 'Anonymous Writer'}
                                            </div>
                                            <span className="text-xs text-muted-foreground font-medium">Day {entry.dayNumber}/30</span>
                                        </div>

                                        <p className="text-foreground/90 leading-relaxed text-[15px] whitespace-pre-wrap">{entry.content}</p>

                                        {isWinningEntry && (
                                            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                                <div className="text-amber-500 font-bold text-sm mb-2 flex items-center gap-2">
                                                    <Trophy className="size-4" /> Group Winner
                                                </div>
                                                <p className="text-xs text-amber-500/80 italic">"{winnerResult.aiExplanation}"</p>
                                                <p className="text-xs font-semibold text-amber-400 mt-2">✨ Best Moment: {winnerResult.bestTurningPoint}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Status Indicator at the bottom */}
                    <div className="flex justify-center pt-8 pb-12">
                        {isEvaluating && (
                            <div className="glass px-6 py-4 rounded-2xl border border-yellow-500/20 flex items-center gap-4 animate-pulse">
                                <Loader2 className="size-6 text-yellow-500 animate-spin" />
                                <div className="text-left">
                                    <p className="text-yellow-500 font-bold text-sm">Evaluating Story...</p>
                                    <p className="text-muted-foreground text-xs">AI is currently judging the contributors.</p>
                                </div>
                            </div>
                        )}
                        {isCompleted && !winnerResult && (
                            <div className="glass px-6 py-4 rounded-2xl border border-emerald-500/20 flex items-center gap-4">
                                <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <BookOpen className="size-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-emerald-400 font-bold text-sm">Story Completed</p>
                                    <p className="text-muted-foreground text-xs">A 30-day journey has come to an end.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Input Area (Only if Active and User is Member) */}
            {isMyActiveStory && isActive && (
                <div className="p-4 bg-background/80 border-t border-border/50 backdrop-blur-xl z-20">
                    <form onSubmit={handleContribute} className="max-w-4xl mx-auto flex gap-3">
                        <textarea
                            placeholder={`Write day ${activeStory.entries?.length + 1}'s contribution...`}
                            className="flex-1 min-h-[50px] max-h-[150px] bg-input/40 border border-border rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none text-[15px]"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleContribute(e);
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!text.trim() || isContributing}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl px-6 flex items-center justify-center transition shadow-lg shadow-indigo-500/25 h-auto min-h-[50px]"
                        >
                            {isContributing ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default StoryDetailPage;
