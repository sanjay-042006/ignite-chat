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

            // Auto-break love connections after 5 days
            const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
            const expiredBreakups = await prisma.loveConnection.findMany({
                where: {
                    status: 'BREAKING_UP',
                    breakupInitiatedAt: { lte: fiveDaysAgo }
                }
            });

            for (const conn of expiredBreakups) {
                await prisma.loveMessage.deleteMany({ where: { connectionId: conn.id } });
                await prisma.loveConnection.delete({ where: { id: conn.id } });
                io.to(`love_${conn.id}`).emit('breakupCompleted', { connectionId: conn.id });
                console.log(`Auto-broke love connection ${conn.id} after 5-day cooldown.`);
            }

        } catch (error) {
            console.error('Error in cron job cleanup:', error.message);
        }
    });

    console.log('Cron scheduler initialized.');
};
