import { useEffect, useState } from 'react';
import { useStoryStore } from '../context/useStoryStore';
import { useChatStore } from '../context/useChatStore';
import { Loader2, Plus, ArrowRight, User, BookOpen, Trophy, CheckCircle2, ArrowLeft, Users, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { resolveUrl } from '../lib/utils';
import clsx from 'clsx';

const StoryLibraryPage = () => {
    const { fetchLibrary, libraryStories, globalWinner, status, joinQueue, activeStory, isLibraryLoading, queueLength, checkActiveStory, createFriendStory } = useStoryStore();
    const { users, getUsers } = useChatStore();
    const navigate = useNavigate();
    const [showFriendPicker, setShowFriendPicker] = useState(false);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [isCreatingFriendStory, setIsCreatingFriendStory] = useState(false);

    useEffect(() => {
        fetchLibrary();
        checkActiveStory();
    }, [fetchLibrary, checkActiveStory]);

    const handleWriteClick = () => {
        if (activeStory) navigate(`/stories/${activeStory.id}`);
        else joinQueue();
    };

    const handleOpenFriendPicker = () => {
        getUsers(); // Refresh friend list
        setSelectedFriends([]);
        setShowFriendPicker(true);
    };

    const toggleFriend = (friendId) => {
        setSelectedFriends(prev =>
            prev.includes(friendId) ? prev.filter(id => id !== friendId) : prev.length < 4 ? [...prev, friendId] : prev
        );
    };

    const handleCreateFriendStory = async () => {
        if (selectedFriends.length < 1) return;
        setIsCreatingFriendStory(true);
        try {
            await createFriendStory(selectedFriends);
            setShowFriendPicker(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreatingFriendStory(false);
        }
    };

    // Only show confirmed friends
    const friends = users.filter(u => u.friendshipStatus === 'FRIEND');

    if (isLibraryLoading) {
        return <div className="flex-1 flex items-center justify-center"><Loader2 className="size-8 animate-spin text-fuchsia-500" /></div>;
    }

    return (
        <div className="w-full h-full flex flex-col p-5 lg:p-8 relative overflow-y-auto">
            <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-fuchsia-500/[0.04] rounded-full blur-[100px] animate-glow-pulse" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-pink-500/[0.03] rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '1s' }} />

            <div className="max-w-5xl mx-auto w-full space-y-8 animate-slide-up relative z-10">
                {/* Back Button */}
                <button onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 text-muted-foreground/70 hover:text-foreground text-xs font-medium transition px-2.5 py-1.5 rounded-lg hover:bg-white/5">
                    <ArrowLeft className="size-4" /> Back
                </button>

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                            <BookOpen className="size-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold bg-gradient-to-r from-fuchsia-300 to-pink-300 bg-clip-text text-transparent">Story Library</h2>
                            <p className="text-xs text-muted-foreground">Create collaborative stories with random people for a day. At the end, AI formats, scores, and publishes the best stories globally!</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Friends Story Button */}
                        <button onClick={handleOpenFriendPicker}
                            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Users className="size-4" /> Friends Story
                        </button>

                        {/* Random Story Button */}
                        <button onClick={handleWriteClick}
                            className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden">
                            {status === 'waiting' && <div className="absolute inset-0 bg-black/20 animate-pulse" />}
                            {status === 'waiting' ? (<><Loader2 className="size-4 animate-spin" /> Queue ({queueLength}/5)...</>)
                                : activeStory ? (<><ArrowRight className="size-4" /> Continue</>)
                                    : (<><Plus className="size-4" /> New Story</>)}
                        </button>
                    </div>
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

            {/* Friend Picker Modal */}
            {showFriendPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0c1120] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                            <div>
                                <h3 className="text-base font-bold">Create Friends Story</h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Select 1-4 friends to write a collaborative story together</p>
                            </div>
                            <button onClick={() => setShowFriendPicker(false)} className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white transition">
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Friend List */}
                        <div className="max-h-[300px] overflow-y-auto p-3 space-y-1.5">
                            {friends.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No friends yet. Add friends first!</p>
                                </div>
                            ) : (
                                friends.map(friend => {
                                    const isSelected = selectedFriends.includes(friend.id);
                                    return (
                                        <button key={friend.id} onClick={() => toggleFriend(friend.id)}
                                            className={clsx(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                                                isSelected ? "bg-violet-500/15 border border-violet-500/30" : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]"
                                            )}>
                                            <div className={clsx(
                                                "size-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden",
                                                isSelected ? "bg-gradient-to-br from-violet-500 to-purple-600 ring-2 ring-violet-400/30" : "bg-gradient-to-br from-indigo-500 to-purple-500"
                                            )}>
                                                {friend.profilePic ? (
                                                    <img src={resolveUrl(friend.profilePic)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    friend.username?.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <span className="text-sm font-medium flex-1 text-left">{friend.username}</span>
                                            {isSelected && (
                                                <CheckCircle2 className="size-5 text-violet-400 shrink-0" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">{selectedFriends.length}/4 selected</span>
                            <button onClick={handleCreateFriendStory}
                                disabled={selectedFriends.length < 1 || isCreatingFriendStory}
                                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-violet-500/20 transition-all">
                                {isCreatingFriendStory ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                                Create Story
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoryLibraryPage;
