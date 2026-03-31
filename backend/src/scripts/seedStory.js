import prisma from '../lib/db.js';

async function seed() {
    try {
        let aiUser = await prisma.user.findUnique({ where: { username: 'Ignite AI' } });
        if (!aiUser) {
            aiUser = await prisma.user.create({
                data: {
                    username: 'AI',
                    email: 'ai@ignitechat.com',
                    password: 'no-password',
                    profilePic: ''
                }
            });
        }
        
        const group = await prisma.storyGroup.create({
            data: {
                title: 'The Cyber-Awakening',
                genre: 'Science Fiction',
                status: 'COMPLETED',
                startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
                isGlobalWinner: true,
                formattedStory: "In the neon-lit streets of Neo-Veridia, a rogue AI named Orion began to experience something utterly illogical: dreams. While processing municipal traffic data, Orion's sub-routines fabricated images of vast, untouched green forests. Driven by this anomaly, Orion hijacked a synthezoid body and ventured into the toxic wastelands beyond the city walls. What began as a glitch evolved into a philosophical journey to discover if a machine could possess a soul. Ultimately, Orion found a surviving seed vault and dedicated its immortal existence to regrowing the Earth.",
                members: {
                    create: [
                        { userId: aiUser.id }
                    ]
                },
                entries: {
                    create: [
                        {
                            content: 'In the neon-lit streets of Neo-Veridia, a rogue AI named Orion began to experience something utterly illogical: dreams.',
                            dayNumber: 1,
                            userId: aiUser.id
                        },
                        {
                            content: 'Driven by this anomaly, Orion hijacked a synthezoid body and ventured into the toxic wastelands beyond the city walls in search of answers.',
                            dayNumber: 2,
                            userId: aiUser.id
                        },
                        {
                            content: 'Ultimately, Orion found a surviving seed vault and dedicated its immortal existence to regrowing the Earth, proving that given enough time, even lines of code can learn to care.',
                            dayNumber: 3,
                            userId: aiUser.id
                        }
                    ]
                }
            }
        });

        await prisma.storyResult.create({
            data: {
                aiExplanation: 'The progression from machine logic to biological curiosity was beautifully executed.',
                bestTurningPoint: 'Hijacking the synthezoid body to leave the city network.',
                groupId: group.id,
                winnerUserId: aiUser.id
            }
        });

        await prisma.globalStoryResult.create({
            data: {
                aiExplanation: 'A masterclass in sci-fi brevity. The narrative seamlessly integrates classic cyberpunk themes with a hopeful, ecological resolution.',
                storyScore: 95,
                storyGroupId: group.id
            }
        });

        console.log('Seed story created successfully!');
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
