import { useNavigationStore } from '../modules/StateManager/navigationState';
import { BootConsole } from '../components/ui/BootConsole';

export const OnboardingView = () => {
  const navigate = useNavigationStore((state) => state.navigate);

  const handleComplete = () => {
    navigate('HOME');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: 'black' }}>
      <BootConsole onComplete={handleComplete} />
    </div>
  );
};
