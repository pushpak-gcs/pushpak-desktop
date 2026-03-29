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

import { useState, useEffect, useCallback } from 'react';
import { CopterMode } from '@pushpak/mavlink';

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
    // Listen for state updates
    const handleStateUpdate = (newState: VehicleState) => {
      setState(newState);
    };

    window.electron.on('mavlink:state', handleStateUpdate);

    // Get initial state
    window.electron.invoke('mavlink:getState').then(setState);

    return () => {
      window.electron.removeListener('mavlink:state', handleStateUpdate);
    };
  }, []);

  // Command wrappers
  const arm = useCallback(async (armState: boolean) => {
    const result = await window.electron.invoke('vehicle:arm', armState);
    if (!result.success) {
      throw new Error(result.error);
    }
  }, []);

  const setMode = useCallback(async (mode: CopterMode) => {
    const result = await window.electron.invoke('vehicle:setMode', mode);
    if (!result.success) {
      throw new Error(result.error);
    }
  }, []);

  const takeoff = useCallback(async (altitude: number) => {
    const result = await window.electron.invoke('vehicle:takeoff', altitude);
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

  return {
    ...state,
    arm,
    setMode,
    takeoff,
    land,
    returnToLaunch,
    goto
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

  useEffect(() => {
    const handleTelemetryUpdate = (newTelemetry: TelemetryState) => {
      setTelemetry(newTelemetry);
    };

    window.electron.on('mavlink:telemetry', handleTelemetryUpdate);

    // Get initial telemetry
    window.electron.invoke('mavlink:getTelemetry').then(setTelemetry);

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
