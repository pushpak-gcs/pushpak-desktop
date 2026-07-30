export interface Position {
  lat: number;
  lng: number;
  alt: number;
}

export interface Waypoint {
  id: number;
  position: Position;
  altitude: number;
  speed: number;
  loiterTime?: number;
  label: string;
}

export interface DroneStatus {
  vehicle: string;
  mode: DroneMode;
  armed: boolean;
  gpsStatus: GPSStatus;
  ekfStatus: EKFStatus;
  linkStatus: LinkStatus;
  battery: BatteryInfo;
  position: Position;
  attitude: Attitude;
  speed: Speed;
  rssi: RSSI;
  timestamp: number;
}

export type DroneMode = 
  | 'STABILIZE' 
  | 'ACRO' 
  | 'ALT_HOLD' 
  | 'AUTO' 
  | 'GUIDED' 
  | 'LOITER' 
  | 'RTL' 
  | 'LAND' 
  | 'POSHOLD'
  | 'ARM';

export interface GPSStatus {
  fix: 'NO_FIX' | '2D_FIX' | '3D_FIX' | 'DGPS' | 'RTK_FLOAT' | 'RTK_FIXED';
  satellites: number;
}

export interface EKFStatus {
  ok: boolean;
  flags: number;
}

export interface LinkStatus {
  quality: 'GOOD' | 'FAIR' | 'POOR' | 'NONE';
  connected: boolean;
}

export interface BatteryInfo {
  voltage: number;
  current: number;
  percentage: number;
  remaining: number; // in minutes
}

export interface Attitude {
  roll: number;
  pitch: number;
  yaw: number;
}

export interface Speed {
  ground: number;
  air: number;
  vertical: number;
}

export interface RSSI {
  signal: number; // dBm
  loss: number; // percentage
}

export interface Mission {
  id: string;
  name: string;
  type?: string;
  polygon?: Position[];
  waypoints: Waypoint[];
  endAction?: 'LOITER' | 'RTL' | 'LAND';
  homePosition?: Position;
  estimatedTime?: number; // minutes
  estimatedDistance?: number; // meters
}

export interface GeofenceData {
  enabled: boolean;
  vertices: Position[];
  maxAltitude: number;
  action: 'RTL' | 'LAND' | 'BRAKE';
}

export interface PayloadTask {
  id: string;
  name: string;
  type: 'PHOTO' | 'VIDEO' | 'SPRAY' | 'DELIVERY';
  waypointId?: number;
  parameters: Record<string, any>;
}
