import { create } from 'zustand';
import { api } from './useAuthStore';
import { useSocketStore } from './useSocketStore';

export const useLoveStore = create((set, get) => ({
    connections: [],
    selectedConnection: null,
    messages: [],
    isLoading: false,
    isMessagesLoading: false,
    isAIChatActive: false,
    aiTimeRemaining: 0,

    getConnections: async () => {
        set({ isLoading: true });
        try {
            const res = await api.get('/love/connections');
            const currentSelected = get().selectedConnection;
            let updatedSelected = null;
            if (currentSelected) {
                updatedSelected = res.data.find(c => c.id === currentSelected.id) || null;
            }
            set({
                connections: res.data,
                selectedConnection: updatedSelected,
            });
        } catch (error) {
            console.error(error);
        } finally {
            set({ isLoading: false });
        }
    },

    setSelectedConnection: (connection) => set({ selectedConnection: connection }),


    sendLoveRequest: async (userId) => {
        try {
            await api.post(`/love/request/${userId}`);
            get().getConnections();
        } catch (error) {
            console.error(error);
        }
    },

    acceptRequest: async (connectionId) => {
        try {
            await api.post(`/love/accept/${connectionId}`);
            get().getConnections();
        } catch (error) {
            console.error(error);
        }
    },

    rejectRequest: async (connectionId) => {
        try {
            await api.post(`/love/reject/${connectionId}`);
            get().getConnections();
        } catch (error) {
            console.error(error);
        }
    },

    getMessages: async (connectionId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await api.get(`/love/${connectionId}/messages`);
            set({ messages: res.data });
            get().markLoveMessagesAsSeen(connectionId);
        } catch (error) {
            console.error(error);
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedConnection } = get();
        if (!selectedConnection) return;
        try {
            await api.post(`/love/${selectedConnection.id}/send`, messageData);
        } catch (error) {
            console.error(error);
        }
    },

    triggerAIChat: async () => {
        const { selectedConnection } = get();
        if (!selectedConnection) return;
        try {
            await api.post(`/love/${selectedConnection.id}/ai-chat`);
        } catch (error) {
            console.error(error);
        }
    },

    initiateBreakup: async () => {
        const { selectedConnection } = get();
        if (!selectedConnection) return;
        try {
            await api.post(`/love/${selectedConnection.id}/breakup`);
            get().getConnections();
        } catch (error) {
            console.error(error);
        }
    },

    acceptBreakup: async () => {
        const { selectedConnection } = get();
        if (!selectedConnection) return;
        try {
            await api.post(`/love/${selectedConnection.id}/breakup/accept`);
            set({ selectedConnection: null, messages: [] });
            get().getConnections();
        } catch (error) {
            console.error(error);
        }
    },

    cancelBreakup: async () => {
        const { selectedConnection } = get();
        if (!selectedConnection) return;
        try {
            await api.post(`/love/${selectedConnection.id}/breakup/cancel`);
            get().getConnections();
        } catch (error) {
            console.error(error);
        }
    },

    setSelectedConnection: (connection) => {
        set({ selectedConnection: connection, messages: [], isAIChatActive: false });
        if (connection) {
            get().getMessages(connection.id);
            const socket = useSocketStore.getState().socket;
            if (socket) {
                socket.emit('joinLoveRoom', connection.id);
            }
        }
    },

    subscribeToMessages: () => {
        const { selectedConnection } = get();
        if (!selectedConnection) return;

        const socket = useSocketStore.getState().socket;

        socket.on('newLoveMessage', (newMessage) => {
            if (newMessage.connectionId === get().selectedConnection?.id) {
                set((state) => ({
                    messages: [...state.messages, newMessage]
                }));
                // Only mark as read if the message is from the partner
                const authUserId = useAuthStore.getState().authUser?.id;
                if (newMessage.senderId !== authUserId) {
                    get().markLoveMessagesAsSeen(newMessage.connectionId);
                }
            }
        });

        socket.on('loveMessagesSeen', ({ connectionId, byUserId }) => {
            const currentSelected = get().selectedConnection;
            if (currentSelected && currentSelected.id === connectionId) {
                // If partner saw the messages, update our local store
                const authUserId = useAuthStore.getState().authUser?.id;
                if (byUserId !== authUserId) {
                    set({
                        messages: get().messages.map(msg => ({ ...msg, isRead: msg.isRead || true }))
                    });
                }
            }
        });

        socket.on('aiChatStarted', ({ connectionId, duration }) => {
            if (connectionId === get().selectedConnection?.id) {
                set({ isAIChatActive: true, aiTimeRemaining: duration });
                const interval = setInterval(() => {
                    set((state) => {
                        const remaining = state.aiTimeRemaining - 1;
                        if (remaining <= 0) {
                            clearInterval(interval);
                            return { aiTimeRemaining: 0 };
                        }
                        return { aiTimeRemaining: remaining };
                    });
                }, 1000);
            }
        });

        socket.on('aiChatEnded', ({ connectionId }) => {
            if (connectionId === get().selectedConnection?.id) {
                set({ isAIChatActive: false, aiTimeRemaining: 0 });
            }
        });

        socket.on('breakupInitiated', ({ connectionId, initiatedBy, initiatedAt }) => {
            // Immediately update selectedConnection if it's the one being broken up
            const current = get().selectedConnection;
            if (current && current.id === connectionId) {
                set({
                    selectedConnection: {
                        ...current,
                        status: 'BREAKING_UP',
                        breakupInitiatedBy: initiatedBy,
                        breakupInitiatedAt: initiatedAt,
                    }
                });
            }
            get().getConnections();
        });

        socket.on('breakupCancelled', ({ connectionId }) => {
            const current = get().selectedConnection;
            if (current && current.id === connectionId) {
                set({
                    selectedConnection: {
                        ...current,
                        status: 'ACCEPTED',
                        breakupInitiatedBy: null,
                        breakupInitiatedAt: null,
                    }
                });
            }
            get().getConnections();
        });

        socket.on('breakupCompleted', ({ connectionId }) => {
            if (connectionId === get().selectedConnection?.id) {
                set({ selectedConnection: null, messages: [] });
            }
            get().getConnections();
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useSocketStore.getState().socket;
        if (socket) {
            socket.off('newLoveMessage');
            socket.off('aiChatStarted');
            socket.off('aiChatEnded');
            socket.off('breakupInitiated');
            socket.off('breakupCancelled');
            socket.off('breakupCompleted');
            socket.off('loveMessagesSeen');
        }
    },

    markLoveMessagesAsSeen: async (connectionId) => {
        try {
            await api.put(`/love/${connectionId}/seen`);
            // Optimistically update
            const authUserId = useAuthStore.getState().authUser?.id;
            set({
                messages: get().messages.map(msg => 
                    msg.senderId !== authUserId ? { ...msg, isRead: true } : msg
                )
            });
        } catch (error) {
            console.error('Failed to mark love messages as seen:', error);
        }
    },
}));
