import { create } from 'zustand';
import { api } from './useAuthStore';
import { useSocketStore } from './useSocketStore';
import toast from 'react-hot-toast';

export const useStoryStore = create((set, get) => ({
    // Library state
    libraryStories: [],
    globalWinner: null,
    isLibraryLoading: false,

    // Active Matchmaking / Current Story state
    status: 'idle', // 'idle', 'waiting', 'matched'
    activeStory: null,
    queueLength: 0,
    isContributing: false,

    // Focused story details state (for StoryDetailPage)
    focusedStory: null,
    isFocusedLoading: false,

    fetchLibrary: async () => {
        set({ isLibraryLoading: true });
        try {
            const [storiesRes, winnerRes] = await Promise.all([
                api.get('/story/library'),
                api.get('/story/library/global-winner')
            ]);
            set({
                libraryStories: storiesRes.data,
                globalWinner: winnerRes.data
            });
        } catch (error) {
            console.error("Failed to fetch story library:", error);
            toast.error("Failed to load Story Library");
        } finally {
            set({ isLibraryLoading: false });
        }
    },

    fetchStoryDetails: async (id) => {
        set({ isFocusedLoading: true, focusedStory: null });
        try {
            const res = await api.get(`/story/${id}`);
            set({ focusedStory: res.data });
        } catch (error) {
            console.error("Failed to fetch story details:", error);
            toast.error("Story not found");
        } finally {
            set({ isFocusedLoading: false });
        }
    },

    checkActiveStory: async () => {
        try {
            const res = await api.get('/story/me/active');
            if (res.data) {
                set({ activeStory: res.data, status: 'matched' });

                // Subscribe to socket room
                const socket = useSocketStore.getState().socket;
                if (socket) {
                    socket.emit('joinStoryGroupSocket', res.data.id);
                    get().subscribeToStoryUpdates();
                }
            } else {
                set({ activeStory: null, status: 'idle' });
            }
        } catch (error) {
            console.error("Failed checking active story", error);
        }
    },

    joinQueue: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;

        set({ status: 'waiting', queueLength: 1 });
        socket.emit('joinStoryQueue');

        socket.off('storyQueueStatus');
        socket.off('storyMatch');

        socket.on('storyQueueStatus', (data) => {
            set({ status: data.state, queueLength: data.queueLength || 1 });
        });

        socket.on('storyMatch', (data) => {
            set({ status: 'matched' });
            get().checkActiveStory(); // Fetch full group data
        });
    },

    leaveQueue: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;

        socket.emit('leaveStoryQueue');
        set({ status: 'idle', queueLength: 0 });
    },

    contribute: async (content) => {
        const { activeStory } = get();
        if (!activeStory) return;

        set({ isContributing: true });
        try {
            await api.post(`/story/${activeStory.id}/contribute`, { content });
            toast.success("Contribution added!");
        } catch (error) {
            console.error("Failed to contribute", error);
            toast.error(error.response?.data?.error || "Failed to add contribution");
        } finally {
            set({ isContributing: false });
        }
    },

    subscribeToStoryUpdates: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;

        socket.on('newStoryEntry', (entry) => {
            set((state) => {
                if (!state.activeStory || state.activeStory.id !== entry.groupId) return state;
                return {
                    activeStory: {
                        ...state.activeStory,
                        entries: [...(state.activeStory.entries || []), entry]
                    }
                };
            });
        });

        socket.on('story_completed', ({ groupId }) => {
            const { activeStory } = get();
            if (activeStory && activeStory.id === groupId) {
                set({ status: 'idle', activeStory: null }); // Boot out of active view, it's evaluated now
                toast.success("Your story has reached 30 days! AI is evaluating it now.", { duration: 5000 });
            }
        });

        socket.on('story_group_winner_announced', (result) => {
            toast.success(`Story evaluation complete! Winner: ${result.winnerUser.username}`, { duration: 6000, icon: '🏆' });
            get().fetchLibrary(); // Refresh library
        });
    },

    unsubscribeFromStoryUpdates: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;
        socket.off('newStoryEntry');
        socket.off('story_completed');
        socket.off('story_group_winner_announced');
    },

    // Global listener setup (call once at app level)
    setupGlobalListeners: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;

        socket.on('global_story_winner_announced', (data) => {
            toast(`NEW GLOBAL WINNER!\n${data.genre} story won with a score of ${data.score}`, {
                icon: '👑',
                duration: 8000
            });
            get().fetchLibrary(); // Refresh library showing new winner
        });
    }
}));
