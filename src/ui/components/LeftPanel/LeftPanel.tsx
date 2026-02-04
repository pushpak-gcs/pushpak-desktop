import React from 'react';
import { useDroneStore } from '../../store/droneStore';
import { Upload, Download, Plus, Trash2, MapPin, Grid, Shield, Package } from 'lucide-react';

export const LeftPanel: React.FC = () => {
  const { selectedTab, setSelectedTab } = useDroneStore();

  const tabs = [
    { id: 'Mission' as const, label: 'Mission', icon: MapPin },
    { id: 'Payload' as const, label: 'Payload', icon: Package },
    { id: 'Geofence' as const, label: 'Geofence', icon: Shield },
    { id: 'Multi-Drone' as const, label: 'Multi-Drone', icon: Grid },
  ];

  return (
    <div className="w-[480px] bg-gradient-to-b from-zinc-900 via-black to-zinc-950 border-r border-zinc-700 flex flex-col h-full">
      {/* Tab Navigation */}
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

      {/* Action Buttons */}
      <div className="px-4 flex gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-white rounded-lg font-bold text-sm tracking-wide transition-all border border-zinc-600 uppercase">
          <Upload size={18} />
          <span>Upload</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-white rounded-lg font-bold text-sm tracking-wide transition-all border border-zinc-600 uppercase">
          <Download size={18} />
          <span>Download</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {selectedTab === 'Mission' && <MissionContent />}
        {selectedTab === 'Payload' && <PayloadContent />}
        {selectedTab === 'Geofence' && <GeofenceContent />}
        {selectedTab === 'Multi-Drone' && <MultiDroneContent />}
      </div>
    </div>
  );
};

const MissionContent: React.FC = () => {
  const { currentMission } = useDroneStore();
  const waypoints = currentMission?.waypoints || [];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Mission Waypoints</h3>
        <button className="p-1.5 bg-primary-500 hover:bg-primary-600 rounded text-white transition-colors">
          <Plus size={18} />
        </button>
      </div>

      {waypoints.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <MapPin size={48} className="mx-auto mb-2 opacity-50" />
          <p>No waypoints added</p>
          <p className="text-sm mt-1">Click on map to add waypoints</p>
        </div>
      ) : (
        <div className="space-y-2">
          {waypoints.map((wp, index) => (
            <div
              key={wp.id}
              className="bg-black border border-gray-700 rounded p-3 hover:border-primary-500 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">
                  {index + 1}. {wp.label || `WP ${wp.id}`}
                </span>
                <button className="text-red-400 hover:text-red-300">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Altitude:</span>
                  <span className="text-white">{wp.altitude}m / {wp.speed}m</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed:</span>
                  <span className="text-white">{wp.speed} m/s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mission Stats */}
      {waypoints.length > 0 && (
        <div className="mt-4 p-3 bg-black border border-gray-700 rounded">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Speed:</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  defaultValue="5"
                  className="w-24"
                />
                <span className="text-white w-12">5 m/s</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Altitude:</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="5"
                  max="100"
                  defaultValue="20"
                  className="w-24"
                />
                <span className="text-white w-12">20 m</span>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-700">
              <div className="flex justify-between text-primary-500">
                <span>Est. Time:</span>
                <span className="font-semibold">15 min</span>
              </div>
              <div className="flex justify-between text-primary-500">
                <span>Battery:</span>
                <span className="font-semibold">85%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
