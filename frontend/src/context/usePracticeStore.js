import { create } from 'zustand';
import { api } from './useAuthStore';
import { useSocketStore } from './useSocketStore';

export const usePracticeStore = create((set, get) => ({
    status: 'idle', // 'idle', 'waiting', 'matched'
    partnerId: null,
    partnerUsername: null,
    roomId: null,
    messages: [],

    joinPracticeQueue: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;

        set({ status: 'waiting', partnerId: null, partnerUsername: null, roomId: null, messages: [] });
        // Tell server we want to match for practice
        socket.emit('joinPracticeQueue');
    },

    setupPracticeListeners: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;

        socket.off('practiceQueueStatus');
        socket.off('practiceMatch');
        socket.off('practiceMatchDirect');
        socket.off('newPracticeMessage');
        socket.off('partnerLeft');

        socket.on('partnerLeft', () => {
            set({ status: 'idle', partnerId: null, partnerUsername: null, roomId: null, messages: [] });
        });

        socket.on('practiceQueueStatus', (data) => {
            set({ status: data.state });
        });

        socket.on('practiceMatch', async ({ roomId, partnerId, partnerUsername }) => {
            set({ status: 'matched', partnerId, partnerUsername, roomId, messages: [] });
            socket.emit('joinPracticeRoom', roomId);
            await get().getPracticeMessages(roomId);
        });

        socket.on('practiceMatchDirect', async ({ targetUserId, roomId, partnerId, partnerUsername }) => {
            set({ status: 'matched', partnerId: partnerId || targetUserId, partnerUsername, roomId, messages: [] });
            socket.emit('joinPracticeRoom', roomId);
            await get().getPracticeMessages(roomId);
        });

        socket.on('newPracticeMessage', (msg) => {
            set((state) => ({ messages: [...state.messages, msg] }));
        });
    },

    leavePracticeQueue: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;

        const { roomId } = get();
        if (roomId) {
            socket.emit('leavePracticeRoom', roomId);
        }

        socket.emit('leavePracticeQueue');
        set({ status: 'idle', partnerId: null, partnerUsername: null, roomId: null, messages: [] });
    },

    nextMatch: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;

        const { roomId } = get();
        if (roomId) {
            socket.emit('nextPractice', roomId);
        }

        get().joinPracticeQueue();
    },

    sendMessage: async (text) => {
        const { roomId, partnerId } = get();
        if (!roomId) return;
        try {
            await api.post(`/practice/${roomId}/send`, { text, receiverId: partnerId });
        } catch (e) {
            console.error("Failed sending practice msg", e);
        }
    },

    getPracticeMessages: async (roomId) => {
        try {
            const res = await api.get(`/practice/${roomId}/messages`);
            set({ messages: res.data });
        } catch (error) {
            console.error("Failed fetching practice messages", error);
        }
    }
}));
