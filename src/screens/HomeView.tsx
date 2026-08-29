import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { Terminal, Mic, Send, Wifi, Smile, Frown, Zap, Ghost, Activity } from 'lucide-react';

import { VesperHeader } from '../components/ui/VesperHeader';
import { ResonanceWaveform } from '../components/ui/ResonanceWaveform';
import { TerminalFrame, TerminalMessageList } from '../components/ui/VesperTerminal';
import { useVesperStore } from '../modules/StateManager/vesperStore';
import { useBoardStore } from '../modules/StateManager/boardState';
import { motion } from 'motion/react';
import { useVesperChat } from '../modules/utils/useVesperChat';

let hasSpokenGreetingGlobal = false;

export const HomeView = () => {
  const {
    isListening, setListening,
    setReadingOnboardingState,
    messages, setMessages
  } = useVesperStore();

  // Speak the initial greeting only after landing on the HomeView
  useEffect(() => {
    if (messages.length === 1 && !hasSpokenGreetingGlobal) {
      const text = messages[0].text;
      if (text.includes('CHAT WITH VESPER')) {
        hasSpokenGreetingGlobal = true;
        const parts = text.split('CHAT WITH VESPER\n\n');
        const greetingText = parts[1] || text;
        if (useVesperStore.getState().audioOutputEnabled) {
          import('../modules/utils/vesperSpeech').then(({ speakVesperText }) => {
            speakVesperText(greetingText);
          });
        }
      }
    }
  }, [messages]);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isDishonest, v9_social_logic_error } = useBoardStore();
  
  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  const {
    inputValue,
    setInputValue,
    isTyping,
    handleSend,
    sendDirectMessage
  } = useVesperChat();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // ── Speech Recognition Setup ──────────────────────────────────────
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (final) setInputValue(prev => (prev + ' ' + final).trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
  }, [setListening, setInputValue]);

  const toggleListen = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (error) {
        console.error('Failed to start recognition', error);
      }
    }
  }, [isListening, setListening]);

  // Haptic Listening Pulse
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isListening) {
      interval = setInterval(() => {
        if (navigator.vibrate) navigator.vibrate(20);
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening]);

  // ── Accept inline reading suggestion ─────────────────────────────
  const acceptReadingSuggestion = useCallback(async (spreadId: string) => {
    setReadingOnboardingState('idle');
    const { useBoardStore } = await import('../modules/StateManager/boardState');
    const { useNavigationStore } = await import('../modules/StateManager/navigationState');
    useBoardStore.getState().setReadingContext(true, 'Self', undefined);
    useBoardStore.getState().setGuidedMode(true);
    useBoardStore.getState().initializeGrid(spreadId);
    useNavigationStore.getState().navigate('TABLETOP');
  }, [setReadingOnboardingState]);

  // ── Dismiss inline suggestion ─────────────────────────────────────
  const dismissSuggestion = useCallback((idx: number) => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, suggestion: undefined } : m));
  }, [setMessages]);



  const latestEmotion = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].emotion) return messages[i].emotion;
    }
    return 'neutral';
  }, [messages]);

  const isAggressive = latestEmotion === 'aggressive' || latestEmotion === 'negative';

  const emotionConfig = useMemo(() => {
    switch(latestEmotion) {
      case 'positive': return { icon: <Smile size={14} />, label: 'AFFECT', value: 'POSITIVE', color: 'var(--eva-cyan)', scramble: false };
      case 'negative': return { icon: <Frown size={14} />, label: 'AFFECT', value: 'NEGATIVE', color: 'var(--magi-orange)', scramble: false };
      case 'aggressive': return { icon: <Zap size={14} />, label: 'AFFECT', value: 'AGGRESSIVE', color: 'var(--magi-orange)', scramble: true };
      case 'embarrassment': return { icon: <Ghost size={14} />, label: 'AFFECT', value: 'EMBARRASSED', color: 'var(--vesper-blue)', scramble: false };
      case 'neutral': 
      default: return { icon: <Activity size={14} />, label: 'AFFECT', value: 'NEUTRAL', color: 'var(--eva-cyan)', scramble: false };
    }
  }, [latestEmotion]);

  return (
    <div className={`material-background ${isAggressive ? 'chromatic-aberration' : ''} ${(isDishonest || v9_social_logic_error) ? 'magenta-glitch' : ''}`} style={{ flex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* Floating 3D VectorCanvas Background */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: 0,
        right: 0,
        bottom: 'var(--tabbar-total)',
        zIndex: 0
      }}>
        {/* VectorCanvas is now globally rendered in App.tsx */}
        <div style={{ height: '35vh', minHeight: '300px', width: '100%', position: 'relative', marginTop: '-30px' }} />
      </div>

      <VesperHeader
        title="COMMUNICATION LINK"
        accentColor="var(--vesper-blue)"
        ambientComponent={<ResonanceWaveform height={60} emotion={latestEmotion} />}
        telemetryData={[
          emotionConfig,
          { 
            icon: <Wifi size={14} />, 
            label: 'UPLINK', 
            value: isOnline ? 'ONLINE' : 'OFFLINE', 
            color: isOnline ? 'var(--eva-cyan)' : 'var(--magi-orange)' 
          }
        ]}
        actions={undefined}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '12px 6px 16px', gap: '12px', overflow: 'hidden', minHeight: 0, zIndex: 1 }}>

        {/* Chat Terminal Frame matching 40% vertical space */}
        <div style={{ width: '100%', height: '40dvh', minHeight: '230px', display: 'flex', flexDirection: 'column' }}>
          <TerminalFrame
            title={v9_social_logic_error ? "KERNEL PANIC // LOGIC ANOMALY" : "VESPER TERMINAL"}
            accentColor={v9_social_logic_error ? "var(--magi-orange)" : "var(--vesper-blue)"}
            headerSubtitle={v9_social_logic_error ? "[ ERR_0x44 ]" : `[ ${messages.length} MSG ]`}
            contentClassName={`${v9_social_logic_error ? 'magnetic-decay' : ''}`}
            style={{ flex: 1, minHeight: 0 }}
            contentStyle={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 8px 8px' }}
          >
            <TerminalMessageList
              messages={messages}
              isTyping={isTyping}
              accentColor={v9_social_logic_error ? "var(--magi-orange)" : "var(--vesper-blue)"}
              onLinkClick={() => {}}
              onAcceptSuggestion={acceptReadingSuggestion}
              onDismissSuggestion={dismissSuggestion}
              onOptionSelect={sendDirectMessage}
              style={{ flex: 1, overflowY: 'auto', marginBottom: '8px' }}
            />

            {/* Input Row */}
            <div style={{ display: 'flex', borderTop: '1px solid rgba(0,112,255,0.2)', background: 'var(--void-black)', padding: '8px 10px 0px', alignItems: 'center', gap: '8px', zIndex: 1, flexShrink: 0 }}>
              <Terminal size={15} style={{ color: 'var(--vesper-blue)', flexShrink: 0, opacity: 0.7 }} />
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                {!inputValue && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'rgba(230, 237, 243, 0.4)', fontFamily: 'monospace', fontSize: '15px' }}>
                    <span className="terminal-orange-cursor" />
                    <span>Enter message</span>
                  </div>
                )}
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    outline: 'none',
                    caretColor: 'var(--magi-orange)',
                    cursor: 'text'
                  }}
                />
              </div>
              {inputValue.trim() ? (
                <motion.button whileTap={{ scale: 0.88 }} onClick={handleSend}
                  style={{ background: 'rgba(255,102,0,0.1)', border: '1px solid var(--magi-orange)', color: 'var(--magi-orange)', borderRadius: '50%', minWidth: '36px', minHeight: '36px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <Send size={15} />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={toggleListen}
                  style={{
                    background: isListening ? 'rgba(255,102,0,0.15)' : 'transparent',
                    border: `1px solid ${isListening ? 'var(--magi-orange)' : 'var(--vesper-blue)'}`,
                    color: isListening ? 'var(--magi-orange)' : 'var(--vesper-blue)',
                    borderRadius: '50%',
                    minWidth: '36px',
                    minHeight: '36px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <Mic size={15} />
                </motion.button>
              )}
            </div>
          </TerminalFrame>
        </div>
      </div>

    </div>
  );
};
