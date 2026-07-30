import { TopBar } from './components/TopBar/TopBar';
import { LeftPanel } from './components/LeftPanel/LeftPanel';
import { RightPanel } from './components/RightPanel/RightPanel';
import { BottomDock } from './components/BottomDock/BottomDock';
import { MapView } from './components/MapView/MapView';
import './App.css';

function App() {
  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white overflow-hidden">
      {/* Top Command Bar */}
      <TopBar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Mission Panel */}
        <LeftPanel />

        {/* Center Map/Video View - Full Width */}
        <div className="flex-1 flex flex-col overflow-hidden z-10">
          <MapView />
        </div>

        {/* Right Telemetry Panel - Overlay */}
        <div className='text z-100'>
        <RightPanel />
        </div>

      </div>

      {/* Bottom Action Dock */}
      <BottomDock />
    </div>
  );
}

export default App;
