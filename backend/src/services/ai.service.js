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
        const { default: prisma } = await import('./db.js');
        const { io } = await import('./socket.js');

        const group = await prisma.storyGroup.findUnique({
            where: { id: groupId },
            include: { entries: { orderBy: { dayNumber: 'asc' } } }
        });

        if (!group || group.entries.length === 0) return;

        let explanation = "Mock AI Evaluation: A great collaborative effort!";
        let winningEntry = group.entries[Math.floor(Math.random() * group.entries.length)];
        let bestTurningPoint = "The plot twist on day " + winningEntry.dayNumber;
        let formattedStoryFallback = group.entries.map(e => e.content).join("\n\n");
        let finalFormattedStory = formattedStoryFallback;

        if (ai) {
            const storyText = group.entries.map(e => `Day ${e.dayNumber} (User ${e.userId}): ${e.content}`).join("\n");
            const prompt = `You are a literary critic and editor evaluating a 30-day collaborative story of genre "${group.genre}".
Here is the story day by day:
${storyText}

1. Evaluate the story for creativity, plot development, and emotional impact.
2. Determine which User made the most impactful or creative contribution (the "turning point" or best moment).
3. Assemble the 30 daily entries into a single cohesive, formatted story. Fix any obvious disjointed sentences, ensure smooth transitions between entries, and format it nicely into paragraphs like a real book.
4. Return ONLY a JSON object with this exact structure:
{
  "winnerUserId": "the exact User ID of the winning contribution",
  "aiExplanation": "A short 2-3 sentence explanation of why they won and what made the story good",
  "bestTurningPoint": "A short description of their specific impactful contribution",
  "formattedStory": "The fully assembled and polished 30-day story text with proper paragraphs"
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
