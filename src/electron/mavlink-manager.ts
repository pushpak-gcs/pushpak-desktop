/**
 * MavlinkManager - High-level wrapper for MavlinkService
 * 
 * Features:
 * - State management (vehicle, telemetry, connection)
 * - Auto-reconnection on failure
 * - Event aggregation
 * - Simplified API for IPC handlers
 * 
 * Usage in Electron main process:
 * ```typescript
 * import { MavlinkManager } from '@pushpak/mavlink/examples/mavlink-manager';
 * 
 * const manager = new MavlinkManager();
 * manager.start(); // Auto-connects to UDP 14550
 * 
 * // Listen for state changes
 * manager.on('state-changed', (state) => {
 *   mainWindow.webContents.send('vehicle-state', state);
 * });
 * ```
 */

import { EventEmitter } from 'events';
import { 
  MavlinkService, 
  UdpTransport, 
  SerialTransport,
  CopterMode, 
  PlaneMode, 
  RoverMode 
} from '@pushpak/mavlink';
import type { Transport } from '@pushpak/mavlink';

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
    roll: number;  // radians
    pitch: number; // radians
    yaw: number;   // radians
  };
  position?: {
    lat: number;   // degrees
    lon: number;   // degrees
    alt: number;   // meters MSL
    relativeAlt: number; // meters AGL
  };
  velocity?: {
    vx: number;    // m/s north
    vy: number;    // m/s east
    vz: number;    // m/s down
  };
  battery?: {
    voltage: number; // volts
    current: number; // amps
    remaining: number; // percent
  };
  gps?: {
    fix: number;
    satellites: number;
  };
  heading: number; // degrees
  groundspeed: number; // m/s
  airspeed: number; // m/s
  climbRate: number; // m/s
  throttle: number; // percent
}

export interface ConnectionConfig {
  type: 'udp' | 'serial';
  // UDP options
  port?: number;
  host?: string;
  // Serial options
  path?: string;
  baudRate?: number;
  // Common
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export class MavlinkManager extends EventEmitter {
  private mavlink?: MavlinkService;
  private transport?: Transport;
  private config: ConnectionConfig;
  
  private vehicleState: VehicleState = {
    connected: false,
    armed: false,
    mode: 'UNKNOWN',
    modeNumber: 0,
    lastHeartbeat: 0
  };
  
  private telemetryState: TelemetryState = {
    heading: 0,
    groundspeed: 0,
    airspeed: 0,
    climbRate: 0,
    throttle: 0
  };
  
  private heartbeatInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private isReconnecting = false;

  constructor(config?: ConnectionConfig) {
    super();
    console.log('[MavlinkManager] Constructor called with config:', config);
    console.log('[MavlinkManager] Stack trace:', new Error().stack);
    this.config = {
      type: 'udp',
      port: 14550,
      host: '127.0.0.1',
      autoReconnect: true,
      reconnectInterval: 5000,
      ...config
    };
    console.log('[MavlinkManager] Final config:', this.config);
  }

  /**
   * Start MAVLink connection and heartbeat
   */
  start(): void {
    console.log('[MavlinkManager] start() called');
    console.log('[MavlinkManager] Stack trace:', new Error().stack);
    this.connectInternal();
  }

  /**
   * Connect with specific configuration
   */
  async connect(config: Partial<ConnectionConfig>): Promise<void> {
    // Update config with new values
    this.config = { ...this.config, ...config };
    this.connectInternal();
  }

  /**
   * Disconnect from MAVLink
   */
  disconnect(): void {
    this.config.autoReconnect = false; // Disable auto-reconnect on manual disconnect
    this.stopInternal();
  }

  /**
   * Stop MAVLink connection
   */
  stop(): void {
    this.stopInternal();
  }

  private stopInternal(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.mavlink) {
      this.mavlink.disconnect('User stop');
      this.mavlink.removeAllListeners();
      this.mavlink = undefined;
    }

    if (this.transport) {
      this.transport = undefined;
    }

    this.updateVehicleState({ connected: false });
  }

  /**
   * Get current vehicle state
   */
  getVehicleState(): VehicleState {
    return { ...this.vehicleState };
  }

  /**
   * Get current telemetry state
   */
  getTelemetryState(): TelemetryState {
    return { ...this.telemetryState };
  }

  /**
   * Check if vehicle is connected and ready
   */
  isReady(): boolean {
    return this.vehicleState.connected && this.vehicleState.systemId !== undefined;
  }

  // ==================== Vehicle Commands ====================

  /**
   * Arm or disarm the vehicle
   */
  async arm(arm: boolean): Promise<void> {
    console.log(`[MavlinkManager] Arm command: ${arm ? 'ARM' : 'DISARM'}`);
    console.log(`[MavlinkManager] isReady=${this.isReady()}, mavlink=${!!this.mavlink}, systemId=${this.vehicleState.systemId}`);
    if (!this.isReady() || !this.mavlink) {
      throw new Error('Vehicle not connected');
    }
    console.log(`[MavlinkManager] Calling mavlink.armDisarm(${arm}, ${this.vehicleState.systemId})`);
    this.mavlink.armDisarm(arm, this.vehicleState.systemId!);
    console.log(`[MavlinkManager] armDisarm command sent`);
  }

  /**
   * Set flight mode
   */
  async setMode(mode: CopterMode | PlaneMode | RoverMode): Promise<void> {
    if (!this.isReady() || !this.mavlink) {
      throw new Error('Vehicle not connected');
    }
    this.mavlink.setFlightMode(mode, this.vehicleState.systemId!);
  }

  /**
   * Takeoff to specified altitude (GUIDED mode)
   */
  async takeoff(altitude: number): Promise<NodeJS.Timeout> {
    console.log(`[MavlinkManager] Takeoff requested: altitude=${altitude}m`);
    console.log(`[MavlinkManager] isReady=${this.isReady()}, mavlink=${!!this.mavlink}, systemId=${this.vehicleState.systemId}`);
    if (!this.isReady() || !this.mavlink) {
      throw new Error('Vehicle not connected');
    }
    console.log(`[MavlinkManager] Calling guidedTakeoff with altitude=${altitude}m, systemId=${this.vehicleState.systemId}`);
    const interval = this.mavlink.guidedTakeoff(altitude, 15000, this.vehicleState.systemId!);
    console.log(`[MavlinkManager] guidedTakeoff called, interval ID:`, interval);
    return interval;
  }

  /**
   * Land at current position
   */
  async land(): Promise<void> {
    if (!this.isReady() || !this.mavlink) {
      throw new Error('Vehicle not connected');
    }
    this.mavlink.land({ targetSystem: this.vehicleState.systemId! });
  }

  /**
   * Return to launch
   */
  async returnToLaunch(): Promise<void> {
    if (!this.isReady() || !this.mavlink) {
      throw new Error('Vehicle not connected');
    }
    this.mavlink.returnToLaunch(this.vehicleState.systemId!);
  }

  /**
   * Go to GPS coordinates
   */
  async goto(lat: number, lon: number, altitude: number): Promise<void> {
    if (!this.isReady() || !this.mavlink) {
      throw new Error('Vehicle not connected');
    }
    this.mavlink.goto(lat, lon, altitude, this.vehicleState.systemId!);
  }

  /**
   * Change vehicle speed
   */
  async setSpeed(speed: number, speedType: 'ground' | 'air' = 'ground'): Promise<void> {
    if (!this.isReady() || !this.mavlink) {
      throw new Error('Vehicle not connected');
    }
    this.mavlink.changeSpeed(speedType === 'ground' ? 1 : 0, speed, -1, this.vehicleState.systemId!);
  }

  // ==================== Private Methods ====================

  private connectInternal(): void {
    if (this.mavlink) {
      return; // Already connected
    }

    // Create transport
    if (this.config.type === 'udp') {
      this.transport = new UdpTransport(
        this.config.port!,
        this.config.host,
        this.config.port
      );
    } else if (this.config.type === 'serial') {
      this.transport = new SerialTransport({
        path: this.config.path!,
        baudRate: this.config.baudRate
      });
    } else {
      throw new Error(`Unknown transport type: ${this.config.type}`);
    }

    // Create MAVLink service
    this.mavlink = new MavlinkService(this.transport);

    // Setup event listeners
    this.setupEventListeners();

    // Connect
    this.mavlink.connect();

    // Start GCS heartbeat
    this.heartbeatInterval = setInterval(() => {
      if (this.mavlink) {
        this.mavlink.sendHeartbeat();
      }
    }, 1000);

    this.emit('connecting');
  }

  private setupEventListeners(): void {
    if (!this.mavlink) return;

    // Connection events
    this.mavlink.on('mavlink:connected', () => {
      this.emit('connected');
      this.isReconnecting = false;
    });

    this.mavlink.on('mavlink:disconnected', (event: any) => {
      this.updateVehicleState({ connected: false });
      this.emit('disconnected', event.reason);
      this.handleDisconnect();
    });

    this.mavlink.on('mavlink:error', (event: any) => {
      this.emit('error', event.error);
      console.error('[MavlinkManager] Error:', event.error);
    });

    // Vehicle presence
    this.mavlink.on('mavlink:vehicle_found', (event: any) => {
      console.log(`[MavlinkManager] Vehicle found - sysid: ${event.sysid}`);
      this.updateVehicleState({
        connected: true,
        systemId: event.sysid
      });
      
      // Request telemetry streams
      if (this.mavlink) {
        this.mavlink.requestDataStream(0, 4, event.sysid); // All streams at 4Hz
      }
      
      this.emit('vehicle-found', event.sysid);
    });

    this.mavlink.on('mavlink:vehicle_lost', (event: any) => {
      this.updateVehicleState({ connected: false });
      this.emit('vehicle-lost', event.sysid);
    });

    // Telemetry messages - process HEARTBEAT here to get baseMode
    this.mavlink.on('mavlink:message', (event: any) => {
      // Handle HEARTBEAT for armed state and mode
      if (event.messageName === 'HEARTBEAT') {
        console.log(`[MavlinkManager] HEARTBEAT message - sysid: ${event.sysid} payload:`, event.payload);
        
        // Ignore our own heartbeats (GCS usually has sysid 254 or 255)
        if (event.sysid >= 254) {
          return;
        }
        
        // Only process if this is our tracked vehicle
        if (this.vehicleState.systemId && event.sysid !== this.vehicleState.systemId) {
          return;
        }
        
        const baseMode = event.payload.baseMode;
        const isArmed = !!(baseMode & 128); // MAV_MODE_FLAG_SAFETY_ARMED (0x80)
        console.log(`[MavlinkManager] Processing HEARTBEAT - baseMode: ${baseMode} (0x${baseMode?.toString(16)}) isArmed: ${isArmed}`);
        
        this.updateVehicleState({
          armed: isArmed,
          lastHeartbeat: Date.now()
        });
      }
      
      // Handle STATUSTEXT to see ArduPilot messages
      if (event.messageName === 'STATUSTEXT') {
        const severity = event.payload.severity;
        const text = event.payload.text || '';
        const severityNames = ['EMERGENCY', 'ALERT', 'CRITICAL', 'ERROR', 'WARNING', 'NOTICE', 'INFO', 'DEBUG'];
        const severityName = severityNames[severity] || `UNKNOWN(${severity})`;
        console.log(`[ArduPilot ${severityName}] ${text}`);
      }
      
      // Handle other telemetry
      this.handleTelemetryMessage(event);
    });
  }

  private handleTelemetryMessage(event: any): void {
    const updates: Partial<TelemetryState> = {};

    switch (event.messageName) {
      case 'ATTITUDE':
        updates.attitude = {
          roll: event.payload.roll,
          pitch: event.payload.pitch,
          yaw: event.payload.yaw
        };
        break;

      case 'GLOBAL_POSITION_INT':
        updates.position = {
          lat: event.payload.lat / 1e7,
          lon: event.payload.lon / 1e7,
          alt: event.payload.alt / 1000,
          relativeAlt: event.payload.relativeAlt / 1000
        };
        updates.velocity = {
          vx: event.payload.vx / 100,
          vy: event.payload.vy / 100,
          vz: event.payload.vz / 100
        };
        updates.heading = event.payload.hdg / 100;
        break;

      case 'VFR_HUD':
        updates.groundspeed = event.payload.groundspeed;
        updates.airspeed = event.payload.airspeed;
        updates.heading = event.payload.heading;
        updates.throttle = event.payload.throttle;
        updates.climbRate = event.payload.climb;
        break;

      case 'SYS_STATUS':
        updates.battery = {
          voltage: event.payload.voltageBattery / 1000,
          current: event.payload.currentBattery / 100,
          remaining: event.payload.batteryRemaining
        };
        break;

      case 'GPS_RAW_INT':
        updates.gps = {
          fix: event.payload.fixType,
          satellites: event.payload.satellitesVisible
        };
        break;

      case 'HEARTBEAT':
        // Update mode from heartbeat
        if (event.sysid === this.vehicleState.systemId) {
          this.updateVehicleState({
            modeNumber: event.payload.customMode,
            mode: this.getModeNameFromNumber(event.payload.customMode)
          });
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      this.updateTelemetryState(updates);
    }
  }

  private getModeNameFromNumber(modeNum: number): string {
    // Copter modes
    const copterModes: Record<number, string> = {
      0: 'STABILIZE', 1: 'ACRO', 2: 'ALT_HOLD', 3: 'AUTO',
      4: 'GUIDED', 5: 'LOITER', 6: 'RTL', 7: 'CIRCLE',
      9: 'LAND', 11: 'DRIFT', 13: 'SPORT', 15: 'AUTOTUNE',
      16: 'POSHOLD', 17: 'BRAKE', 20: 'GUIDED_NOGPS', 21: 'SMART_RTL'
    };
    return copterModes[modeNum] || `MODE_${modeNum}`;
  }

  private handleDisconnect(): void {
    if (this.config.autoReconnect && !this.isReconnecting) {
      this.isReconnecting = true;
      console.log(`[MavlinkManager] Reconnecting in ${this.config.reconnectInterval}ms...`);
      
      this.reconnectTimeout = setTimeout(() => {
        if (this.mavlink) {
          this.mavlink.removeAllListeners();
          this.mavlink = undefined;
        }
        this.transport = undefined;
        this.connectInternal();
      }, this.config.reconnectInterval);
    }
  }

  private updateVehicleState(updates: Partial<VehicleState>): void {
    const changed = Object.keys(updates).some(
      key => (this.vehicleState as any)[key] !== (updates as any)[key]
    );

    if (changed) {
      this.vehicleState = { ...this.vehicleState, ...updates };
      this.emit('state-changed', this.getVehicleState());
    }
  }

  private updateTelemetryState(updates: Partial<TelemetryState>): void {
    this.telemetryState = { ...this.telemetryState, ...updates };
    this.emit('telemetry-changed', this.getTelemetryState());
  }
}
