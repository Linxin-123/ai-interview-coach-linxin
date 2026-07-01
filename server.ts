import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY environment variable is not defined. AI evaluation features will use mock fallback.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST API for checking API configuration
app.get("/api/config", (req, res) => {
  res.json({
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Mock fallback generator in case API key is missing or fails
function getMockComprehensiveFeedback(role: string, roundType: number, answers: any[]) {
  return {
    score: 87,
    confidenceRating: 4,
    grammarScore: 84,
    vocabularyScore: 83,
    fluencyScore: 88,
    encouragingComment: "Outstanding perseverance! Practicing speaking completely in English can be daunting, but you completed the entire round with impressive focus. Your delivery has solid technical foundation, and you clearly understand critical business metrics. By integrating stronger action verbs and practicing pacing, you will sound like a fully seasoned global specialist!",
    generalStrengths: [
      "Demonstrated robust domain knowledge and structural logical thinking.",
      "Maintained structured descriptions of project tasks and processes.",
      "Clear, audible rhythm with highly professional tone."
    ],
    questionsFeedback: (answers || []).map((ans, idx) => ({
      questionId: ans.questionId || `q_${idx}`,
      questionText: ans.questionText || "Core interview topic",
      strength: "Expressed key deliverables clearly with relevant terminology.",
      phraseUpgrade: {
        original: ans.userAnswer && ans.userAnswer.length > 20 ? ans.userAnswer.slice(0, 50) + "..." : "I worked on this and resolved it.",
        upgraded: "I spear-headed the resolution by implementing a highly structured diagnostic pipeline...",
        explanation: "Active, ownership-oriented verbs highlight leadership and core capability in global interviews."
      },
      suggestedStarAnswer: `For this question, always apply the STAR model:
- Situation: In my previous project, we faced a critical challenge regarding this metric.
- Task: I was responsible for identifying root causes and setting up recovery actions.
- Action: I collaborated with cross-functional teams, cleaned our source data, and optimized our metrics.
- Result: Ultimately, we successfully resolved the issue, improving performance and team efficiency.`
    }))
  };
}

// POST endpoint to evaluate user's mock interview answers
app.post("/api/evaluate", async (req, res) => {
  const { role, accent, roundType, answers } = req.body;

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "Answers array is required for comprehensive evaluation." });
  }

  const ai = getAiClient();
  if (!ai) {
    // No API key: let the CLIENT compute the real local analysis (pronunciation/fluency/relevance).
    return res.status(503).json({ error: "no-api-key", useLocal: true });
  }

  try {
    const prompt = `
You are a highly supportive, world-class Silicon Valley English Interview Coach. 
Your objective is to evaluate a candidate's overall performance during an English interview session, and provide highly encouraging, comprehensive feedback to build their confidence.
The candidate is a non-native English speaker practicing spoken answers for job roles abroad.

Job Role Focus: ${role}
Accent Selection: ${accent}
Interview Round Type Focus: Round ${roundType} (1: Recruiter screen, 2: Behavioral, 3: Technical)

Here is the list of questions asked, and the candidate's spoken answers (transcribed silently):
${JSON.stringify(answers, null, 2)}

Please evaluate their performance across all these questions and return a single, beautifully structured JSON object matching the requested schema.
Be EXTREMELY encouraging, constructive, and warm in your "encouragingComment" (usually over 100 words, high-spirited, acknowledging how brave they are to practice).

Please provide:
1. score: An overall mock score (0 to 100) that motivates the candidate. (Prefer 75-96 to boost confidence unless answers are empty or totally unrelated).
2. confidenceRating: An integer 1 to 5.
3. pronunciationScore: Integer 0-100 for clarity/intelligibility (infer from how clean and understandable the transcribed answer reads).
4. fluencyScore: Integer 0-100 for pacing, natural flow, and absence of filler words (um, like, you know).
5. relevanceScore: Integer 0-100 for how directly each answer addressed the specific question asked.
6. encouragingComment: A highly motivating, compassionate overview in English, acknowledging the candidate's strengths and giving them a warm boost of confidence.
7. generalStrengths: An array of 3 specific global strengths shown in the candidate's responses.
8. dimensionNotes: An object { pronunciation, fluency, relevance } — for EACH, one specific, professional, actionable sentence referring to what the candidate actually said and how to improve it.
9. questionsFeedback: An array matching the exact questions answered, where each item contains:
   - questionId: The question's ID.
   - questionText: The full text of the question.
   - strength: A specific point where their answer to this specific question was strong.
   - phraseUpgrade: An object with { original, upgraded, explanation }:
     * original: The exact simple or slightly awkward phrase/sentence from their answer. If their answer was too short or empty, provide a general phrase they might have said.
     * upgraded: A highly professional, native-sounding alternative.
     * explanation: A friendly explanation of why the upgraded version sounds better and more persuasive in an international interview.
   - suggestedStarAnswer: A complete, beautifully polished sample answer utilizing the STAR (Situation, Task, Action, Result) method, custom tailored to this candidate's role and question, which they can read, copy, and practice to sound like a native professional.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Overall score out of 100" },
            confidenceRating: { type: Type.INTEGER, description: "Confidence star rating from 1 to 5" },
            pronunciationScore: { type: Type.INTEGER, description: "Pronunciation/clarity subscore 0-100" },
            fluencyScore: { type: Type.INTEGER, description: "Fluency subscore 0-100" },
            relevanceScore: { type: Type.INTEGER, description: "Relevance-to-question subscore 0-100" },
            encouragingComment: { type: Type.STRING, description: "Deeply warm, positive, encouraging overall critique highlighting achievements" },
            generalStrengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 general strengths bullets"
            },
            dimensionNotes: {
              type: Type.OBJECT,
              properties: {
                pronunciation: { type: Type.STRING, description: "Specific actionable pronunciation/clarity note" },
                fluency: { type: Type.STRING, description: "Specific actionable fluency note" },
                relevance: { type: Type.STRING, description: "Specific actionable relevance note" }
              },
              required: ["pronunciation", "fluency", "relevance"]
            },
            questionsFeedback: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionId: { type: Type.STRING, description: "The ID of the question" },
                  questionText: { type: Type.STRING, description: "The text of the question" },
                  strength: { type: Type.STRING, description: "Specific strong point for this question" },
                  phraseUpgrade: {
                    type: Type.OBJECT,
                    properties: {
                      original: { type: Type.STRING, description: "Awkward or basic phrase from candidate" },
                      upgraded: { type: Type.STRING, description: "Polished native-level professional alternative" },
                      explanation: { type: Type.STRING, description: "Brief friendly explanation of why this upgrade helps" }
                    },
                    required: ["original", "upgraded", "explanation"]
                  },
                  suggestedStarAnswer: { type: Type.STRING, description: "A beautifully written native-level replacement answer utilizing the STAR method" }
                },
                required: ["questionId", "questionText", "strength", "phraseUpgrade", "suggestedStarAnswer"]
              }
            }
          },
          required: [
            "score",
            "confidenceRating",
            "pronunciationScore",
            "fluencyScore",
            "relevanceScore",
            "encouragingComment",
            "generalStrengths",
            "dimensionNotes",
            "questionsFeedback"
          ]
        },
        temperature: 0.7,
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No text returned from Gemini API");
    }

    const evaluation = JSON.parse(resultText.trim());
    res.json(evaluation);
  } catch (error: any) {
    console.error("Gemini AI evaluation failed:", error?.message || error);
    // Do NOT show fake data. Return an error so the client runs the real local analysis.
    res.status(503).json({ error: "ai-failed", useLocal: true, details: error?.message || String(error) });
  }
});

// Vite middleware and asset routing setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
