import React, { useEffect, useRef } from 'react';
import { useDroneStore } from '../../store/droneStore';
import { MapPin, Crosshair } from 'lucide-react';

export const MapView: React.FC = () => {
  const { droneStatus, currentMission } = useDroneStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw geofence if exists (example)
    drawGeofence(ctx, canvas.width, canvas.height);

    // Draw waypoints
    if (currentMission?.waypoints) {
      drawWaypoints(ctx, currentMission.waypoints, canvas.width, canvas.height);
    }

    // Draw drone position
    drawDrone(ctx, canvas.width / 2, canvas.height / 2, droneStatus.attitude.yaw);

    // Draw home position
    drawHome(ctx, canvas.width / 2 - 50, canvas.height / 2 - 50);
  }, [currentMission, droneStatus]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1;

    const gridSize = 50;
    
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawGeofence = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const margin = 80;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(width - margin, margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.lineTo(margin, height - margin);
    ctx.closePath();
    ctx.stroke();
    
    ctx.setLineDash([]);
  };

  const drawWaypoints = (
    ctx: CanvasRenderingContext2D,
    waypoints: any[],
    width: number,
    height: number
  ) => {
    waypoints.forEach((_wp, index) => {
      const x = width / 2 + (index - waypoints.length / 2) * 100;
      const y = height / 2 - 80 + (index % 2) * 40;

      // Draw line between waypoints
      if (index > 0) {
        const prevX = width / 2 + (index - 1 - waypoints.length / 2) * 100;
        const prevY = height / 2 - 80 + ((index - 1) % 2) * 40;
        
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      // Draw waypoint circle
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Draw waypoint number
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), x, y);
    });
  };

  const drawDrone = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    yaw: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((yaw * Math.PI) / 180);

    // Drone body
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(10, 15);
    ctx.lineTo(0, 10);
    ctx.lineTo(-10, 15);
    ctx.closePath();
    ctx.fill();

    // Drone outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Drone label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Drone 1', x, y + 30);
  };

  const drawHome = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', x, y);

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.fillText('Home', x, y + 20);
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Map Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button className="p-2 bg-gray-600/90 hover:bg-dark-200 border border-gray-600 rounded text-white transition-colors">
          <MapPin size={20} />
        </button>
        <button className="p-2 bg-gray-600/90 hover:bg-dark-200 border border-gray-600 rounded text-white transition-colors">
          <Crosshair size={20} />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-600/90 border border-gray-600 rounded p-3 text-xs">
        <div className="text-white font-semibold mb-2">Map Legend</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <span className="text-gray-300">Drone Position</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-300">Waypoints</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-300">Home Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-red-500"></div>
            <span className="text-gray-300">Geofence</span>
          </div>
        </div>
      </div>

      {/* Live Video Toggle */}
      <div className="absolute top-4 left-4 bg-gray-600/90 border border-gray-600 rounded px-4 py-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4" />
          <span className="text-white text-sm font-medium">Live Video</span>
        </label>
      </div>
    </div>
  );
};
