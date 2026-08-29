import { useVesperStore } from '../StateManager/vesperStore';
import { useBoardStore } from '../StateManager/boardState';

// Global promise to prevent double execution and allow waiting
let prefetchPromise: Promise<void> | null = null;

export const prefetchVesperConnection = async (): Promise<void> => {
  const store = useVesperStore.getState();
  
  // Only run if there is exactly 1 message and its options array is empty
  if (store.messages.length === 1 && (!store.messages[0].options || store.messages[0].options.length === 0)) {
    if (prefetchPromise) return prefetchPromise;
    
    prefetchPromise = (async () => {
      try {
        const boardState = useBoardStore.getState();
        const integrationLevel = (boardState.v9_shadow_integration_level || 0) + (boardState.sierpinskiSeed?.complexity || 0);
        
        const { generateInitialTopics } = await import('../Network/geminiService');
        const topics = await generateInitialTopics(integrationLevel);
        
        const greetings = ['Hi', 'Hello', 'Hey there', 'Greetings', 'Welcome'];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        const fullGreeting = `${greeting}! Select a topic below or send a message to begin.`;
        
        useVesperStore.setState((state) => {
          if (state.messages.length === 1) {
            const updated = [...state.messages];
            updated[0] = { 
              ...updated[0], 
              text: `[ CONNECTION ESTABLISHED ] CHAT WITH VESPER\n\n${fullGreeting}`,
              options: topics 
            };
            return { messages: updated };
          }
          return state;
        });
        

      } catch (e) {
        console.error("Failed to fetch initial topics:", e);
      } finally {
        prefetchPromise = null;
      }
    })();
    
    return prefetchPromise;
  }
};
