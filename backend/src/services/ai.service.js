import { GoogleGenAI } from '@google/genai';

let ai = null;
try {
    if (process.env.GEMINI_API_KEY) {
        ai = new GoogleGenAI({});
    }
} catch (e) {
    console.warn("Could not initialize GoogleGenAI. AI Features will work in mock mode.");
}

export const correctGrammar = async (text) => {
    try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
            console.warn("GEMINI_API_KEY not found. Returning Mock Mode correction.");
            return `✨ [AI Corrected]: ${text}`;
        }

        const prompt = `Correct the grammar of the following sentence. Only return the corrected sentence without any conversational filler or explanations. If it is already correct, return the same sentence.\n\nSentence: "${text}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let correctedText = response.text.trim();

        // Remove surrounding quotes if the AI added them back
        if (correctedText.startsWith('"') && correctedText.endsWith('"')) {
            correctedText = correctedText.substring(1, correctedText.length - 1);
        }

        return correctedText;
    } catch (error) {
        console.error('Error in AI Grammar Correction:', error.message);
        return `✨ [AI Corrected]: ${text}`;
    }
};

export const evaluateGroupStory = async (groupId) => {
    try {
        const { default: prisma } = await import('../lib/db.js');
        const { io } = await import('../lib/socket.js');

        const group = await prisma.storyGroup.findUnique({
            where: { id: groupId },
            include: { entries: { orderBy: { dayNumber: 'asc' } } }
        });

        if (!group || group.entries.length === 0) {
            // No entries — just mark as completed
            await prisma.storyGroup.update({
                where: { id: groupId },
                data: { status: 'COMPLETED', title: `${group?.genre || 'Untitled'} Story` }
            });
            return;
        }

        let storyTitle = `The ${group.genre} Chronicles`;
        let explanation = "Mock AI Evaluation: A great collaborative effort!";
        let winningEntry = group.entries[Math.floor(Math.random() * group.entries.length)];
        let bestTurningPoint = "The plot twist on entry " + winningEntry.dayNumber;
        let formattedStoryFallback = group.entries.map(e => e.content).join("\n\n");
        let finalFormattedStory = formattedStoryFallback;

        if (ai) {
            const storyText = group.entries.map(e => `Entry ${e.dayNumber} (User ${e.userId}): ${e.content}`).join("\n");
            const prompt = `You are a literary critic and editor evaluating a collaborative story of genre "${group.genre}".
Here is the story entry by entry:
${storyText}

1. Create a compelling, creative title for this story.
2. Evaluate the story for creativity, plot development, and emotional impact.
3. Determine which User made the most impactful or creative contribution (the "turning point" or best moment).
4. Assemble all the entries into a single cohesive, formatted story. Fix any obvious disjointed sentences, ensure smooth transitions between entries, and format it nicely into paragraphs like a real book.
5. Return ONLY a JSON object with this exact structure:
{
  "storyTitle": "A creative title for this story",
  "winnerUserId": "the exact User ID of the winning contribution",
  "aiExplanation": "A short 2-3 sentence explanation of why they won and what made the story good",
  "bestTurningPoint": "A short description of their specific impactful contribution",
  "formattedStory": "The fully assembled and polished story text with proper paragraphs"
}
Output only valid JSON, no markdown blocks.`;

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });

                // Clean markdown response if any
                const text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                const result = JSON.parse(text);

                // Verify the user actually exists in this group
                const validWinner = group.entries.find(e => e.userId === result.winnerUserId);
                if (validWinner) {
                    winningEntry = validWinner;
                    explanation = result.aiExplanation;
                    bestTurningPoint = result.bestTurningPoint;
                    finalFormattedStory = result.formattedStory || formattedStoryFallback;
                }
                if (result.storyTitle) {
                    storyTitle = result.storyTitle;
                }
            } catch (aiErr) {
                console.error("AI Story Evaluation parsing failed, using fallback.", aiErr.message);
            }
        }

        const result = await prisma.storyResult.create({
            data: {
                groupId,
                winnerUserId: winningEntry.userId,
                aiExplanation: explanation,
                bestTurningPoint
            },
            include: { winnerUser: { select: { username: true } } }
        });

        await prisma.storyGroup.update({
            where: { id: groupId },
            data: {
                status: 'COMPLETED',
                title: storyTitle,
                formattedStory: finalFormattedStory
            }
        });

        io.to(`story_${groupId}`).emit('story_group_winner_announced', result);

    } catch (err) {
        console.error("Error evaluating group story:", err);
    }
};

export const evaluateGlobalStories = async () => {
    try {
        const { default: prisma } = await import('./db.js');
        const { io } = await import('./socket.js');

        // Find stories completed in the last evaluated cycle (e.g., those without a global evaluation yet)
        const unjudgedCompletedGroups = await prisma.storyGroup.findMany({
            where: {
                status: 'COMPLETED',
                globalResults: { none: {} } // Has no global result
            },
            include: { entries: { orderBy: { dayNumber: 'asc' } } }
        });

        // We need at least 2 stories to run a competition
        if (unjudgedCompletedGroups.length < 2) return;

        let winningGroup = unjudgedCompletedGroups[0];
        let explanation = "Mock AI Global Eval: The most consistent tone across all 30 days.";
        let score = 85;

        // If AI is enabled, evaluate them against each other
        if (ai) {
            const storiesPayload = unjudgedCompletedGroups.map(g => {
                const text = g.entries.map(e => e.content).join(" ");
                return `Story ID: ${g.id}\nGenre: ${g.genre}\nStory:\n${text}\n---`;
            }).join("\n");

            const prompt = `You are a master literary judge. I am giving you ${unjudgedCompletedGroups.length} completed collaborative stories.
${storiesPayload}

1. Evaluate all stories based on originality, genre consistency, emotional impact, and storytelling quality.
2. Select the single best story among them.
3. Return ONLY a JSON object with this exact structure:
{
  "winningStoryId": "the exact Story ID of the best story",
  "aiExplanation": "A short 2-3 sentence explanation of why this story won the global competition.",
  "storyScore": a number between 1 and 100 representing its overall quality
}
Output only valid JSON, no markdown blocks.`;

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });

                const text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                const result = JSON.parse(text);

                const validWinner = unjudgedCompletedGroups.find(g => g.id === result.winningStoryId);
                if (validWinner) {
                    winningGroup = validWinner;
                    explanation = result.aiExplanation;
                    score = result.storyScore;
                }
            } catch (aiErr) {
                console.error("AI Global Evaluation parsing failed.", aiErr.message);
            }
        }

        // Set the global winner flag
        await prisma.storyGroup.update({
            where: { id: winningGroup.id },
            data: { isGlobalWinner: true }
        });

        // Save result
        const globalRes = await prisma.globalStoryResult.create({
            data: {
                storyGroupId: winningGroup.id,
                aiExplanation: explanation,
                storyScore: score
            }
        });

        // Emit to everyone connected
        io.emit('global_story_winner_announced', {
            storyId: winningGroup.id,
            genre: winningGroup.genre,
            score
        });

    } catch (err) {
        console.error("Error evaluating global stories:", err);
    }
};

export const generateLoveAIChat = async (messages, user1, user2) => {
    const mockMessages = [
        { sendAs: user1.id, content: `Hey ${user2.username}, you know what I was thinking about today? 💭` },
        { sendAs: user2.id, content: `Oh really? Tell me everything! 😊` },
        { sendAs: user1.id, content: `How lucky I am to have you in my life ❤️` },
        { sendAs: user2.id, content: `Aww stop it, you're making me blush! 🥰` },
        { sendAs: user1.id, content: `No seriously, every moment with you is special ✨` },
        { sendAs: user2.id, content: `You always know the right things to say... I feel the same way about you 💕` },
        { sendAs: user1.id, content: `Let's plan something fun this weekend! What do you say? 🎉` },
    ];

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '' || !ai) {
        console.warn("GEMINI_API_KEY not found. Returning mock AI love chat.");
        return mockMessages;
    }

    try {
        const chatHistory = messages.map(m =>
            `${m.sender?.username || 'Unknown'}: ${m.content}`
        ).join('\n');

        const prompt = `You are an AI that mimics how two people chat with each other for fun/entertainment.

Here is a real conversation between "${user1.username}" and "${user2.username}":
${chatHistory || '(No messages yet — they just started chatting!)'}

Now, generate exactly 7 new messages that continue this conversation naturally, perfectly mimicking each person's tone, vocabulary, emoji usage, and personality. The messages should be playful, sweet, and entertaining — this is a fun love chat feature.

Return ONLY a JSON array with this exact format:
[
  { "sendAs": "${user1.id}", "content": "message text" },
  { "sendAs": "${user2.id}", "content": "message text" },
  ...
]

Rules:
- Alternate between ${user1.username} (id: ${user1.id}) and ${user2.username} (id: ${user2.id})
- Start with ${user1.username}
- Keep the same vibe, slang, and emoji patterns they used
- Make it romantic, funny, and entertaining
- Output only valid JSON, no markdown blocks`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(text);

        // Validate the result
        if (Array.isArray(result) && result.length > 0 && result[0].sendAs && result[0].content) {
            return result.slice(0, 7);
        }

        return mockMessages;
    } catch (error) {
        console.error('Error in generateLoveAIChat:', error.message);
        return mockMessages;
    }
};

