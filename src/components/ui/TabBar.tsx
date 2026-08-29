import { useNavigationStore } from '../../modules/StateManager/navigationState';
import { Moon, Grid, History } from 'lucide-react';
import './TabBar.css';

export const TabBar = () => {
  const currentScreen = useNavigationStore((state) => state.currentScreen);
  const navigate = useNavigationStore((state) => state.navigate);

  if (currentScreen === 'ONBOARDING') return null;

  // Determine border color dynamically based on screen
  const getBorderColor = () => {
    switch (currentScreen) {
      case 'HOME': return 'var(--vesper-blue)';
      case 'PROFILE': return 'var(--magi-violet)';
      case 'TABLETOP':
      default: return 'var(--eva-cyan)';
    }
  };

  return (
    <div className="tabbar-container" style={{ borderTop: `2px solid ${getBorderColor()}` }}>
      <div className="holographic-backdrop" />
      <div 
        className={`tab-item ${currentScreen === 'HOME' ? 'active-vesper' : ''}`}
        onClick={() => navigate('HOME')}
      >
        <Moon size={24} className="ritual-glitch" />
        <span className="tab-label">VESPER</span>
      </div>
      <div 
        className={`tab-item ${currentScreen === 'TABLETOP' ? 'active-grid' : ''}`}
        onClick={() => navigate('TABLETOP')}
      >
        <Grid size={24} className="ritual-glitch" />
        <span className="tab-label">GRID</span>
      </div>
      <div 
        className={`tab-item ${currentScreen === 'PROFILE' ? 'active-records' : ''}`}
        onClick={() => navigate('PROFILE')}
      >
        <History size={24} className="ritual-glitch" />
        <span className="tab-label">INDIVIDUATION</span>
      </div>
    </div>
  );
};
