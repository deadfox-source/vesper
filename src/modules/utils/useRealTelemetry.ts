import { useState, useEffect } from 'react';

export interface TelemetryState {
  battery: { level: number | null; charging: boolean | null; supported: boolean };
  weather: { temp: number | null; code: number | null; status: string; supported: boolean };
  location: { lat: number | null; lon: number | null; status: string };
  spaceWeather: { kpIndex: number | null; status: string };
  cpu: { cores: number | null };
}

export const useRealTelemetry = () => {
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    battery: { level: null, charging: null, supported: true },
    weather: { temp: null, code: null, status: 'AWAITING COORDS', supported: true },
    location: { lat: null, lon: null, status: 'AWAITING COORDS' },
    spaceWeather: { kpIndex: null, status: 'FETCHING' },
    cpu: { cores: navigator.hardwareConcurrency || null },
  });

  useEffect(() => {
    // 1. Battery Telemetry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let batteryInstance: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateBattery = (b: any) => {
      setTelemetry(prev => ({
        ...prev,
        battery: { level: b.level, charging: b.charging, supported: true }
      }));
    };

    if ('getBattery' in navigator) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).getBattery().then((b: any) => {
        batteryInstance = b;
        updateBattery(b);
        b.addEventListener('levelchange', () => updateBattery(b));
        b.addEventListener('chargingchange', () => updateBattery(b));
      }).catch(() => {
        setTelemetry(prev => ({ ...prev, battery: { ...prev.battery, supported: false } }));
      });
    } else {
      setTimeout(() => {
        setTelemetry(prev => ({ ...prev, battery: { ...prev.battery, supported: false } }));
      }, 0);
    }

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', () => updateBattery(batteryInstance));
        batteryInstance.removeEventListener('chargingchange', () => updateBattery(batteryInstance));
      }
    };
  }, []);

  useEffect(() => {
    // 2. Geolocation & Weather
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setTelemetry(prev => ({ ...prev, location: { lat, lon, status: 'ONLINE' } }));
          try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const data = await res.json();
            if (data.current_weather) {
              setTelemetry(prev => ({
                ...prev,
                weather: { 
                  temp: data.current_weather.temperature, 
                  code: data.current_weather.weathercode,
                  status: 'ONLINE',
                  supported: true
                }
              }));
            }
          } catch {
            setTelemetry(prev => ({ ...prev, weather: { ...prev.weather, status: 'API ERR' } }));
          }
        },
        () => {
          setTelemetry(prev => ({ 
            ...prev, 
            weather: { ...prev.weather, status: 'DENIED/UNAVAIL' },
            location: { ...prev.location, status: 'DENIED' } 
          }));
        }
      );
    } else {
      setTimeout(() => {
        setTelemetry(prev => ({ 
          ...prev, 
          weather: { ...prev.weather, supported: false, status: 'NO SENSOR' },
          location: { ...prev.location, status: 'NO SENSOR' }
        }));
      }, 0);
    }
  }, []);

  useEffect(() => {
    // 3. Space Weather (NOAA Planetary K-index)
    const fetchSpaceWeather = async () => {
      try {
        const res = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
        const data = await res.json();
        // Data format: [ ["time_tag", "Kp"], ["2023-10-10 00:00:00", "2.33"], ... ]
        if (data && data.length > 1) {
          const latest = data[data.length - 1];
          const kp = parseFloat(latest[1]);
          setTelemetry(prev => ({
            ...prev,
            spaceWeather: { kpIndex: kp, status: 'ONLINE' }
          }));
        }
      } catch {
        setTelemetry(prev => ({ ...prev, spaceWeather: { ...prev.spaceWeather, status: 'API ERR' } }));
      }
    };

    fetchSpaceWeather();
    // Refresh space weather every 10 minutes
    const interval = setInterval(fetchSpaceWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return telemetry;
};
