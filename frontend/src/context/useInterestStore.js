import { create } from 'zustand';
import { api } from './useAuthStore';
import { useSocketStore } from './useSocketStore';

export const useInterestStore = create((set, get) => ({
    activeRoom: null,
    messages: [],
    isJoining: false,
    isMessagesLoading: false,

    joinInterestRoom: async (topic, skipRoomId = null) => {
        set({ isJoining: true });
        try {
            // Calls backend `joinInterestRoom` controller
            const res = await api.post('/interest/join', { topic, skipRoomId });
            set({ activeRoom: res.data, messages: [] });

            // Emit socket to join this room specifically 
            const socket = useSocketStore.getState().socket;
            if (socket) {
                socket.emit('joinInterestSocket', res.data.roomId);
            }

            return true;
        } catch (error) {
            console.error('Error joining interest room:', error);
            return false;
        } finally {
            set({ isJoining: false });
        }
    },

    nextMatch: async () => {
        const { activeRoom, joinInterestRoom, leaveRoom } = get();
        if (!activeRoom) return;

        const currentTopic = activeRoom.topic;
        const currentRoomId = activeRoom.roomId;

        // Leave current socket room
        leaveRoom();

        // Join again, passing currentRoomId to skip it
        await joinInterestRoom(currentTopic, currentRoomId);
    },

    getMessages: async (roomId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await api.get(`/interest/${roomId}/messages`);
            set({ messages: res.data });
        } catch (error) {
            console.error(error);
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (text) => {
        const { activeRoom } = get();
        if (!activeRoom) return;

        try {
            await api.post(`/interest/${activeRoom.roomId}/send`, { text });
            // The socket listener handles appending to messages automatically
        } catch (error) {
            console.error(error);
        }
    },

    leaveRoom: () => {
        const socket = useSocketStore.getState().socket;
        const { activeRoom } = get();
        if (socket && activeRoom) {
            // Technically wait for disconnect to clear room, or allow an explicit leave.
            socket.emit('leaveInterestSocket', activeRoom.roomId);
        }
        set({ activeRoom: null, messages: [] });
    },

    subscribeToMessages: () => {
        const socket = useSocketStore.getState().socket;
        socket?.on('newInterestMessage', (msg) => {
            set((state) => ({ messages: [...state.messages, msg] }));
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useSocketStore.getState().socket;
        socket?.off('newInterestMessage');
    }
}));
