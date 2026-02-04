import React, { useState, useRef } from 'react';
import { useDroneStore } from '../../store/droneStore';
import { Gauge, Navigation, Wind, Radio, TrendingUp, GripVertical, ChevronRight, ChevronLeft } from 'lucide-react';

export const RightPanel: React.FC = () => {
  const { droneStatus } = useDroneStore();
  const { attitude, position, speed, rssi } = droneStatus;
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position2, setPosition2] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: position2.x,
        startPosY: position2.y,
      };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && dragRef.current) {
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      setPosition2({
        x: dragRef.current.startPosX + deltaX,
        y: dragRef.current.startPosY + deltaY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragRef.current = null;
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div 
      className={`absolute ${isDragging ? 'cursor-grabbing' : ''} transition-all duration-300 z-10`}
      style={{
        right: isCollapsed ? '-280px' : `${16 - position2.x}px`,
        top: `${16 + position2.y}px`,
        width: '320px',
        height: 'calc(100% - 2rem)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-10 top-1/2 -translate-y-1/2 bg-gradient-to-b from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 border-2 border-zinc-700 rounded-l-lg p-2 transition-all shadow-xl z-20"
      >
        {isCollapsed ? <ChevronLeft size={20} className="text-cyan-400" /> : <ChevronRight size={20} className="text-cyan-400" />}
      </button>

      <div className="h-full bg-gradient-to-b from-zinc-900/95 via-black/95 to-zinc-950/95 backdrop-blur-md border-2 border-zinc-700 rounded-lg flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b-2 border-zinc-700 bg-zinc-900/50 drag-handle cursor-grab active:cursor-grabbing flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-cyan-400" />
            Flight Telemetry
          </h2>
          <GripVertical size={20} className="text-gray-500" />
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin">
        {/* Attitude Indicator */}
        <TelemetryCard title="Attitude" icon={<Gauge size={18} />}>
          <div className="flex justify-center my-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Horizon */}
                <circle cx="50" cy="50" r="45" fill="none" stroke="#374151" strokeWidth="2" />
                <line x1="20" y1="50" x2="80" y2="50" stroke="#00ff88" strokeWidth="2" />
                
                {/* Pitch line */}
                <line
                  x1="50"
                  y1="10"
                  x2="50"
                  y2="90"
                  stroke="#00d4ff"
                  strokeWidth="2"
                  transform={`rotate(${attitude.roll} 50 50)`}
                />
                
                {/* Center dot */}
                <circle cx="50" cy="50" r="3" fill="#00ff88" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-gray-400">Roll</div>
                  <div className="text-lg font-bold text-primary-500">{attitude.roll.toFixed(1)}°</div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-black p-2 rounded">
              <div className="text-gray-400 text-xs">Pitch</div>
              <div className="text-white font-semibold">{attitude.pitch.toFixed(1)}°</div>
            </div>
            <div className="bg-black p-2 rounded">
              <div className="text-gray-400 text-xs">Yaw</div>
              <div className="text-white font-semibold">{attitude.yaw.toFixed(1)}°</div>
            </div>
          </div>
        </TelemetryCard>

        {/* Altitude */}
        <TelemetryCard title="Altitude" icon={<Navigation size={18} />}>
          <div className="text-center my-4">
            <div className="text-4xl font-bold text-primary-500">
              {position.alt.toFixed(1)}
              <span className="text-xl text-gray-400 ml-1">m</span>
            </div>
            <div className="text-sm text-gray-400 mt-2">Above Sea Level</div>
          </div>
          <div className="bg-black p-2 rounded">
            <div className="text-gray-400 text-xs">Vertical Speed</div>
            <div className="text-white font-semibold">{speed.vertical.toFixed(1)} m/s</div>
          </div>
        </TelemetryCard>

        {/* Speed */}
        <TelemetryCard title="Speed" icon={<Wind size={18} />}>
          <div className="space-y-2">
            <div className="bg-black p-3 rounded">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Ground</span>
                <span className="text-xl font-bold text-white">{speed.ground.toFixed(1)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">m/s</div>
            </div>
            <div className="bg-black p-3 rounded">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Air</span>
                <span className="text-xl font-bold text-white">{speed.air.toFixed(1)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">m/s</div>
            </div>
          </div>
        </TelemetryCard>

        {/* Link Quality */}
        <TelemetryCard title="Link" icon={<Radio size={18} />}>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">RSSI</span>
                <span className="text-white font-semibold">{rssi.signal} dBm</span>
              </div>
              <div className="w-full bg-black rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.max(0, 100 + rssi.signal)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Packet Loss</span>
                <span className="text-white font-semibold">{rssi.loss.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-black rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${rssi.loss}%` }}
                />
              </div>
            </div>
          </div>
        </TelemetryCard>

        {/* GPS Position */}
        <TelemetryCard title="GPS Position" icon={<Navigation size={18} />}>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-gray-400">Lat:</span>
              <span className="text-white">{position.lat.toFixed(6)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Lng:</span>
              <span className="text-white">{position.lng.toFixed(6)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Alt:</span>
              <span className="text-white">{position.alt.toFixed(1)} m</span>
            </div>
          </div>
        </TelemetryCard>
    </div>
      </div>
    </div>
  );
};

interface TelemetryCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const TelemetryCard: React.FC<TelemetryCardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-black border border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
        <div className="text-primary-500">{icon}</div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
};
