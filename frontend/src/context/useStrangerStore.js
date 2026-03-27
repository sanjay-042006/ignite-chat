import { create } from 'zustand';
import { api } from './useAuthStore';
import { useSocketStore } from './useSocketStore';

export const useStrangerStore = create((set, get) => ({
    status: 'idle', // 'idle', 'waiting', 'matched'
    partnerId: null,
    partnerUsername: null,
    roomId: null,
    messages: [],
    isTyping: false,

    joinQueue: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;

        set({ status: 'waiting', partnerId: null, partnerUsername: null, roomId: null, messages: [] });
        // Tell server we want to match
        socket.emit('joinStrangerQueue');

        // Remove existing listeners to avoid duplicates
        socket.off('strangerQueueStatus');
        socket.off('strangerMatch');
        socket.off('newStrangerMessage');
        socket.off('partnerLeft');

        // Listeners
        socket.on('strangerQueueStatus', (data) => {
            set({ status: data.state }); // 'waiting'
        });

        socket.on('strangerMatch', ({ targetUserId, roomId, partnerId, targetUsername }) => {
            set({ status: 'matched', partnerId: partnerId || targetUserId, partnerUsername: targetUsername, roomId });
            // After matched, client natively joins room on backend
            socket.emit('joinStrangerRoom', roomId);
        });

        socket.on('newStrangerMessage', (msg) => {
            set((state) => ({ messages: [...state.messages, msg] }));
        });

        socket.on('partnerLeft', () => {
            // Partner disconnected or skipped
            set({ status: 'idle', partnerId: null, partnerUsername: null, roomId: null, messages: [] });
        });
    },

    leaveQueue: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;

        const { roomId } = get();
        if (roomId) {
            socket.emit('leaveStrangerRoom', roomId);
        }

        socket.emit('leaveStrangerQueue');
        set({ status: 'idle', partnerId: null, partnerUsername: null, roomId: null, messages: [] });
    },

    nextMatch: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;

        const { roomId } = get();
        if (roomId) {
            socket.emit('nextStranger', roomId);
        }

        get().joinQueue();
    },

    sendMessage: async (messageData) => {
        const { roomId } = get();
        if (!roomId) return;
        try {
            await api.post(`/anonymous/stranger/${roomId}/send`, messageData);
            // Socket broadcast handles pushing it to `messages` array
        } catch (e) {
            console.error("Failed sending stranger msg", e);
        }
    }
}));
