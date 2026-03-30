import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';

const BASE_URL = import.meta.env.VITE_BASE_URL || undefined;

export const useSocketStore = create((set, get) => ({
    socket: null,
    onlineUsers: [],

    connectSocket: () => {
        const { authUser } = useAuthStore.getState();
        if (!authUser || get().socket) return; // Return if we ALREADY have a socket (don't rely on .connected)

        const token = localStorage.getItem('jwt');

        const socket = io(BASE_URL, {
            withCredentials: true,
            transports: ['polling', 'websocket'],
            auth: { token },
            autoConnect: false, // Wait until event listeners are set
        });

        socket.on('getOnlineUsers', (userIds) => {
            set({ onlineUsers: userIds });
        });

        socket.connect();
        set({ socket });
    },

    disconnectSocket: () => {
        const currentSocket = get().socket;
        if (currentSocket) {
            currentSocket.disconnect();
            set({ socket: null, onlineUsers: [] });
        }
    },
}));
