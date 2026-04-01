import { create } from 'zustand';
import { api } from './useAuthStore';
import { useSocketStore } from './useSocketStore';

// Named listener refs so we can remove only these specific handlers
let _chatNewMessageHandler = null;
let _chatMessagesSeenHandler = null;

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
            get().markMessagesAsSeen(userId); // Automatically mark as read when chat is opened
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
        const { selectedUser, markMessagesAsSeen } = get();
        if (!selectedUser) return;

        const socket = useSocketStore.getState().socket;

        // Use named refs so we only remove THESE handlers (not the global one in socketStore)
        _chatNewMessageHandler = (newMessage) => {
            if (newMessage.senderId !== selectedUser.id) return;
            set({ messages: [...get().messages, newMessage] });
            markMessagesAsSeen(selectedUser.id);
        };

        _chatMessagesSeenHandler = ({ byUserId }) => {
            if (selectedUser.id === byUserId) {
                set({
                    messages: get().messages.map(msg => ({ ...msg, isRead: true }))
                });
            }
        };

        socket.on('newMessage', _chatNewMessageHandler);
        socket.on('messagesSeen', _chatMessagesSeenHandler);
    },

    unsubscribeFromMessages: () => {
        const socket = useSocketStore.getState().socket;
        if (!socket) return;
        if (_chatNewMessageHandler) {
            socket.off('newMessage', _chatNewMessageHandler);
            _chatNewMessageHandler = null;
        }
        if (_chatMessagesSeenHandler) {
            socket.off('messagesSeen', _chatMessagesSeenHandler);
            _chatMessagesSeenHandler = null;
        }
    },

    markMessagesAsSeen: async (senderId) => {
        try {
            await api.put(`/messages/seen/${senderId}`);
            // Optimistically update our local UI so they appear unread-cleared
            set({
                messages: get().messages.map(msg => 
                    msg.senderId === senderId ? { ...msg, isRead: true } : msg
                )
            });
        } catch (error) {
            console.error('Failed to mark messages as seen:', error);
        }
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

    setSelectedUser: (selectedUser) => {
        // Clear unread count when selecting a user
        if (selectedUser) {
            set({
                users: get().users.map(u =>
                    u.id === selectedUser.id ? { ...u, unreadCount: 0 } : u
                )
            });
        }
        set({ selectedUser });
    },
}));
