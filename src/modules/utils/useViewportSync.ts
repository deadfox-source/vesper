import { useEffect } from 'react';

export const useViewportSync = () => {
  useEffect(() => {
    const syncViewport = () => {
      const isStandalone = 
        (window.navigator as unknown as { standalone?: boolean }).standalone || 
        window.matchMedia('(display-mode: standalone)').matches;

      const vpHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const vpWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
      
      // In iOS standalone PWA mode with viewport-fit=cover, when keyboard is not open,
      // the physical screen height is window.screen.height. If WebKit has a corrupted
      // innerHeight/visualViewport due to phantom toolbar subtraction, use screen.height.
      const isKeyboardOpen = document.activeElement && 
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      
      let targetHeight = vpHeight;
      if (isStandalone && !isKeyboardOpen && window.screen && window.screen.height) {
        // If the difference between screen height and viewport height is less than 200px
        // (which corresponds to a phantom toolbar/safe-area gap rather than a ~300px+ keyboard),
        // use window.screen.height to ensure full edge-to-edge rendering without bottom gaps.
        if (window.screen.height - vpHeight > 10 && window.screen.height - vpHeight < 220) {
          targetHeight = window.screen.height;
        }
      }

      // Set global CSS variables
      document.documentElement.style.setProperty('--real-viewport-height', `${targetHeight}px`);
      document.documentElement.style.setProperty('--real-viewport-width', `${vpWidth}px`);
      
      // Directly enforce on root elements to override WebKit layout bugs
      document.documentElement.style.height = `${targetHeight}px`;
      document.body.style.height = `${targetHeight}px`;
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.style.height = `${targetHeight}px`;
      }
    };

    syncViewport();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncViewport);
      window.visualViewport.addEventListener('scroll', syncViewport);
    }
    window.addEventListener('resize', syncViewport);
    window.addEventListener('orientationchange', () => {
      setTimeout(syncViewport, 50);
      setTimeout(syncViewport, 200);
      setTimeout(syncViewport, 500);
    });

    // Also sync on focus/blur of inputs to adapt smoothly to keyboard toggling
    window.addEventListener('focusin', () => setTimeout(syncViewport, 100));
    window.addEventListener('focusout', () => setTimeout(syncViewport, 100));

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', syncViewport);
        window.visualViewport.removeEventListener('scroll', syncViewport);
      }
      window.removeEventListener('resize', syncViewport);
    };
  }, []);
};
