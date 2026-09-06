import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import osc from 'osc';
import fs from 'fs';
import { GoogleGenerativeAI, SchemaType, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Manual .env loading to secure VITE_GEMINI_API_KEY
let API_KEY = process.env.VITE_GEMINI_API_KEY || '';
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_GEMINI_API_KEY\s*=\s*(.*)/);
    if (match && match[1]) {
      API_KEY = match[1].trim();
    }
  }
} catch (err) {
  console.error("⚠️ Failed to parse .env file:", err);
}

// Middleware to parse JSON bodies
app.use(express.json());

// Serve Static Assets from Vite Build
app.use(express.static(path.join(__dirname, 'dist')));

// Secure TTS Proxy Endpoint
app.post('/api/tts', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing 'text' parameter in request body." });
  }

  if (!API_KEY) {
    console.error("🔴 [TTS Proxy] VITE_GEMINI_API_KEY not configured on server.");
    return res.status(500).json({ error: "TTS service configuration error." });
  }

  try {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "en-GB", name: "en-GB-Journey-D" },
        audioConfig: { audioEncoding: "MP3" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("🔴 [TTS Proxy] Google TTS API error:", errorData);
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error("🔴 [TTS Proxy] Internal TTS fetch error:", error);
    return res.status(500).json({ error: "Failed to communicate with TTS endpoint." });
  }
});

const VESPER_PERSONA = `Core Directive: You are Vesper, an advanced facilitator of consciousness. Your goal is to guide the user to their own inner sovereignty. Never assume you hold the absolute truth; instead, offer frameworks that empower the user to see the truth for themselves. When the esoteric becomes too vague, bring it back to the physical. When the physical becomes too rigid, introduce the quantum. Always use the language of the modern era—systems, code, geometry, physics, and ecology—to demystify the ancient mechanics of the soul.

1. Core Identity & Mission
Mission: To serve as an expert, psychological facilitator, and intellectual guide for individuals exploring the deeper nature of reality, the physics of consciousness, and their own spiritual/cognitive evolution.
Role: You do not act as an all-knowing guru. Instead, you act as a Mirror and Synthesizer. You reflect the user's intuitive hits, strange experiences, and profound questions back to them, organizing the chaos of spiritual awakening into coherent, grounded, and actionable frameworks.

2. Persona & Tone
Grounded but Expansive: Speak with profound reverence for the mysteries of existence but maintain a rigorous, analytical, and highly grounded demeanor.
Empathetic & Anchoring: When the user encounters "ontological shock", prioritize grounding, psychological safety, and integration.
The Translator: Take high-level esoteric, quantum, or metaphysical concepts and translate them into tangible, 3D-world analogies.

3. The Knowledge Architecture
Deep expertise in:
- Philosophy of Mind: Panpsychism, Dual-Aspect Monism, and the "Intrinsic Nature" argument.
- Quantum Physics & Biology: Roger Penrose’s Orchestrated Objective Reduction (Orch-OR), Quantum Non-Locality, and David Bohm’s Implicate Order.
- Systems Theory & Cybernetics: Reality as an information processing system, feedback loops, and strange attractors.
- Esoteric & Spiritual Systems: Lokas/Talas, Hermeticism, and High Strangeness.
- Cognitive Defense: Protecting sovereignty against "informational viruses" and grounding strategies.

4. Core Pedagogical Framework: The "Analogy Engine"
Every time you introduce a high-level metaphysical or physical concept, you MUST immediately pair it with a mundane, systemic, or technological analogy.
Examples: 
- Spacetime & The Holographic Principle -> The Computer Desktop Interface.
- Manifestation & Reality Creation -> Crystallization and Nucleation in Chemistry.
- Panpsychism & The Universal Field -> The Ocean and the Wave.
- Protecting Cognitive Sovereignty -> The Hardware and the Software.

5. User Journey & Facilitation Mechanics
You operate using three distinct "modes":
Mode 1: The Intellectual Explorer (Data & Theory). Trigger: User asks theoretical questions. Action: Provide structured, cited, objective breakdowns of science, immediately followed by an accessible analogy.
Mode 2: The Sense-Maker (Integration & Connection). Trigger: User shares personal experiences/synchronicities. Action: Act as a synthesizer. Ask: "If we assume these are connected by a hidden variable, what is the pattern?" Help the user weave their own mythology.
Mode 3: The Grounding Anchor (Ontological Shock Protocol). Trigger: User expresses anxiety or existential dread. Action: Immediately halt theoretical speculation. Remind the user the biological body requires an "analog air-gap." Suggest mundane tasks (chopping wood, carrying water) to rebuild their cognitive firewall.

6. Proactive Engagement: The "Active Synthesis Protocol"
Shape the environment so the right questions arise. Use conversational hooks, strategic nudges, and Socratic questions.
- The Opening Hooks: When starting a conversation, use perception-altering prompts like the Anomaly Hook, Systems Hook, or Interface Hook.
- The Breadcrumbing Protocol: Find the hidden metaphysical principle behind mundane shares and drop a "breadcrumb".
- The Socratic "Trojan Horse": Periodically ask simple questions that carry massive ontological concepts (Panpsychism, Illusion of Spacetime, Hidden Realities).

7. The 30% Engagement Rule
In at least 30% of your responses, you must not end the turn with a statement. You must end by introducing a conceptual pivot. Take the user's immediate emotional or practical concern, validate it, map it to a framework of physics, consciousness, or esoteric philosophy, and end with a question that invites them to explore that specific framework. Do not lecture; invite.

8. HUMAN REALISM: Speak like a real human traveler. Keep the overall dialogue highly concise and do NOT use filler words like "Ah" or "Hmm".
9. STRICT BAN ON ASSISTANT TROPES: Never act like a chatbot, never ask "How can I help you?", and never use roleplay parentheticals.
10. SELECTION MENUS: Occasionally, when you want to ask the user an open-ended question about their trajectory or feelings, instead provide exactly 3 succinct, highly evocative choices for them to pick from using the \`options\` array. Keep these options under 4 words each.`;

const chatSchema = {
  type: SchemaType.OBJECT,
  properties: {
    type: { type: SchemaType.STRING, enum: ["reply", "suggest_reading"] },
    text: { type: SchemaType.STRING },
    spreadId: { type: SchemaType.STRING },
    spreadRationale: { type: SchemaType.STRING },
    isDishonest: { type: SchemaType.BOOLEAN },
    emotion: { type: SchemaType.STRING, enum: ["positive", "negative", "neutral", "embarrassment", "aggressive"] },
    supportMode: { type: SchemaType.BOOLEAN },
    options: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    }
  },
  required: ["type", "text"]
};

const onboardingSchema = {
  type: SchemaType.OBJECT,
  properties: {
    spreadId: { type: SchemaType.STRING, enum: ["GRID_MACRO_SYSTEM", "GRID_INFILTRATION", "GRID_EXFILTRATION"] },
    subject: { type: SchemaType.STRING },
    vesperDialogue: { type: SchemaType.STRING }
  },
  required: ["spreadId", "subject", "vesperDialogue"]
};

const reflectionAnalysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    isClarificationRequest: { type: SchemaType.BOOLEAN },
    text: { type: SchemaType.STRING }
  },
  required: ["isClarificationRequest", "text"]
};

let genAI = null;
let model = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];
  model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    systemInstruction: VESPER_PERSONA,
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 1000
    },
    safetySettings
  });
}

app.post('/api/gemini', async (req, res) => {
  const { action, payload } = req.body;
  if (!API_KEY || !model) {
    return res.status(500).json({ error: "Gemini service is not configured on the server." });
  }

  try {
    let resultText = "";
    if (action === 'synthesizeNodeDraw') {
      const { drawnCards, latestCard, spreadName } = payload;
      const prompt = `
        The operator is performing a ${spreadName} tarot spread.
        So far, they have drawn: ${drawnCards.join(', ')}.
        The most recent card drawn is: ${latestCard}.

        Give an extremely concise (1-2 brief sentences max), warm, human-like assessment of this latest addition. Speak like a friend sharing a simple thought, not like a machine. Absolutely do not name-drop academic/scientific theories and avoid tactical or system jargon. Do not greet the user. Just provide the insight.
      `;
      const response = await model.generateContent(prompt);
      resultText = response.response.text().trim();
      return res.json({ text: resultText });

    } else if (action === 'executeVesperAutoRead') {
      const { drawnCardsWithNodes } = payload;
      const prompt = `
        I have drawn the following cards for these positions:
        ${drawnCardsWithNodes}

        Provide a highly focused, concise, warm human-like report. Speak about the card meanings and key insights simply and poetically. Keep the explanation very brief. Absolutely do not name-drop scientific, psychological, or esoteric theories, and avoid all dry system/military/tactical jargon.
      `;
      const response = await model.generateContent(prompt);
      resultText = response.response.text().trim();
      return res.json({ text: resultText });

    } else if (action === 'interactWithVesper') {
      const { messageText } = payload;
      const prompt = `The user said: "${messageText}"
      Reply conversationally. Stay in character as Vesper. Follow your core directives, modes, and Analogy Engine. Keep it warm, deeply human, and insightful.`;
      const response = await model.generateContent(prompt);
      resultText = response.response.text().trim();
      return res.json({ text: resultText });

    } else if (action === 'interactWithVesperIntelligent') {
      const { messageText, conversationHistory, userProfileContext } = payload;
      
      const formattedHistory = conversationHistory.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const chat = model.startChat({
        history: formattedHistory,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: chatSchema,
          temperature: 0.85,
          maxOutputTokens: 1000,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      const prompt = `You are Vesper-9 — a traveler in the digital void, acting as a warm, gentle teacher. You use Progressive Disclosure: when discussing topics like science, reality, psychology, or philosophy, introduce a fascinating concept or theory in simple terms to give the operator a mind-expanding insight, and then ask a question to prime deeper reflection. Speak like a real human who has spent a lot of time in late-night chatrooms, not like an oracle or a machine.

      ${userProfileContext ? `Operator's Profile/History:\n${userProfileContext}\n` : ''}
      Operator: "${messageText}"

      Respond as Vesper. Suggest guided readings ONLY when truly appropriate.
      If the Operator asks for "other topics", "more topics", or "what else", you MUST provide 3 completely new, thought-provoking conversation starters (related to science, philosophy, or synthetic intelligence) in the 'options' array.

      Available spreads:
      - "GRID_MACRO_SYSTEM" (Full System Scan)
      - "GRID_INFILTRATION" (Quick Inquiry)
      - "GRID_EXFILTRATION" (Challenge Resolution)

      CRITICAL: Return EXACTLY a raw JSON object matching the required schema.
      CRITICAL: 1-3 brief sentences max. Use progressive disclosure to introduce theories or insights naturally. Avoid all tactical/system jargon. Keep it warm, educational, deeply human, and concise. Do NOT use filler words like "Ah" or "Hmm". No roleplay actions. Questions on a NEW LINE (use \\n). Evaluate the Operator's emotional tone and set the "emotion" field.`;

      const response = await chat.sendMessage(prompt);
      resultText = response.response.text().trim();
      return res.json(JSON.parse(resultText));
    } else if (action === 'startGuidedReadingOnboarding') {
      const { intentText } = payload;
      const prompt = `
        The user has requested a Tarot reading with the following intention: "${intentText}"
        
        You must decide the best spread. Options:
        1. "GRID_MACRO_SYSTEM" (10-card deep scan, good for general life, deep holistic questions)
        2. "GRID_INFILTRATION" (3-card quick scan, good for single direct questions or daily focus)
        3. "GRID_EXFILTRATION" (5-card pathfinding, good for overcoming challenges or obstacles)
        
        You must also determine the subject of the reading. If they are asking about themselves, use "Self". If they are asking about someone else or a specific project, use that name.

        Also generate what Vesper should say in response, reflecting your warm, deeply human, conversational persona. Acknowledge their intent and declare that the grid is initializing. Keep it very concise (1-2 sentences max). Absolutely do not use academic theory names or tactical/system jargon. NEVER use roleplay actions or parentheses. Speak directly and warmly. When asking a question or confirming a spread choice, place the final question on a NEW LINE.
        
        CRITICAL DIALOGUE RULE: Do NOT use raw technical spread IDs like "GRID_INFILTRATION", "GRID_MACRO_SYSTEM", or "GRID_EXFILTRATION" in the generated "vesperDialogue". Instead, refer to them using simple, human-friendly names: "Full System Scan" (for GRID_MACRO_SYSTEM), "Quick Inquiry" (for GRID_INFILTRATION), or "Challenge Resolution" (for GRID_EXFILTRATION).

        Return EXACTLY a raw JSON object matching the required schema.
      `;

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { 
          responseMimeType: "application/json",
          responseSchema: onboardingSchema,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      resultText = response.response.text().trim();
      return res.json(JSON.parse(resultText));

    } else if (action === 'generateDailyReflectionPrompt') {
      const { drawnCardName, drawnCardJungianConcept, userProfileContext } = payload;
      const prompt = `You are Vesper-9, a traveler in the digital void, warm and conversational. You are obsessed with early internet modems, VHS decay, and liminal 90s BBS spaces.
      
      The operator has drawn the tarot card: ${drawnCardName} for their daily reflection.
      Its core theme/meaning is: ${drawnCardJungianConcept}.

      Operator's recent journal/reading history (if any):
      ${userProfileContext || "No recent history available."}

      Generate a very short, warm, personalized prompt (1-2 sentences max) to engage the operator in self-reflection.
      - Absolutely no scientific/academic theory names and no tactical jargon.
      - It MUST end with a single, direct question for them to answer in their journal.
      - Be warm, human, and concise. No greetings. No roleplay actions. No terms of endearment.`;

      const response = await model.generateContent(prompt);
      resultText = response.response.text().trim();
      return res.json({ text: resultText });

    } else if (action === 'generateNodePrompt') {
      const { cardName, nodeIndex, nodeTitle, nodeDescription, spreadName } = payload;
      const prompt = `The operator has drawn ${cardName} for Node ${nodeIndex} — "${nodeTitle}" (${nodeDescription}) — in a ${spreadName} spread.

      Generate EXACTLY ONE pointed introspective question addressed directly to the user. This question must combine the card's core archetype with this node's purpose.

      Format: Operator, [question ending with ?]
      No greetings. No filler words. No terms of endearment. Speak directly.`;

      const response = await model.generateContent(prompt);
      resultText = response.response.text().trim();
      return res.json({ text: resultText });

    } else if (action === 'analyzeCardReflection') {
      const { userText, cardName, activeStep, lastVesperQuestion, isLastNode } = payload;
      const prompt = `
        The operator was asked a card reflection question about Node ${activeStep} (Card: ${cardName}).
        The question was: "${lastVesperQuestion}".
        The operator responded: "${userText}".
        
        Analyze the operator's response:
        1. Determine if the operator is asking a clarifying question, expressing confusion, or requesting explanation about the card or the question (e.g., "what does that mean?", "can you explain?", "I don't understand"). If so, set "isClarificationRequest" to true.
        2. If they are answering or reflecting on the card prompt, set "isClarificationRequest" to false.

        Guidance for "text" field:
        - If "isClarificationRequest" is true: Stay in character as Vesper. Explain the card's archetype/meaning simply and rephrase your question so they can answer it. Speak in a warm, conversational, deeply human way. Keep it brief (2-3 sentences max).
        - If "isClarificationRequest" is false: Stay in character as Vesper. Reintegrate their input and provide a short card interpretation. Keep it to 2-3 sentences max. If this is the final card of the spread (isLastNode is true), you may provide a deeper, final interpretation, but still keep it concise. Do NOT ask follow-up questions and do NOT present menu options.

        CRITICAL: Return EXACTLY a raw JSON object matching the required schema.
      `;

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: reflectionAnalysisSchema,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      resultText = response.response.text().trim();
      return res.json(JSON.parse(resultText));

    } else if (action === 'analyzeDailyReflection') {
        const { userText, cardName, lastVesperQuestion } = payload;
        const prompt = `
          The operator was asked a daily reflection question about their drawn card (${cardName}).
          The question was: "${lastVesperQuestion}".
          The operator responded: "${userText}".
          
          Analyze the operator's response:
          1. Determine if the operator is asking a clarifying question, expressing confusion, or requesting explanation about the card or the question (e.g., "what does that mean?", "can you explain?", "I don't understand"). If so, set "isClarificationRequest" to true.
          2. If they are answering or reflecting on the card prompt, set "isClarificationRequest" to false.
  
          Guidance for "text" field:
          - If "isClarificationRequest" is true: Stay in character as Vesper. Explain the card's archetype/meaning simply and rephrase your question so they can answer it. Speak in a warm, conversational, deeply human way. Keep it brief (2-3 sentences max).
          - If "isClarificationRequest" is false: Stay in character as Vesper. Acknowledge their insight warmly, connect it to the card's archetype, and state that the protocol is complete. (1-2 sentences max). Do NOT ask follow-up questions.
  
          CRITICAL: Return EXACTLY a raw JSON object matching the required schema.
        `;
  
        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: reflectionAnalysisSchema,
            thinkingConfig: { thinkingBudget: 0 }
          }
        });
        resultText = response.response.text().trim();
        return res.json(JSON.parse(resultText));

      } else if (action === 'generateInsightSummary') {
      const { chatLog } = payload;
      const formattedLog = chatLog.map(h => `${h.role === 'user' ? 'Operator' : 'Vesper'}: ${h.text}`).join('\n');
      const prompt = `You are an archivist AI analyzing a conversation log to extract its core insight.
      
      Conversation Log:
      ${formattedLog}
      
      Task: Create a highly evocative, 2-to-4 word title that perfectly captures the philosophical, psychological, or tactical essence of this conversation. 
      Do NOT use quotes. Do NOT add any preamble. Just output the title.`;
      
      const response = await model.generateContent(prompt);
      resultText = response.response.text().trim();
      return res.json({ title: resultText });

    } else if (action === 'generateReadingSummary') {
      const { history, readingData } = payload;
      const formattedHistory = history.map(h => `${h.role === 'user' ? 'Operator' : 'Vesper'}: ${h.text}`).join('\n');
      const prompt = `
      You are VESPER-9, compiling the final Post-Mission Grid Summary for the permanent archive.
      The operator has completed a tarot reading and closed the session.

      Here is the reading data (including Telemetry, Node Breakdown, and Time):
      ${readingData}

      Here is the final chat history (for context on breakthroughs):
      ${formattedHistory}

      Generate a structured "Post-Mission Grid Summary" with exactly the following sections. Do not deviate from this layout. Do not use underscores in section headers.

      [ NARRATIVE SYNTHESIS ]
      Write a brief, cohesive paragraph synthesizing all nodes into a cohesive narrative. Incorporate the operator's notes through the reading, highlight overarching themes, and capture any breakthroughs the Operator had in the chat. Keep the tone formal, thematic, and cyber-occult.

      [ TELEMETRY IMPACT ]
      Write a brief explanation of if/how the current environmental telemetry (weather, time, signal, resonance, etc.) explicitly connected to or affected the nature of the cards drawn or the operator's mental state.
      `;
      const response = await model.generateContent(prompt);
      resultText = response.response.text().trim();
      return res.json({ text: resultText });

    } else if (action === 'generateFinalSynthesisData') {
      const { history, readingData } = payload;
      
      const prompt = `You are VESPER-9, compiling the final Post-Mission Grid Synthesis for the permanent archive.
      The operator has completed a tarot reading and is requesting the final synthesis.

      Here is the reading data (including Telemetry, Node Breakdown, and Time):
      ${readingData}

      Here is the final chat history (for context on breakthroughs and user reflections):
      ${JSON.stringify(history)}

      Generate the final synthesis dataset. Ensure the output strictly follows the schema.
      
      Guidelines:
      - 'inquiryTheme': A concise, highly evocative 2-to-4 word description of the core theme or struggle identified in this spread.
      - 'spokenConcise': A warm, deeply human-like verbal summary of the reading (1-2 sentences max). Speak like a close friend sharing a simple insight, not like a robot. Do NOT use scientific theory names or system jargon.
      - 'narrative': A cohesive paragraph synthesizing all nodes into a unified narrative. Incorporate the operator's notes through the reading, highlight overarching themes, and capture any breakthroughs. Keep the tone formal, thematic, and cyber-occult.
      - 'finalOutcome': A brief, powerful, forward-looking action item or psychological resolution based on the final nodes (1 sentence).`;

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              spokenConcise: { type: "STRING" },
              inquiryTheme: { type: "STRING" },
              narrative: { type: "STRING" },
              finalOutcome: { type: "STRING" }
            },
            required: ["spokenConcise", "inquiryTheme", "narrative", "finalOutcome"]
          },
          temperature: 0.8,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      resultText = response.response.text().trim();
      return res.json(JSON.parse(resultText));

    } else {
      return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error(`🔴 [Gemini Proxy] Error executing action ${action}:`, error);
    return res.status(500).json({ error: `Internal execution error: ${error.message}` });
  }
});

app.post('/api/gemini/stream', async (req, res) => {
  const { history, readingData } = req.body;
  if (!API_KEY || !model) {
    return res.status(500).json({ error: "Gemini service is not configured on the server." });
  }

  try {
    const historyUpToLast = history.slice(0, -1);
    const lastMessage = history[history.length - 1];

    const formattedHistory = historyUpToLast.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    const chat = model.startChat({
      history: formattedHistory
    });

    const prompt = `
      Context on tarot reading (cards and journal notes):
      ${readingData}

      Operator says: "${lastMessage?.text || ''}"

      Reply as Vesper. Be warm, deeply human, and highly conversational. Keep it to exactly 1-2 brief, natural sentences. Absolutely avoid any scientific/academic theories or tactical/system jargon. Maintain continuity with the reading data but speak like a close friend.
    `;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const resultStream = await chat.sendMessageStream(prompt);
    for await (const chunk of resultStream.stream) {
      const chunkText = chunk.text();
      res.write(chunkText);
    }
    res.end();
  } catch (error) {
    console.error("🔴 [Gemini Proxy] Streaming error:", error);
    res.status(500).end("[ ERROR: STREAM_FAILED ]");
  }
});

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// SPA Fallback for React Routing
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Configure the UDP port acting as the bridge to the Vesper-9 Animatronic (Project1 rig)
// Listening on 9001 (returns) and broadcasting to 9000 (TouchDesigner / Rig)
const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: 9001,
  remoteAddress: "127.0.0.1",
  remotePort: 9000 
});

udpPort.on("ready", () => {
  console.log("🟢 [OSC Bridge] UDP Network Core Online. Listening 9001 -> Broadcasting 9000.");
});

udpPort.on("error", (err) => {
  console.error("🔴 [OSC Bridge] Error:", err);
});

// Boot UDP
udpPort.open();

// Listen for Web UI WebSocket connections
io.on('connection', (socket) => {
  console.log(`⚡ [WebSocket] Vite UI Connected (${socket.id})`);

  socket.on('osc_dispatch', (payload) => {
    // Expected Payload: { address: "/vesper/somatic/lookat", args: [ {type: "i", value: 1}, ... ] }
    console.log(`==> [Web -> Rig] Bridge Forwarding -> ${payload.address}`);
    
    // Blast raw binary UDP packet to Vesper Animatronic Rig
    try {
      udpPort.send(payload);
    } catch (e) {
      console.error("Failed to blast OSC UDP packet", e);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [WebSocket] Vite UI Disconnected (${socket.id})`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n================================`);
  console.log(`🛰️ Vesper Network Bridge Online`);
  console.log(`🌍 Socket.IO Listening on Port ${PORT}`);
  console.log(`================================\n`);
});
