import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit3, Upload, Play, Square, Loader } from 'lucide-react';
import { useDroneStore } from '../../store/droneStore';
import { useVehicle } from '../../hooks/mavlink';

const API_URL = 'http://localhost:5000';

export const MissionContent: React.FC = () => {
  const { 
    currentMission, 
    setCurrentMission,
    savedMissions, 
    setSavedMissions,
    isDrawingMode,
    setIsDrawingMode,
    updateWaypoint, 
    removeWaypoint, 
    updateMissionDetails,
    clearPolygon
  } = useDroneStore();
  const { uploadMission } = useVehicle();

  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const res = await fetch(`${API_URL}/missions`);
      const data = await res.json();
      setSavedMissions(data);
    } catch (e) {
      console.error("Failed to fetch missions", e);
    }
  };

  const handleCreateNew = () => {
    setCurrentMission({
      id: Math.random().toString(36).substring(7),
      name: 'New Mission',
      type: 'Grid',
      waypoints: [],
      polygon: [],
      endAction: 'LOITER'
    });
    setIsCreating(true);
  };

  const handleGenerate = async () => {
    if (!currentMission?.polygon || currentMission.polygon.length < 3) {
      alert("Please draw an area with at least 3 points");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/generate_mission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: currentMission.type,
          polygon: currentMission.polygon,
          spacing: 10,
          angle: 0
        })
      });
      const data = await res.json();
      if (data.success) {
        const generatedWps = data.waypoints.map((wp: any, index: number) => ({
          id: Date.now() + index,
          position: wp,
          altitude: 20,
          speed: 5,
          loiterTime: 0,
          label: `Auto WP ${index+1}`
        }));
        setCurrentMission({
          ...currentMission,
          waypoints: generatedWps
        });
      } else {
        alert("Failed to generate: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error generating mission");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!currentMission) return;
    try {
      await fetch(`${API_URL}/missions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentMission)
      });
      await fetchMissions();
      setIsCreating(false);
    } catch (e) {
      console.error("Failed to save", e);
      alert("Error saving mission");
    }
  };

  const handleUpload = async (mission: any) => {
    try {
      await uploadMission(mission.waypoints, mission.endAction || 'LOITER');
      alert('Mission uploaded!');
    } catch (e: any) {
      alert('Upload failed: ' + e.message);
    }
  };

  if (isCreating && currentMission) {
    const isAreaMission = currentMission.type !== 'Waypoint';
    
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">Create Mission</h3>
          <button 
            onClick={() => setIsCreating(false)}
            className="text-gray-400 hover:text-white"
          >
            Back
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Name</label>
            <input 
              value={currentMission.name}
              onChange={(e) => updateMissionDetails({ name: e.target.value })}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 outline-none focus:border-primary-500" 
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Type</label>
            <select
              value={currentMission.type}
              onChange={(e) => updateMissionDetails({ type: e.target.value, polygon: [], waypoints: [] })}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 outline-none focus:border-primary-500"
            >
              <option value="Grid">Grid</option>
              <option value="Survey">Survey</option>
              <option value="Search & Rescue">Search & Rescue</option>
              <option value="Agri">Agri</option>
              <option value="Inspection">Inspection</option>
              <option value="Waypoint">Waypoint</option>
            </select>
          </div>
        </div>

        {isAreaMission && (
          <div className="bg-black border border-gray-700 rounded p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Search Area</span>
              <button 
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className={`text-xs px-2 py-1 rounded ${isDrawingMode ? 'bg-red-500/20 text-red-400' : 'bg-primary-500/20 text-primary-400'}`}
              >
                {isDrawingMode ? 'Stop Drawing' : 'Draw Area'}
              </button>
            </div>
            {currentMission.polygon && currentMission.polygon.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{currentMission.polygon.length} points drawn</span>
                <button onClick={clearPolygon} className="text-xs text-gray-500 hover:text-white">Clear</button>
              </div>
            )}
            <button 
              onClick={handleGenerate}
              disabled={loading || !currentMission.polygon || currentMission.polygon.length < 3}
              className="w-full mt-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-sm py-1.5 rounded flex items-center justify-center gap-2"
            >
              {loading ? <Loader size={14} className="animate-spin" /> : <Play size={14} />}
              Generate Waypoints
            </button>
          </div>
        )}

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {currentMission.waypoints.map((wp, index) => (
             <div key={wp.id} className="bg-black border border-gray-700 rounded p-3">
               <div className="flex items-center justify-between mb-2">
                 <span className="font-semibold text-white text-sm">
                   {index + 1}. {wp.label || `WP ${wp.id}`}
                 </span>
                 <button onClick={() => removeWaypoint(wp.id)} className="text-red-400 hover:text-red-300">
                   <Trash2 size={14} />
                 </button>
               </div>
               <div className="text-xs text-gray-400 space-y-2 flex gap-2">
                 <div>
                   <label className="block mb-1">Alt (m)</label>
                   <input type="number" value={wp.altitude} onChange={(e) => updateWaypoint(wp.id, { altitude: Number(e.target.value) })} className="w-12 bg-gray-800 text-white rounded px-1" />
                 </div>
                 <div>
                   <label className="block mb-1">Speed</label>
                   <input type="number" value={wp.speed} onChange={(e) => updateWaypoint(wp.id, { speed: Number(e.target.value) })} className="w-12 bg-gray-800 text-white rounded px-1" />
                 </div>
                 <div>
                   <label className="block mb-1">Loiter(s)</label>
                   <input type="number" value={wp.loiterTime||0} onChange={(e) => updateWaypoint(wp.id, { loiterTime: Number(e.target.value) })} className="w-12 bg-gray-800 text-white rounded px-1" />
                 </div>
               </div>
             </div>
          ))}
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded font-semibold"
        >
          Save Mission
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Missions</h3>
        <button 
          onClick={handleCreateNew}
          className="p-1.5 bg-primary-500 hover:bg-primary-600 rounded text-white flex items-center gap-1 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {savedMissions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <MapPin size={48} className="mx-auto mb-2 opacity-50" />
          <p>No saved missions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedMissions.map((m) => (
            <div key={m.id} className="bg-black border border-gray-700 rounded p-3 hover:border-gray-500 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-white">{m.name}</h4>
                  <p className="text-xs text-primary-400">{m.type || 'Waypoint'} • {m.waypoints.length} WPs</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setCurrentMission(m);
                      setIsCreating(true);
                    }}
                    className="text-gray-400 hover:text-white"
                    title="Edit"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => handleUpload(m)}
                    className="text-green-500 hover:text-green-400"
                    title="Upload to Drone"
                  >
                    <Upload size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
