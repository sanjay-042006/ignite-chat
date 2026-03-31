import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';

const BASE_URL = import.meta.env.VITE_BASE_URL || undefined;

let isAppActive = true;

// Listen to Capacitor App State natively
try {
    App.addListener('appStateChange', ({ isActive }) => {
        isAppActive = isActive;
    });
} catch (error) {
    console.log("Capacitor App plugin not available (likely web environment)");
}

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

        // Global listeners for local notifications when backgrounded
        socket.on('newMessage', async (msg) => {
            if (!isAppActive) {
                try {
                    await LocalNotifications.schedule({
                        notifications: [{
                            id: Math.floor(Math.random() * 100000),
                            title: 'New Message',
                            body: msg.content || 'Sent an attachment',
                            schedule: { at: new Date(Date.now() + 100) },
                            sound: null,
                            attachments: null,
                            actionTypeId: "",
                            extra: null
                        }]
                    });
                } catch (e) { console.error("Local notification error", e); }
            }
        });

        socket.on('newLoveMessage', async (msg) => {
            const authUserId = useAuthStore.getState().authUser?.id;
            if (!isAppActive && msg.senderId !== authUserId) {
                try {
                    await LocalNotifications.schedule({
                        notifications: [{
                            id: Math.floor(Math.random() * 100000),
                            title: '💕 Love Message',
                            body: msg.content || (msg.isAI ? 'Sent an AI message' : 'Sent an attachment'),
                            schedule: { at: new Date(Date.now() + 100) },
                        }]
                    });
                } catch (e) { console.error("Local notification error", e); }
            }
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
