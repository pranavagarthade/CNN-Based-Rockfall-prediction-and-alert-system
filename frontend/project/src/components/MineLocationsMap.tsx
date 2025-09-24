import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import { MapPin, Thermometer, Droplets, Wind, Eye, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { topMineLocations } from '../data/mineLocations';
import { getWeatherData } from '../services/weatherApi';
import { MineLocation, WeatherData } from '../types';

// Custom marker icons
const createCustomIcon = (riskLevel: string) => {
  const color = riskLevel === 'High' ? '#dc2626' : riskLevel === 'Medium' ? '#d97706' : '#16a34a';
  return divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

interface MineMarkerProps {
  mine: MineLocation;
  weather: WeatherData | null;
  onMarkerClick: (mine: MineLocation) => void;
}

const MineMarker: React.FC<MineMarkerProps> = ({ mine, weather, onMarkerClick }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-50';
      case 'Inactive': return 'text-red-600 bg-red-50';
      case 'Under Development': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle className="h-4 w-4" />;
      case 'Inactive': return <AlertTriangle className="h-4 w-4" />;
      case 'Under Development': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Marker
      position={mine.coordinates}
      icon={createCustomIcon(mine.riskLevel)}
      eventHandlers={{
        click: () => onMarkerClick(mine)
      }}
    >
      <Popup className="custom-popup" maxWidth={350}>
        <div className="p-4 min-w-[300px]">
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

          {/* Mine Details */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <span className="text-sm text-gray-900">{mine.type}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Production:</span>
                <span className="text-sm text-gray-900">{mine.production}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(mine.operationalStatus)}`}>
                  {getStatusIcon(mine.operationalStatus)}
                  <span className="ml-1">{mine.operationalStatus}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Information */}
          {weather ? (
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
                  <span className="font-medium text-blue-900 flex items-center">
                    {weather.icon} {weather.condition}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700 flex items-center">
                    <Droplets className="h-3 w-3 mr-1" />
                    Humidity:
                  </span>
                  <span className="font-medium text-blue-900">{weather.humidity}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700 flex items-center">
                    <Wind className="h-3 w-3 mr-1" />
                    Wind:
                  </span>
                  <span className="font-medium text-blue-900">{weather.windSpeed} km/h</span>
                </div>
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-blue-700 flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    Visibility:
                  </span>
                  <span className="font-medium text-blue-900">{weather.visibility} km</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading weather data...</p>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

import { Polyline } from 'react-leaflet';
interface MineLocationsMapProps {
  dangerMine?: string | null;
}

const SAFE_LOCATION: [number, number] = [28.6139, 77.2090]; // Example: New Delhi as a safe location

const MineLocationsMap: React.FC<MineLocationsMapProps> = ({ dangerMine }) => {
  const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherData }>({});
  const [selectedMine, setSelectedMine] = useState<MineLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

    loadWeatherData();
  }, []);

  const handleMarkerClick = (mine: MineLocation) => {
    setSelectedMine(mine);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Top 10 Mining Locations in India
        </h2>
        <p className="text-primary-100 text-sm mt-1">
          Interactive map showing major mining operations with real-time weather conditions
        </p>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
            <span className="text-sm text-gray-600">Loading weather data...</span>
          </div>
        )}

        <MapContainer
          center={[20.5937, 78.9629]} // Center of India
          zoom={5}
          style={{ height: '600px', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {topMineLocations.map((mine) => (
            <MineMarker
              key={mine.id}
              mine={mine}
              weather={weatherData[mine.id] || null}
              onMarkerClick={handleMarkerClick}
            />
          ))}
          {/* Draw escape path if dangerMine is set */}
          {dangerMine && (() => {
            const mine = topMineLocations.find(m => m.name === dangerMine);
            if (!mine) return null;
            return (
              <Polyline
                positions={[mine.coordinates, SAFE_LOCATION]}
                pathOptions={{ color: 'lime', weight: 6, dashArray: '10,10' }}
              />
            );
          })()}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Risk Level Legend</h4>
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-600 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">High Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-600 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">Medium Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">Low Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MineLocationsMap;