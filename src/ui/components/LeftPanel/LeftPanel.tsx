import React, { useState } from 'react';
import { useDroneStore } from '../../store/droneStore';
import { useVehicle, CopterMode } from '../../hooks/mavlink';
import { Upload, Download, Plus, Trash2, MapPin, Grid, Shield, Package } from 'lucide-react';

export const LeftPanel: React.FC = () => {
  const { selectedTab, setSelectedTab, currentMission } = useDroneStore();
  const { uploadMission, setMode, arm, takeoff } = useVehicle();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUpload = async () => {
    if (currentMission && currentMission.waypoints.length > 0) {
      try {
        await uploadMission(currentMission.waypoints, currentMission.endAction || 'LOITER');
        setShowConfirm(true);
      } catch (err: any) {
        alert('Failed to upload mission: ' + err.message);
      }
    } else {
      alert('No waypoints to upload');
    }
  };

  const startMission = async () => {
    setShowConfirm(false);
    try {
      await setMode(CopterMode.GUIDED);
      await arm(true);
      await takeoff(currentMission!.waypoints[0].altitude || 10);
      
      setTimeout(async () => {
        try {
          await setMode(CopterMode.AUTO);
        } catch (e) {
          console.error("Failed to switch to AUTO mode:", e);
        }
      }, 4000);
    } catch (e) {
      console.error("Failed to start mission automatically:", e);
    }
  };

  const tabs = [
    { id: 'Mission' as const, label: 'Mission', icon: MapPin },
    { id: 'Payload' as const, label: 'Payload', icon: Package },
    { id: 'Geofence' as const, label: 'Geofence', icon: Shield },
    { id: 'Multi-Drone' as const, label: 'Multi-Drone', icon: Grid },
  ];

  return (
    <div className="w-[480px] bg-gradient-to-b from-zinc-900 via-black to-zinc-950 border-r border-zinc-700 flex flex-col h-full">
      {/* tab  navigation */}
      <div className="flex border-2 border-zinc-700 m-4 rounded-lg overflow-hidden bg-zinc-900/80">
        {tabs.map((tab, index) => (
          <React.Fragment key={tab.id}>
            <button
              onClick={() => setSelectedTab(tab.id)}
              className={`flex-1 flex items-center justify-center py-3 text-xs font-bold tracking-wider transition-all uppercase ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-b from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
            {index < tabs.length - 1 && (
              <div className="w-px bg-zinc-700"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="px-4 flex gap-3">
        <button 
          onClick={handleUpload}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-white rounded-lg font-bold text-sm tracking-wide transition-all border border-zinc-600 uppercase"
        >
          <Upload size={18} />
          <span>Upload</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-white rounded-lg font-bold text-sm tracking-wide transition-all border border-zinc-600 uppercase">
          <Download size={18} />
          <span>Download</span>
        </button>
      </div>

      {/* main-content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {selectedTab === 'Mission' && <MissionContent />}
        {selectedTab === 'Payload' && <PayloadContent />}
        {selectedTab === 'Geofence' && <GeofenceContent />}
        {selectedTab === 'Multi-Drone' && <MultiDroneContent />}
      </div>

      {/* confirm-modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Mission Uploaded</h3>
            <p className="text-gray-300 mb-6">
              The mission was uploaded successfully. Do you want to ARM the drone and start AUTO mode now?
            </p>
            <div className="flex gap-4 justify-end">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-semibold transition-colors border border-zinc-700"
              >
                Cancel
              </button>
              <button 
                onClick={startMission}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded font-bold transition-colors"
              >
                Start Mission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { MissionContent } from './MissionContent';

const PayloadContent: React.FC = () => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Payload Tasks</h3>
      <div className="text-center py-8 text-gray-400">
        <Package size={48} className="mx-auto mb-2 opacity-50" />
        <p>No payload tasks</p>
        <button className="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded transition-colors">
          Add Payload Task
        </button>
      </div>
    </div>
  );
};

const GeofenceContent: React.FC = () => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Geofence</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-black border border-gray-700 rounded">
          <span className="text-sm text-gray-300">Enable Geofence</span>
          <input type="checkbox" className="w-4 h-4" />
        </div>
        <div className="p-3 bg-black border border-gray-700 rounded">
          <label className="text-sm text-gray-300 block mb-2">Max Altitude (m)</label>
          <input
            type="number"
            defaultValue={100}
            className="w-full bg-dark-200 border border-gray-600 rounded px-3 py-2 text-white"
          />
        </div>
        <div className="p-3 bg-black border border-gray-700 rounded">
          <label className="text-sm text-gray-300 block mb-2">Action on Breach</label>
          <select className="w-full bg-dark-200 border border-gray-600 rounded px-3 py-2 text-white">
            <option>RTL (Return to Launch)</option>
            <option>LAND</option>
            <option>BRAKE</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const MultiDroneContent: React.FC = () => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Multi-Drone Control</h3>
      <div className="text-center py-8 text-gray-400">
        <Grid size={48} className="mx-auto mb-2 opacity-50" />
        <p>Multi-drone support</p>
        <p className="text-sm mt-1">Coming soon...</p>
      </div>
    </div>
  );
};
