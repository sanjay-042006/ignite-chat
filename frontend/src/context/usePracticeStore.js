import { create } from 'zustand';
import { api } from './useAuthStore';
import { useSocketStore } from './useSocketStore';

export const usePracticeStore = create((set, get) => ({
    status: 'idle', // 'idle', 'waiting', 'matched'
    partnerId: null,
    roomId: null,
    messages: [],

    joinPracticeQueue: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;

        set({ status: 'waiting', partnerId: null, roomId: null, messages: [] });
        // Tell server we want to match for practice
        socket.emit('joinPracticeQueue');

        socket.off('practiceQueueStatus');
        socket.off('practiceMatch');
        socket.off('practiceMatchDirect');
        socket.off('newPracticeMessage');
        socket.off('partnerLeft');

        socket.on('partnerLeft', () => {
            set({ status: 'idle', partnerId: null, roomId: null, messages: [] });
        });

        socket.on('practiceQueueStatus', (data) => {
            set({ status: data.state });
        });

        socket.on('practiceMatch', ({ roomId, partnerId }) => {
            set({ status: 'matched', partnerId, roomId });
            socket.emit('joinPracticeRoom', roomId);
        });

        socket.on('practiceMatchDirect', ({ targetUserId, roomId, partnerId }) => {
            set({ status: 'matched', partnerId, roomId });
            socket.emit('joinPracticeRoom', roomId);
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
        set({ status: 'idle', partnerId: null, roomId: null, messages: [] });
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
    }
}));
