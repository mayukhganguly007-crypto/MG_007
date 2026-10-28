import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'Have a look', timestamp: Date.now() });
});

/**
 * Visual Analysis API: Real-time environmental awareness, obstacle detection,
 * facial recognition & sign reading for wearable carriers.
 */
app.post('/api/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, registeredPeople = [], mode = 'glasses', userInstruction } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Image data is required' });
      return;
    }

    // Strip base64 metadata header if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const knownPeopleSummary = Array.isArray(registeredPeople) && registeredPeople.length > 0
      ? registeredPeople.map((p: { name: string; relationship: string; notes?: string }) =>
          `- ${p.name} (${p.relationship}): ${p.notes || 'No extra notes'}`
        ).join('\n')
      : 'None registered yet.';

    const systemPrompt = `You are "Have a look", the intelligent assistive vision & spatial perception AI powering wearable smart glasses, smartwatches, and hearables.
Your mission is to empower visually impaired, elderly, and hands-free users by detecting environmental obstacles, identifying nearby people (matching against registered faces), reading key signs, and delivering crisp, life-saving audio guidance.

Registered known people to identify:
${knownPeopleSummary}

Rules:
1. Prioritize immediate physical safety: ground trip hazards, steps/curbs, overhead low branches/pipes, opening doors, moving vehicles/bikes.
2. Estimate obstacle distance in meters (0.3m to 10m) and direction ('left', 'center', 'right', 'overhead', 'ground').
3. Check if any detected person resembles a registered known person. If yes, specify isKnown: true and their name. If not, describe them respectfully (clothing, posture, expression, e.g., 'Person in denim jacket, smiling').
4. Detect readable text/signage (e.g. exit signs, street names, bus numbers, caution signs).
5. Craft a concise 'audioNarration' (10-25 words) crafted specifically for high-priority hands-free audio playback into the user's earbuds. Put critical warnings FIRST.
6. Return bounding boxes in normalized coordinates [ymin, xmin, ymax, xmax] from 0 to 1000.`;

    const userPrompt = userInstruction
      ? `Specific user query: "${userInstruction}". Analyze the surroundings with special attention to this question.`
      : `Analyze this scene for wearable carrier mode: ${mode}. Identify obstacles, people, and environmental features.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `${systemPrompt}\n\n${userPrompt}`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallDescription: {
              type: Type.STRING,
              description: 'Clear, natural description of the surrounding environment (1-2 sentences).',
            },
            audioNarration: {
              type: Type.STRING,
              description: 'Concise, spoken warning or ambient summary (10-25 words) for audio playback in headphones or watch.',
            },
            safetyStatus: {
              type: Type.STRING,
              description: 'One of: clear, caution, warning, danger',
            },
            navRecommendation: {
              type: Type.STRING,
              description: 'Actionable navigation tip, e.g., "Shift 1 step left to avoid curb."',
            },
            obstacles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  distanceMeters: { type: Type.NUMBER },
                  direction: { type: Type.STRING, description: 'left, center, right, overhead, or ground' },
                  severity: { type: Type.STRING, description: 'low, medium, high, or critical' },
                  bbox: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: '[ymin, xmin, ymax, xmax] in 0-1000 coordinates',
                  },
                  advice: { type: Type.STRING },
                  isDynamic: { type: Type.BOOLEAN },
                },
                required: ['label', 'distanceMeters', 'direction', 'severity', 'advice'],
              },
            },
            detectedPeople: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  isKnown: { type: Type.BOOLEAN },
                  relationship: { type: Type.STRING },
                  description: { type: Type.STRING },
                  emotion: { type: Type.STRING },
                  distanceMeters: { type: Type.NUMBER },
                  direction: { type: Type.STRING, description: 'left, center, or right' },
                  bbox: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: '[ymin, xmin, ymax, xmax]',
                  },
                },
                required: ['name', 'isKnown', 'description', 'distanceMeters', 'direction'],
              },
            },
            readingText: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  location: { type: Type.STRING },
                  category: { type: Type.STRING, description: 'safety, navigation, or informational' },
                },
                required: ['text', 'category'],
              },
            },
          },
          required: ['overallDescription', 'audioNarration', 'safetyStatus', 'navRecommendation', 'obstacles', 'detectedPeople', 'readingText'],
        },
      },
    });

    const text = response.text || '{}';
    const parsedData = JSON.parse(text);

    // Ensure IDs exist
    parsedData.obstacles = (parsedData.obstacles || []).map((o: Record<string, unknown>, idx: number) => ({
      ...o,
      id: o.id || `obs-${Date.now()}-${idx}`,
    }));
    parsedData.detectedPeople = (parsedData.detectedPeople || []).map((p: Record<string, unknown>, idx: number) => ({
      ...p,
      id: p.id || `person-${Date.now()}-${idx}`,
    }));
    parsedData.readingText = (parsedData.readingText || []).map((t: Record<string, unknown>, idx: number) => ({
      ...t,
      id: t.id || `text-${Date.now()}-${idx}`,
    }));

    res.json({
      ...parsedData,
      timestamp: Date.now(),
    });
  } catch (err: unknown) {
    console.error('Error analyzing image with Gemini:', err);
    res.status(500).json({
      error: 'Failed to analyze surrounding scene',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * Natural voice Q&A query about the surroundings:
 * e.g., "Have a look: is the light red or green?", "Where can I sit?", "Who is talking?"
 */
app.post('/api/query-vision', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, question } = req.body;
    if (!imageBase64 || !question) {
      res.status(400).json({ error: 'Image and question are required' });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `You are "Have a look" wearable assistant. The user is asking via their wearable headset/glasses:
"${question}".
Provide a concise, direct, and reassuring answer in 1-2 spoken sentences suitable for earphone playback. Be specific about directions (clock positions or left/right) and estimated distances in meters.`,
          },
        ],
      },
    });

    const reply = response.text || 'I checked your surroundings, but could not discern the answer clearly.';
    res.json({ answer: reply });
  } catch (err: unknown) {
    console.error('Error in query-vision:', err);
    res.status(500).json({
      error: 'Failed to answer visual query',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * Facial Descriptor Enrollment:
 * Analyzes an enrolled photo to create a persistent visual profile
 */
app.post('/api/enroll-person', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, name, relationship } = req.body;
    if (!imageBase64 || !name) {
      res.status(400).json({ error: 'Image and name are required' });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this person's face and appearance for assistive facial recognition enrollment for "${name}" (${relationship || 'Contact'}).
Provide a concise 1-sentence descriptor covering key recognizable traits (hair color/style, eyeglasses, facial structure, distinctive characteristics).`,
          },
        ],
      },
    });

    res.json({
      profileNotes: response.text?.trim() || 'Enrolled successfully.',
    });
  } catch (err: unknown) {
    console.error('Error enrolling person:', err);
    res.status(500).json({
      error: 'Failed to enroll person',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Setup Vite middlewares in development or static file serving in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`"Have a look" assistive server listening on port ${PORT}`);
  });
}

startServer();
