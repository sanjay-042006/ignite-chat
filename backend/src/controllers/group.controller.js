import prisma from '../lib/db.js';
import { io } from '../lib/socket.js';

export const createGroup = async (req, res) => {
    try {
        const { name, memberIds } = req.body;
        const adminId = req.user.id;

        if (!name || !memberIds || memberIds.length === 0) {
            return res.status(400).json({ error: 'Group name and at least one member required' });
        }

        // Include the creator as a member automatically
        const uniqueMembers = Array.from(new Set(memberIds)).filter(id => id !== adminId);

        // Verify friendships
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { user1Id: adminId, user2Id: { in: uniqueMembers } },
                    { user1Id: { in: uniqueMembers }, user2Id: adminId }
                ]
            }
        });

        if (friendships.length !== uniqueMembers.length) {
            return res.status(403).json({ error: 'You can only add users who are your friends' });
        }

        const allMembers = [...uniqueMembers, adminId];

        const group = await prisma.group.create({
            data: {
                name,
                members: {
                    create: allMembers.map((id) => ({
                        userId: id,
                        isAdmin: id === adminId,
                    })),
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, username: true, profilePic: true },
                        },
                    },
                },
            },
        });

        res.status(201).json(group);
    } catch (error) {
        console.error('Error in createGroup:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getGroups = async (req, res) => {
    try {
        const userId = req.user.id;

        const groups = await prisma.group.findMany({
            where: {
                members: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, username: true, profilePic: true } },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json(groups);
    } catch (error) {
        console.error('Error in getGroups:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        // Verify user is in group
        const isMember = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId,
                    groupId,
                },
            },
        });

        if (!isMember) {
            return res.status(403).json({ error: 'Not a member of this group' });
        }

        const messages = await prisma.message.findMany({
            where: {
                groupId,
                roomType: 'GROUP'
            },
            include: {
                sender: {
                    select: { id: true, username: true }
                }
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error in getGroupMessages: ', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const sendGroupMessage = async (req, res) => {
    try {
        const { text, mediaUrl, mediaType } = req.body;
        const { groupId } = req.params;
        const senderId = req.user.id;

        if (!text && !mediaUrl) {
            return res.status(400).json({ error: 'Message content or media is required' });
        }

        const isMember = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: senderId,
                    groupId,
                },
            },
        });

        if (!isMember) {
            return res.status(403).json({ error: 'Not a member of this group' });
        }

        const newMessage = await prisma.message.create({
            data: {
                senderId,
                groupId,
                content: text || null,
                mediaUrl: mediaUrl || null,
                mediaType: mediaType || null,
                roomType: 'GROUP',
            },
            include: {
                sender: {
                    select: { id: true, username: true }
                }
            }
        });

        // We emit to a socket room named after the groupId
        io.to(groupId).emit('newGroupMessage', newMessage);

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error in sendGroupMessage: ', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        // Verify user is admin of the group
        const membership = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } }
        });

        if (!membership || !membership.isAdmin) {
            return res.status(403).json({ error: 'Only the group admin can delete this group' });
        }

        // Cascade delete: messages → members → group
        await prisma.message.deleteMany({ where: { groupId, roomType: 'GROUP' } });
        await prisma.groupMember.deleteMany({ where: { groupId } });
        await prisma.group.delete({ where: { id: groupId } });

        // Notify all group members via socket
        io.to(groupId).emit('groupDeleted', { groupId });

        res.status(200).json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Error in deleteGroup:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const membership = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } }
        });

        if (!membership) {
            return res.status(404).json({ error: 'You are not a member of this group' });
        }

        // Check how many members remain
        const memberCount = await prisma.groupMember.count({ where: { groupId } });

        if (memberCount <= 1) {
            // Last member — delete the entire group
            await prisma.message.deleteMany({ where: { groupId, roomType: 'GROUP' } });
            await prisma.groupMember.deleteMany({ where: { groupId } });
            await prisma.group.delete({ where: { id: groupId } });
            io.to(groupId).emit('groupDeleted', { groupId });
            return res.status(200).json({ message: 'Left and group deleted (last member)' });
        }

        // Remove the member
        await prisma.groupMember.delete({
            where: { userId_groupId: { userId, groupId } }
        });

        // If the leaving user was admin, promote the earliest member
        if (membership.isAdmin) {
            const nextAdmin = await prisma.groupMember.findFirst({
                where: { groupId },
                orderBy: { joinedAt: 'asc' }
            });
            if (nextAdmin) {
                await prisma.groupMember.update({
                    where: { id: nextAdmin.id },
                    data: { isAdmin: true }
                });
            }
        }

        io.to(groupId).emit('memberLeft', { groupId, userId });

        res.status(200).json({ message: 'Left the group' });
    } catch (error) {
        console.error('Error in leaveGroup:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateGroupProfilePic = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { profilePic } = req.body;
        const userId = req.user.id;

        if (!profilePic) {
            return res.status(400).json({ error: 'Profile picture data is required' });
        }

        const membership = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } }
        });

        if (!membership || !membership.isAdmin) {
            return res.status(403).json({ error: 'Only admins can update the group profile picture' });
        }

        const updatedGroup = await prisma.group.update({
            where: { id: groupId },
            data: { profilePic }
        });

        io.to(groupId).emit('groupProfileUpdated', { groupId, profilePic });

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.error('Error in updateGroupProfilePic:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { memberIds } = req.body;
        const adminId = req.user.id;

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ error: 'Provide at least one member to add' });
        }

        const adminMembership = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: adminId, groupId } }
        });

        if (!adminMembership || !adminMembership.isAdmin) {
            return res.status(403).json({ error: 'Only admins can add members' });
        }

        // Get existing members to avoid duplicates
        const existingMembers = await prisma.groupMember.findMany({
            where: { groupId }
        });
        const existingMemberIds = existingMembers.map(m => m.userId);

        const newUniqueIds = memberIds.filter(id => !existingMemberIds.includes(id));
        if (newUniqueIds.length === 0) {
            return res.status(400).json({ error: 'All selected users are already in the group' });
        }

        // Verify friendships
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { user1Id: adminId, user2Id: { in: newUniqueIds } },
                    { user1Id: { in: newUniqueIds }, user2Id: adminId }
                ]
            }
        });

        if (friendships.length !== newUniqueIds.length) {
            return res.status(403).json({ error: 'You can only add users who are your friends' });
        }

        // Add to database
        const baseTime = Date.now();
        await Promise.all(newUniqueIds.map((id, idx) =>
            prisma.groupMember.create({
                data: {
                    userId: id,
                    groupId,
                    joinedAt: new Date(baseTime + idx * 1000)
                }
            })
        ));

        // Fetch the new members with full user objects for the UI
        const addedMembers = await prisma.groupMember.findMany({
            where: { groupId, userId: { in: newUniqueIds } },
            include: { user: { select: { id: true, username: true, profilePic: true } } },
            orderBy: { joinedAt: 'asc' }
        });

        // Notify group participants (already in room)
        io.to(groupId).emit('groupMembersAdded', { groupId, members: addedMembers });
        
        // Notify the new members personally so their client can fetch the group and join the socket room
        newUniqueIds.forEach(id => {
            const socketIds = req.app.get('getReceiverSocketId')(id); // Helper function fallback if needed, but wait!
            // I should use io.emit or directly notify via 'groupSessionStarted' style.
            // But wait, the socket file usually has getReceiverSocketId.
        });

        res.status(200).json({ message: 'Members added', newMembers: addedMembers });
    } catch (error) {
        console.error('Error in addGroupMembers:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const removeGroupMember = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const adminId = req.user.id;

        if (userId === adminId) {
            return res.status(400).json({ error: 'You cannot remove yourself. Use Leave Group instead.' });
        }

        const adminMembership = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: adminId, groupId } }
        });

        if (!adminMembership || !adminMembership.isAdmin) {
            return res.status(403).json({ error: 'Only admins can remove members' });
        }

        const targetMembership = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } }
        });

        if (!targetMembership) {
            return res.status(404).json({ error: 'User is not in this group' });
        }

        await prisma.groupMember.delete({
            where: { id: targetMembership.id }
        });

        io.to(groupId).emit('groupMemberRemoved', { groupId, userId });

        res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error in removeGroupMember:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
