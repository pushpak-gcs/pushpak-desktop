/**
 * React hooks for pushpak-desktop renderer process
 * 
 * Usage:
 * ```typescript
 * import { useVehicle, useTelemetry } from './hooks/mavlink';
 * 
 * function FlightControls() {
 *   const { connected, armed, mode, arm, setMode, takeoff } = useVehicle();
 *   const { attitude, position, battery } = useTelemetry();
 *   
 *   return (
 *     <button onClick={() => arm(true)} disabled={!connected}>
 *       ARM
 *     </button>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// CopterMode constants - mirrors the enum in @pushpak/mavlink
// We define it here to avoid importing Node.js dependencies in the browser
export const CopterMode = {
  STABILIZE: 0,
  ACRO: 1,
  ALT_HOLD: 2,
  AUTO: 3,
  GUIDED: 4,
  LOITER: 5,
  RTL: 6,
  CIRCLE: 7,
  LAND: 9,
  DRIFT: 11,
  SPORT: 13,
  FLIP: 14,
  AUTOTUNE: 15,
  POSHOLD: 16,
  BRAKE: 17,
  THROW: 18,
  AVOID_ADSB: 19,
  GUIDED_NOGPS: 20,
  SMART_RTL: 21,
  FLOWHOLD: 22,
  FOLLOW: 23,
  ZIGZAG: 24,
  SYSTEMID: 25,
  AUTOROTATE: 26,
  AUTO_RTL: 27
} as const;

export type CopterMode = typeof CopterMode[keyof typeof CopterMode];

// Type definitions for Electron IPC (adjust based on your preload setup)
declare global {
  interface Window {
    electron: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, callback: (...args: any[]) => void) => void;
      removeListener: (channel: string, callback: (...args: any[]) => void) => void;
    };
  }
}

// Vehicle state from manager
export interface VehicleState {
  connected: boolean;
  armed: boolean;
  mode: string;
  modeNumber: number;
  systemId?: number;
  componentId?: number;
  autopilot?: number;
  lastHeartbeat: number;
}

// Telemetry state from manager
export interface TelemetryState {
  attitude?: {
    roll: number;
    pitch: number;
    yaw: number;
  };
  position?: {
    lat: number;
    lon: number;
    alt: number;
    relativeAlt: number;
  };
  velocity?: {
    vx: number;
    vy: number;
    vz: number;
  };
  battery?: {
    voltage: number;
    current: number;
    remaining: number;
  };
  gps?: {
    fix: number;
    satellites: number;
  };
  heading: number;
  groundspeed: number;
  airspeed: number;
  climbRate: number;
  throttle: number;
}

/**
 * Hook for vehicle state and commands
 */
export function useVehicle() {
  const [state, setState] = useState<VehicleState>({
    connected: false,
    armed: false,
    mode: 'UNKNOWN',
    modeNumber: 0,
    lastHeartbeat: 0
  });

  useEffect(() => {
    // Check if electron API is available
    if (typeof window === 'undefined' || !window.electron) {
      console.error('window.electron is not available. Preload script may not be loaded.');
      return;
    }

    // Listen for state updates
    const handleStateUpdate = (newState: VehicleState) => {
      setState(newState);
    };

    window.electron.on('mavlink:state', handleStateUpdate);

    // Get initial state
    window.electron.invoke('mavlink:getState').then((initialState) => {
      setState(initialState);
    }).catch(err => {
      console.error('Failed to get initial MAVLink state:', err);
    });

    return () => {
      window.electron.removeListener('mavlink:state', handleStateUpdate);
    };
  }, []);

  // Command wrappers
  const arm = useCallback(async (armState: boolean) => {
    if (typeof window === 'undefined' || !window.electron) {
      throw new Error('Electron API not available');
    }
    console.log(`[MAVLink] ${armState ? 'Arming' : 'Disarming'} vehicle...`);
    const result = await window.electron.invoke('vehicle:arm', armState);
    if (!result.success) {
      console.error(`[MAVLink] ${armState ? 'Arm' : 'Disarm'} failed:`, result.error);
      throw new Error(result.error);
    }
    console.log(`[MAVLink] Vehicle ${armState ? 'armed' : 'disarmed'} successfully`);
  }, []);

  const setMode = useCallback(async (mode: CopterMode) => {
    const result = await window.electron.invoke('vehicle:setMode', mode);
    if (!result.success) {
      throw new Error(result.error);
    }
  }, []);

  const takeoff = useCallback(async (altitude: number) => {
    console.log(`[mavlink.ts] Takeoff command invoked with altitude: ${altitude}m`);
    const result = await window.electron.invoke('vehicle:takeoff', altitude);
    console.log(`[mavlink.ts] Takeoff IPC result:`, result);
    if (!result.success) {
      throw new Error(result.error);
    }
  }, []);

  const land = useCallback(async () => {
    const result = await window.electron.invoke('vehicle:land');
    if (!result.success) {
      throw new Error(result.error);
    }
  }, []);

  const returnToLaunch = useCallback(async () => {
    const result = await window.electron.invoke('vehicle:rtl');
    if (!result.success) {
      throw new Error(result.error);
    }
  }, []);

  const goto = useCallback(async (lat: number, lon: number, altitude: number) => {
    const result = await window.electron.invoke('vehicle:goto', lat, lon, altitude);
    if (!result.success) {
      throw new Error(result.error);
    }
  }, []);

  const connect = useCallback(async (config: { type: 'udp' | 'serial', port?: number, host?: string, path?: string, baudRate?: number }) => {
    const result = await window.electron.invoke('mavlink:connect', config);
    if (!result.success) {
      throw new Error(result.error);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const result = await window.electron.invoke('mavlink:disconnect');
    if (!result.success) {
      throw new Error(result.error);
    }
  }, []);

  return {
    ...state,
    arm,
    setMode,
    takeoff,
    land,
    returnToLaunch,
    goto,
    connect,
    disconnect
  };
}

/**
 * Hook for telemetry data
 */
export function useTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    heading: 0,
    groundspeed: 0,
    airspeed: 0,
    climbRate: 0,
    throttle: 0
  });

  const lastAltitudeRef = useRef<number>(0);

  useEffect(() => {
    // Check if electron API is available
    if (typeof window === 'undefined' || !window.electron) {
      console.error('window.electron is not available. Preload script may not be loaded.');
      return;
    }

    const handleTelemetryUpdate = (newTelemetry: TelemetryState) => {
      // Only log when altitude changes by more than 0.5m (to detect takeoff)
      const currentAlt = newTelemetry.position?.relativeAlt ?? 0;
      if (Math.abs(currentAlt - lastAltitudeRef.current) > 0.5) {
        console.log(`[mavlink.ts] Altitude changed: ${lastAltitudeRef.current.toFixed(2)}m -> ${currentAlt.toFixed(2)}m`);
        lastAltitudeRef.current = currentAlt;
      }
      setTelemetry(newTelemetry);
    };

    window.electron.on('mavlink:telemetry', handleTelemetryUpdate);

    // Get initial telemetry
    window.electron.invoke('mavlink:getTelemetry').then(setTelemetry).catch(err => {
      console.error('Failed to get initial MAVLink telemetry:', err);
    });

    return () => {
      window.electron.removeListener('mavlink:telemetry', handleTelemetryUpdate);
    };
  }, []);

  return telemetry;
}

/**
 * Hook for vehicle connection events
 */
export function useVehicleConnection() {
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const handleVehicleFound = (sysid: number) => {
      setVehicleId(sysid);
      setIsConnected(true);
    };

    const handleVehicleLost = () => {
      setIsConnected(false);
    };

    window.electron.on('mavlink:vehicle-found', handleVehicleFound);
    window.electron.on('mavlink:vehicle-lost', handleVehicleLost);

    return () => {
      window.electron.removeListener('mavlink:vehicle-found', handleVehicleFound);
      window.electron.removeListener('mavlink:vehicle-lost', handleVehicleLost);
    };
  }, []);

  return { vehicleId, isConnected };
}
