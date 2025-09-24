import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMap, Circle } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import { 
  MapPin, Thermometer, Droplets, Wind, Eye, Activity, AlertTriangle, 
  CheckCircle, Clock, Shield, Route, Navigation, Target, Users, 
  Zap, Radio, Gauge, AlertCircle, Phone, Navigation2
} from 'lucide-react';
import { topMineLocations } from '../data/mineLocations';
import { getWeatherData } from '../services/weatherApi';
// import { geolocationService } from '../services/geolocationService';
import { RoutingService } from '../services/routingService';
import { realTimeMineDataService } from '../services/realTimeMineData';
import { geolocationService } from '../services/geoLocationService';  
import { MineLocation, WeatherData, UserLocation, SafeRoute, EmergencyAlert, DangerZone } from '../types';

// Enhanced danger zones with real-time status
const dangerZones: DangerZone[] = [
  {
    id: 'danger-1',
    name: 'Jharia Coalfield Fire Zone',
    mineId: 'jharia-coal',
    coordinates: [
      [23.7400, 86.4000],
      [23.7600, 86.4200],
      [23.7400, 86.4400],
      [23.7200, 86.4200]
    ],
    type: 'Underground Fire',
    riskLevel: 'Critical',
    description: 'Active underground coal fire with toxic gas emissions. Immediate evacuation required.',
    radius: 2000,
    lastUpdated: new Date().toISOString(),
    realTimeStatus: 'Active'
  },
  {
    id: 'danger-2',
    name: 'Bailadila Iron Ore Landslide Zone',
    mineId: 'bailadila-iron',
    coordinates: [
      [18.6000, 81.3000],
      [18.6200, 81.3200],
      [18.6000, 81.3400],
      [18.5800, 81.3200]
    ],
    type: 'Landslide Risk',
    riskLevel: 'High',
    description: 'Unstable slopes with risk of landslides during monsoon season',
    radius: 1500,
    lastUpdated: new Date().toISOString(),
    realTimeStatus: 'Monitoring'
  },
  {
    id: 'danger-3',
    name: 'Korba Coal Mine Gas Leak Zone',
    mineId: 'korba-coal',
    coordinates: [
      [22.3400, 82.6800],
      [22.3600, 82.7000],
      [22.3400, 82.7200],
      [22.3200, 82.7000]
    ],
    type: 'Toxic Gas Leak',
    riskLevel: 'High',
    description: 'Methane gas accumulation with explosion risk',
    radius: 1800,
    lastUpdated: new Date().toISOString(),
    realTimeStatus: 'Active'
  }
];

// Custom marker icons
const createUserLocationIcon = () => {
  return divIcon({
    html: `<div style="background: linear-gradient(45deg, #3b82f6, #1d4ed8); width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4); position: relative;">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
    </div>`,
    className: 'user-location-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const createMineIcon = (riskLevel: string, hasAlert: boolean = false) => {
  const color = riskLevel === 'High' ? '#dc2626' : riskLevel === 'Medium' ? '#d97706' : '#16a34a';
  const pulseClass = hasAlert ? 'animate-pulse' : '';
  
  return divIcon({
    html: `<div class="${pulseClass}" style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
      ${hasAlert ? '<div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>' : ''}
    </div>`,
    className: 'mine-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const createEmergencyIcon = (type: string) => {
  const color = '#dc2626';
  return divIcon({
    html: `<div class="animate-pulse" style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.5); display: flex; align-items: center; justify-content: center;">
      <div style="color: white; font-size: 12px; font-weight: bold;">!</div>
    </div>`,
    className: 'emergency-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

// User location tracker component
const UserLocationTracker: React.FC<{ 
  onLocationUpdate: (location: UserLocation) => void;
  userLocation: UserLocation | null;
}> = ({ onLocationUpdate, userLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], map.getZoom());
    }
  }, [userLocation, map]);

  return userLocation ? (
    <>
      <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserLocationIcon()}>
        <Popup>
          <div className="p-3">
            <h4 className="font-bold text-blue-900 flex items-center mb-2">
              <Navigation className="h-4 w-4 mr-1" />
              Your Location
            </h4>
            <div className="space-y-1 text-sm">
              <p>Accuracy: ±{Math.round(userLocation.accuracy)}m</p>
              <p>Last updated: {new Date(userLocation.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        </Popup>
      </Marker>
      <Circle
        center={[userLocation.lat, userLocation.lng]}
        radius={userLocation.accuracy}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 1
        }}
      />
    </>
  ) : null;
};

// Enhanced mine marker with real-time data
const EnhancedMineMarker: React.FC<{
  mine: MineLocation;
  weather: WeatherData | null;
  hasEmergencyAlert: boolean;
  onMarkerClick: (mine: MineLocation) => void;
}> = ({ mine, weather, hasEmergencyAlert, onMarkerClick }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEmergencyStatusColor = (status: string) => {
    switch (status) {
      case 'Emergency': return 'text-red-600 bg-red-100';
      case 'Alert': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  return (
    <Marker
      position={mine.coordinates}
      icon={createMineIcon(mine.riskLevel, hasEmergencyAlert)}
      eventHandlers={{
        click: () => onMarkerClick(mine)
      }}
    >
      <Popup className="custom-popup" maxWidth={400}>
        <div className="p-4 min-w-[350px]">
          {/* Mine Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{mine.name}</h3>
              <p className="text-sm text-gray-600 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {mine.state}
              </p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(mine.riskLevel)}`}>
              {mine.riskLevel} Risk
            </div>
          </div>

          {/* Emergency Status */}
          {mine.realTimeData?.emergencyStatus && mine.realTimeData.emergencyStatus !== 'Normal' && (
            <div className={`p-2 rounded-lg mb-3 ${getEmergencyStatusColor(mine.realTimeData.emergencyStatus)}`}>
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="font-medium">Emergency Status: {mine.realTimeData.emergencyStatus}</span>
              </div>
            </div>
          )}

          {/* Real-time Data */}
          {mine.realTimeData && (
            <div className="bg-gray-50 p-3 rounded-lg mb-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <Radio className="h-4 w-4 mr-1" />
                Live Mine Data
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 flex items-center">
                    <Gauge className="h-3 w-3 mr-1" />
                    Gas Levels:
                  </span>
                  <span className="font-medium">{mine.realTimeData.gasLevels?.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 flex items-center">
                    <Thermometer className="h-3 w-3 mr-1" />
                    Temperature:
                  </span>
                  <span className="font-medium">{mine.realTimeData.temperature?.toFixed(1)}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 flex items-center">
                    <Zap className="h-3 w-3 mr-1" />
                    Seismic:
                  </span>
                  <span className="font-medium">{mine.realTimeData.seismicActivity?.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 flex items-center">
                    <Wind className="h-3 w-3 mr-1" />
                    Air Quality:
                  </span>
                  <span className="font-medium">{mine.realTimeData.airQuality?.toFixed(0)} AQI</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Last updated: {new Date(mine.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Weather Information */}
          {weather && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                <Thermometer className="h-4 w-4 mr-1" />
                Current Weather
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Temperature:</span>
                  <span className="font-medium text-blue-900">{weather.temperature}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Condition:</span>
                  <span className="font-medium text-blue-900">{weather.condition}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Humidity:</span>
                  <span className="font-medium text-blue-900">{weather.humidity}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Wind:</span>
                  <span className="font-medium text-blue-900">{weather.windSpeed} km/h</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

// Emergency alert marker
const EmergencyAlertMarker: React.FC<{ alert: EmergencyAlert }> = ({ alert }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'border-red-600 bg-red-50';
      case 'High': return 'border-orange-600 bg-orange-50';
      default: return 'border-yellow-600 bg-yellow-50';
    }
  };

  return (
    <>
      <Marker position={alert.location} icon={createEmergencyIcon(alert.type)}>
        <Popup>
          <div className="p-3 min-w-[250px]">
            <div className={`p-2 rounded-lg border-2 ${getSeverityColor(alert.severity)} mb-3`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-red-900 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-1" />
                  {alert.type}
                </h3>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  {alert.severity}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
              <div className="text-xs text-gray-500">
                Alert time: {new Date(alert.timestamp).toLocaleString()}
              </div>
            </div>
            <div className="bg-red-100 p-2 rounded border border-red-200">
              <p className="text-xs text-red-800 font-medium flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                Emergency: Call 112 immediately
              </p>
            </div>
          </div>
        </Popup>
      </Marker>
      <Circle
        center={alert.location}
        radius={alert.radius}
        pathOptions={{
          color: '#dc2626',
          fillColor: '#dc2626',
          fillOpacity: 0.2,
          weight: 2,
          dashArray: '5, 5'
        }}
      />
    </>
  );
};

// Safe route display
const SafeRouteDisplay: React.FC<{ route: SafeRoute; isSelected: boolean }> = ({ route, isSelected }) => {
  const getRouteColor = (safetyScore: number) => {
    if (safetyScore >= 80) return '#16a34a'; // Green
    if (safetyScore >= 60) return '#d97706'; // Orange
    return '#dc2626'; // Red
  };

  return (
    <Polyline
      positions={route.coordinates}
      pathOptions={{
        color: getRouteColor(route.safetyScore),
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 1 : 0.7,
        dashArray: isSelected ? undefined : '10, 5'
      }}
    >
      <Popup>
        <div className="p-3 min-w-[250px]">
          <h3 className="text-lg font-bold text-green-900 mb-2 flex items-center">
            <Route className="h-4 w-4 mr-1" />
            {route.name}
          </h3>
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Distance:</span>
              <span className="font-medium">{(route.distance / 1000).toFixed(1)} km</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Est. Time:</span>
              <span className="font-medium">{route.estimatedTime} min</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Safety Score:</span>
              <span className={`font-medium ${route.safetyScore >= 80 ? 'text-green-600' : route.safetyScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {route.safetyScore}/100
              </span>
            </div>
          </div>
          {route.avoidedHazards.length > 0 && (
            <div className="bg-green-50 p-2 rounded border border-green-200">
              <p className="text-xs text-green-800 font-medium mb-1">Avoided Hazards:</p>
              <ul className="text-xs text-green-700">
                {route.avoidedHazards.map((hazard, index) => (
                  <li key={index}>• {hazard}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Popup>
    </Polyline>
  );
};

const MineLocationsMap: React.FC = () => {
  const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherData }>({});
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [safeRoutes, setSafeRoutes] = useState<SafeRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SafeRoute | null>(null);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [liveMineData, setLiveMineData] = useState<{ [key: string]: MineLocation }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showDangerZones, setShowDangerZones] = useState(true);
  const [showSafetyRoutes, setShowSafetyRoutes] = useState(true);
  const [showEmergencyAlerts, setShowEmergencyAlerts] = useState(true);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  
  const routingServiceRef = useRef<RoutingService | null>(null);

  useEffect(() => {
    // Initialize routing service
    routingServiceRef.current = new RoutingService(dangerZones, topMineLocations);

    // Load initial weather data
    loadWeatherData();

    // Subscribe to real-time mine data
    realTimeMineDataService.subscribe({
      onMineUpdate: (mine) => {
        setLiveMineData(prev => ({ ...prev, [mine.id]: mine }));
      },
      onEmergencyAlert: (alert) => {
        setEmergencyAlerts(prev => [...prev, alert]);
        // Auto-remove alert after 10 minutes
        setTimeout(() => {
          setEmergencyAlerts(prev => prev.filter(a => a.id !== alert.id));
        }, 600000);
      }
    });

    return () => {
      geolocationService.stopTracking();
      realTimeMineDataService.unsubscribe();
    };
  }, []);

  const loadWeatherData = async () => {
    setIsLoading(true);
    const weatherPromises = topMineLocations.map(async (mine) => {
      const weather = await getWeatherData(mine.coordinates[0], mine.coordinates[1], mine.name);
      return { [mine.id]: weather };
    });

    const weatherResults = await Promise.all(weatherPromises);
    const weatherMap = weatherResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    setWeatherData(weatherMap);
    setIsLoading(false);
  };

  const startLocationTracking = () => {
    setIsTracking(true);
    geolocationService.startTracking((location) => {
      setUserLocation(location);
      
      // Auto-calculate safe routes to nearest safe zone
      if (routingServiceRef.current) {
        const nearestSafeZone = routingServiceRef.current.findNearestSafeZone(location);
        if (nearestSafeZone) {
          calculateSafeRoutes(location, nearestSafeZone);
        }
      }
    });
  };

  const stopLocationTracking = () => {
    setIsTracking(false);
    geolocationService.stopTracking();
    setUserLocation(null);
    setSafeRoutes([]);
    setSelectedRoute(null);
  };

  const calculateSafeRoutes = async (start: UserLocation, dest: [number, number]) => {
    if (!routingServiceRef.current) return;

    try {
      const routes = await routingServiceRef.current.calculateSafeRoute(start, dest);
      setSafeRoutes(routes);
      if (routes.length > 0) {
        setSelectedRoute(routes[0]); // Select the safest route by default
      }
    } catch (error) {
      console.error('Error calculating safe routes:', error);
    }
  };

  const handleDestinationSet = (coords: [number, number]) => {
    setDestination(coords);
    if (userLocation && routingServiceRef.current) {
      calculateSafeRoutes(userLocation, coords);
    }
  };

  const getMineWithLiveData = (mine: MineLocation): MineLocation => {
    const liveData = liveMineData[mine.id];
    return liveData ? { ...mine, ...liveData } : mine;
  };

  const hasEmergencyAlert = (mine: MineLocation): boolean => {
    return emergencyAlerts.some(alert => {
      const distance = Math.sqrt(
        Math.pow(alert.location[0] - mine.coordinates[0], 2) +
        Math.pow(alert.location[1] - mine.coordinates[1], 2)
      );
      return distance < 0.1; // Within ~10km
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Navigation2 className="h-5 w-5 mr-2" />
          Real-time Mine Safety Navigation System
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          Live tracking • Safe routing • Emergency alerts • Real-time mine data
        </p>
      </div>

      {/* Enhanced Controls */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* Location Tracking */}
          <div className="flex items-center space-x-2">
            <button
              onClick={isTracking ? stopLocationTracking : startLocationTracking}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isTracking 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <Target className="h-4 w-4 mr-1 inline" />
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </button>
            {userLocation && (
              <span className="text-xs text-green-600 font-medium">
                ● Live (±{Math.round(userLocation.accuracy)}m)
              </span>
            )}
          </div>

          {/* Display Options */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showDangerZones}
                onChange={(e) => setShowDangerZones(e.target.checked)}
                className="mr-2 text-red-600"
              />
              <span className="text-sm font-medium text-gray-700">Danger Zones</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showSafetyRoutes}
                onChange={(e) => setShowSafetyRoutes(e.target.checked)}
                className="mr-2 text-green-600"
              />
              <span className="text-sm font-medium text-gray-700">Safe Routes</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showEmergencyAlerts}
                onChange={(e) => setShowEmergencyAlerts(e.target.checked)}
                className="mr-2 text-red-600"
              />
              <span className="text-sm font-medium text-gray-700">Emergency Alerts</span>
            </label>
          </div>

          {/* Route Selection */}
          {safeRoutes.length > 0 && (
            <select
              value={selectedRoute?.id || ''}
              onChange={(e) => {
                const route = safeRoutes.find(r => r.id === e.target.value);
                setSelectedRoute(route || null);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {safeRoutes.map(route => (
                <option key={route.id} value={route.id}>
                  {route.name} (Safety: {route.safetyScore}/100)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Emergency Alerts Banner */}
        {emergencyAlerts.length > 0 && showEmergencyAlerts && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="font-medium text-red-800">
                {emergencyAlerts.length} Active Emergency Alert{emergencyAlerts.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="mt-1 text-sm text-red-700">
              Latest: {emergencyAlerts[emergencyAlerts.length - 1]?.type} - {emergencyAlerts[emergencyAlerts.length - 1]?.message}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">Loading live data...</span>
          </div>
        )}

        <MapContainer
          center={userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629]}
          zoom={userLocation ? 10 : 5}
          style={{ height: '700px', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User Location Tracking */}
          <UserLocationTracker 
            onLocationUpdate={setUserLocation}
            userLocation={userLocation}
          />

          {/* Enhanced Mine markers with live data */}
          {topMineLocations.map((mine) => {
            const enhancedMine = getMineWithLiveData(mine);
            return (
              <EnhancedMineMarker
                key={mine.id}
                mine={enhancedMine}
                weather={weatherData[mine.id] || null}
                hasEmergencyAlert={hasEmergencyAlert(mine)}
                onMarkerClick={() => handleDestinationSet(mine.coordinates)}
              />
            );
          })}

          {/* Danger zones */}
          {showDangerZones && dangerZones.map((zone) => (
            <Polygon
              key={zone.id}
              positions={zone.coordinates}
              pathOptions={{
                color: zone.riskLevel === 'Critical' ? '#dc2626' : '#ea580c',
                fillColor: zone.riskLevel === 'Critical' ? '#dc2626' : '#ea580c',
                fillOpacity: zone.realTimeStatus === 'Active' ? 0.4 : 0.2,
                weight: 3,
                opacity: 0.8
              }}
            >
              <Popup>
                <div className="p-3 min-w-[250px]">
                  <h3 className="text-lg font-bold text-red-900 mb-2">{zone.name}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        zone.realTimeStatus === 'Active' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {zone.realTimeStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Risk Level:</span>
                      <span className="text-sm font-medium text-red-600">{zone.riskLevel}</span>
                    </div>
                    <p className="text-sm text-gray-700">{zone.description}</p>
                  </div>
                </div>
              </Popup>
            </Polygon>
          ))}

          {/* Safe routes */}
          {showSafetyRoutes && safeRoutes.map((route) => (
            <SafeRouteDisplay
              key={route.id}
              route={route}
              isSelected={selectedRoute?.id === route.id}
            />
          ))}

          {/* Emergency alerts */}
          {showEmergencyAlerts && emergencyAlerts.map((alert) => (
            <EmergencyAlertMarker key={alert.id} alert={alert} />
          ))}
        </MapContainer>
      </div>

      {/* Enhanced Status Panel */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* System Status */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <Activity className="h-4 w-4 mr-1 text-green-600" />
              System Status
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tracking:</span>
                <span className={`font-medium ${isTracking ? 'text-green-600' : 'text-gray-400'}`}>
                  {isTracking ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Live Data:</span>
                <span className="font-medium text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Alerts:</span>
                <span className="font-medium text-red-600">{emergencyAlerts.length} Active</span>
              </div>
            </div>
          </div>

          {/* Current Route Info */}
          {selectedRoute && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <Route className="h-4 w-4 mr-1 text-blue-600" />
                Active Route
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-medium">{(selectedRoute.distance / 1000).toFixed(1)} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Safety Score:</span>
                  <span className={`font-medium ${
                    selectedRoute.safetyScore >= 80 ? 'text-green-600' : 
                    selectedRoute.safetyScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {selectedRoute.safetyScore}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Est. Time:</span>
                  <span className="font-medium">{selectedRoute.estimatedTime} min</span>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                <span className="text-gray-700">Your Location</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                <span className="text-gray-700">High Risk Mine</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-1 bg-green-600 mr-2" style={{borderTop: '1px dashed #16a34a'}}></div>
                <span className="text-gray-700">Safe Route</span>
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <Phone className="h-4 w-4 mr-1 text-red-600" />
              Emergency
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Emergency:</span>
                <span className="font-medium text-red-600">112</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Fire:</span>
                <span className="font-medium text-red-600">101</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Medical:</span>
                <span className="font-medium text-red-600">108</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MineLocationsMap;