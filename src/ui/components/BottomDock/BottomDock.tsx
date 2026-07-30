import React, { useState } from 'react';
import { useVehicle } from '../../hooks/mavlink';
import { Plane, Navigation, Pause, Play, Package, Eye, FileText, AlertCircle } from 'lucide-react';

export const BottomDock: React.FC = () => {
  const { armed, connected, takeoff, land, returnToLaunch } = useVehicle();
  const [isExecuting, setIsExecuting] = useState(false);
  const [showAltitudeDialog, setShowAltitudeDialog] = useState(false);
  const [altitude, setAltitude] = useState('10');

  const handleTakeoffClick = () => {
    if (!connected) {
      alert('No vehicle connected!');
      return;
    }
    if (!armed) {
      alert('Vehicle must be armed first!');
      return;
    }
    setShowAltitudeDialog(true);
  };

  const handleTakeoff = async () => {
    const altitudeValue = parseFloat(altitude);
    if (isNaN(altitudeValue) || altitudeValue <= 0 || altitudeValue > 100) {
      alert('Invalid altitude! Please enter a value between 0 and 100 meters.');
      return;
    }

    setShowAltitudeDialog(false);
    
    console.log(`[BottomDock] Initiating takeoff to ${altitudeValue}m`);
    try {
      setIsExecuting(true);
      await takeoff(altitudeValue);
      console.log(`[BottomDock] Takeoff command sent successfully: ${altitudeValue}m`);
    } catch (error) {
      console.error('[BottomDock] Takeoff failed:', error);
      alert(`Takeoff failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleLand = async () => {
    if (!connected) {
      alert('No vehicle connected!');
      return;
    }

    try {
      setIsExecuting(true);
      await land();
      console.log('Land command sent');
    } catch (error) {
      console.error('Land failed:', error);
      alert(`Land failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRTL = async () => {
    if (!connected) {
      alert('No vehicle connected!');
      return;
    }

    try {
      setIsExecuting(true);
      await returnToLaunch();
      console.log('RTL command sent');
    } catch (error) {
      console.error('RTL failed:', error);
      alert(`RTL failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCommand = (command: string) => {
    console.log(`Command not yet implemented: ${command}`);
    alert(`${command} functionality coming soon!`);
  };

  return (
    <>
      <div className="h-20 bg-gradient-to-b from-zinc-900 via-black to-zinc-950 border-t-2 border-zinc-700 flex items-center justify-center gap-4 px-6 shadow-2xl relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
        <ActionButton
          icon={<Plane size={22} />}
          label="TAKEOFF"
          onClick={handleTakeoffClick}
          variant="success"
          disabled={!connected || !armed || isExecuting}
        />
        
        <ActionButton
          icon={<Navigation size={22} />}
          label="LAND"
          onClick={handleLand}
          variant="warning"
          disabled={!connected || isExecuting}
        />
        
        <ActionButton
          icon={<AlertCircle size={22} />}
          label="RTL"
          onClick={handleRTL}
          variant="info"
          disabled={!connected || isExecuting}
        />
        
        <ActionButton
          icon={<Pause size={22} />}
          label="PAUSE"
          onClick={() => handleCommand('PAUSE')}
          variant="default"
        />
        
        <ActionButton
          icon={<Play size={22} />}
          label="RESUME"
          onClick={() => handleCommand('RESUME')}
          variant="default"
        />

        <div className="w-px h-10 bg-zinc-600 mx-2" />
        
        <ActionButton
          icon={<Package size={22} />}
          label="PAYLOAD"
          onClick={() => handleCommand('PAYLOAD')}
          variant="default"
        />
        
        <ActionButton
          icon={<Eye size={22} />}
          label="DETECTION"
          onClick={() => handleCommand('DETECTION')}
          variant="default"
        />
        
        <ActionButton
          icon={<FileText size={22} />}
          label="LOGS"
          onClick={() => handleCommand('LOGS')}
          variant="default"
        />
      </div>

      {/* altitude Dialog */}
      {showAltitudeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-lg p-6 min-w-[400px]">
            <h3 className="text-xl font-bold text-white mb-4">Enter Takeoff Altitude</h3>
            <input
              type="number"
              value={altitude}
              onChange={(e) => setAltitude(e.target.value)}
              className="w-full bg-zinc-800 text-white border-2 border-zinc-600 rounded px-4 py-2 mb-4 outline-none focus:border-cyan-500"
              placeholder="Altitude in meters"
              min="0"
              max="100"
              step="0.5"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTakeoff();
                if (e.key === 'Escape') setShowAltitudeDialog(false);
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleTakeoff}
                className="flex-1 bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-2 px-4 rounded border-2 border-green-500"
              >
                TAKEOFF
              </button>
              <button
                onClick={() => setShowAltitudeDialog(false)}
                className="flex-1 bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-white font-bold py-2 px-4 rounded border-2 border-zinc-600"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
}) => {
  const variantClasses = {
    default: 'bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-white border-zinc-600 shadow-lg',
    success: 'bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white border-green-500 shadow-lg shadow-green-500/20',
    warning: 'bg-gradient-to-b from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white border-orange-500 shadow-lg shadow-orange-500/20',
    danger: 'bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border-red-500 shadow-lg shadow-red-500/20',
    info: 'bg-gradient-to-b from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-500/20',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-3 px-6 py-3 rounded-lg border-2 font-bold text-sm tracking-wider uppercase
        transition-all duration-200 transform hover:scale-105 hover:brightness-110 active:scale-95
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100
        ${variantClasses[variant]}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
