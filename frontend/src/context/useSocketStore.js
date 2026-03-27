import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || undefined;

export const useSocketStore = create((set, get) => ({
    socket: null,
    onlineUsers: [],

    connectSocket: () => {
        const { authUser } = useAuthStore.getState();
        if (!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
            withCredentials: true,
        });

        socket.connect();
        set({ socket });

        socket.on('getOnlineUsers', (userIds) => {
            set({ onlineUsers: userIds });
        });
    },

    disconnectSocket: () => {
        if (get().socket?.connected) {
            get().socket.disconnect();
            set({ socket: null });
        }
    },
}));
