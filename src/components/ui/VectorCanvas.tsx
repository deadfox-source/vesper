import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Add missing type declarations for React Three Fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      octahedronGeometry: any;
      meshPhysicalMaterial: any;
      icosahedronGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      cylinderGeometry: any;
      tetrahedronGeometry: any;
      dodecahedronGeometry: any;
      torusGeometry: any;
      sphereGeometry: any;
      ambientLight: any;
      pointLight: any;
    }
  }
}

export interface TelemetryDataInput {
  battery?: { level: number | null; charging: boolean | null };
  weather?: { temp: number | null; code: number | null };
  spaceWeather?: { kpIndex: number | null };
  isOnline?: boolean;
}

// ----------------------------------------------------
// TELEMETRY ORBITERS COMPONENT
// ----------------------------------------------------
export const TelemetryOrbiters = ({ telemetry }: { telemetry?: TelemetryDataInput }) => {
  const batteryGroup = useRef<THREE.Group>(null);
  const spaceWeatherGroup = useRef<THREE.Group>(null);
  const weatherGroup = useRef<THREE.Group>(null);
  const networkGroup = useRef<THREE.Group>(null);

  const batteryMesh = useRef<THREE.Mesh>(null);
  const spaceWeatherMesh = useRef<THREE.Mesh>(null);
  const weatherMesh = useRef<THREE.Mesh>(null);
  const networkMesh = useRef<THREE.Mesh>(null);

  const batteryLevel = telemetry?.battery?.level ?? 0.85;
  const isCharging = telemetry?.battery?.charging ?? false;
  const kpIndex = telemetry?.spaceWeather?.kpIndex ?? 2.33;
  const temp = telemetry?.weather?.temp ?? 22.0;
  const isOnline = telemetry?.isOnline ?? true;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // 1. Battery Power Orbiter (Equatorial R=2.45)
    if (batteryGroup.current && batteryMesh.current) {
      const r1 = 2.45;
      const speed1 = isCharging ? 0.9 : 0.45;
      const a1 = t * speed1;
      batteryGroup.current.position.set(Math.cos(a1) * r1, Math.sin(t * 1.2) * 0.1, Math.sin(a1) * r1);
      batteryMesh.current.rotation.x += delta * 1.5;
      batteryMesh.current.rotation.y += delta * 2.0;
    }

    // 2. Space Weather Kp-Index Orbiter (Tilted 35 deg, R=2.75)
    if (spaceWeatherGroup.current && spaceWeatherMesh.current) {
      const r2 = 2.75;
      const speed2 = 0.35 + (kpIndex / 9.0) * 0.5;
      const a2 = t * speed2 + 2.0;
      const tilt2 = 35 * (Math.PI / 180);
      const x2 = Math.cos(a2) * r2;
      const y2 = Math.sin(a2) * r2 * Math.sin(tilt2) + Math.cos(t * 1.5) * 0.15;
      const z2 = Math.sin(a2) * r2 * Math.cos(tilt2);
      spaceWeatherGroup.current.position.set(x2, y2, z2);
      spaceWeatherMesh.current.rotation.y += delta * (1.0 + kpIndex * 0.6);
      spaceWeatherMesh.current.rotation.z += delta * (1.5 + kpIndex * 0.4);
    }

    // 3. Atmospheric Weather / Temp Orbiter (Counter-Tilted -40 deg, R=2.95)
    if (weatherGroup.current && weatherMesh.current) {
      const r3 = 2.95;
      const a3 = -t * 0.38 + 4.0;
      const tilt3 = -40 * (Math.PI / 180);
      const x3 = Math.cos(a3) * r3;
      const y3 = Math.sin(a3) * r3 * Math.sin(tilt3);
      const z3 = Math.sin(a3) * r3 * Math.cos(tilt3);
      weatherGroup.current.position.set(x3, y3, z3);
      weatherMesh.current.rotation.x += delta * 1.2;
      weatherMesh.current.rotation.y += delta * 0.8;
    }

    // 4. Quantum Uplink / Network Relay (Polar Orbit 75 deg, R=3.25)
    if (networkGroup.current && networkMesh.current) {
      const r4 = 3.25;
      const a4 = t * 0.55 + 1.0;
      const tilt4 = 75 * (Math.PI / 180);
      const x4 = Math.cos(a4) * r4;
      const y4 = Math.sin(a4) * r4 * Math.sin(tilt4);
      const z4 = Math.sin(a4) * r4 * Math.cos(tilt4);
      networkGroup.current.position.set(x4, y4, z4);
      networkMesh.current.rotation.x += delta * 2.5;
      networkMesh.current.rotation.z += delta * 2.0;
    }
  });

  const batteryColor = batteryLevel < 0.2 ? '#ff6600' : isCharging ? '#00f0ff' : '#ffb800';
  const kpColor = kpIndex >= 4.0 ? '#ff6600' : '#8b5cf6';
  const tempColor = temp < 15 ? '#00f0ff' : temp > 28 ? '#ff6600' : '#8b5cf6';
  const onlineColor = isOnline ? '#00f0ff' : '#ff6600';

  return (
    <group>
      {/* Orbital Trail Rings */}
      {/* 1. Equatorial Trail (Battery) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.2, 0.005, 6, 64]} />
        <meshBasicMaterial color={batteryColor} transparent opacity={0.2} />
      </mesh>

      {/* 2. Inclined 35 deg Trail (Space Weather) */}
      <mesh rotation={[Math.PI / 2 - 0.61, 0, 0]}>
        <torusGeometry args={[2.5, 0.005, 6, 64]} />
        <meshBasicMaterial color={kpColor} transparent opacity={0.25} />
      </mesh>

      {/* 3. Counter-Inclined -40 deg Trail (Atmosphere) */}
      <mesh rotation={[Math.PI / 2 + 0.70, 0, 0]}>
        <torusGeometry args={[2.75, 0.005, 6, 64]} />
        <meshBasicMaterial color={tempColor} transparent opacity={0.2} />
      </mesh>

      {/* 4. Polar 75 deg Trail (Quantum Uplink) */}
      <mesh rotation={[Math.PI / 2 - 1.31, 0, 0]}>
        <torusGeometry args={[3.0, 0.005, 6, 64]} />
        <meshBasicMaterial color={onlineColor} transparent opacity={0.25} />
      </mesh>

      {/* 1. Battery Power Orbiter */}
      <group ref={batteryGroup}>
        <mesh ref={batteryMesh}>
          <cylinderGeometry args={[0.09, 0.09, 0.22, 6]} />
          <meshStandardMaterial color={batteryColor} emissive={batteryColor} emissiveIntensity={isCharging ? 3.0 : 1.5} roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh scale={[1.4, 1.4, 1.4]}>
          <cylinderGeometry args={[0.1, 0.1, 0.24, 6]} />
          <meshBasicMaterial color={batteryColor} wireframe transparent opacity={0.5} />
        </mesh>
      </group>

      {/* 2. Space Weather Kp-Index Orbiter */}
      <group ref={spaceWeatherGroup}>
        <mesh ref={spaceWeatherMesh}>
          <tetrahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial color={kpColor} emissive={kpColor} emissiveIntensity={kpIndex >= 4 ? 3.5 : 1.8} roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh scale={[1.5, 1.5, 1.5]}>
          <octahedronGeometry args={[0.14, 0]} />
          <meshBasicMaterial color={kpColor} wireframe transparent opacity={0.6} />
        </mesh>
      </group>

      {/* 3. Atmospheric Weather / Temp Orbiter */}
      <group ref={weatherGroup}>
        <mesh ref={weatherMesh}>
          <dodecahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial color={tempColor} emissive={tempColor} emissiveIntensity={1.6} roughness={0.2} metalness={0.5} />
        </mesh>
        <mesh scale={[1.4, 1.4, 1.4]}>
          <icosahedronGeometry args={[0.13, 0]} />
          <meshBasicMaterial color={tempColor} wireframe transparent opacity={0.45} />
        </mesh>
      </group>

      {/* 4. Quantum Uplink / Network Relay */}
      <group ref={networkGroup}>
        <mesh ref={networkMesh}>
          <torusGeometry args={[0.15, 0.03, 8, 16]} />
          <meshStandardMaterial color={onlineColor} emissive={onlineColor} emissiveIntensity={isOnline ? 2.5 : 0.8} roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
};

// ----------------------------------------------------
// CORE GEOMETRY & ANIMATION COMPONENT
// ----------------------------------------------------
export const DiamondModel = ({ mode, audioAnalyser, color, isMobile = false }: { mode: 'IDLE' | 'THINKING' | 'ACTIVE', audioAnalyser: AnalyserNode | null, color: string, isMobile?: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  
  // Extra visual layers for frequency visualization
  const innerRippleRef = useRef<THREE.Mesh>(null);
  const outerRippleRef = useRef<THREE.Mesh>(null);

  // Smooth data refs for animation
  const targetScale = useRef(1);
  const currentScale = useRef(1);
  
  // Audio Buffer
  const freqData = useMemo(() => new Uint8Array(32), []);
  
  // Gaze tracking refs
  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!meshRef.current || !coreRef.current) return;

    // --- AUDIO READING ---
    let volume = 0;
    let low = 0;
    let mid = 0;
    let high = 0;

    if (audioAnalyser) {
        audioAnalyser.getByteFrequencyData(freqData);
        let sum = 0;
        for(let i = 0; i < freqData.length; i++) sum += freqData[i];
        volume = (sum / freqData.length) / 255;
        
        low = freqData[1] / 255;
        mid = freqData[4] / 255;
        high = freqData[8] / 255;
    }

    // --- GAZE & ROTATION ---
    targetRotation.current.x = state.pointer.y * 0.5;
    targetRotation.current.y = state.pointer.x * 0.5;

    const baseSpeed = mode === 'THINKING' ? 2 : mode === 'ACTIVE' ? 0.5 : 0.2;
    const activeJitter = mode === 'ACTIVE' ? volume * 0.1 : 0;
    const time = state.clock.elapsedTime;
    
    // Smoothly interpolate current rotation to target gaze
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotation.current.x + Math.sin(time * 0.5) * 0.1, 0.1);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotation.current.y + (time * baseSpeed * 0.1), 0.1);
    meshRef.current.rotation.z = Math.cos(time * 0.3) * 0.05 + activeJitter;

    coreRef.current.rotation.y -= delta * (baseSpeed * 1.5);
    
    // Rotate ripples
    if (innerRippleRef.current) {
        innerRippleRef.current.rotation.x += delta * 0.2;
        innerRippleRef.current.rotation.y += delta * 0.2;
    }
    if (outerRippleRef.current) {
        outerRippleRef.current.rotation.z -= delta * 0.4;
    }

    // --- VISUALIZATION MAPPING ---
    // 1. Scale Logic (Volume driven)
    targetScale.current = 1 + volume * 0.4;
    currentScale.current += (targetScale.current - currentScale.current) * 0.1;
    const s = currentScale.current;
    
    meshRef.current.scale.set(s, s, s);
    coreRef.current.scale.set(s * 0.5, s * 0.5, s * 0.5);

    // 2. Core Pulse (Bass + Volume)
    if (coreRef.current.material instanceof THREE.MeshStandardMaterial) {
        const baseIntensity = 2.0; 
        const speechPulse = (volume * 2.5) + (low * 2);
        coreRef.current.material.emissiveIntensity = baseIntensity + speechPulse;
        coreRef.current.material.color.set(color);
        coreRef.current.material.emissive.set(color);
    }
    
    // 3. Main Shell Shimmer (Highs)
    if (!isMobile && materialRef.current) {
        materialRef.current.roughness = THREE.MathUtils.lerp(0, 0.2, high);
        materialRef.current.transmission = THREE.MathUtils.lerp(1, 0.9, low * 0.3);
    }

    // 4. Inner Ripple (Mids) - Geometric Wireframe
    if (innerRippleRef.current) {
        const baseSize = 1.6;
        const finalScale = baseSize + (mid * 0.4);
        innerRippleRef.current.scale.lerp(new THREE.Vector3(finalScale, finalScale, finalScale), 0.2);
        
        if (innerRippleRef.current.material instanceof THREE.MeshBasicMaterial) {
            innerRippleRef.current.material.opacity = THREE.MathUtils.lerp(innerRippleRef.current.material.opacity, mid * 0.6, 0.2);
            innerRippleRef.current.material.color.set(color);
        }
    }

    // 5. Outer Ripple (Highs) - Spiky/Fast
    if (outerRippleRef.current) {
         const baseSize = 1.8;
         const finalScale = baseSize + (high * 0.5) + (low * 0.25); 
         outerRippleRef.current.scale.lerp(new THREE.Vector3(finalScale, finalScale, finalScale), 0.3);
         
         if (outerRippleRef.current.material instanceof THREE.MeshBasicMaterial) {
            outerRippleRef.current.material.opacity = THREE.MathUtils.lerp(outerRippleRef.current.material.opacity, high * 0.8, 0.2);
            outerRippleRef.current.material.color.set(color);
        }
    }
  });

  return (
    <group>
      {/* 1. Main Glass Shell */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[1.5, 0]} />
        {isMobile ? (
          <>
            <meshStandardMaterial 
              color={color} 
              transparent={true} 
              opacity={0.35} 
              roughness={0.4}
              metalness={0.1}
            />
            <mesh>
              <octahedronGeometry args={[1.5, 0]} />
              <meshBasicMaterial 
                color={color} 
                transparent={true} 
                opacity={0.4} 
                wireframe={true} 
              />
            </mesh>
          </>
        ) : (
          <meshPhysicalMaterial 
              ref={materialRef}
              color={color}
              roughness={0} 
              metalness={0.1}
              transmission={1} 
              thickness={2} 
              envMapIntensity={2}
              clearcoat={1}
              clearcoatRoughness={0}
              transparent={true}
              opacity={0.3}
              side={THREE.DoubleSide}
          />
        )}
      </mesh>
      
      {/* 2. Frequency Ripple: Mids */}
      <mesh ref={innerRippleRef}>
         <icosahedronGeometry args={[1, 1]} />
         <meshBasicMaterial color={color} wireframe transparent opacity={0} />
      </mesh>

      {/* 3. Frequency Ripple: Highs */}
      <mesh ref={outerRippleRef}>
         <octahedronGeometry args={[1, 0]} />
         <meshBasicMaterial color={color} wireframe transparent opacity={0} />
      </mesh>

      {/* 4. Inner Glowing Core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial 
            color={color} 
            emissive={color}
            emissiveIntensity={2}
            roughness={0.4}
            metalness={0.8}
            wireframe={true}
        />
        <mesh scale={[0.8, 0.8, 0.8]}>
            <icosahedronGeometry args={[0.8, 0]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      </mesh>
    </group>
  );
};


// ----------------------------------------------------
// CANVAS WRAPPER COMPONENT
// ----------------------------------------------------
export const VectorCanvas = ({ 
  mode = 'IDLE', 
  color = '#00f0ff',
  audioAnalyser = null,
  telemetry
}: { 
  mode?: 'IDLE' | 'THINKING' | 'ACTIVE',
  color?: string,
  audioAnalyser?: AnalyserNode | null,
  telemetry?: TelemetryDataInput
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', background: 'transparent' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color={color} />
          
          {!isMobile && <Environment preset="city" />}

          <Float 
              speed={mode === 'IDLE' ? 1.5 : 4} 
              rotationIntensity={mode === 'IDLE' ? 0.3 : 0.5} 
              floatIntensity={mode === 'IDLE' ? 1.5 : 0.2}
              floatingRange={mode === 'IDLE' ? [-0.15, 0.15] : [-0.05, 0.05]}
          >
              <group scale={0.75} position={[0, 0.45, 0]}>
                  <DiamondModel 
                    mode={mode} 
                    audioAnalyser={audioAnalyser} 
                    color={color} 
                    isMobile={isMobile}
                  />
                  <TelemetryOrbiters telemetry={telemetry} />
              </group>
          </Float>
      </Canvas>
    </div>
  );
};
