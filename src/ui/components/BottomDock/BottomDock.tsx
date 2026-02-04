import React from 'react';
import { useDroneStore } from '../../store/droneStore';
import { Plane, Navigation, Pause, Play, Package, Eye, FileText, AlertCircle } from 'lucide-react';

export const BottomDock: React.FC = () => {
  const { droneStatus, sendCommand } = useDroneStore();
  const { armed } = droneStatus;

  const handleCommand = (command: string) => {
    sendCommand(command);
  };

  return (
    <div className="h-20 bg-gradient-to-b from-zinc-900 via-black to-zinc-950 border-t-2 border-zinc-700 flex items-center justify-center gap-4 px-6 shadow-2xl relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
      <ActionButton
        icon={<Plane size={22} />}
        label="TAKEOFF"
        onClick={() => handleCommand('TAKEOFF')}
        variant="default"
        disabled={armed}
      />
      
      <ActionButton
        icon={<Navigation size={22} />}
        label="LAND"
        onClick={() => handleCommand('LAND')}
        variant="default"
      />
      
      <ActionButton
        icon={<AlertCircle size={22} />}
        label="RTL"
        onClick={() => handleCommand('RTL')}
        variant="info"
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
