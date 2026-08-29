import { useEffect, useState, useMemo } from 'react';
import { VectorCanvas } from './VectorCanvas';
import { useVesperStore } from '../../modules/StateManager/vesperStore';
import { getAudioAnalyser } from '../../modules/utils/vesperSpeech';
import { useRealTelemetry } from '../../modules/utils/useRealTelemetry';

export const GlobalVesperAvatar = () => {
  const { isListening, isSpeaking, messages } = useVesperStore();
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
  const telemetry = useRealTelemetry();

  useEffect(() => {
    const analyser = getAudioAnalyser();
    if (analyser) {
      setAudioAnalyser(analyser);
    }
  }, [isSpeaking]);

  const latestEmotion = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].emotion) return messages[i].emotion;
    }
    return 'neutral';
  }, [messages]);

  const avatarColor = useMemo(() => {
    if (latestEmotion === 'aggressive' || latestEmotion === 'negative') return '#ff6600';
    if (isSpeaking) return '#00f0ff';
    if (isListening) return '#ffb800';
    return '#8b5cf6';
  }, [latestEmotion, isSpeaking, isListening]);

  const mode = isSpeaking ? 'ACTIVE' : (isListening ? 'THINKING' : 'IDLE');

  return (
    <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
      <VectorCanvas 
        mode={mode} 
        color={avatarColor}
        audioAnalyser={audioAnalyser} 
        telemetry={{
          battery: telemetry.battery,
          weather: telemetry.weather,
          spaceWeather: telemetry.spaceWeather,
          isOnline: navigator.onLine
        }}
      />
    </div>
  );
};
