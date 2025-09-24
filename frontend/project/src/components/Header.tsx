
import React, { useState } from 'react';
import { AlertTriangle, User as UserIcon, LogOut, Map } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, currentPage, onNavigate }) => {
  const [alertStatus, setAlertStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmergencyAlert = async () => {
    setLoading(true);
    setAlertStatus(null);
    try {
      const response = await fetch('http://localhost:8000/emergency-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setAlertStatus('Emergency alert sent successfully!');
      } else {
        const data = await response.json();
        setAlertStatus(data.detail || 'Failed to send alert.');
      }
    } catch (err) {
      setAlertStatus('Network error. Could not send alert.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full p-2">
                <img 
                  src="/ministry-logo.png" 
                  alt="Ministry of Mines India" 
                  className="h-8 w-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <Map className="h-6 w-6 text-white hidden" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">GeoGuardians</h1>
                <p className="text-xs text-gray-600">Ministry of Mines, India</p>
              </div>
            </div>

            


            {/* Navigation Links */}
            <nav className="flex items-center space-x-4 ml-8">
              <button
                className={`text-sm font-semibold px-3 py-1 rounded ${currentPage === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => onNavigate('dashboard')}
              >
                Dashboard
              </button>
              <button
                className={`text-sm font-semibold px-3 py-1 rounded ${currentPage === 'maps' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => onNavigate('maps')}
              >
                Mine Locations
              </button>
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Red Alert Button */}
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200 pulse-animation disabled:opacity-60"
              onClick={handleEmergencyAlert}
              disabled={loading}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:block">{loading ? 'Sending...' : 'Emergency Alert'}</span>
            </button>
            {alertStatus && (
              <span className="ml-2 text-sm text-red-700 font-semibold">{alertStatus}</span>
            )}

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                <UserIcon className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900 hidden sm:block">
                  {user.name}
                </span>
              </div>
              
              <button
                onClick={onLogout}
                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors duration-200 group"
                title="Logout"
              >
                <LogOut className="h-4 w-4 text-gray-600 group-hover:text-gray-800" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;