import { useEffect } from 'react';
import { useStoryStore } from '../context/useStoryStore';
import { Loader2, Plus, ArrowRight, User, BookOpen, Trophy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const StoryLibraryPage = () => {
    const { fetchLibrary, libraryStories, globalWinner, status, joinQueue, activeStory, isLibraryLoading, queueLength } = useStoryStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchLibrary();
    }, [fetchLibrary]);

    const handleWriteClick = () => {
        if (activeStory) {
            navigate(`/stories/${activeStory.id}`);
        } else {
            joinQueue();
        }
    };

    if (isLibraryLoading) {
        return <div className="flex-1 flex items-center justify-center p-6 lg:p-12"><Loader2 className="w-10 h-10 animate-spin text-cyan-400" /></div>;
    }

    return (
        <div className="w-full h-full flex flex-col p-6 lg:p-12 bg-background/50 relative overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent backdrop-blur-3xl -z-10 blur-[100px]" />

            <div className="max-w-6xl mx-auto w-full space-y-10 animate-in fade-in zoom-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-extrabold tracking-tight">Story Library</h2>
                        <p className="text-muted-foreground text-lg mt-2">Read collaborative stories or join a group to write one.</p>
                    </div>

                    <button
                        onClick={handleWriteClick}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition relative overflow-hidden group"
                    >
                        {status === 'waiting' && (
                            <div className="absolute inset-0 bg-black/20 animate-pulse mix-blend-overlay" />
                        )}
                        {status === 'waiting' ? (
                            <><Loader2 className="size-5 animate-spin" /> Waiting in Queue ({queueLength}/5)...</>
                        ) : activeStory ? (
                            <><ArrowRight className="size-5" /> Continue Writing</>
                        ) : (
                            <><Plus className="size-5" /> Start New Story</>
                        )}
                    </button>
                </div>

                {/* Global Winner Hero Section */}
                {globalWinner && (
                    <div className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-2xl shadow-orange-500/20">
                        <div className="bg-background/95 backdrop-blur-xl rounded-[22px] p-8 md:p-12 h-full relative">
                            <Trophy className="absolute top-8 right-8 size-24 text-amber-500/10 rotate-12" />
                            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-1.5 rounded-full text-sm font-bold border border-amber-500/20 mb-6">
                                <Trophy className="size-4" /> Global Best Story
                            </div>

                            <h3 className="text-3xl md:text-5xl font-black mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                                {globalWinner.title || "The Unwritten Tale"}
                            </h3>

                            <div className="flex gap-4 text-sm text-muted-foreground mb-6">
                                <span className="flex items-center gap-1"><BookOpen className="size-4" /> {globalWinner.genre}</span>
                                <span className="flex items-center gap-1"><Trophy className="size-4" /> Score: {globalWinner.globalResults?.[0]?.storyScore}/100</span>
                            </div>

                            <p className="text-lg leading-relaxed mb-8 max-w-3xl text-foreground/80 italic">
                                "{globalWinner.globalResults?.[0]?.aiExplanation}"
                            </p>

                            <Link to={`/stories/${globalWinner.id}`} className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-orange-500/25">
                                Read Winner <ArrowRight className="size-5" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Story Grid */}
                <div>
                    <h3 className="text-2xl font-bold mb-6">Completed Stories ({libraryStories.length})</h3>
                    {libraryStories.length === 0 ? (
                        <div className="text-center p-12 glass rounded-3xl border border-white/5">
                            <BookOpen className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-lg text-muted-foreground">No stories have been completed yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {libraryStories.map(story => (
                                <Link key={story.id} to={`/stories/${story.id}`} className="group flex flex-col p-6 rounded-3xl glass hover:bg-white/5 border border-white/5 hover:border-white/20 transition-all hover:scale-[1.02]">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-500/20">
                                            {story.genre}
                                        </div>
                                        {story.isGlobalWinner && <Trophy className="size-5 text-amber-500" title="Global Winner" />}
                                    </div>
                                    <h4 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">
                                        {story.title || "Untitled Masterpiece"}
                                    </h4>
                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                                        {story.entries?.[0]?.content || "No opening paragraph found."}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-1">
                                            <User className="size-3" /> {story._count?.members || 0} Authors
                                        </div>
                                        <div className="text-indigo-400 font-medium group-hover:underline flex items-center gap-1">
                                            Read <ArrowRight className="size-3" />
                                        </div>
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
