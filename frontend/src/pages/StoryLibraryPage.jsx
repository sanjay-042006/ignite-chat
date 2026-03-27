import { useEffect } from 'react';
import { useStoryStore } from '../context/useStoryStore';
import { Loader2, Plus, ArrowRight, User, BookOpen, Trophy, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const StoryLibraryPage = () => {
    const { fetchLibrary, libraryStories, globalWinner, status, joinQueue, activeStory, isLibraryLoading, queueLength, checkActiveStory } = useStoryStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchLibrary();
        checkActiveStory();
    }, [fetchLibrary, checkActiveStory]);

    const handleWriteClick = () => {
        if (activeStory) navigate(`/stories/${activeStory.id}`);
        else joinQueue();
    };

    if (isLibraryLoading) {
        return <div className="flex-1 flex items-center justify-center"><Loader2 className="size-8 animate-spin text-fuchsia-500" /></div>;
    }

    return (
        <div className="w-full h-full flex flex-col p-5 lg:p-8 relative overflow-y-auto pb-20 md:pb-8">
            <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-fuchsia-500/[0.04] rounded-full blur-[100px] animate-glow-pulse" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-pink-500/[0.03] rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '1s' }} />

            <div className="max-w-5xl mx-auto w-full space-y-8 animate-slide-up relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                            <BookOpen className="size-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold bg-gradient-to-r from-fuchsia-300 to-pink-300 bg-clip-text text-transparent">Story Library</h2>
                            <p className="text-xs text-muted-foreground">Read or write collaborative stories</p>
                        </div>
                    </div>

                    <button onClick={handleWriteClick}
                        className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden">
                        {status === 'waiting' && <div className="absolute inset-0 bg-black/20 animate-pulse" />}
                        {status === 'waiting' ? (<><Loader2 className="size-4 animate-spin" /> Queue ({queueLength}/5)...</>)
                            : activeStory ? (<><ArrowRight className="size-4" /> Continue</>)
                                : (<><Plus className="size-4" /> New Story</>)}
                    </button>
                </div>

                {/* Global Winner */}
                {globalWinner && (
                    <div className="relative overflow-hidden rounded-2xl p-px bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-xl shadow-orange-500/15">
                        <div className="bg-background/95 backdrop-blur-xl rounded-[15px] p-6 relative">
                            <Trophy className="absolute top-4 right-4 size-16 text-amber-500/[0.07] rotate-12" />
                            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-[10px] font-bold border border-amber-500/20 mb-4">
                                <Trophy className="size-3" /> Global Best
                            </div>
                            <h3 className="text-xl font-extrabold mb-2 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                {globalWinner.title || "The Unwritten Tale"}
                            </h3>
                            <div className="flex gap-3 text-[11px] text-muted-foreground mb-3">
                                <span className="flex items-center gap-1"><BookOpen className="size-3" /> {globalWinner.genre}</span>
                                <span className="flex items-center gap-1"><Trophy className="size-3" /> Score: {globalWinner.globalResults?.[0]?.storyScore}/100</span>
                            </div>
                            <p className="text-xs text-foreground/60 italic mb-4 line-clamp-2">"{globalWinner.globalResults?.[0]?.aiExplanation}"</p>
                            <Link to={`/stories/${globalWinner.id}`} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 transition-all hover:scale-[1.02]">
                                Read Winner <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Story Grid */}
                <div>
                    <h3 className="text-sm font-bold mb-3 text-foreground/70">Completed ({libraryStories.length})</h3>
                    {libraryStories.length === 0 ? (
                        <div className="text-center p-10 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <BookOpen className="size-8 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">No stories completed yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {libraryStories.map(story => (
                                <Link key={story.id} to={`/stories/${story.id}`}
                                    className="group flex flex-col p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all hover:scale-[1.01]">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="bg-fuchsia-500/10 text-fuchsia-400 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border border-fuchsia-500/15">{story.genre}</span>
                                        {story.isGlobalWinner && <Trophy className="size-4 text-amber-400" />}
                                    </div>
                                    <h4 className="text-sm font-bold mb-1.5 group-hover:text-fuchsia-400 transition">{story.title || "Untitled"}</h4>
                                    <p className="text-[11px] text-muted-foreground/70 line-clamp-2 mb-4 flex-1">{story.entries?.[0]?.content || "No opening."}</p>
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 pt-2.5 border-t border-white/5">
                                        <span className="flex items-center gap-1"><User className="size-2.5" /> {story._count?.members || 0}</span>
                                        <span className="text-fuchsia-400/60 font-medium group-hover:text-fuchsia-400 flex items-center gap-0.5">Read <ArrowRight className="size-2.5" /></span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoryLibraryPage;
