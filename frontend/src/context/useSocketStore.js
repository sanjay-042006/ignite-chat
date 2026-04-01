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

    connectSocket: async () => {
        const { authUser } = useAuthStore.getState();
        if (!authUser || get().socket) return;

        try {
            const { display } = await LocalNotifications.checkPermissions();
            if (display !== 'granted') {
                await LocalNotifications.requestPermissions();
            }
        } catch (e) { console.log("Local notifications permission error (likely web):", e); }

        const token = localStorage.getItem('jwt');

        const socket = io(BASE_URL, {
            withCredentials: true,
            transports: ['polling', 'websocket'],
            auth: { token },
            autoConnect: false,
        });

        socket.on('getOnlineUsers', (userIds) => {
            set({ onlineUsers: userIds });
        });

        // ── GLOBAL: Direct message notification + unread badge ──
        socket.on('newMessage', async (msg) => {
            // Increment unread count in chat store (lazy import to avoid circular deps)
            const { useChatStore } = await import('./useChatStore');
            const chatState = useChatStore.getState();
            // Only increment if this sender is NOT the currently open chat
            if (!chatState.selectedUser || chatState.selectedUser.id !== msg.senderId) {
                useChatStore.setState({
                    users: chatState.users.map(u =>
                        u.id === msg.senderId
                            ? { ...u, unreadCount: (u.unreadCount || 0) + 1 }
                            : u
                    )
                });
            }

            if (!isAppActive) {
                try {
                    await LocalNotifications.schedule({
                        notifications: [{
                            id: Math.floor(Math.random() * 100000),
                            title: 'New Message',
                            body: msg.content || 'Sent an attachment',
                            sound: null,
                            attachments: null,
                            actionTypeId: "",
                            extra: null
                        }]
                    });
                } catch (e) { console.error("Local notification error", e); }
            }
        });

        // ── GLOBAL: Group message notification + unread badge ──
        socket.on('newGroupMessage', async (msg) => {
            const authUserId = useAuthStore.getState().authUser?.id;
            if (msg.senderId === authUserId) return; // Don't count own messages

            const { useGroupStore } = await import('./useGroupStore');
            const groupState = useGroupStore.getState();
            // Only increment if this group is NOT the currently open group
            if (!groupState.selectedGroup || groupState.selectedGroup.id !== msg.groupId) {
                useGroupStore.setState({
                    groups: groupState.groups.map(g =>
                        g.id === msg.groupId
                            ? { ...g, unreadCount: (g.unreadCount || 0) + 1 }
                            : g
                    )
                });
            }

            if (!isAppActive) {
                try {
                    await LocalNotifications.schedule({
                        notifications: [{
                            id: Math.floor(Math.random() * 100000),
                            title: '👥 Group Message',
                            body: msg.content || 'Sent an attachment',
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
            if (msg.senderId === authUserId) return;

            const { useLoveStore } = await import('./useLoveStore');
            const loveState = useLoveStore.getState();
            // Only increment if not current selected connection
            if (!loveState.selectedConnection || loveState.selectedConnection.id !== msg.connectionId) {
                useLoveStore.setState({
                    connections: loveState.connections.map(c => 
                        c.id === msg.connectionId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
                    )
                });
            }

            if (!isAppActive) {
                try {
                    await LocalNotifications.schedule({
                        notifications: [{
                            id: Math.floor(Math.random() * 100000),
                            title: '💕 Love Message',
                            body: msg.content || (msg.isAI ? 'Sent an AI message' : 'Sent an attachment'),
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
