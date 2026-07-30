import { create } from 'zustand';
import type { DroneStatus, Mission, GeofenceData, PayloadTask } from '../types';
import { socket } from '../hooks/mavlink';

interface DroneStore {

  droneStatus: DroneStatus;
  connected: boolean;
  

  currentMission: Mission | null;
  savedMissions: Mission[];
  isDrawingMode: boolean;
  geofence: GeofenceData | null;
  payloadTasks: PayloadTask[];
  

  selectedTab: 'Mission' | 'Payload' | 'Geofence' | 'Multi-Drone';
  mapCenter: { lat: number; lng: number };
  

  updateDroneStatus: (status: Partial<DroneStatus>) => void;
  setConnected: (connected: boolean) => void;
  setCurrentMission: (mission: Mission | null) => void;
  setSavedMissions: (missions: Mission[]) => void;
  setIsDrawingMode: (isDrawing: boolean) => void;
  updateMissionDetails: (updates: Partial<Mission>) => void;
  addPolygonVertex: (position: any) => void;
  clearPolygon: () => void;
  addWaypoint: (waypoint: any) => void;
  removeWaypoint: (id: number) => void;
  updateWaypoint: (id: number, updates: Partial<any>) => void;
  setEndAction: (action: 'LOITER' | 'RTL' | 'LAND') => void;
  setGeofence: (geofence: GeofenceData | null) => void;
  addPayloadTask: (task: PayloadTask) => void;
  setSelectedTab: (tab: 'Mission' | 'Payload' | 'Geofence' | 'Multi-Drone') => void;
  sendCommand: (command: string) => void;
}

export const useDroneStore = create<DroneStore>((set) => ({
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
  savedMissions: [],
  isDrawingMode: false,
  geofence: null,
  payloadTasks: [],
  selectedTab: 'Mission',
  mapCenter: { lat: 19.0760, lng: 72.8777 }, // Default Location at starting
  
  updateDroneStatus: (status) =>
    set((state) => ({
      droneStatus: { ...state.droneStatus, ...status, timestamp: Date.now() },
    })),
  
  setConnected: (connected) => set({ connected }),
  
  setCurrentMission: (mission) => set({ currentMission: mission }),
  
  setSavedMissions: (missions) => set({ savedMissions: missions }),
  
  setIsDrawingMode: (isDrawing) => set({ isDrawingMode: isDrawing }),
  
  updateMissionDetails: (updates) => 
    set((state) => ({
      currentMission: state.currentMission 
        ? { ...state.currentMission, ...updates }
        : null
    })),
    
  addPolygonVertex: (position) =>
    set((state) => {
      if (!state.currentMission) return state;
      const currentPoly = state.currentMission.polygon || [];
      return {
        currentMission: {
          ...state.currentMission,
          polygon: [...currentPoly, position]
        }
      };
    }),
    
  clearPolygon: () =>
    set((state) => {
      if (!state.currentMission) return state;
      return {
        currentMission: {
          ...state.currentMission,
          polygon: []
        }
      };
    }),
  
  addWaypoint: (waypoint) =>
    set((state) => {
      if (!state.currentMission) {
        return {
          currentMission: {
            id: Date.now().toString(),
            name: 'New Mission',
            waypoints: [waypoint]
          }
        };
      }
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
  
  updateWaypoint: (id, updates) =>
    set((state) => {
      if (!state.currentMission) return state;
      return {
        currentMission: {
          ...state.currentMission,
          waypoints: state.currentMission.waypoints.map((wp) => 
            wp.id === id ? { ...wp, ...updates } : wp
          ),
        }
      };
    }),
    
  setEndAction: (action) =>
    set((state) => {
      if (!state.currentMission) return state;
      return {
        currentMission: {
          ...state.currentMission,
          endAction: action
        }
      }
    }),
  
  setGeofence: (geofence) => set({ geofence }),
  
  addPayloadTask: (task) =>
    set((state) => ({
      payloadTasks: [...state.payloadTasks, task],
    })),
  
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  
  sendCommand: (command) => {
    console.log('Sending command:', command);
    socket.emit('command_long', { command: command });
  },
}));
