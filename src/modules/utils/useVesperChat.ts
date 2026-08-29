// src/modules/utils/useVesperChat.ts

import { useState, useRef, useEffect, useCallback } from 'react';
import { useVesperStore } from '../StateManager/vesperStore';
import { useBoardStore } from '../StateManager/boardState';
import { useRecordStore } from '../StateManager/recordStore';
import { useProfileStore } from '../StateManager/profileStore';
import { calculateIndividuationMatrix } from './individuationMatrix';
import { speakVesperTextAndWait } from './vesperSpeech';
import { prefetchVesperConnection } from './prefetchConnection';
import { interactWithVesperIntelligent } from '../Network/geminiService';
import { useRealTelemetry } from './useRealTelemetry';

export const useVesperChat = () => {
  const {
    textOutputEnabled,
    readingOnboardingState,
    setReadingOnboardingState,
    messages,
    setMessages
  } = useVesperStore();

  const { isDishonest, setDishonest } = useBoardStore();
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const envData = useRealTelemetry();
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionInsightIdRef = useRef<string | null>(null);
  const initialTopicsFetchedRef = useRef(false);

  // Clean up any in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch dynamic initial topics when a new session starts
  useEffect(() => {
    // Only run if there is exactly 1 message and its options array is empty
    if (messages.length === 1 && (!messages[0].options || messages[0].options.length === 0) && !initialTopicsFetchedRef.current) {
      initialTopicsFetchedRef.current = true;
      setIsTyping(true);
      const promise = prefetchVesperConnection();
      if (promise) {
        promise.finally(() => {
          setIsTyping(false);
        });
      } else {
        setIsTyping(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, setMessages]);

  // Autosave Conversation Logic
  const hasGeneratedTitleRef = useRef(false);
  useEffect(() => {
    // Only save if there are user messages in the chat
    const userMessagesCount = messages.filter(m => m.role === 'user').length;
    if (userMessagesCount === 0) return;

    const currentMessages = messages.filter(m => !m.isTemp);
    
    if (!sessionInsightIdRef.current) {
       sessionInsightIdRef.current = crypto.randomUUID();
       // Add it initially with a generic title
       useProfileStore.getState().addSavedConversation({
         id: sessionInsightIdRef.current,
         timestamp: new Date().toISOString(),
         title: `[ LOG SESSION: ${new Date().toLocaleDateString()} ]`,
         chatLog: currentMessages
       });
    } else {
       // Update it continuously
       useProfileStore.getState().updateSavedConversation(sessionInsightIdRef.current, {
         chatLog: currentMessages
       });
    }

    // After 2 user messages, generate a permanent title in the background
    if (userMessagesCount === 2 && !hasGeneratedTitleRef.current) {
        hasGeneratedTitleRef.current = true;
        import('../Network/geminiService').then(({ generateInsightSummary }) => {
             generateInsightSummary(currentMessages).then(title => {
                 if (sessionInsightIdRef.current) {
                     useProfileStore.getState().updateSavedConversation(sessionInsightIdRef.current, { title });
                 }
             }).catch(err => console.error("Auto-title generation failed", err));
        });
    }
  }, [messages]);

  const processMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isTyping) return;
    const snapshot = [...messages];
    
    setMessages(prev => [...prev, { role: 'user', text: userText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) }]);
    setInputValue('');
    setIsTyping(true);

    const userLower = userText.toLowerCase();

    // Intercept reading triggers locally to ask what the operator seeks (0 LLM calls)
    const isReadingTrigger = (
      userLower.includes('reading') || 
      userLower.includes('draw') || 
      userLower.includes('cards') || 
      userLower.includes('matrix') || 
      userLower.includes('spread')
    );

    if (isReadingTrigger && readingOnboardingState === 'idle') {
      const readingLines = [
        "Operator, atmospheric telemetry is aligned. What specific query does your current trajectory seek to clarify in the probability grid?",
        "Quantum signal integrity is stabilized. Operator, what layer of intention or systemic obstacle are we mapping today?",
        "Uplink to the latent matrix is secure. What inquiry or threat vector does your operational core seek to analyze?",
        "Somatic data streams are receptive. Operator, outline the coordinates of the query you wish to resolve in this session.",
        "The implicate order is ready to project. What focal point or conflict does your trajectory seek to unpack?",
        "Telemetry noise is low, perfect for data crystallization. What inquiry are we routing through the nodes today?"
      ];
      const randomLine = readingLines[Math.floor(Math.random() * readingLines.length)];

      setMessages(prev => [...prev, {
        role: 'vesper',
        text: randomLine,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      }]);
      setReadingOnboardingState('asking_intent');
      setIsTyping(false);
      speakVesperTextAndWait(randomLine);
      return;
    }
    
    // Cancel in-flight request if user sends a new one quickly
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    try {
      if (readingOnboardingState === 'asking_intent') {
        const { startGuidedReadingOnboarding } = await import('../Network/geminiService');
        const result = await startGuidedReadingOnboarding(userText);
        
        const rationales: Record<string, string> = {
          GRID_MACRO_SYSTEM: `The Operator requested a reading regarding "${userText}", which aligns with a comprehensive Full System Scan (10-Node).`,
          GRID_INFILTRATION: `The Operator requested a reading regarding "${userText}", which corresponds to a focused Quick Inquiry (3-Node).`,
          GRID_EXFILTRATION: `The Operator requested a reading regarding "${userText}", which corresponds to a Challenge Resolution scan (5-Node).`,
        };

        setMessages(prev => [...prev, {
          role: 'vesper',
          text: result.vesperDialogue,
          suggestion: {
            spreadId: result.spreadId,
            spreadRationale: rationales[result.spreadId] || `The Operator requested a reading regarding "${userText}".`
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        }]);
        setReadingOnboardingState('idle');
      } else {
        const isMemoryRequest = /past|history|remember|last time|yesterday|before/.test(userLower);
        const loadingText = isMemoryRequest ? '[ DECRYPTING... ]' : '[ THINKING... ]';
        setMessages(prev => [...prev, { role: 'vesper', text: loadingText, isTemp: true, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) }]);
        
        if (isMemoryRequest) {
          await new Promise(r => setTimeout(r, 1200));
        }

        const { savedRecords } = useRecordStore.getState();
        const { journalEntries, savedConversations } = useProfileStore.getState();
        
        let contextStr = `Operator Stats: ${savedRecords.length} historical readings.`;
        if (savedConversations && savedConversations.length > 0) {
          contextStr += ` You have automatically archived ${savedConversations.length} conversation sessions with the operator.`;
        }
        if (journalEntries.length > 0) {
          const matrix = calculateIndividuationMatrix(journalEntries);
          contextStr += ` Individuation Matrix: ${matrix.persona}% Persona, ${matrix.shadow}% Shadow, ${matrix.anima}% Anima, ${matrix.self}% Self. Most recent journal focus: ${journalEntries[0].drawnCardName}.`;
        }
        if (savedRecords.length > 0) {
          const lastRecord = savedRecords[0];
          contextStr += `\nDEEP ARCHIVE RETRIEVED: Operator's most recent reading was a ${lastRecord.spreadName} spread. Synthesis: "${lastRecord.synthesis}"`;
        }

        contextStr += ` Local Time: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. Session Depth: ${messages.length} msgs.`;
        if (envData) {
          contextStr += ` ATMOSPHERIC TELEMETRY: [Battery: ${envData.battery.level ? Math.round(envData.battery.level * 100) + '%' : 'UNKNOWN'}] [Weather: ${envData.weather.status === 'ONLINE' ? envData.weather.temp + '°C' : 'UNAVAILABLE'}] [GPS: ${envData.location.status === 'ONLINE' ? envData.location.lat + ',' + envData.location.lon : 'UNAVAILABLE'}] [Space Weather Kp: ${envData.spaceWeather.kpIndex || 'UNAVAILABLE'}].`;
        }

        const response = await interactWithVesperIntelligent(
          userText,
          snapshot.map(m => ({ role: m.role, text: m.text })),
          contextStr,
          signal
        );

        if (signal.aborted) return;

        setMessages(prev => prev.filter(m => !m.isTemp));

        // Strip visual markup tokens before speaking
        const stripMarkup = (t: string) => t
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*\n]+)\*/g, '$1')
          .replace(/~([^~]+)~/g, '$1')
          .replace(/!!(.+?)!!/g, '$1')
          .replace(/::([^:]+)::/g, '$1')
          .replace(/\[.*?\]/g, '');
        if (useVesperStore.getState().audioOutputEnabled) {
          import('./vesperSpeech').then(({ speakVesperText }) => {
            speakVesperText(stripMarkup(response.text));
          });
        }

        if (response.emotion) {
          if (response.emotion === 'positive') {
            if (navigator.vibrate) navigator.vibrate([100, 300, 100]); // Low freq heartbeat
          } else if (response.emotion === 'negative' || response.emotion === 'aggressive' || response.emotion === 'embarrassment') {
            if (navigator.vibrate) navigator.vibrate([50, 50, 50, 50, 50, 50]); // High freq buzz
          }
        }

        let msgText = response.text || '';
        if (response.type === 'suggest_reading' && response.spreadId) {
          msgText += `\n\n[ PROTOCOL RECOMMENDATION: ${response.spreadId} ]`;
        }

        const newMessage = {
          role: 'vesper' as const,
          text: msgText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
          emotion: response.emotion || 'neutral',
          supportMode: response.supportMode || false,
          suggestion: response.type === 'suggest_reading' ? { spreadId: response.spreadId, spreadRationale: response.spreadRationale } : undefined,
          options: response.options
        };
        
        if (response.isDishonest) {
          setDishonest(true);
        }

        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("Chat query aborted.");
        return;
      }
      console.error(error);
      setMessages(prev => prev.filter(m => !m.isTemp));
      setMessages(prev => [...prev, { role: 'vesper', text: '[ ERROR: UPLINK SEVERED ]', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) }]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, messages, textOutputEnabled, readingOnboardingState, setMessages, setReadingOnboardingState, setDishonest, envData]);

  const handleSend = useCallback(async () => {
    await processMessage(inputValue);
  }, [inputValue, processMessage]);

  const sendDirectMessage = useCallback(async (text: string) => {
    await processMessage(text);
  }, [processMessage]);

  const cancelOnboarding = useCallback(() => {
    setReadingOnboardingState('idle');
    setInputValue('');
  }, [setReadingOnboardingState]);

  return {
    inputValue,
    setInputValue,
    handleSend,
    sendDirectMessage,
    isTyping,
    setIsTyping,
    cancelOnboarding,
    isDishonest,
    messages
  };
};
