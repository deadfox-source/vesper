import { useVesperStore } from '../StateManager/vesperStore';

// Persistent HTMLAudioElement to satisfy iOS WebKit user-gesture requirements
const globalAudio = typeof window !== 'undefined' ? new Audio() : null;

// Tiny silent WAV sound to synchronously initialize and unlock the audio stream in WebKit
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

let globalAudioAnalyser: AnalyserNode | null = null;

export const getAudioAnalyser = (): AnalyserNode | null => {
  if (typeof window === 'undefined') return null;
  if (globalAudioAnalyser) return globalAudioAnalyser;
  if (!globalAudio) return null;

  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = ctx.createMediaElementSource(globalAudio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64; // Small fftSize since we only need 32 frequency bins
    
    // Connect source to analyser and analyser to destination so we can still hear the audio
    source.connect(analyser);
    analyser.connect(ctx.destination);
    
    globalAudioAnalyser = analyser;

    // Resume context if suspended
    const resume = () => {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(err => console.warn("Failed to resume AudioContext", err));
      }
    };
    window.addEventListener('click', resume, { passive: true });
    window.addEventListener('touchstart', resume, { passive: true });

    return analyser;
  } catch (error) {
    console.warn("🟢 [Audio System] Failed to create audio analyser for globalAudio:", error);
    return null;
  }
};

let isAudioUnlocked = false;

export const unlockAudio = () => {
  if (!globalAudio || isAudioUnlocked) return;
  
  // If it's already playing actual audio, don't interrupt it.
  // It's probably already unlocked if it's playing.
  if (!globalAudio.paused && globalAudio.src && !globalAudio.src.startsWith('data:audio/wav')) {
    isAudioUnlocked = true;
    return;
  }

  // Synchronously play and pause a tiny silent sound on the first interaction
  const originalSrc = globalAudio.src;
  globalAudio.src = SILENT_WAV;
  
  globalAudio.play()
    .then(() => {
      globalAudio.pause();
      isAudioUnlocked = true;
      // Note: we do not restore originalSrc because it might auto-play unexpectedly and it's safer to leave it silent until needed
    })
    .catch(err => {
      console.warn("🟢 [Audio System] WebKit speech channel pre-unlock failed/deferred:", err);
      // Restore if we failed, just in case
      globalAudio.src = originalSrc;
    });
};

// Hook up automatic click/touch unlock listeners
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    if (!isAudioUnlocked) unlockAudio();
    if (isAudioUnlocked) {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    }
  };
  window.addEventListener('click', handleInteraction, { passive: true });
  window.addEventListener('touchstart', handleInteraction, { passive: true });
}

interface SpeechTask {
  text: string;
  resolve: () => void;
}

let speechQueueTasks: SpeechTask[] = [];
let isProcessingQueue = false;

export const clearSpeechQueue = () => {
  speechQueueTasks.forEach(task => task.resolve());
  speechQueueTasks = [];
  
  if (globalAudio) {
    globalAudio.pause();
    // Keep it loaded with silent WAV so it stays unlocked on iOS
    try {
      globalAudio.src = SILENT_WAV;
    } catch (e) {
      console.warn("Failed to set silent WAV on clear:", e);
    }
  }
  useVesperStore.getState().setSpeaking(false);
  useVesperStore.getState().setActiveSpeechSentence(null);
  isProcessingQueue = false;
};

export const setVoiceEnabled = (enabled: boolean) => {
  if (!enabled) {
    clearSpeechQueue();
  }
};

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const ttsPromiseCache = new Map<string, Promise<string | null>>();

const getAudioContent = (text: string): Promise<string | null> => {
  let promise = ttsPromiseCache.get(text);
  if (promise) {
    return promise;
  }

  promise = (async () => {
    try {
      if (API_KEY) {
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

          if (response.ok) {
            const data = await response.json();
            return data.audioContent || null;
          } else {
            console.warn("Direct client TTS failed, falling back to local proxy...", await response.text());
          }
        } catch (directErr) {
          console.warn("Direct client TTS request failed, trying local proxy fallback...", directErr);
        }
      }

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        console.error("TTS Fetch Error:", await response.text());
        return null;
      }

      const data = await response.json();
      return data.audioContent || null;
    } catch (error) {
      console.error("TTS Network Error:", error);
      return null;
    }
  })();

  ttsPromiseCache.set(text, promise);
  return promise;
};

const cleanTextContent = (text: string) => {
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[#*_~"`{}[\]<>/\\|]+/g, '')
    .replace(/^>\s*/, '')
    .replace(/!{2,}/g, '!')
    .replace(/(^|\s)-+|-+(\s|$)/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b([A-Z])([A-Z]+)\b/g, (_match, p1, p2) => p1 + p2.toLowerCase());
};

const _playAudioAndWait = async (text: string): Promise<void> => {
  const store = useVesperStore.getState();
  const audioEnabled = store.audioOutputEnabled;
  if (!audioEnabled || !globalAudio) {
    return;
  }

  const base64Audio = await getAudioContent(text);
  if (!base64Audio || !useVesperStore.getState().audioOutputEnabled) {
    useVesperStore.getState().setSpeaking(false);
    useVesperStore.getState().setActiveSpeechSentence(null);
    return;
  }

  store.setSpeaking(true);
  store.setActiveSpeechSentence(text);

  // Update source of the already unlocked persistent element
  globalAudio.src = `data:audio/mp3;base64,${base64Audio}`;

  return new Promise<void>((resolve) => {
    const safetyTimer = setTimeout(() => {
      const s = useVesperStore.getState();
      s.setSpeaking(false);
      s.setActiveSpeechSentence(null);
      resolve();
    }, 10_000);

    globalAudio.onplay = () => useVesperStore.getState().setSpeaking(true);
    globalAudio.onended = () => {
      const s = useVesperStore.getState();
      s.setSpeaking(false);
      s.setActiveSpeechSentence(null);
      clearTimeout(safetyTimer);
      resolve();
    };
    globalAudio.onerror = (err) => {
      console.error("🟢 [Audio System] Playback error:", err);
      const s = useVesperStore.getState();
      s.setSpeaking(false);
      s.setActiveSpeechSentence(null);
      clearTimeout(safetyTimer);
      resolve();
    };

    globalAudio.play().catch(e => {
      console.error("🟢 [Audio System] Playback promise failed:", e);
      useVesperStore.getState().setSpeaking(false);
      clearTimeout(safetyTimer);
      resolve();
    });
  });
};

const processTaskQueue = async () => {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (speechQueueTasks.length > 0) {
    const task = speechQueueTasks.shift();
    if (!task) continue;

    await _playAudioAndWait(task.text);
    task.resolve();
  }

  isProcessingQueue = false;
};

const enqueueSpeech = async (text: string, options?: { wait?: boolean }): Promise<void> => {
  const parts = text.split(/([.!?]+(?:\s+|$))/g);
  const rawSentences: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const t = parts[i] || '';
    const p = parts[i + 1] || '';
    const combined = (t + p).trim();
    if (combined) rawSentences.push(combined);
  }

  if (rawSentences.length === 0) {
    return;
  }

  // Pre-clean sentences and kick off pre-fetching
  const cleanedSentences: string[] = [];
  for (const sentence of rawSentences) {
    const cleanText = cleanTextContent(sentence);
    if (cleanText) {
      cleanedSentences.push(cleanText);
    }
  }

  if (cleanedSentences.length === 0) {
    return;
  }

  // Parallel pre-fetching of all sentences (highly concurrent, cached in ttsPromiseCache)
  cleanedSentences.forEach(sentence => {
    getAudioContent(sentence).catch(err => {
      console.warn("🟢 [Audio System] Pre-fetch failed for sentence:", sentence, err);
    });
  });

  // Sequentially process speech tasks
  for (const sentence of cleanedSentences) {
    await new Promise<void>((resolve) => {
      speechQueueTasks.push({ text: sentence, resolve });
      processTaskQueue();
    });
  }
};

export const speakVesperText = (text: string) => enqueueSpeech(text, { wait: false });
export const speakVesperTextAndWait = (text: string) => enqueueSpeech(text, { wait: true });
