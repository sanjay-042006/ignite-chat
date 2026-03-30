import { create } from 'zustand';
import { api } from './useAuthStore';
import { useSocketStore } from './useSocketStore';

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await api.get('/messages/users');
            set({ users: res.data });
        } catch (error) {
            console.error(error);
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await api.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            console.error(error);
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
            const res = await api.post(`/messages/send/${selectedUser.id}`, {
                text: messageData.text,
                mediaUrl: messageData.mediaUrl,
                mediaType: messageData.mediaType,
                replyToId: messageData.replyToId || null,
            });
            set({ messages: [...messages, res.data] });
        } catch (error) {
            console.error(error);
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useSocketStore.getState().socket;

        socket.on('newMessage', (newMessage) => {
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser.id;
            if (!isMessageSentFromSelectedUser) return;

            set({
                messages: [...get().messages, newMessage],
            });
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useSocketStore.getState().socket;
        socket.off('newMessage');
    },

    sendFriendRequest: async (userId) => {
        try {
            await api.post(`/friends/request/${userId}`);
            get().getUsers(); // Refresh the list
        } catch (error) {
            console.error(error);
        }
    },

    acceptFriendRequest: async (requestId) => {
        try {
            await api.post(`/friends/accept/${requestId}`);
            get().getUsers();
        } catch (error) {
            console.error(error);
        }
    },

    rejectFriendRequest: async (requestId) => {
        try {
            await api.post(`/friends/reject/${requestId}`);
            get().getUsers();
        } catch (error) {
            console.error(error);
        }
    },

    setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
