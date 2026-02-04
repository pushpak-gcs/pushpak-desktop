import { useEffect } from 'react';
import { TopBar } from './components/TopBar/TopBar';
import { LeftPanel } from './components/LeftPanel/LeftPanel';
import { RightPanel } from './components/RightPanel/RightPanel';
import { BottomDock } from './components/BottomDock/BottomDock';
import { MapView } from './components/MapView/MapView';
import { useDroneStore } from './store/droneStore';
import './App.css';

function App() {
  const { updateDroneStatus, setConnected } = useDroneStore();

  useEffect(() => {
    // Simulate live telemetry updates
    const interval = setInterval(() => {
      updateDroneStatus({
        position: {
          lat: 19.0760 + (Math.random() - 0.5) * 0.001,
          lng: 72.8777 + (Math.random() - 0.5) * 0.001,
          alt: 20 + (Math.random() - 0.5) * 2,
        },
        attitude: {
          roll: (Math.random() - 0.5) * 4,
          pitch: (Math.random() - 0.5) * 4,
          yaw: Math.random() * 360,
        },
        speed: {
          ground: 5 + Math.random() * 2,
          air: 6 + Math.random() * 2,
          vertical: (Math.random() - 0.5) * 0.5,
        },
      });
    }, 1000);

    // Simulate connection after 1 second
    setTimeout(() => setConnected(true), 1000);

    return () => clearInterval(interval);
  }, [updateDroneStatus, setConnected]);

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white overflow-hidden">
      {/* Top Command Bar */}
      <TopBar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Mission Panel */}
        <LeftPanel />

        {/* Center Map/Video View - Full Width */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MapView />
        </div>

        {/* Right Telemetry Panel - Overlay */}
        <RightPanel />
      </div>

      {/* Bottom Action Dock */}
      <BottomDock />
    </div>
  );
}

export default App;
