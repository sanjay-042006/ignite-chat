import { create } from 'zustand';
import { api } from './useAuthStore';
import { useSocketStore } from './useSocketStore';

export const useGroupStore = create((set, get) => ({
    groups: [],
    selectedGroup: null,
    isGroupsLoading: false,
    isGroupMessagesLoading: false,
    groupMessages: [],

    getGroups: async () => {
        set({ isGroupsLoading: true });
        try {
            const res = await api.get('/groups');
            set({ groups: res.data });
        } catch (error) {
            console.error(error);
        } finally {
            set({ isGroupsLoading: false });
        }
    },

    setSelectedGroup: (group) => set({ selectedGroup: group }),


    createGroup: async (name, memberIds) => {
        try {
            const res = await api.post('/groups', { name, memberIds });
            set((state) => ({ groups: [res.data, ...state.groups] }));

            // Tell socket to join this new room
            const socket = useSocketStore.getState().socket;
            if (socket) {
                socket.emit('joinGroup', res.data.id);
            }
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    getGroupMessages: async (groupId) => {
        set({ isGroupMessagesLoading: true });
        try {
            const res = await api.get(`/groups/${groupId}/messages`);
            set({ groupMessages: res.data });
        } catch (error) {
            console.error(error);
        } finally {
            set({ isGroupMessagesLoading: false });
        }
    },

    sendGroupMessage: async (groupId, messageData) => {
        try {
            const res = await api.post(`/groups/${groupId}/send`, messageData);
            // We don't append manually, socket listener will append it if connected properly
            // If we want immediate feedback, we can optimistically append
        } catch (error) {
            console.error(error);
        }
    },

    setSelectedGroup: (selectedGroup) => {
        // Clear unread badge when opening a group
        if (selectedGroup) {
            set({
                groups: get().groups.map(g =>
                    g.id === selectedGroup.id ? { ...g, unreadCount: 0 } : g
                )
            });
            // Mark as read on the server
            api.put(`/groups/${selectedGroup.id}/read`).catch(() => {});
        }
        set({ selectedGroup });
        if (selectedGroup) {
            get().getGroupMessages(selectedGroup.id);
        } else {
            set({ groupMessages: [] });
        }
    },

    subscribeToGroupMessages: () => {
        const { selectedGroup } = get();
        if (!selectedGroup) return;

        const socket = useSocketStore.getState().socket;

        socket.on('newGroupMessage', (newMessage) => {
            // Only append if it belongs to the currently selected group
            if (newMessage.groupId === get().selectedGroup?.id) {
                set((state) => ({
                    groupMessages: [...state.groupMessages, newMessage]
                }));
            }
        });

        socket.on('anonymousModeToggled', (data) => {
            // Here we could handle UI state changes explicitly or let the chat container handle it
            console.log("Anonymous Mode Toggle Event:", data);
        });

        socket.on('groupProfileUpdated', ({ groupId, profilePic }) => {
            set((state) => ({
                groups: state.groups.map(g => g.id === groupId ? { ...g, profilePic } : g),
                selectedGroup: state.selectedGroup?.id === groupId ? { ...state.selectedGroup, profilePic } : state.selectedGroup
            }));
        });

        socket.on('groupMembersAdded', ({ groupId, members }) => {
            set((state) => {
                const groupFilter = g => g.id === groupId;
                const updateGroup = g => ({ ...g, members: [...(g.members || []), ...members] });

                return {
                    groups: state.groups.map(g => groupFilter(g) ? updateGroup(g) : g),
                    selectedGroup: state.selectedGroup?.id === groupId ? updateGroup(state.selectedGroup) : state.selectedGroup
                };
            });
        });

        socket.on('groupMemberRemoved', ({ groupId, userId }) => {
            set((state) => {
                const groupFilter = g => g.id === groupId;
                const updateGroup = g => ({ ...g, members: (g.members || []).filter(m => m.userId !== userId) });

                // If WE are the ones who were removed:
                const myId = useAuthStore.getState().authUser?.id;
                if (userId === myId && state.selectedGroup?.id === groupId) {
                    return {
                        groups: state.groups.filter(g => g.id !== groupId),
                        selectedGroup: null,
                    };
                }

                return {
                    groups: state.groups.map(g => groupFilter(g) ? updateGroup(g) : g),
                    selectedGroup: state.selectedGroup?.id === groupId ? updateGroup(state.selectedGroup) : state.selectedGroup
                };
            });
        });
    },

    unsubscribeFromGroupMessages: () => {
        const socket = useSocketStore.getState().socket;
        if (socket) {
            socket.off('newGroupMessage');
            socket.off('anonymousModeToggled');
            socket.off('groupProfileUpdated');
            socket.off('groupMembersAdded');
            socket.off('groupMemberRemoved');
        }
    },

    deleteGroup: async (groupId) => {
        try {
            await api.delete(`/groups/${groupId}`);
            set((state) => ({
                groups: state.groups.filter(g => g.id !== groupId),
                selectedGroup: state.selectedGroup?.id === groupId ? null : state.selectedGroup,
                groupMessages: state.selectedGroup?.id === groupId ? [] : state.groupMessages,
            }));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    leaveGroup: async (groupId) => {
        try {
            await api.post(`/groups/${groupId}/leave`);
            set((state) => ({
                groups: state.groups.filter(g => g.id !== groupId),
                selectedGroup: state.selectedGroup?.id === groupId ? null : state.selectedGroup,
                groupMessages: state.selectedGroup?.id === groupId ? [] : state.groupMessages,
            }));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    updateGroupProfilePic: async (groupId, profilePic) => {
        try {
            const res = await api.put(`/groups/${groupId}/profile-pic`, { profilePic });
            set((state) => ({
                groups: state.groups.map(g => g.id === groupId ? { ...g, profilePic: res.data.profilePic } : g),
                selectedGroup: state.selectedGroup?.id === groupId ? { ...state.selectedGroup, profilePic: res.data.profilePic } : state.selectedGroup
            }));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    addGroupMembers: async (groupId, memberIds) => {
        try {
            await api.post(`/groups/${groupId}/members`, { memberIds });
            // Let the socket listener handle the state update
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    removeGroupMember: async (groupId, userId) => {
        try {
            await api.delete(`/groups/${groupId}/members/${userId}`);
            // Let the socket listener handle the state update
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
}));
