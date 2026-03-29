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

    // Identity reveal state
    iRevealed: false,         // Did I reveal my name to partner?
    partnerRevealed: false,   // Did partner reveal their name to me?

    joinQueue: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;

        set({ status: 'waiting', partnerId: null, partnerUsername: null, roomId: null, messages: [], iRevealed: false, partnerRevealed: false });
        socket.emit('joinStrangerQueue');

        // Remove existing listeners to avoid duplicates
        socket.off('strangerQueueStatus');
        socket.off('strangerMatch');
        socket.off('newStrangerMessage');
        socket.off('partnerLeft');
        socket.off('partnerRevealed');

        socket.on('strangerQueueStatus', (data) => {
            set({ status: data.state });
        });

        socket.on('strangerMatch', ({ targetUserId, roomId, partnerId, targetUsername }) => {
            set({
                status: 'matched',
                partnerId: partnerId || targetUserId,
                partnerUsername: targetUsername,
                roomId,
                iRevealed: false,
                partnerRevealed: false
            });
            socket.emit('joinStrangerRoom', roomId);
        });

        socket.on('newStrangerMessage', (msg) => {
            set((state) => ({ messages: [...state.messages, msg] }));
        });

        socket.on('partnerLeft', () => {
            set({ status: 'idle', partnerId: null, partnerUsername: null, roomId: null, messages: [], iRevealed: false, partnerRevealed: false });
        });

        // When partner reveals their identity to us
        socket.on('partnerRevealed', ({ username }) => {
            set({ partnerRevealed: true, partnerUsername: username });
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
        set({ status: 'idle', partnerId: null, partnerUsername: null, roomId: null, messages: [], iRevealed: false, partnerRevealed: false });
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

    // Reveal my identity to the partner
    revealIdentity: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;

        const { roomId } = get();
        if (!roomId) return;

        socket.emit('revealIdentity', roomId);
        set({ iRevealed: true });
    },

    sendMessage: async (messageData) => {
        const { roomId } = get();
        if (!roomId) return;
        try {
            await api.post(`/anonymous/stranger/${roomId}/send`, messageData);
        } catch (e) {
            console.error("Failed sending stranger msg", e);
        }
    }
}));
