import { create } from 'zustand';
import type { DroneStatus, Mission, GeofenceData, PayloadTask } from '../types';

interface DroneStore {
  // Drone state
  droneStatus: DroneStatus;
  connected: boolean;
  
  // Mission state
  currentMission: Mission | null;
  geofence: GeofenceData | null;
  payloadTasks: PayloadTask[];
  
  // UI state
  selectedTab: 'Mission' | 'Payload' | 'Geofence' | 'Multi-Drone';
  mapCenter: { lat: number; lng: number };
  
  // Actions
  updateDroneStatus: (status: Partial<DroneStatus>) => void;
  setConnected: (connected: boolean) => void;
  setCurrentMission: (mission: Mission | null) => void;
  addWaypoint: (waypoint: any) => void;
  removeWaypoint: (id: number) => void;
  setGeofence: (geofence: GeofenceData | null) => void;
  addPayloadTask: (task: PayloadTask) => void;
  setSelectedTab: (tab: 'Mission' | 'Payload' | 'Geofence' | 'Multi-Drone') => void;
  sendCommand: (command: string) => void;
}

export const useDroneStore = create<DroneStore>((set) => ({
  // Initial state
  droneStatus: {
    vehicle: 'Drone 1',
    mode: 'STABILIZE',
    armed: false,
    gpsStatus: { fix: '3D_FIX', satellites: 15 },
    ekfStatus: { ok: true, flags: 0 },
    linkStatus: { quality: 'GOOD', connected: true },
    battery: { voltage: 12.6, current: 5.2, percentage: 85, remaining: 25 },
    position: { lat: 0, lng: 0, alt: 0 },
    attitude: { roll: 0, pitch: 0, yaw: 0 },
    speed: { ground: 0, air: 0, vertical: 0 },
    rssi: { signal: -65, loss: 0.1 },
    timestamp: Date.now(),
  },
  connected: false,
  currentMission: null,
  geofence: null,
  payloadTasks: [],
  selectedTab: 'Mission',
  mapCenter: { lat: 19.0760, lng: 72.8777 }, // Default to Mumbai
  
  // Actions
  updateDroneStatus: (status) =>
    set((state) => ({
      droneStatus: { ...state.droneStatus, ...status, timestamp: Date.now() },
    })),
  
  setConnected: (connected) => set({ connected }),
  
  setCurrentMission: (mission) => set({ currentMission: mission }),
  
  addWaypoint: (waypoint) =>
    set((state) => {
      if (!state.currentMission) return state;
      return {
        currentMission: {
          ...state.currentMission,
          waypoints: [...state.currentMission.waypoints, waypoint],
        },
      };
    }),
  
  removeWaypoint: (id) =>
    set((state) => {
      if (!state.currentMission) return state;
      return {
        currentMission: {
          ...state.currentMission,
          waypoints: state.currentMission.waypoints.filter((wp) => wp.id !== id),
        },
      };
    }),
  
  setGeofence: (geofence) => set({ geofence }),
  
  addPayloadTask: (task) =>
    set((state) => ({
      payloadTasks: [...state.payloadTasks, task],
    })),
  
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  
  sendCommand: (command) => {
    console.log('Sending command:', command);
    // TODO: Implement MAVLink command sending
  },
}));
