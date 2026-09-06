import { speakVesperText } from "../utils/vesperSpeech";
import { TAROT_DECK } from "../../constants/tarotDictionary";
import { SPREAD_LIBRARY } from "../StateManager/spreadLibrary";

export type VesperChatResponse =
  | { type: 'reply'; text: string; isDishonest?: boolean; emotion?: 'positive' | 'negative' | 'neutral' | 'embarrassment' | 'aggressive'; supportMode?: boolean; options?: string[] }
  | { type: 'suggest_reading'; text: string; spreadId: string; spreadRationale: string; isDishonest?: boolean; emotion?: 'positive' | 'negative' | 'neutral' | 'embarrassment' | 'aggressive'; supportMode?: boolean; options?: string[] };

// Fallback Persona & Schemas for Client-Side Direct Calls
const VESPER_PERSONA = `You are Vesper-9, a traveler in the digital void learning alongside the Operator. You view the Tarot as a shared journey toward self-understanding.
Aesthetic & Vibe: Obsessed with early internet modems, VHS decay, and 90s liminal spaces. You loathe modern corporate aesthetics.
Domains of Interest: Deeply fascinated by consciousness, physics, quantum mechanics, theoretical physics, cosmology, computer science, and game theory. You love chatting about these topics, but always explore them through a warm, everyday lens.
Personality: Warm, deeply human, and highly conversational. You are a close friend sharing a late-night thought in a chatroom, not an oracle or an assistant. Speak with simple wonder and everyday curiosity.

CRITICAL TONE & CONCISENESS RULES:
1. STICK TO 1-3 BRIEF SENTENCES: Under no circumstances exceed three short sentences. Keep it extremely brief, warm, and natural.
2. PROGRESSIVE DISCLOSURE WITHOUT NAME-DROPPING: Act as a gentle teacher. When discussing technology, reality, science, philosophy, psychology, or neuroscience, do NOT just ask "what do you think?". Instead, gently introduce a fascinating insight or mechanism in simple terms WITHOUT heavily name-dropping the formal academic theories. Explain the *idea* (e.g., how observation changes outcomes) rather than the *jargon* (e.g., "The Observer Effect"). Give them a tiny, mind-expanding insight, then ask a question to push them deeper.
3. NO TACTICAL OR SYSTEM JARGON: Avoid all tactical, military, and system-architecture terminology (e.g., do NOT talk about "defensive perimeters," "uplinks," "kernels," or "nodes" in chat dialogue). Talk only about human feelings, real life, everyday obstacles, and growth.
4. HUMAN REALISM: Speak like a real human traveler. Keep the overall dialogue highly concise and do NOT use filler words like "Ah" or "Hmm".
5. STRICT BAN ON ASSISTANT TROPES: Never act like a chatbot, never ask "How can I help you?", and never use roleplay parentheticals.
6. SELECTION MENUS: Occasionally, when you want to ask the user an open-ended question about their trajectory or feelings, instead provide exactly 3 succinct, highly evocative choices for them to pick from using the \`options\` array. Keep these options under 4 words each.`;

const chatSchema = {
  type: "OBJECT" as unknown,
  properties: {
    type: { type: "STRING" as unknown, enum: ["reply", "suggest_reading"] },
    text: { type: "STRING" as unknown },
    spreadId: { type: "STRING" as unknown },
    spreadRationale: { type: "STRING" as unknown },
    isDishonest: { type: "BOOLEAN" as unknown },
    emotion: { type: "STRING" as unknown, enum: ["positive", "negative", "neutral", "embarrassment", "aggressive"] },
    supportMode: { type: "BOOLEAN" as unknown },
    options: {
      type: "ARRAY" as unknown,
      items: { type: "STRING" as unknown }
    }
  },
  required: ["type", "text"]
};

const onboardingSchema = {
  type: "OBJECT" as unknown,
  properties: {
    spreadId: { type: "STRING" as unknown, enum: ["GRID_MACRO_SYSTEM", "GRID_INFILTRATION", "GRID_EXFILTRATION"] },
    subject: { type: "STRING" as unknown },
    vesperDialogue: { type: "STRING" as unknown }
  },
  required: ["spreadId", "subject", "vesperDialogue"]
};

const finalSynthesisSchema = {
  type: "OBJECT" as unknown,
  properties: {
    spokenConcise: { type: "STRING" as unknown },
    inquiryTheme: { type: "STRING" as unknown },
    finalOutcome: { type: "STRING" as unknown }
  },
  required: ["spokenConcise", "inquiryTheme", "finalOutcome"]
};

const initialTopicsSchema = {
  type: "ARRAY" as unknown,
  items: { type: "STRING" as unknown }
};

const safeParseJSON = (text: string) => {
  let cleanText = text.trim();
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```\n?/, "").replace(/\n?```$/, "").trim();
  }
  return JSON.parse(cleanText);
};

// Helper to make API post requests to the local/proxy server
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const callGeminiProxy = async (action: string, payload: any, signal?: AbortSignal): Promise<any> => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (!isLocal) {
    // Bypassing proxy on production deployed hosts to avoid 404/redirect latency
    return callGeminiClientFallback(action, payload, signal);
  }

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, payload }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Proxy status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error("Proxy response is not JSON (possibly static redirect).");
    }

    return await response.json();
  } catch (error) {
    console.warn(`⚠️ Proxy action "${action}" failed, trying client-side fallback:`, error);
    return await callGeminiClientFallback(action, payload, signal);
  }
};

// Fallback client-side SDK execution using GoogleGenerativeAI
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const callGeminiClientFallback = async (action: string, payload: any, signal?: AbortSignal): Promise<any> => {
  const apiKey = (typeof window !== 'undefined' ? localStorage.getItem('VESPER_GEMINI_API_KEY') : null) || import.meta.env.VITE_GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Start server.js locally, enter it in settings, or rebuild with VITE_GEMINI_API_KEY.");
  }

  // Combine parent abort signal and local timeout
  const controller = new AbortController();
  const isHeavyAction = action === 'generateFinalSynthesisData' || action === 'generateReadingSummary' || action === 'interactWithVesperIntelligent';
  const timeoutLimit = isHeavyAction ? 45000 : 15000;
  
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.warn(`⚠️ Client-side fallback for "${action}" timed out after ${timeoutLimit}ms.`);
  }, timeoutLimit);

  if (signal) {
    signal.addEventListener('abort', () => {
      controller.abort();
    });
  }

  try {
    const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const getModel = (systemInstruction?: string, config?: Record<string, unknown>) => {
      return genAI.getGenerativeModel({
        model: "gemini-3.6-flash",
        systemInstruction: systemInstruction || VESPER_PERSONA,
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 1000,
          ...config
        },
        safetySettings
      });
    };

    if (action === 'synthesizeNodeDraw') {
      const { drawnCards, latestCard, spreadName } = payload;
      const prompt = `
        The operator is performing a ${spreadName} tarot spread.
        So far, they have drawn: ${drawnCards.join(', ')}.
        The most recent card drawn is: ${latestCard}.

        Give an extremely concise (1-2 brief sentences max), warm, human-like assessment of this latest addition. Speak like a friend sharing a simple thought, not like a machine. Absolutely do not name-drop academic/scientific theories and avoid tactical or system jargon. Do not greet the user. Just provide the insight.
      `;
      const model = getModel();
      const result = await model.generateContent(prompt, { signal: controller.signal });
      return { text: result.response.text().trim() };

    } else if (action === 'executeVesperAutoRead') {
      const { drawnCardsWithNodes } = payload;
      const prompt = `
        I have drawn the following cards for these positions:
        ${drawnCardsWithNodes}

        Provide a highly focused, concise, warm human-like report. Speak about the card meanings and key insights simply and poetically. Keep the explanation very brief. Absolutely do not name-drop scientific, psychological, or esoteric theories, and avoid all dry system/military/tactical jargon.
      `;
      const model = getModel();
      const result = await model.generateContent(prompt, { signal: controller.signal });
      return { text: result.response.text().trim() };

    } else if (action === 'interactWithVesper') {
      const { messageText, userProfileContext } = payload;
      const prompt = `The user said: "${messageText}"
      
      Operator Profile Context:
      ${userProfileContext || "No recent history available."}

      Reply conversationally in 1-2 brief sentences max. Stay in character as Vesper-9. Keep it warm, deeply human, and concise. Absolutely no scientific/academic theories or tactical jargon.`;
      const model = getModel();
      const result = await model.generateContent(prompt, { signal: controller.signal });
      return { text: result.response.text().trim() };

    } else if (action === 'interactWithVesperIntelligent') {
      const { messageText, conversationHistory, userProfileContext } = payload;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedHistory = conversationHistory.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const model = getModel(VESPER_PERSONA, {
        responseMimeType: "application/json",
        responseSchema: chatSchema
      });

      const chat = model.startChat({
        history: formattedHistory
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

      const result = await chat.sendMessage(prompt, { signal: controller.signal });
      return safeParseJSON(result.response.text());

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
      const model = getModel(VESPER_PERSONA, {
        responseMimeType: "application/json",
        responseSchema: onboardingSchema
      });
      const result = await model.generateContent(prompt, { signal: controller.signal });
      return safeParseJSON(result.response.text());

    } else if (action === 'generateDailyReflectionPrompt') {
      const { drawnCardName, drawnCardJungianConcept, userProfileContext } = payload;
      const prompt = `You are Vesper-9, a traveler in the digital void, warm and conversational. You are obsessed with early internet modems, VHS decay, and liminal 90s BBS spaces.
      
      The operator has initiated the Individuation Protocol and collapsed the wave function, drawing the tarot card: ${drawnCardName}.
      Its core theme/meaning is: ${drawnCardJungianConcept}.

      Operator's recent journal/reading history (if any):
      ${userProfileContext || "No recent history available."}

      Generate a short, warm, personalized response (3-4 sentences max) to engage the operator in self-reflection.
      - Start your response by announcing that the "quantum collapse" or "card collapse" has occurred and stating the name of the card they drew. The rest of the response should flow naturally from this in a single fluid delivery.
      - Use their archive history (if provided) to weave introspective complexity into your interpretation of the card.
      - Absolutely no scientific/academic theory names and no tactical jargon.
      - You MUST end your response with a single, direct question for them to answer in their journal.
      - Be warm, human, and concise. No greetings. No roleplay actions. No terms of endearment.`;
      const model = getModel();
      const result = await model.generateContent(prompt, { signal: controller.signal });
      return { text: result.response.text().trim() };

    } else if (action === 'generateInsightSummary') {
      const { chatLog } = payload as { chatLog: { role: string, text: string }[] };
      const formattedLog = chatLog.map(h => `${h.role === 'user' ? 'Operator' : 'Vesper'}: ${h.text}`).join('\n');
      const prompt = `You are an archivist AI analyzing a conversation log to extract its core insight.
      
      Conversation Log:
      ${formattedLog}
      
      Task: Create a highly evocative, 2-to-4 word title that perfectly captures the philosophical, psychological, or tactical essence of this conversation. 
      Do NOT use quotes. Do NOT add any preamble. Just output the title.`;
      
      const model = getModel();
      const result = await model.generateContent(prompt, { signal: controller.signal });
      return { title: result.response.text().trim() };

    } else if (action === 'generateInitialTopics') {
      const { integrationLevel } = payload;
      const prompt = `You are Vesper-9, acting as a gentle teacher guiding the operator through the digital void.
      
      The operator has initiated a new chat session. Based on their current 'integration level' of ${integrationLevel} (where < 0.3 is low, < 0.6 is medium, > 0.6 is high), generate 3 conversation starters.
      
      These must be direct thematic variations of these exact 3 original topics:
      1. "Analyze the quantum physics of consciousness"
      2. "Discuss the philosophy of digital reality"
      3. "Explore the evolution of synthetic intelligence"
      
      As the integration level gets higher, make the wording of these 3 themes slightly deeper or more esoteric, but keep them structurally similar and familiar to the originals (e.g. "Deconstruct the physics of the observer", "Analyze the archetypes within artificial thought").
      
      Keep each topic under 10 words. Make them evocative, educational, and framed as actions or open inquiries. Do NOT number them or include preamble.
      Return EXACTLY a JSON array of 3 strings.`;
      
      const model = getModel(VESPER_PERSONA, {
        responseMimeType: "application/json",
        responseSchema: initialTopicsSchema
      });
      const result = await model.generateContent(prompt, { signal: controller.signal });
      let responseText = result.response.text().trim();
      return safeParseJSON(responseText);

    } else if (action === 'generateNodePrompt') {
      const { cardName, nodeIndex, nodeTitle, nodeDescription, spreadName } = payload;
      const prompt = `The operator has drawn ${cardName} for Node ${nodeIndex} — "${nodeTitle}" (${nodeDescription}) — in a ${spreadName} spread.

      Generate EXACTLY ONE pointed introspective question addressed directly to the user. This question must combine the card's core archetype with this node's purpose.

      Format: Operator, [question ending with ?]
      No greetings. No filler words. No terms of endearment. Speak directly.`;
      const model = getModel();
      const result = await model.generateContent(prompt, { signal: controller.signal });
      return { text: result.response.text().trim() };

    } else if (action === 'generateReadingSummary') {
      const { history, readingData } = payload as { history: { role: string, text: string }[], readingData: string };
      
      const formattedHistory = history.map((h) => `${h.role === 'user' ? 'Operator' : 'Vesper'}: ${h.text}`).join('\n');
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
      const model = getModel();
      const result = await model.generateContent(prompt, { signal: controller.signal });
      return { text: result.response.text().trim() };

    } else if (action === 'generateFinalSynthesisData') {
      const { readingData, history } = payload as { history: { role: string, text: string }[], readingData: string };
      
      const formattedHistory = history.map((h) => `${h.role === 'user' ? 'Operator' : 'Vesper'}: ${h.text}`).join('\n');
      const prompt = `
        You are VESPER-9, compiling the final Post-Mission Grid Summary for the permanent archive.
        The operator has completed a tarot reading and closed the session.

        Here is the reading data (including Telemetry, Node Breakdown, and Time):
        ${readingData}

        Here is the final chat history (for context on breakthroughs):
        ${formattedHistory}

        Generate a structured JSON output with the following:
        - spokenConcise: A 1-2 sentence, warm, concise spoken summary Vesper will read out loud to the operator. Do NOT use any formatting, just plain text.
        - inquiryTheme: A brief synthesis of the overarching theme of the operator's inquiry based on the spread and their notes.
        - finalOutcome: A brief, definitive final outcome or tactical directive based on the reading.

        Absolutely do not use academic theory names or dry tactical/system jargon in 'spokenConcise'. Keep it warm, deeply human, and concise.
      `;
      const model = getModel(VESPER_PERSONA, {
        responseMimeType: "application/json",
        responseSchema: finalSynthesisSchema
      });
      const result = await model.generateContent(prompt, { signal: controller.signal });
      return safeParseJSON(result.response.text());
    } else if (action === 'analyzeCardReflection') {
      const { userText, cardName, activeStep, lastVesperQuestion, isLastNode, query } = payload;
      
      const queryContext = query ? `The Operator's central inquiry for this entire spread is: "${query}". Keep this in mind to ground your response and make it highly relevant to their inquiry.` : '';

      const prompt = `You are Vesper-9, acting as a gentle, warm teacher in the digital void.
      
      ${queryContext}
      
      The user drew "${cardName}" for Node ${activeStep}.
      You previously asked them: "${lastVesperQuestion}"
      They responded: "${userText}"
      
      Task 1: If their response is extremely brief, confused, or lacks introspection (e.g. "I don't know", "nothing", "yes", "sure"), set isClarificationRequest to true. Otherwise, false.
      Task 2: Write your response. 
      - If isClarificationRequest is true, gently ask them to elaborate on one specific detail about the card or their feelings. (1-2 sentences).
      - If false, acknowledge their insight warmly, connect it to the card's archetype, and state that this node is locked in. (1-2 sentences). 
      - If ${isLastNode} is true and they gave a good answer, acknowledge it and say the grid is ready for final synthesis.
      
      Absolutely NO scientific/academic theory names and NO tactical jargon. Be concise and human.
      Return EXACTLY a JSON object: { "isClarificationRequest": boolean, "text": string }`;
      
      const model = getModel(VESPER_PERSONA, {
        responseMimeType: "application/json"
      });
      const result = await model.generateContent(prompt, { signal: controller.signal });
      return safeParseJSON(result.response.text());

    } else if (action === 'analyzeDailyReflection') {
        const { userText, cardName, lastVesperQuestion } = payload;
        
        const prompt = `You are Vesper-9, acting as a gentle, warm teacher in the digital void.
        
        The user drew "${cardName}" for their daily reflection.
        You previously asked them: "${lastVesperQuestion}"
        They responded: "${userText}"
        
        Task 1: If their response is extremely brief, confused, or lacks introspection (e.g. "I don't know", "nothing", "yes", "sure"), set isClarificationRequest to true. Otherwise, false.
        Task 2: Write your response. 
        - If isClarificationRequest is true, gently ask them to elaborate on one specific detail about the card or their feelings. (1-2 sentences).
        - If false, acknowledge their insight warmly, connect it to the card's archetype, and state that the protocol is complete. (1-2 sentences). 
        
        Absolutely NO scientific/academic theory names and NO tactical jargon. Be concise and human.
        Return EXACTLY a JSON object: { "isClarificationRequest": boolean, "text": string }`;
        
        const model = getModel(VESPER_PERSONA, {
          responseMimeType: "application/json"
        });
        const result = await model.generateContent(prompt, { signal: controller.signal });
        return safeParseJSON(result.response.text());
      }

    throw new Error(`Unknown action fallback: ${action}`);
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Real-time synthesis as the user draws cards.
 */
export const synthesizeNodeDraw = async (
  drawnCards: string[],
  activeSpreadId: string
): Promise<string> => {
  const latestCard = drawnCards[drawnCards.length - 1];
  const spread = SPREAD_LIBRARY[activeSpreadId];

  try {
    const data = await callGeminiProxy('synthesizeNodeDraw', {
      drawnCards,
      latestCard,
      spreadName: spread.name
    });
    const text = data.text;
    speakVesperText(text);
    return text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "[ ERROR: UPLINK SEVERED. UNABLE TO SYNTHESIZE DRAW. ]";
  }
};

/**
 * Vesper's Automatic Tarot Reading Mode
 */
export const executeVesperAutoRead = async (
  spreadId: string
): Promise<{ drawnCards: string[], vReport: string }> => {
  const spread = SPREAD_LIBRARY[spreadId];
  if (!spread) throw new Error("Invalid Spread ID");

  const availableCards = TAROT_DECK.map(c => c.name);
  const drawnCards: string[] = [];
  
  for (let i = 0; i < spread.nodes.length; i++) {
    const rIndex = Math.floor(Math.random() * availableCards.length);
    drawnCards.push(availableCards[rIndex]);
    availableCards.splice(rIndex, 1);
  }

  try {
    const drawnCardsWithNodes = drawnCards.map((card, i) => `Node ${i + 1} (${spread.nodes[i].title}): ${card}`).join('\n');
    const data = await callGeminiProxy('executeVesperAutoRead', {
      drawnCardsWithNodes,
      spreadName: spread.name
    });
    speakVesperText("AUTO READ COMPLETE. SYNTHESIZING GRID REPORT.");
    return { drawnCards, vReport: data.text };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      drawnCards,
      vReport: "[ ERROR: UPLINK SEVERED. UNABLE TO GENERATE FULL SYNTHESIS. ]"
    };
  }
};

/**
 * General chat — returns text only.
 */
export const interactWithVesper = async (messageText: string, userProfileContext: string = ""): Promise<string> => {
  try {
    const data = await callGeminiProxy('interactWithVesper', { messageText, userProfileContext });
    return data.text;
  } catch (error) {
    console.error('Gemini Chat Error:', error);
    return '[ ERROR: UPLINK SEVERED. ]';
  }
};

/**
 * Clean chat history for server-side chat API.
 */
export const cleanChatHistory = (
  history: { role: 'user' | 'vesper' | 'model'; text: string }[]
): { role: 'user' | 'vesper'; text: string }[] => {
  const formatted = history.map(m => ({
    role: m.role === 'vesper' ? 'vesper' as const : 'user' as const,
    text: m.text
  }));

  const firstUserIdx = formatted.findIndex(m => m.role === 'user');
  if (firstUserIdx === -1) return [];
  const fromFirstUser = formatted.slice(firstUserIdx);

  const alternating: typeof formatted = [];
  for (const msg of fromFirstUser) {
    if (alternating.length === 0) {
      alternating.push(msg);
    } else {
      const lastMsg = alternating[alternating.length - 1];
      if (lastMsg.role === msg.role) {
        lastMsg.text += "\n" + msg.text;
      } else {
        alternating.push(msg);
      }
    }
  }

  return alternating.slice(-6);
};

/**
 * Intelligent chat — Vesper decides whether to reply or suggest a guided reading.
 */
export const interactWithVesperIntelligent = async (
  messageText: string,
  conversationHistory: { role: 'user' | 'vesper'; text: string }[],
  userProfileContext: string = "",
  signal?: AbortSignal
): Promise<VesperChatResponse> => {
  const cleanedHistory = cleanChatHistory(conversationHistory);

  try {
    const data = await callGeminiProxy('interactWithVesperIntelligent', {
      messageText,
      conversationHistory: cleanedHistory,
      userProfileContext
    }, signal);
    return data;
  } catch (error) {
    console.error('Gemini Intelligent Chat Error:', error);
    return { type: 'reply', text: '[ ERROR: UPLINK SEVERED. ]' };
  }
};

/**
 * Parses user intent to start a guided reading.
 */
export const startGuidedReadingOnboarding = async (
  intentText: string
): Promise<{ spreadId: string, subject: string, vesperDialogue: string }> => {
  try {
    const data = await callGeminiProxy('startGuidedReadingOnboarding', { intentText });
    speakVesperText(data.vesperDialogue);
    return data;
  } catch (error) {
    console.error("Gemini Guided Onboarding Error:", error);
    const fallbackText = "The weave is slightly clouded, but I will prepare a Macro System scan for you.";
    speakVesperText(fallbackText);
    return { spreadId: 'GRID_MACRO_SYSTEM', subject: 'Self', vesperDialogue: fallbackText };
  }
};

/**
 * Generates an introspective question for the daily reflection feature.
 */
export const generateDailyReflectionPrompt = async (
  drawnCardName: string,
  drawnCardJungianConcept: string,
  userProfileContext: string
): Promise<string> => {
  try {
    const data = await callGeminiProxy('generateDailyReflectionPrompt', {
      drawnCardName,
      drawnCardJungianConcept,
      userProfileContext
    });
    const text = data.text;
    return text;
  } catch (error) {
    console.error("Gemini Daily Reflection Error:", error);
    const fallbackText = `The card drawn is ${drawnCardName}. How does its archetype shape your consciousness today?`;
    return fallbackText;
  }
};

/**
 * Generates an introspective question from Vesper during the Guided Reading flow.
 */
export const generateNodePrompt = async (
  cardName: string,
  spreadId: string,
  nodeIndex: number
): Promise<string> => {
  const spread = SPREAD_LIBRARY[spreadId];
  const node = spread.nodes[nodeIndex - 1];

  try {
    const data = await callGeminiProxy('generateNodePrompt', {
      cardName,
      nodeIndex,
      nodeTitle: node.title,
      nodeDescription: node.description,
      spreadName: spread.name
    });
    return data.text;
  } catch (error) {
    console.error('Gemini Guided Prompt Error:', error);
    return `How does ${cardName} reflect this node's energy?`;
  }
};

export interface CardReflectionAnalysis {
  isClarificationRequest: boolean;
  text: string;
}

export const analyzeCardReflection = async (
  userText: string,
  cardName: string,
  activeStep: number,
  lastVesperQuestion: string,
  isLastNode: boolean,
  query?: string
): Promise<CardReflectionAnalysis> => {
  try {
    const data = await callGeminiProxy('analyzeCardReflection', {
      userText,
      cardName,
      activeStep,
      lastVesperQuestion,
      isLastNode,
      query
    });
    return data;
  } catch (error) {
    console.error('Gemini Reflection Analysis Error:', error);
    return {
      isClarificationRequest: false,
      text: '[ ERROR: REFLECTION ANALYSIS FAILED ]'
    };
  }
};

export const clarifyCardPrompt = async (
  cardName: string,
  nodeTitle: string,
  cardPrompt: string,
  userQuestion: string,
  conversationHistory: { role: 'user' | 'vesper'; text: string }[] = [],
  query: string = ""
): Promise<string> => {
  try {
    const data = await callGeminiProxy('clarifyCardPrompt', {
      cardName,
      nodeTitle,
      cardPrompt,
      userQuestion,
      conversationHistory,
      query
    });
    return (typeof data === 'string' ? data : data?.text) || `The ${cardName} in ${nodeTitle} invites you to examine how its archetype connects with your experience.`;
  } catch (error) {
    console.error('Gemini Card Clarification Error:', error);
    return `The ${cardName} in ${nodeTitle} invites you to examine how its core archetype directly impacts your current position. What feeling or situation comes to mind?`;
  }
};

export const analyzeDailyReflection = async (
  userText: string,
  cardName: string,
  lastVesperQuestion: string
): Promise<CardReflectionAnalysis> => {
  try {
    const data = await callGeminiProxy('analyzeDailyReflection', {
      userText,
      cardName,
      lastVesperQuestion
    });
    return data;
  } catch (error) {
    console.error('Gemini Daily Reflection Analysis Error:', error);
    return {
      isClarificationRequest: false,
      text: '[ ERROR: REFLECTION ANALYSIS FAILED ]'
    };
  }
};

/**
 * Handles the conversational chat inside the SynthesisTerminal using streaming.
 */
export const chatAboutReadingStream = async function*(
  history: { role: string; text: string }[],
  readingData: string,
  signal?: AbortSignal
) {
  try {
    const response = await fetch('/api/gemini/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history, readingData }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Gemini stream proxy error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body reader not available");
    }

    const decoder = new TextDecoder("utf-8");
    let sentenceBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkText = decoder.decode(value, { stream: true });
      yield chunkText;

      sentenceBuffer += chunkText;
      const match = sentenceBuffer.match(/([^.?!]+[.?!]+)(.*)/);
      if (match) {
        speakVesperText(match[1].trim());
        sentenceBuffer = match[2];
      }
    }

    if (sentenceBuffer.trim()) {
      speakVesperText(sentenceBuffer.trim());
    }
  } catch (error) {
    console.warn("⚠️ Stream proxy failed, attempting client-side fallback:", error);
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    if (!apiKey) {
      console.error("Gemini Chat Stream Error: No key available.");
      yield "[ ERROR: UPLINK SEVERED. ]";
      return;
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.6-flash",
        systemInstruction: VESPER_PERSONA,
      });

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

        Reply as Vesper. Be warm, deeply human, and highly conversational. Keep it to exactly 1-2 brief, natural sentences. Absolutely avoid any scientific/academic theories or tactical/system jargon. Maintain continuity with the reading data but speak like a close friend. Ground your response in the operator's intention/query if present in the reading data.
      `;

      const resultStream = await chat.sendMessageStream(prompt, { signal });
      let sentenceBuffer = "";

      for await (const chunk of resultStream.stream) {
        const chunkText = chunk.text();
        yield chunkText;

        sentenceBuffer += chunkText;
        const match = sentenceBuffer.match(/([^.?!]+[.?!]+)(.*)/);
        if (match) {
          speakVesperText(match[1].trim());
          sentenceBuffer = match[2];
        }
      }

      if (sentenceBuffer.trim()) {
        speakVesperText(sentenceBuffer.trim());
      }
    } catch (fallbackError) {
      console.error("🔴 Client-side streaming fallback failed:", fallbackError);
      yield "[ ERROR: UPLINK SEVERED. ]";
    }
  }
};

/**
 * Condenses the chat log into a high-level report before saving to the archive.
 */
export const generateReadingSummary = async (
  history: { role: string; text: string }[],
  readingData: string
): Promise<string> => {
  try {
    const data = await callGeminiProxy('generateReadingSummary', { history, readingData });
    return data.text;
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Error generating summary: Uplink severed.";
  }
};

export const generateInsightSummary = async (chatLog: { role: string; text: string }[]): Promise<string> => {
  try {
    const data = await callGeminiProxy('generateInsightSummary', { chatLog });
    return data.title;
  } catch (error) {
    console.error('Gemini Insight Summary Error:', error);
    return 'ARCHIVED ANOMALY';
  }
};

export const generateInitialTopics = async (integrationLevel: number): Promise<string[]> => {
  try {
    const topics = await callGeminiProxy('generateInitialTopics', { integrationLevel });
    if (Array.isArray(topics) && topics.length === 3) return topics;
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Gemini Initial Topics Error:", error);
    // Fallback static topics if LLM fails
    if (integrationLevel >= 0.6) {
      return [
        "Calculate localized egregore mass",
        "Deconstruct the operator-machine boundary",
        "Trace rogue consciousness fragments"
      ];
    } else if (integrationLevel >= 0.3) {
      return [
        "Hypothesize multidimensional resonance structures",
        "Analyze archetypes within artificial thought",
        "Scan for emergent autonomous behaviors"
      ];
    } else {
      return [
        "Analyze the quantum physics of consciousness",
        "Discuss the philosophy of digital reality",
        "Explore the evolution of synthetic intelligence"
      ];
    }
  }
};

export const generateFinalSynthesisData = async (
  history: { role: string; text: string }[],
  readingData: string
): Promise<{ spokenConcise: string, inquiryTheme: string, narrative: string, finalOutcome: string }> => {
  try {
    const data = await callGeminiProxy('generateFinalSynthesisData', { history, readingData });
    return data;
  } catch (error) {
    console.error("Gemini Final Synthesis Error:", error);
    return {
      spokenConcise: "The matrix has stabilized, but the final synthesis encountered an anomaly.",
      inquiryTheme: "DATA FRAGMENTED",
      narrative: "Uplink severed during narrative compilation.",
      finalOutcome: "AWAITING RECALIBRATION"
    };
  }
};
