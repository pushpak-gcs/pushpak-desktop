import React, { useMemo, useState, useRef, useEffect } from 'react';
import { MapPin, Crosshair, Navigation2, Flag, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, Polygon, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L, { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useDroneStore } from '../../store/droneStore';
import type { Position, Waypoint } from '../../types';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const isValidCoordinate = (value: number, max: number) =>
  Number.isFinite(value) && Math.abs(value) <= max;

const isValidPosition = (position: Position | undefined | null) =>
  !!position &&
  isValidCoordinate(position.lat, 90) &&
  isValidCoordinate(position.lng, 180);

const toLatLng = (position: Position): L.LatLngExpression => [position.lat, position.lng];

const createDroneIcon = (heading: number): DivIcon => {
  return L.divIcon({
    className: 'drone-marker',
    html: `
      <div style="transform: rotate(${heading}deg); display: flex; align-items: center; justify-content: center;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ff88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.5 2h3v4h-3z"/>
          <path d="M12 6v12"/>
          <circle cx="12" cy="12" r="1" fill="#00ff88"/>
          <path d="M6 11h12"/>
          <path d="M7 8l-3-3M17 8l3-3M7 16l-3 3M17 16l3 3"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface ContextMenuProps {
  position: { x: number; y: number };
  latlng: L.LatLng | null;
  onClose: () => void;
  setIsDrawingPolygon: (value: boolean) => void;
  setPolygonVertices: (vertices: L.LatLng[]) => void;
  onLoadKml: () => void;
  setKmlData: (data: { polygons: L.LatLng[][], markers: L.LatLng[] }) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ position, latlng, onClose, setIsDrawingPolygon, setPolygonVertices, onLoadKml, setKmlData }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuSections = [
    {
      title: 'Waypoint',
      items: [
        { icon: <Flag size={16} />, label: 'Add Waypoint', action: () => console.log('Add waypoint at', latlng) },
        { icon: <Trash2 size={16} />, label: 'Delete Waypoint', action: () => console.log('Delete waypoint') },
        { icon: <Navigation2 size={16} />, label: 'Set Home Position', action: () => console.log('Set home at', latlng) },
      ],
    },
    {
      title: 'Mission',
      items: [
        { icon: <Flag size={16} />, label: 'Clear Mission', action: () => console.log('Clear mission') },
        { icon: <MapPin size={16} />, label: 'Load Mission', action: () => console.log('Load mission') },
        { icon: <MapPin size={16} />, label: 'Save Mission', action: () => console.log('Save mission') },
      ],
    },
    {
      title: 'Geofence',
      items: [
        { icon: <MapPin size={16} />, label: 'Add Geofence Vertex', action: () => console.log('Add geofence vertex at', latlng) },
        { icon: <MapPin size={16} />, label: 'Draw Polygon', action: () => { onClose(); setIsDrawingPolygon(true); setPolygonVertices([]); } },
        { icon: <Trash2 size={16} />, label: 'Clear Geofence', action: () => console.log('Clear geofence') },
        { icon: <MapPin size={16} />, label: 'Load Geofence', action: () => console.log('Load geofence') },
        { icon: <MapPin size={16} />, label: 'Save Geofence', action: () => console.log('Save geofence') },
      ],
    },
    {
      title: 'Tools',
      items: [
        { icon: <MapPin size={16} />, label: 'Measure Distance', action: () => console.log('Measure distance') },
        { icon: <MapPin size={16} />, label: 'Drop Marker', action: () => console.log('Drop marker at', latlng) },
        { icon: <MapPin size={16} />, label: 'Load KML File', action: () => { onClose(); onLoadKml(); } },
        { icon: <Trash2 size={16} />, label: 'Clear KML', action: () => { onClose(); setKmlData({ polygons: [], markers: [] }); } },
        { icon: <Trash2 size={16} />, label: 'Clear Selection', action: () => console.log('Clear selection') },
      ],
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-lg shadow-2xl py-2 min-w-[200px] max-h-[500px] overflow-y-auto z-[9999]"
      style={{ left: position.x, top: position.y }}
    >
      {latlng && (
        <div className="px-4 py-2 border-b border-gray-700 text-xs text-gray-400 font-mono">
          {latlng.lat.toFixed(6)}, {latlng.lng.toFixed(6)}
        </div>
      )}
      {menuSections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          {sectionIndex > 0 && <div className="h-px bg-gray-700 my-1" />}
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {section.title}
          </div>
          {section.items.map((item, itemIndex) => (
            <button
              key={itemIndex}
              onClick={() => {
                item.action();
                onClose();
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-700 text-white text-sm transition-colors"
            >
              <span className="text-cyan-400">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

const MapEventHandler: React.FC<{ 
  onContextMenu: (e: L.LeafletMouseEvent) => void;
  onMapClick: (e: L.LeafletMouseEvent) => void;
}> = ({ onContextMenu, onMapClick }) => {
  useMapEvents({
    contextmenu: (e) => {
      e.originalEvent.preventDefault();
      onContextMenu(e);
    },
    click: (e) => {
      onMapClick(e);
    },
  });
  return null;
};

const FitKmlBounds: React.FC<{ kmlData: { polygons: L.LatLng[][], markers: L.LatLng[] } }> = ({ kmlData }) => {
  const map = useMap();

  useEffect(() => {
    if (kmlData.polygons.length === 0 && kmlData.markers.length === 0) return;

    const allPoints: L.LatLng[] = [];
    
    // Add all polygon vertices
    kmlData.polygons.forEach(polygon => {
      allPoints.push(...polygon);
    });
    
    // Add all markers
    allPoints.push(...kmlData.markers);

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
    }
  }, [kmlData, map]);

  return null;
};

export const MapView: React.FC = () => {
  const { droneStatus, currentMission, geofence, mapCenter } = useDroneStore();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; latlng: L.LatLng } | null>(null);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [polygonVertices, setPolygonVertices] = useState<L.LatLng[]>([]);
  const [kmlData, setKmlData] = useState<{ polygons: L.LatLng[][], markers: L.LatLng[] }>({ polygons: [], markers: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const waypoints: Waypoint[] = currentMission?.waypoints ?? [];
  const waypointPositions = useMemo(
    () => waypoints.filter((wp) => isValidPosition(wp.position)).map((wp) => toLatLng(wp.position)),
    [waypoints]
  );

  const geofencePositions = useMemo(
    () =>
      geofence?.vertices
        ?.filter((vertex) => isValidPosition(vertex))
        .map((vertex) => toLatLng(vertex)) ??
      [],
    [geofence]
  );

  const dronePosition = isValidPosition(droneStatus.position)
    ? toLatLng(droneStatus.position)
    : ([mapCenter.lat, mapCenter.lng] as L.LatLngExpression);

  const homePosition = isValidPosition(currentMission?.homePosition)
    ? toLatLng(currentMission!.homePosition!)
    : null;

  const droneIcon = createDroneIcon(droneStatus.attitude.yaw);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (isDrawingPolygon) {
      setPolygonVertices([...polygonVertices, e.latlng]);
    }
  };

  const undoLastVertex = () => {
    if (polygonVertices.length > 0) {
      setPolygonVertices(polygonVertices.slice(0, -1));
    }
  };

  const completePolygon = () => {
    if (polygonVertices.length >= 3) {
      console.log('Polygon completed with vertices:', polygonVertices);
      // Here you can save the polygon to the store or state
      setIsDrawingPolygon(false);
      setPolygonVertices([]);
    }
  };

  const cancelPolygonDrawing = () => {
    setIsDrawingPolygon(false);
    setPolygonVertices([]);
  };

  const handleLoadKml = () => {
    fileInputRef.current?.click();
  };

  const parseKmlFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        
        const polygons: L.LatLng[][] = [];
        const markers: L.LatLng[] = [];

        // Parse Polygons
        const polygonElements = xmlDoc.getElementsByTagName('Polygon');
        console.log('Found polygon elements:', polygonElements.length);
        for (let i = 0; i < polygonElements.length; i++) {
          const coordsText = polygonElements[i].getElementsByTagName('coordinates')[0]?.textContent;
          if (coordsText) {
            const coords = coordsText.trim().split(/\s+/).map(coord => {
              const parts = coord.split(',');
              const lng = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              return L.latLng(lat, lng);
            }).filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));
            console.log(`Polygon ${i} coords:`, coords.length, coords[0]);
            if (coords.length >= 3) {
              polygons.push(coords);
            }
          }
        }

        // Parse LineStrings as polylines
        const lineElements = xmlDoc.getElementsByTagName('LineString');
        console.log('Found line elements:', lineElements.length);
        for (let i = 0; i < lineElements.length; i++) {
          const coordsText = lineElements[i].getElementsByTagName('coordinates')[0]?.textContent;
          if (coordsText) {
            const coords = coordsText.trim().split(/\s+/).map(coord => {
              const parts = coord.split(',');
              const lng = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              return L.latLng(lat, lng);
            }).filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));
            if (coords.length >= 2) {
              polygons.push(coords); // Treat as path
            }
          }
        }

        // Parse Placemarks (points)
        const placemarks = xmlDoc.getElementsByTagName('Placemark');
        console.log('Found placemarks:', placemarks.length);
        for (let i = 0; i < placemarks.length; i++) {
          const point = placemarks[i].getElementsByTagName('Point')[0];
          if (point) {
            const coordsText = point.getElementsByTagName('coordinates')[0]?.textContent;
            if (coordsText) {
              const parts = coordsText.trim().split(',');
              const lng = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              console.log(`Point ${i}:`, lat, lng);
              if (!isNaN(lat) && !isNaN(lng)) {
                markers.push(L.latLng(lat, lng));
              }
            }
          }
        }

        setKmlData({ polygons, markers });
        const total = polygons.length + markers.length;
        console.log('KML loaded successfully:', { polygons: polygons.length, markers: markers.length });
        alert(`KML loaded: ${polygons.length} polygon(s), ${markers.length} marker(s)`);
      } catch (error) {
        console.error('Error parsing KML:', error);
        alert('Failed to parse KML file: ' + error);
      }
    };
    reader.onerror = () => {
      alert('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.kml')) {
        parseKmlFile(file);
      } else {
        alert('Please select a valid KML file');
      }
    }
    // Reset input so the same file can be loaded again
    if (e.target) e.target.value = '';
  };

  const handleContextMenu = (e: L.LeafletMouseEvent) => {
    if (!isDrawingPolygon) {
      setContextMenu({
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
        latlng: e.latlng,
      });
    }
  };

  // Handle keyboard shortcuts for polygon drawing
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isDrawingPolygon) {
        if (e.key === 'Escape') {
          cancelPolygonDrawing();
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          undoLastVertex();
        } else if (e.key === 'Enter' && polygonVertices.length >= 3) {
          completePolygon();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDrawingPolygon, polygonVertices]);

  return (
    <div className="relative w-full h-full bg-black">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={16}
        className="w-full h-full"
        zoomControl={false}
        preferCanvas
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          maxZoom={20}
        />

        <MapEventHandler onContextMenu={handleContextMenu} onMapClick={handleMapClick} />
        <FitKmlBounds kmlData={kmlData} />

        {/* KML Data Display */}
        {kmlData.polygons.map((polygon, index) => (
          <Polygon
            key={`kml-polygon-${index}`}
            positions={polygon.map(p => [p.lat, p.lng])}
            pathOptions={{ color: '#8b5cf6', weight: 2, fillOpacity: 0.3 }}
          >
            <Tooltip>KML Polygon {index + 1}</Tooltip>
          </Polygon>
        ))}
        {kmlData.markers.map((marker, index) => (
          <CircleMarker
            key={`kml-marker-${index}`}
            center={[marker.lat, marker.lng]}
            radius={6}
            pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.8 }}
          >
            <Tooltip>KML Point {index + 1}</Tooltip>
          </CircleMarker>
        ))}

        {/* Drawing Polygon Preview */}
        {isDrawingPolygon && polygonVertices.length > 0 && (
          <>
            {polygonVertices.length >= 3 && (
              <Polygon
                positions={polygonVertices.map(v => [v.lat, v.lng])}
                pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '5 5', fillOpacity: 0.2 }}
              />
            )}
            {polygonVertices.length >= 2 && (
              <Polyline
                positions={polygonVertices.map(v => [v.lat, v.lng])}
                pathOptions={{ color: '#3b82f6', weight: 2 }}
              />
            )}
            {polygonVertices.map((vertex, index) => (
              <CircleMarker
                key={index}
                center={[vertex.lat, vertex.lng]}
                radius={5}
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 1 }}
              >
                <Tooltip permanent direction="top" offset={[0, -10]}>
                  {index + 1}
                </Tooltip>
              </CircleMarker>
            ))}
          </>
        )}

        {geofencePositions.length >= 3 && (
          <Polygon
            positions={geofencePositions}
            pathOptions={{ color: '#ef4444', weight: 3, dashArray: '6 6' }}
          />
        )}

        {waypointPositions.length > 0 && (
          <Polyline positions={waypointPositions} pathOptions={{ color: '#fbbf24', weight: 3 }} />
        )}

        {waypoints.map((wp, index) =>
          isValidPosition(wp.position) ? (
            <Marker key={wp.id ?? index} position={toLatLng(wp.position)}>
              <Tooltip direction="top" offset={[0, -6]}>{`WP ${index + 1}: ${wp.label}`}</Tooltip>
            </Marker>
          ) : null
        )}

        {homePosition && (
          <CircleMarker
            center={homePosition}
            radius={8}
            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.9 }}
          >
            <Tooltip direction="top" offset={[0, -6]}>{currentMission?.name ?? 'Home'}</Tooltip>
          </CircleMarker>
        )}

        {dronePosition && (
          <Marker position={dronePosition} icon={droneIcon}>
            <Tooltip direction="top" offset={[0, -6]} permanent>
              {droneStatus.vehicle}
            </Tooltip>
          </Marker>
        )}
      </MapContainer>

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
          {(kmlData.polygons.length > 0 || kmlData.markers.length > 0) && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-purple-500"></div>
              <span className="text-gray-300">KML Data ({kmlData.polygons.length + kmlData.markers.length})</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Video Toggle */}
      <div className="absolute top-4 left-4 bg-gray-600/90 border border-gray-600 rounded px-4 py-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4" />
          <span className="text-white text-sm font-medium">Live Video</span>
        </label>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          latlng={contextMenu.latlng}
          onClose={() => setContextMenu(null)}
          setIsDrawingPolygon={setIsDrawingPolygon}
          setPolygonVertices={setPolygonVertices}
          onLoadKml={handleLoadKml}
          setKmlData={setKmlData}
        />
      )}

      {/* Hidden file input for KML loading */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".kml"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Polygon Drawing Controls */}
      {isDrawingPolygon && (
        <div className="absolute top-20 right-4 bg-gray-800/95 backdrop-blur-md border-2 border-blue-500 rounded-lg shadow-2xl p-4 z-500 min-w-[320px]">
          <div className="text-white mb-3">
            <div className="text-lg font-bold mb-1">Drawing Polygon</div>
            <div className="text-sm text-gray-300">
              Click on map to add vertices ({polygonVertices.length} added)
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Minimum 3 vertices required
            </div>
            <div className="text-xs text-blue-400 mt-2">
              Shortcuts: ESC=Cancel | Backspace=Undo | Enter=Complete
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={undoLastVertex}
              disabled={polygonVertices.length === 0}
              className={`flex-1 px-4 py-2 rounded font-bold text-sm transition-all ${
                polygonVertices.length > 0
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Undo Last
            </button>
            <button
              onClick={completePolygon}
              disabled={polygonVertices.length < 3}
              className={`flex-1 px-4 py-2 rounded font-bold text-sm transition-all ${
                polygonVertices.length >= 3
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Complete
            </button>
            <button
              onClick={cancelPolygonDrawing}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
