import React, { useState, useEffect, useRef } from 'react';
import Map, { Source, Layer, Popup, Marker } from 'react-map-gl';
import { motion, AnimatePresence } from 'framer-motion';
import { Car } from 'lucide-react';
import { UserMarker } from './UserMarker';
import { MapMarker } from './MapMarker';
import { RydeQuestCar } from './RydeQuestCar';
import { RydeQuestPopup } from './RydeQuestPopup';
import { AppStats } from '../AppStats';
import { MapPopup } from './MapPopup';
import type { ViewState, Group, GroupActivity, UserLocation, AppStats as AppStatsType, ActivityEvent } from '../../types';

interface MapViewProps {
  viewState: ViewState;
  onMove: (evt: { viewState: ViewState }) => void;
  mapboxToken: string;
  groups: Group[];
  groupActivities: GroupActivity[];
  userLocations: UserLocation[];
  selectedGroup: Group | null;
  onGroupSelect: (group: Group) => void;
  userHeatmapData: any;
  userHeatmapLayer: any;
  appStats: AppStatsType;
  activityEvents: ActivityEvent[];
  onClose: () => void;
}

// Function to calculate a point approximately 5 miles away from origin
const calculateDestination = (originLat: number, originLng: number, bearing: number): [number, number] => {
  // Earth's radius in miles
  const R = 3958.8;
  
  // Distance in miles
  const distance = 5;
  
  // Convert to radians
  const lat1 = originLat * Math.PI / 180;
  const lon1 = originLng * Math.PI / 180;
  const bearingRad = bearing * Math.PI / 180;
  
  // Calculate destination point
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / R) + 
                  Math.cos(lat1) * Math.sin(distance / R) * Math.cos(bearingRad));
  
  const lon2 = lon1 + Math.atan2(Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(lat1),
                        Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2));
  
  // Convert back to degrees
  return [lat2 * 180 / Math.PI, lon2 * 180 / Math.PI];
};

// Generate route paths for each group
const generateRoutePaths = (groups: Group[]) => {
  const paths: Array<{
    id: string,
    origin: [number, number],
    points: Array<{lat: number, lng: number}>
  }> = [];
  
  groups.forEach((group, index) => {
    // Calculate a destination point ~5 miles away in a random direction
    const bearing = (index * 75) % 360; // Use different bearings for variety
    const [destLat, destLng] = calculateDestination(group.latitude, group.longitude, bearing);
    
    // Create interpolated points between origin and destination (outbound)
    const numPoints = 15; // Number of points to interpolate
    const points: Array<{lat: number, lng: number}> = [];
    
    // Add origin
    points.push({lat: group.latitude, lng: group.longitude});
    
    // Add interpolated points for outbound journey
    for (let i = 1; i < numPoints - 1; i++) {
      const fraction = i / (numPoints - 1);
      const lat = group.latitude + fraction * (destLat - group.latitude);
      const lng = group.longitude + fraction * (destLng - group.longitude);
      
      // Add some curvature to make it look more like a road
      const curveMagnitude = 0.005 * Math.sin(fraction * Math.PI);
      const curvedLat = lat + curveMagnitude * Math.cos(bearing * Math.PI / 180);
      const curvedLng = lng + curveMagnitude * Math.sin(bearing * Math.PI / 180);
      
      points.push({lat: curvedLat, lng: curvedLng});
    }
    
    // Add destination
    points.push({lat: destLat, lng: destLng});
    
    // Add points for return journey (in reverse order)
    for (let i = numPoints - 2; i > 0; i--) {
      points.push(points[i]);
    }
    
    // Add origin again to complete the loop
    points.push({lat: group.latitude, lng: group.longitude});
    
    paths.push({
      id: `route-${group.id}`,
      origin: [group.latitude, group.longitude],
      points
    });
  });
  
  return paths;
};

// Driver names for consistency
const driverNames = [
  "Alex", "Jordan", "Taylor", "Morgan", 
  "Casey", "Riley", "Avery", "Quinn", 
  "Jamie", "Kendall", "Skyler", "Dylan"
];

// Reduced participant counts for groups (approximately 1/4 of original)
const participantReducer = (originalCount: number) => {
  return Math.max(5, Math.floor(originalCount / 4));
};

const MapView: React.FC<MapViewProps> = ({
  viewState,
  onMove,
  mapboxToken,
  groups,
  groupActivities,
  userLocations,
  selectedGroup,
  onGroupSelect,
  userHeatmapData,
  userHeatmapLayer,
  appStats,
  activityEvents,
  onClose
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [popupInfo, setPopupInfo] = useState<Group | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [routePaths, setRoutePaths] = useState<Array<{
    id: string,
    origin: [number, number],
    points: Array<{lat: number, lng: number}>
  }>>([]);
  const [rydequestDrivers, setRydequestDrivers] = useState<Array<{
    id: string,
    name: string,
    latitude: number,
    longitude: number,
    routeId: string,
    pointIndex: number,
    direction: number,
    isOutbound: boolean
  }>>([]);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  
  const mapRef = useRef<any>(null);
  
  // Function to calculate marker size based on zoom level
  const getMarkerScale = () => {
    if (!mapRef.current) return 1;
    const zoom = mapRef.current.getMap().getZoom();
    return Math.max(0.6, Math.min(1.2, zoom / 12));
  };
  
  // Event categories for filtering
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'italian', label: 'Italian' },
    { id: 'bar', label: 'Bars' },
    { id: 'gastropub', label: 'Gastropub' },
    { id: 'wine-bar', label: 'Wine' },
    { id: 'latin', label: 'Latin' }
  ];
  
  // Filter groups based on category
  const filteredGroups = activeCategory && activeCategory !== 'all'
    ? groups.filter(group => group.category === activeCategory)
    : groups;

  // Modified groups with reduced participant counts
  const modifiedGroups = filteredGroups.map(group => ({
    ...group,
    participants: participantReducer(group.participants)
  }));

  // Generate route paths when groups change
  useEffect(() => {
    const paths = generateRoutePaths(groups);
    setRoutePaths(paths);
  }, [groups]);

  // Generate and animate RydeQuest drivers along routes
  useEffect(() => {
    if (routePaths.length === 0) return;
    
    // Create initial drivers along routes
    const generateDrivers = () => {
      const drivers = [];
      
      // Create drivers for each route
      for (let routeIndex = 0; routeIndex < routePaths.length; routeIndex++) {
        const route = routePaths[routeIndex];
        
        // Add 1-2 cars per route
        const carCount = Math.floor(Math.random() * 1) + 1;
        
        for (let i = 0; i < carCount; i++) {
          // Place car at random point on the route (but in the first half)
          const halfRouteLength = Math.floor(route.points.length / 2);
          const pointIndex = Math.floor(Math.random() * halfRouteLength);
          const point = route.points[pointIndex];
          
          // Use deterministic driver name based on route and index
          const nameIndex = (routeIndex * 4 + i) % driverNames.length;
          
          drivers.push({
            id: `driver-${routeIndex}-${i}`,
            name: driverNames[nameIndex],
            latitude: point.lat,
            longitude: point.lng,
            routeId: route.id,
            pointIndex: pointIndex,
            direction: 1, // 1 = forward along route, -1 = backward
            isOutbound: true // Cars start as outbound
          });
        }
      }
      
      setRydequestDrivers(drivers);
    };
    
    generateDrivers();
    
    // Move drivers along routes - SLOWED DOWN BY 4X (now updating every 4 seconds)
    const interval = setInterval(() => {
      setRydequestDrivers(prev => {
        return prev.map(driver => {
          // Find the route for this driver
          const route = routePaths.find(r => r.id === driver.routeId);
          if (!route) return driver;
          
          // Update point index based on direction
          let newPointIndex = driver.pointIndex + driver.direction;
          
          // If reached end of route, reverse direction
          let newDirection = driver.direction;
          let isOutbound = driver.isOutbound;
          
          const halfRouteLength = Math.floor(route.points.length / 2);
          
          if (newPointIndex >= route.points.length - 1) {
            newPointIndex = route.points.length - 1;
            newDirection = -1;
            isOutbound = false;
          } else if (newPointIndex <= 0) {
            newPointIndex = 0;
            newDirection = 1;
            isOutbound = true;
          } else if (newPointIndex === halfRouteLength) {
            // Halfway point - transition from outbound to inbound
            isOutbound = false;
          }
          
          // Get new position
          const newPoint = route.points[newPointIndex];
          
          // Extremely small variation to maintain route alignment
          const jitter = 0.00001;
          const latJitter = (Math.random() - 0.5) * jitter;
          const lngJitter = (Math.random() - 0.5) * jitter;
          
          return {
            ...driver,
            latitude: newPoint.lat + latJitter,
            longitude: newPoint.lng + lngJitter,
            pointIndex: newPointIndex,
            direction: newDirection,
            isOutbound
          };
        });
      });
    }, 4000); // Update every 4 seconds (1/4 speed)
    
    return () => clearInterval(interval);
  }, [routePaths]);
  
  // Map loaded callback
  const handleMapLoad = () => {
    setMapReady(true);
  };
  
  // Fly to a specific location
  const flyToLocation = (latitude: number, longitude: number, zoom: number = 14) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom,
        duration: 1500,
        essential: true
      });
    }
  };
  
  // Fly to selected group
  useEffect(() => {
    if (selectedGroup && mapRef.current) {
      flyToLocation(selectedGroup.latitude, selectedGroup.longitude);
    }
  }, [selectedGroup]);
  
  // Toggle layers
  const toggleLayers = () => {
    setShowHeatmap(!showHeatmap);
  };
  
  // Handle marker click
  const handleMarkerClick = (group: Group) => {
    setPopupInfo(group);
  };
  
  // Handle popup close
  const handlePopupClose = () => {
    setPopupInfo(null);
  };
  
  // Handle car click
  const handleCarClick = (car: any) => {
    setSelectedCar(car);
  };
  
  // Handle car popup close
  const handleCarPopupClose = () => {
    setSelectedCar(null);
  };
  
  // Custom heatmap layer with better visibility - purple theme
  const customHeatmapLayer = {
    ...userHeatmapLayer,
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(91,33,182,0)', // purple-800 with 0 opacity
        0.1, 'rgba(124,58,237,0.3)', // purple-600 with 0.3 opacity
        0.3, 'rgba(139,92,246,0.5)', // purple-500 with 0.5 opacity
        0.5, 'rgba(167,139,250,0.7)', // purple-400 with 0.7 opacity
        0.7, 'rgba(192,132,252,0.85)', // purple-300 with 0.85 opacity
        1, 'rgba(216,180,254,1)' // purple-200 with full opacity
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 18],
      'heatmap-opacity': 0.75
    }
  };
  
  return (
    <motion.div 
      className="relative w-full h-full bg-[#121826]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>
        {!mapReady && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#121826]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto border-t-4 border-purple-500 border-solid rounded-full animate-spin"></div>
              <p className="mt-4 text-white">Loading Map...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Map
        {...viewState}
        ref={mapRef}
        onMove={onMove}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={mapboxToken}
        maxZoom={18}
        minZoom={9}
        attributionControl={false}
        reuseMaps
        onLoad={handleMapLoad}
        renderWorldCopies={false}
        antialias={true}
        initialViewState={{
          ...viewState,
          pitch: 0,
          bearing: 0
        }}
        touchZoomRotate={true}
        touchPitch={true}
        dragRotate={false}
        onClick={() => {
          setPopupInfo(null);
          setSelectedCar(null);
        }}
      >
        {/* Heat map layer (enabled by default) */}
        <Source type="geojson" data={userHeatmapData}>
          <Layer {...customHeatmapLayer} />
        </Source>
        
        {/* RydeQuest Drivers */}
        {rydequestDrivers.map(driver => (
          <RydeQuestCar 
            key={driver.id} 
            driver={driver} 
            onSelect={handleCarClick}
            scale={getMarkerScale()}
          />
        ))}
        
        {/* User locations - now showing as purple dots */}
        {userLocations.map(user => (
          <UserMarker key={user.id} user={user} scale={getMarkerScale()} />
        ))}

        {/* Venue Markers */}
        {modifiedGroups.map((group) => (
          <MapMarker
            key={group.id}
            group={group}
            activity={groupActivities.find(a => a.id === group.id) || 
              { id: group.id, level: 1, surgeCount: 0 }}
            isSelected={selectedGroup?.id === group.id}
            onSelect={handleMarkerClick}
            scale={getMarkerScale()}
          />
        ))}
        
        {/* Group Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            onClose={handlePopupClose}
            closeOnClick={true}
            closeButton={true}
            className="custom-popup"
            draggable={true}
          >
            <MapPopup 
              group={{
                ...popupInfo,
                participants: participantReducer(popupInfo.participants)
              }} 
              onDetails={() => {
                onGroupSelect(popupInfo);
                handlePopupClose();
              }} 
            />
          </Popup>
        )}
        
        {/* RydeQuest Car Popup - now draggable */}
        {selectedCar && (
          <Popup
            longitude={selectedCar.longitude}
            latitude={selectedCar.latitude}
            anchor="bottom"
            onClose={handleCarPopupClose}
            closeOnClick={true}
            closeButton={true}
            className="custom-popup rydequest-popup"
            draggable={true}
            maxWidth="300px"
          >
            <RydeQuestPopup 
              driver={selectedCar} 
              onClose={handleCarPopupClose}
            />
          </Popup>
        )}
      </Map>
      
      {/* Category Filters - moved to top center as requested */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-[#121826]/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg border border-blue-900/30 hide-scrollbar overflow-x-auto max-w-[90%]">
        <div className="flex space-x-1">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id === activeCategory ? null : category.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategory === category.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#1a2234]/70 text-gray-300 hover:bg-[#1a2234]'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* App Stats display (bottom right) */}
      <AppStats stats={appStats} />
    </motion.div>
  );
};

export default MapView;