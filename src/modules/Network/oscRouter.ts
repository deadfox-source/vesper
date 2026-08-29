import { io, Socket } from 'socket.io-client';
import { useVesperStore } from '../StateManager/vesperStore';

export class OSCRouter {
  private static instance: OSCRouter;
  private socket: Socket | null = null;

  private constructor() {
    console.log("[OSC Router] Initialized Web Bridge Mode (lazy connection).");
  }

  private connect() {
    if (this.socket) return; // Already connected or attempting

    // Connect to the WebSocket Bridge (Local or Deployed)
    const bridgeUrl = import.meta.env.DEV ? 'http://localhost:4000' : window.location.origin;
    this.socket = io(bridgeUrl, {
      reconnectionAttempts: 5,
      timeout: 5000,
    });

    this.socket.on('connect', () => {
      console.log('🔮 [WebSocket] Connected to Local Bridge Socket (OSC Mode)');
    });

    this.socket.on('connect_error', (error) => {
      console.warn('⚠️ [WebSocket] Failed to connect to bridge server. Start server.js in root.', error.message);
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[OSC Router] Disconnected from bridge server.');
    }
  }

  public static getInstance(): OSCRouter {
    if (!OSCRouter.instance) {
      OSCRouter.instance = new OSCRouter();
    }
    return OSCRouter.instance;
  }

  /**
   * Ensures the WebSocket connection is live before dispatching.
   * Only connects when FULL mode is active and a dispatch is needed.
   */
  private ensureConnection() {
    const { mode } = useVesperStore.getState();
    if (mode !== 'FULL') return false;

    if (!this.socket) {
      this.connect();
    }
    return this.socket?.connected ?? false;
  }

  /**
   * Dispatches a vector instruction through the Websocket to the Bridge Server.
   * The bridge then sends it as a raw UDP OSC packet to the Vesper-9 Animatronic.
   */
  public dispatchRigLookAt(nodeId: number, spreadId: string, relX: number, relY: number) {
    if (!this.ensureConnection()) return;

    const payload = {
      address: "/vesper/somatic/lookat",
      args: [
        { type: "i", value: nodeId },
        { type: "s", value: spreadId },
        { type: "f", value: relX },
        { type: "f", value: relY }
      ]
    };
    
    // Log locally
    console.log(`📡 [Web TX] Node ${nodeId} Tap -> Emitting via WebSocket`);
    
    // Emit through WebSocket Bridge
    if (this.socket && this.socket.connected) {
      this.socket.emit('osc_dispatch', payload);
    }
  }

  public dispatchRigReaction(intensity: number) {
    if (!this.ensureConnection()) return;

    console.log(`📡 [Web TX] Rig Reaction Triggered -> Intensity: ${intensity}`);
    if (this.socket && this.socket.connected) {
      this.socket.emit('osc_dispatch', {
        address: "/vesper/somatic/reaction",
        args: [{ type: "f", value: intensity }]
      });
    }
  }
}

export const oscRouter = OSCRouter.getInstance();
