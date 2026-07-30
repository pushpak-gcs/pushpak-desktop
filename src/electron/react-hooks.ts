import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:5000', {
  autoConnect: true,
});

// vehicle state
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

// telemetry states
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

export type CopterMode = 
  | 'STABILIZE' | 'ACRO' | 'ALT_HOLD' | 'AUTO' 
  | 'GUIDED' | 'LOITER' | 'RTL' | 'CIRCLE' 
  | 'LAND' | 'DRIFT' | 'SPORT' | 'AUTOTUNE' 
  | 'POSHOLD' | 'BRAKE' | 'GUIDED_NOGPS' | 'SMART_RTL';


export function useVehicle() {
  const [state, setState] = useState<VehicleState>({
    connected: false,
    armed: false,
    mode: 'UNKNOWN',
    modeNumber: 0,
    lastHeartbeat: 0
  });

  useEffect(() => {
    const handleStateUpdate = (newState: VehicleState) => {
      setState(newState);
    };

    socket.on('mavlink:state', handleStateUpdate);

    return () => {
      socket.off('mavlink:state', handleStateUpdate);
    };
  }, []);

  const arm = useCallback(async (armState: boolean) => {
    return new Promise<void>((resolve, reject) => {
      socket.emit('vehicle_arm', { arm: armState }, (response: any) => {
        if (response && response.success) resolve();
        else reject(new Error(response?.error || 'Unknown error'));
      });
    });
  }, []);

  const setMode = useCallback(async (mode: CopterMode) => {
    return new Promise<void>((resolve, reject) => {
      socket.emit('vehicle_setMode', { mode }, (response: any) => {
        if (response && response.success) resolve();
        else reject(new Error(response?.error || 'Unknown error'));
      });
    });
  }, []);

  const takeoff = useCallback(async (altitude: number) => {
    return new Promise<void>((resolve, reject) => {
      socket.emit('vehicle_takeoff', { altitude }, (response: any) => {
        if (response && response.success) resolve();
        else reject(new Error(response?.error || 'Unknown error'));
      });
    });
  }, []);

  const land = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      socket.emit('vehicle_land', {}, (response: any) => {
        if (response && response.success) resolve();
        else reject(new Error(response?.error || 'Unknown error'));
      });
    });
  }, []);

  const returnToLaunch = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      socket.emit('vehicle_rtl', {}, (response: any) => {
        if (response && response.success) resolve();
        else reject(new Error(response?.error || 'Unknown error'));
      });
    });
  }, []);

  const goto = useCallback(async (lat: number, lon: number, altitude: number) => {
    return new Promise<void>((resolve, reject) => {
      socket.emit('vehicle_goto', { lat, lon, altitude }, (response: any) => {
        if (response && response.success) resolve();
        else reject(new Error(response?.error || 'Unknown error'));
      });
    });
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

    socket.on('mavlink:telemetry', handleTelemetryUpdate);

    return () => {
      socket.off('mavlink:telemetry', handleTelemetryUpdate);
    };
  }, []);

  return telemetry;
}


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

    socket.on('mavlink:vehicle-found', handleVehicleFound);
    socket.on('mavlink:vehicle-lost', handleVehicleLost);
    socket.on('mavlink:disconnected', handleVehicleLost);

    return () => {
      socket.off('mavlink:vehicle-found', handleVehicleFound);
      socket.off('mavlink:vehicle-lost', handleVehicleLost);
      socket.off('mavlink:disconnected', handleVehicleLost);
    };
  }, []);

  return { vehicleId, isConnected };
}
