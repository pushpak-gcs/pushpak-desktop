import React from 'react';
import { useDroneStore } from '../../store/droneStore';
import { Battery, Satellite, Signal, Radio, Settings } from 'lucide-react';

export const TopBar: React.FC = () => {
  const { droneStatus, connected } = useDroneStore();
  const { vehicle, mode, armed, gpsStatus, ekfStatus, linkStatus, battery } = droneStatus;

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString();
  };

  return (
    <div className="flex items-center bg-gradient-to-b from-zinc-900 via-black to-zinc-950 text-white px-4 py-2 border-b-2 border-zinc-700 gap-6 h-[64px] shadow-2xl relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <span className="text-2xl text-primary-500">✈</span>
        <span className="text-xl font-bold ">
          PUSHPAK GCS
        </span>
      </div>

      <div className="flex gap-4 items-center justify-end flex-grow">
        {/* Vehicle Selector */}
        <div className="flex items-center gap-2">
        <select 
          value={vehicle} 
          className="bg-zinc-800 text-white border-2 border-zinc-600 rounded-lg px-4 py-2 text-base font-semibold outline-none hover:border-zinc-500 focus:border-cyan-500 transition-colors min-w-[110px]"
        >
          <option value="Drone 1">Drone 1</option>
          <option value="Drone 2">Drone 2</option>
        </select>
      </div>

      {/* Mode Dropdown */}
      <div className="flex items-center gap-2">
        <select 
          value={mode} 
          className="bg-zinc-800 text-white border-2 border-zinc-600 rounded-lg px-4 py-2 text-base font-semibold outline-none hover:border-zinc-500 focus:border-cyan-500 transition-colors min-w-[110px]"
        >
          <option value="STABILIZE">STABILIZE</option>
          <option value="ALT_HOLD">ALT HOLD</option>
          <option value="LOITER">LOITER</option>
          <option value="AUTO">AUTO</option>
          <option value="RTL">RTL</option>
          <option value="LAND">LAND</option>
          <option value="GUIDED">GUIDED</option>
          <option value="ARM">ARM</option>
        </select>
      </div>

      {/* Arm Button */}
      <button 
        className={`px-6 py-2 rounded-lg font-bold text-base transition-all hover:opacity-90 hover:scale-105 shadow-lg ${
          armed 
            ? 'bg-gradient-to-b from-green-500 via-green-600 to-green-700 text-white border-2 border-green-400' 
            : 'bg-gradient-to-b from-orange-500 via-orange-600 to-orange-700 text-white border-2 border-orange-400'
        }`}
      >
        {armed ? 'ARMED' : 'DISARM'}
      </button>

      {/* Status Indicators */}
      <div className="flex items-center border-2 border-zinc-600 rounded-lg overflow-hidden bg-zinc-800/50">
        <div className={`flex items-center gap-2 px-4 py-2 ${
          gpsStatus.fix === '3D_FIX' 
            ? 'text-green-400' 
            : 'text-yellow-400'
        }`}>
          <Satellite size={18} />
          <span className="text-sm font-semibold">GPS {gpsStatus.satellites}</span>
        </div>
        
        <div className="h-8 w-px bg-zinc-600"></div>
        
        <div className={`flex items-center gap-2 px-4 py-2 ${
          ekfStatus.ok 
            ? 'text-green-400' 
            : 'text-red-400'
        }`}>
          <Signal size={18} />
          <span className="text-sm font-semibold">EKF 
          <span className='text-white'> {ekfStatus.ok ? 'OK' : 'ERR'}</span>  
          </span>
        </div>
        
        <div className="h-8 w-px bg-zinc-600"></div>
        
        <div className={`flex items-center gap-2 px-4 py-2 ${
          linkStatus.quality === 'GOOD' 
            ? 'text-green-400' 
            : 'text-yellow-400'
        }`}>
          <Radio size={18} />
          <span className="text-sm font-semibold">
            LINK 
            <span className='text-white'> {linkStatus.quality}</span>
          </span>
        </div>
      </div>

      {/* Battery & Time */}
      <div className="flex items-center border-2 border-zinc-600 rounded-lg overflow-hidden bg-zinc-800/50">
        <div className="flex items-center gap-2 px-4 py-2">
          <Battery size={18} className="text-cyan-400" />
          <span className="font-semibold text-cyan-400">{battery.percentage}%</span>
          <span className="text-sm text-gray-400">{battery.voltage.toFixed(1)}V</span>
        </div>
        
        <div className="h-8 w-px bg-zinc-600"></div>
        
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="text-sm font-semibold text-white">{formatTime()}</span>
        </div>
      </div>

      {/* Connection Status */}
      <div className={`px-3 py-1 rounded text-sm font-semibold ${
        connected 
          ? 'bg-green-500/20 text-green-400' 
          : 'bg-red-500/20 text-red-400'
      }`}>
        {connected ? 'Connected' : 'Disconnected'}
      </div>

      {/* Settings */}
      <button className="p-2 hover:bg-zinc-800 rounded transition-colors">
        <Settings size={20} className="text-gray-400 hover:text-white" />
      </button>
      </div>

    </div>
  );
};
