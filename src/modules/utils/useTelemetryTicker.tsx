import { useMemo, useState, useEffect } from 'react';
import { Battery, Cloud, Globe, Activity } from 'lucide-react';
import { useRealTelemetry } from './useRealTelemetry';
import type { TelemetryItem } from '../../components/ui/VesperHeader';

export const useTelemetryTicker = (): TelemetryItem => {
  const telemetry = useRealTelemetry();

  const powerBlock = useMemo((): TelemetryItem => {
    if (telemetry.battery.supported && telemetry.battery.level !== null) {
      return {
        icon: <Battery size={14} />,
        label: 'POWER',
        value: `${Math.round(telemetry.battery.level * 100)}% [${telemetry.battery.charging ? 'AC' : 'DC'}]`,
        color: telemetry.battery.level < 0.2 ? 'var(--magi-orange)' : 'var(--eva-cyan)'
      };
    }
    return {
      icon: <Activity size={14} />,
      label: 'SYS.CORES',
      value: telemetry.cpu.cores ? telemetry.cpu.cores.toString() : 'UNKNOWN',
      color: 'var(--eva-cyan)'
    };
  }, [telemetry.battery, telemetry.cpu]);

  const weatherBlock = useMemo((): TelemetryItem => {
    if (telemetry.weather.status === 'ONLINE' && telemetry.weather.temp !== null) {
      return {
        icon: <Cloud size={14} />,
        label: 'LOCAL.TEMP',
        value: `${telemetry.weather.temp}°C`,
        color: 'var(--eva-cyan)'
      };
    }
    return {
      icon: <Cloud size={14} />,
      label: 'LOCAL.TEMP',
      value: telemetry.weather.status,
      color: 'var(--vesper-blue)',
      scramble: true
    };
  }, [telemetry.weather]);

  const spaceWeatherBlock = useMemo((): TelemetryItem => {
    if (telemetry.spaceWeather.status === 'ONLINE' && telemetry.spaceWeather.kpIndex !== null) {
      const kp = telemetry.spaceWeather.kpIndex;
      return {
        icon: <Globe size={14} />,
        label: 'Kp-INDEX',
        value: kp.toFixed(2),
        color: kp >= 5 ? 'var(--magi-orange)' : 'var(--eva-cyan)',
        scramble: kp >= 5
      };
    }
    return {
      icon: <Globe size={14} />,
      label: 'Kp-INDEX',
      value: telemetry.spaceWeather.status,
      color: 'var(--vesper-blue)',
      scramble: true
    };
  }, [telemetry.spaceWeather]);

  const [tickerIndex, setTickerIndex] = useState(0);
  const rotatingBlocks = useMemo(() => [powerBlock, weatherBlock, spaceWeatherBlock], [powerBlock, weatherBlock, spaceWeatherBlock]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % rotatingBlocks.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [rotatingBlocks.length]);

  return rotatingBlocks[tickerIndex];
};
