# Pushpak GCS - Ground Control Station

<div align="center">

![Pushpak GCS](https://img.shields.io/badge/Pushpak-GCS-00ff88?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Electron](https://img.shields.io/badge/Electron-40.0.0-47848F?style=for-the-badge&logo=electron)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react)

A modern, open-source Ground Control Station for drone operations, inspired by Mission Planner.

</div>

##  Features

- **Real-time Telemetry Display**
  - Attitude indicator (Roll, Pitch, Yaw)
  - Altitude and vertical speed
  - Ground and air speed
  - GPS position and fix status
  - Battery voltage and percentage
  - Link quality (RSSI) and packet loss

- **Mission Planning**
  - Interactive waypoint management
  - Mission upload/download
  - Speed and altitude configuration
  - Estimated time and battery calculation

- **Flight Control**
  - Arm/Disarm control
  - Flight mode selection (STABILIZE, ALT_HOLD, LOITER, AUTO, RTL, LAND, GUIDED)
  - Takeoff, Land, RTL commands
  - Pause/Resume mission

- **Safety Features**
  - Geofence configuration
  - Max altitude limits
  - Breach action settings (RTL, LAND, BRAKE)

- **Payload Management**
  - Payload task planning
  - Photo, Video, Spray, Delivery support

- **Modern UI**
  - Clean, dark-themed interface
  - Tailwind CSS styling
  - Responsive layout
  - Live telemetry updates

### Planned Features

- [ ] Actual MAVLink protocol integration
- [ ] Real map integration (OpenStreetMap/Google Maps)
- [ ] Live video streaming
- [ ] Multi-drone support
- [ ] Survey grid planning
- [ ] Data logging and analysis
- [ ] Parameter configuration
- [ ] Firmware update capability

## Architecture

```
pushpak-desktop/
├── src/
│   ├── electron/          # Electron main process
│   │   ├── main.ts        # Main entry point
│   │   └── utils.ts       # Utilities
│   └── ui/                # React frontend
│       ├── components/    # UI components
│       │   ├── TopBar/    # Status bar
│       │   ├── LeftPanel/ # Mission planning
│       │   ├── RightPanel/# Telemetry display
│       │   ├── BottomDock/# Action buttons
│       │   └── MapView/   # Map/video display
│       ├── store/         # State management (Zustand)
│       │   └── droneStore.ts
│       ├── types/         # TypeScript definitions
│       │   └── index.ts
│       ├── services/      # Backend services
│       │   └── mavlink.ts # MAVLink communication
│       ├── App.tsx        # Main app component
│       └── main.tsx       # React entry point
├── dist-electron/         # Compiled Electron files
├── dist-react/            # Built React app
└── package.json
```

## 🛠️ Tech Stack

- **Frontend**: React 19.2 + TypeScript
- **Desktop Framework**: Electron 40.0
- **Styling**: Tailwind CSS 3.x
- **State Management**: Zustand
- **Icons**: Lucide React
- **Build Tool**: Vite 7.x
- **Bundler**: Electron Builder

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd pushpak-desktop

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Create distributable
npm run dist:linux   # For Linux
npm run dist:win     # For Windows
npm run dist:mac     # For macOS
```

## Usage

### Development Mode

```bash
npm run dev
```

This starts both the Vite dev server (React) and Electron in development mode with hot reload.

### Building

```bash
# Transpile Electron TypeScript
npm run transpile:electron

# Build React app
npm run build

# Create platform-specific installers
npm run dist:linux    # .AppImage, .deb
npm run dist:win      # .exe installer
npm run dist:mac      # .dmg
```

##  UI Components

### Top Bar
- Vehicle status and information
- Flight mode selector
- Arm/Disarm button
- GPS, EKF, Link status indicators
- Battery and time display

### Left Panel (Tabs)
- **Mission**: Waypoint management and mission planning
- **Payload**: Payload task configuration
- **Geofence**: Safety boundary settings
- **Multi-Drone**: Multi-vehicle control (planned)

### Center View
- Interactive map with waypoints
- Live video feed toggle
- Geofence visualization
- Home point and drone position

### Right Panel
- Attitude indicator
- Altitude display
- Speed metrics
- Link quality
- GPS coordinates

### Bottom Dock
- Flight control buttons (Takeoff, Land, RTL)
- Mission control (Pause, Resume)
- Additional features (Payload, Detection, Logs)

## 🔌 MAVLink Integration (TODO)

The `mavlink.ts` service provides a structure for MAVLink communication:

```typescript
import { mavlink } from './services/mavlink';

// Connect to drone
await mavlink.connect('udp:127.0.0.1:14550');

// Send commands
mavlink.sendCommand({ type: 'TAKEOFF' });

// Subscribe to telemetry
const unsubscribe = mavlink.onTelemetry((data) => {
  console.log('Telemetry:', data);
});

// Upload mission
await mavlink.uploadMission(waypoints);
```

### Recommended Libraries

- `node-mavlink` - MAVLink protocol implementation
- `serialport` - Serial communication
- `dgram` - UDP communication (built-in)

##  Contributing

This is an open-source project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  Code Style

- Use TypeScript for type safety
- Follow React hooks best practices
- Use Tailwind CSS for styling
- Keep components modular and reusable
- Document complex functions

##  Known Issues

- MAVLink communication not yet implemented
- Map is canvas-based (needs real map integration)
- Video streaming not implemented
- Multi-drone support incomplete

##  License

MIT License - feel free to use this project for your drone operations!

##  Acknowledgments

- Inspired by [Mission Planner](https://ardupilot.org/planner/)
- Built for the open-source drone community
- Uses [MAVLink](https://mavlink.io/) protocol specification

---

<div align="center">

**Built with ❤️ for the drone community**

</div>
```
