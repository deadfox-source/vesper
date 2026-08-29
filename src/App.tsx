import { useNavigationStore } from './modules/StateManager/navigationState';
import { TabletopView } from './screens/TabletopView';
import { HomeView } from './screens/HomeView';
import { OnboardingView } from './screens/OnboardingView';
import { ProfileArchiveView } from './screens/ProfileArchiveView';
import { TabBar } from './components/ui/TabBar';
import { VesperTelemetryRow } from './components/ui/VesperTelemetryRow';
import { SierpinskiPet } from './components/ui/SierpinskiPet';
import { GlobalVesperAvatar } from './components/ui/GlobalVesperAvatar';
import { useViewportSync } from './modules/utils/useViewportSync';

const ScreenRouter = () => {
  const currentScreen = useNavigationStore((state) => state.currentScreen);

  switch (currentScreen) {
    case 'ONBOARDING':
      return <OnboardingView />;
    case 'HOME':
      return <HomeView />;
    case 'PROFILE':
      return <ProfileArchiveView />;
    case 'TABLETOP':
    default:
      return <TabletopView />;
  }
};

const App = () => {
  useViewportSync();
  const currentScreen = useNavigationStore((state) => state.currentScreen);

  let tickerColor = 'var(--eva-cyan)';
  switch (currentScreen) {
    case 'ONBOARDING':
      tickerColor = 'var(--warning-amber)';
      break;
    case 'TABLETOP':
      tickerColor = 'var(--eva-cyan)';
      break;
    case 'PROFILE':
      tickerColor = 'var(--magi-violet)';
      break;
    case 'HOME':
    default:
      tickerColor = 'var(--vesper-blue)';
  }

  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%', 
      height: 'var(--real-viewport-height, 100%)', 
      flex: 1,
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: 'var(--void-black)',
      overflow: 'hidden'
    }}>
      {/* Global Background Grid & CRT scanlines */}
      {currentScreen !== 'ONBOARDING' && (
        <>
          {/* Data-Wave 40px Grid Pattern */}
          <div className="data-wave-bg" style={{ 
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            backgroundSize: '40px 40px',
            backgroundImage: 'linear-gradient(to right, rgba(0, 240, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.04) 1px, transparent 1px)'
          }} />

          {/* CRT Scanlines */}
          <div className="scanline" style={{ 
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            backgroundSize: '100% 4px',
            backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.12) 1.5px, transparent 1.5px)'
          }} />
          
          {/* Centered global 3D geometric shape (Egrego-Pet) */}
          <div style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 0,
            pointerEvents: 'none',
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            overflow: 'hidden',
          }}>
            <div style={{
              transform: 'scale(1.15) rotateX(28deg) translateY(-20px) translateZ(0)',
              transformStyle: 'preserve-3d',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '600px',
              height: '600px',
              position: 'absolute',
              opacity: currentScreen === 'HOME' ? 0.35 : 0.12
            }}>
              <SierpinskiPet />
            </div>

            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
              <GlobalVesperAvatar />
            </div>
          </div>
        </>
      )}

      {/* Main App Content Hierarchy */}
      {currentScreen !== 'ONBOARDING' && <VesperTelemetryRow color={tickerColor} />}
      
      <div style={{ 
        flex: 1, 
        overflow: 'hidden', 
        position: 'relative', 
        paddingBottom: currentScreen !== 'ONBOARDING' ? 'var(--tabbar-total)' : '0', 
        zIndex: 1, 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
         <ScreenRouter />
      </div>

      {currentScreen !== 'ONBOARDING' && <TabBar />}
    </div>
  );
};

export default App;
