import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';


export const socket: Socket = io('http://localhost:5000', {
  autoConnect: true,
});

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

    socket.on('mavlink:state', handleStateUpdate);

    return () => {
      socket.off('mavlink:state', handleStateUpdate);
    };
  }, []);

  // Command wrappers
  const arm = useCallback(async (armState: boolean) => {
    console.log(`[MAVLink] ${armState ? 'Arming' : 'Disarming'} vehicle...`);
    return new Promise<void>((resolve, reject) => {
      socket.emit('vehicle_arm', { arm: armState }, (response: any) => {
        if (response && response.success) {
          console.log(`[MAVLink] Vehicle ${armState ? 'armed' : 'disarmed'} successfully`);
          resolve();
        } else {
          console.error(`[MAVLink] ${armState ? 'Arm' : 'Disarm'} failed:`, response?.error);
          reject(new Error(response?.error || 'Unknown error'));
        }
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
    console.log(`[mavlink.ts] Takeoff command invoked with altitude: ${altitude}m`);
    return new Promise<void>((resolve, reject) => {
      socket.emit('vehicle_takeoff', { altitude }, (response: any) => {
        console.log(`[mavlink.ts] Takeoff socket result:`, response);
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

  const connect = useCallback(async (config: any) => {
    let connection_string = 'udp:127.0.0.1:14550';
    let baudrate = 115200;
    
    if (config.type === 'udp') {
      connection_string = `udp:${config.host}:${config.port}`;
    } else if (config.type === 'tcp') {
      connection_string = `tcp:${config.host}:${config.port}`;
    } else if (config.type === 'serial') {
      connection_string = config.path;
      baudrate = config.baudRate;
    }
    
    return new Promise<void>((resolve, reject) => {
      socket.emit('vehicle_connect', { connection_string, baudrate }, (response: any) => {
        if (response && response.success) resolve();
        else reject(new Error(response?.error || 'Unknown error'));
      });
    });
  }, []);

  const disconnect = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      socket.emit('vehicle_disconnect', {}, (response: any) => {
        if (response && response.success) resolve();
        else reject(new Error(response?.error || 'Unknown error'));
      });
    });
  }, []);

  const uploadMission = useCallback(async (waypoints: any[], endAction: 'LOITER' | 'RTL' | 'LAND' = 'LOITER') => {
    return new Promise<void>((resolve, reject) => {
      // Map waypoints to just lat, lon, alt for the backend
      const mapped = waypoints.map(wp => ({
        lat: wp.position.lat,
        lon: wp.position.lng,
        alt: wp.altitude || 10,
        loiterTime: wp.loiterTime || 0
      }));
      socket.emit('vehicle_upload_mission', { waypoints: mapped, endAction }, (response: any) => {
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
    goto,
    connect,
    disconnect,
    uploadMission
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

  const lastAltitudeRef = useRef<number>(0);

  useEffect(() => {
    const handleTelemetryUpdate = (newTelemetry: TelemetryState) => {
      // Only log when altitude changes by more than 0.5m (to detect takeoff)
      const currentAlt = newTelemetry.position?.relativeAlt ?? 0;
      if (Math.abs(currentAlt - lastAltitudeRef.current) > 0.5) {
        console.log(`[mavlink.ts] Altitude changed: ${lastAltitudeRef.current.toFixed(2)}m -> ${currentAlt.toFixed(2)}m`);
        lastAltitudeRef.current = currentAlt;
      }
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
    socket.on('connect', () => console.log('Socket.IO Connected to pushpak-core'));
    socket.on('disconnect', () => {
      console.log('Socket.IO Disconnected from pushpak-core');
      setIsConnected(false);
    });

    return () => {
      socket.off('mavlink:vehicle-found', handleVehicleFound);
      socket.off('mavlink:vehicle-lost', handleVehicleLost);
      socket.off('mavlink:disconnected', handleVehicleLost);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return { vehicleId, isConnected };
}
