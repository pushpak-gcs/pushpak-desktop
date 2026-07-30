import React from 'react';
import { Battery, Satellite, Signal, Radio, Settings, Plug, Unplug } from 'lucide-react';
import { useVehicle, useTelemetry, CopterMode } from '../../hooks/mavlink';

export const TopBar: React.FC = () => {
  const { connected, armed, mode, systemId, arm, setMode, connect, disconnect } = useVehicle();
  const telemetry = useTelemetry();
  const [selectedPort, setSelectedPort] = React.useState<string>('UDP');
  const [selectedBaudRate, setSelectedBaudRate] = React.useState<number>(115200);

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString();
  };

  const getGpsFix = (fixType?: number): '3D_FIX' | 'NO_FIX' | '2D_FIX' => {
    if (!fixType || fixType < 2) return 'NO_FIX';
    if (fixType === 2) return '2D_FIX';
    return '3D_FIX';
  };

  const getLinkQuality = (): 'GOOD' | 'POOR' | 'NONE' => {
    if (!connected) return 'NONE';
    return 'GOOD';
  };

  const handleArmClick = async () => {
    if (!connected) {
      alert('No vehicle connected. Please connect a vehicle first.');
      return;
    }
    
    const action = armed ? 'disarm' : 'arm';
    const targetState = !armed;
    console.log(`[TopBar] Attempting to ${action} vehicle (current: ${armed}, target: ${targetState})`);
    
    try {
      await arm(targetState);
      console.log(`[TopBar] Successfully sent ${action} command`);
    } catch (error) {
      console.error(`[TopBar] Failed to ${action}:`, error);
      alert(`Failed to ${action} vehicle: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleModeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      const modeName = e.target.value;
      const modeMap: Record<string, CopterMode> = {
        'STABILIZE': CopterMode.STABILIZE,
        'ALT_HOLD': CopterMode.ALT_HOLD,
        'LOITER': CopterMode.LOITER,
        'AUTO': CopterMode.AUTO,
        'RTL': CopterMode.RTL,
        'LAND': CopterMode.LAND,
        'GUIDED': CopterMode.GUIDED
      };
      
      if (modeName in modeMap) {
        await setMode(modeMap[modeName]);
      }
    } catch (error) {
      console.error('Failed to change mode:', error);
    }
  };

  const handleConnectClick = async () => {
    if (connected) {
      try {
        await disconnect();
        console.log('Disconnected successfully');
      } catch (error) {
        console.error('Failed to disconnect:', error);
        alert(`Failed to disconnect: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      try {
        if (selectedPort === 'UDP') {
          await connect({ type: 'udp', port: 14550, host: '127.0.0.1' });
        } else if (selectedPort === 'TCP') {
          await connect({ type: 'tcp', port: 5760, host: '127.0.0.1' });
        } else {
          await connect({ type: 'serial', path: selectedPort, baudRate: selectedBaudRate });
        }
        console.log('Connected successfully');
      } catch (error) {
        console.error('Failed to connect:', error);
        alert(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
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
        <div className="flex items-center gap-2">
          <div className="bg-zinc-800 text-white border-2 border-zinc-600 rounded-lg px-4 py-2 text-base font-semibold min-w-[110px] text-center">
            {systemId ? `System ${systemId}` : 'No Vehicle'}
          </div>
        </div>

      <div className="flex items-center gap-2">
        <select 
          value={mode} 
          onChange={handleModeChange}
          disabled={!connected}
          className="bg-zinc-800 text-white border-2 border-zinc-600 rounded-lg px-4 py-2 text-base font-semibold outline-none hover:border-zinc-500 focus:border-cyan-500 transition-colors min-w-[110px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="STABILIZE">STABILIZE</option>
          <option value="ALT_HOLD">ALT HOLD</option>
          <option value="LOITER">LOITER</option>
          <option value="AUTO">AUTO</option>
          <option value="RTL">RTL</option>
          <option value="LAND">LAND</option>
          <option value="GUIDED">GUIDED</option>
        </select>
      </div>


      <button 
        onClick={handleArmClick}
        disabled={!connected}
        className={`px-6 py-2 rounded-lg font-bold text-base transition-all hover:opacity-90 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
          armed 
            ? 'bg-gradient-to-b from-green-500 via-green-600 to-green-700 text-white border-2 border-green-400' 
            : 'bg-gradient-to-b from-orange-500 via-orange-600 to-orange-700 text-white border-2 border-orange-400'
        }`}
      >
        {armed ? 'DISARM' : 'ARM'}
      </button>

      <div className="flex items-center border-2 border-zinc-600 rounded-lg overflow-hidden bg-zinc-800/50">
        <div className={`flex items-center gap-2 px-4 py-2 ${
          getGpsFix(telemetry.gps?.fix) === '3D_FIX' 
            ? 'text-green-400' 
            : getGpsFix(telemetry.gps?.fix) === '2D_FIX'
            ? 'text-yellow-400'
            : 'text-red-400'
        }`}>
          <Satellite size={18} />
          <span className="text-sm font-semibold">GPS {telemetry.gps?.satellites ?? 0}</span>
        </div>
        
        <div className="h-8 w-px bg-zinc-600"></div>
        
        <div className={`flex items-center gap-2 px-4 py-2 ${
          telemetry.position?.alt
            ? 'text-green-400' 
            : 'text-red-400'
        }`}>
          <Signal size={18} />
          <span className="text-sm font-semibold">ALT 
          <span className='text-white'> {telemetry.position?.relativeAlt?.toFixed(1) ?? '0.0'}m</span>  
          </span>
        </div>
        
        <div className="h-8 w-px bg-zinc-600"></div>
        
        <div className={`flex items-center gap-2 px-4 py-2 ${
          getLinkQuality() === 'GOOD' 
            ? 'text-green-400' 
            : getLinkQuality() === 'POOR'
            ? 'text-yellow-400'
            : 'text-red-400'
        }`}>
          <Radio size={18} />
          <span className="text-sm font-semibold">
            LINK 
            <span className='text-white'> {getLinkQuality()}</span>
          </span>
        </div>
      </div>

      {/* Battery & Time */}
      <div className="flex items-center border-2 border-zinc-600 rounded-lg overflow-hidden bg-zinc-800/50">
        <div className="flex items-center gap-2 px-4 py-2">
          <Battery size={18} className={telemetry.battery ? (telemetry.battery.remaining > 20 ? 'text-cyan-400' : 'text-red-400') : 'text-gray-400'} />
          <span className={`font-semibold ${telemetry.battery ? (telemetry.battery.remaining > 20 ? 'text-cyan-400' : 'text-red-400') : 'text-gray-400'}`}>
            {telemetry.battery?.remaining?.toFixed(0) ?? '--'}%
          </span>
          <span className="text-sm text-gray-400">{telemetry.battery?.voltage?.toFixed(1) ?? '--'}V</span>
        </div>
        
        <div className="h-8 w-px bg-zinc-600"></div>
        
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="text-sm font-semibold text-white">{formatTime()}</span>
        </div>
      </div>


      <button className="p-2 hover:bg-zinc-800 rounded transition-colors">
        <Settings size={20} className="text-gray-400 hover:text-white" />
      </button>

      <div className="flex items-center gap-2 border-2 border-zinc-600 rounded-lg overflow-hidden bg-zinc-800/50">
        <select 
          value={selectedPort}
          onChange={(e) => setSelectedPort(e.target.value)}
          disabled={connected}
          className="bg-zinc-800 text-white border-0 px-3 py-2 text-sm font-semibold outline-none hover:bg-zinc-700 focus:bg-zinc-700 transition-colors min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="UDP">UDP</option>
          <option value="TCP">TCP</option>
          <option value="/dev/ttyUSB0">/dev/ttyUSB0</option>
          <option value="/dev/ttyUSB1">/dev/ttyUSB1</option>
          <option value="/dev/ttyACM0">/dev/ttyACM0</option>
          <option value="COM1">COM1</option>
          <option value="COM2">COM2</option>
          <option value="COM3">COM3</option>
          <option value="COM4">COM4</option>
        </select>
        
        <div className="h-8 w-px bg-zinc-600"></div>
        
        <select 
          value={selectedBaudRate}
          onChange={(e) => setSelectedBaudRate(Number(e.target.value))}
          disabled={connected || selectedPort === 'UDP' || selectedPort === 'TCP'}
          className="bg-zinc-800 text-white border-0 px-3 py-2 text-sm font-semibold outline-none hover:bg-zinc-700 focus:bg-zinc-700 transition-colors min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="57600">57600</option>
          <option value="115200">115200</option>
          <option value="230400">230400</option>
          <option value="460800">460800</option>
          <option value="921600">921600</option>
        </select>
        
        <div className="h-8 w-px bg-zinc-600"></div>
        
        <button 
          onClick={handleConnectClick}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-sm transition-all hover:opacity-90 ${
            connected 
              ? 'bg-red-600/50 text-white hover:bg-red-600' 
              : 'bg-green-600/50 text-white hover:bg-green-600'
          }`}
        >
          {connected ? (
            <>
              <Unplug size={16} />
              <span>DISCONNECT</span>
            </>
          ) : (
            <>
              <Plug size={16} />
              <span>CONNECT</span>
            </>
          )}
        </button>
      </div>
      </div>

    </div>
  );
};
