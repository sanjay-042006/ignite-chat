import cron from 'node-cron';
import prisma from './db.js';
import { io } from './socket.js';

export const startCronJobs = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();

            // Find sessions that just expired but are still marked active
            const expiredSessions = await prisma.anonymousSession.findMany({
                where: {
                    isActive: true,
                    expiresAt: {
                        lte: now
                    }
                }
            });

            if (expiredSessions.length > 0) {
                // Mark them inactive
                await prisma.anonymousSession.updateMany({
                    where: {
                        id: { in: expiredSessions.map(s => s.id) }
                    },
                    data: { isActive: false }
                });

                console.log(`Cleaned up ${expiredSessions.length} expired anonymous sessions.`);

                // Note: We could map sessions back to groups to explicitly broadcast "Anonymous mode ended"
                // But for simplicity, we'll let the frontend rely on its own countdown timer sync
            }

            // Cleanup expired Interest Rooms
            const expiredInterestRooms = await prisma.interestRoom.findMany({
                where: {
                    expiresAt: { lte: now }
                }
            });

            if (expiredInterestRooms.length > 0) {
                await prisma.interestRoomMember.deleteMany({
                    where: { roomId: { in: expiredInterestRooms.map(r => r.id) } }
                });

                await prisma.interestRoom.deleteMany({
                    where: { id: { in: expiredInterestRooms.map(r => r.id) } }
                });

                console.log(`Cleaned up ${expiredInterestRooms.length} expired interest rooms.`);
            }

        } catch (error) {
            console.error('Error in cron job cleanup:', error.message);
        }
    });

    console.log('Cron scheduler initialized.');
};
