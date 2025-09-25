import React, { useState, useCallback } from 'react';
import { topMineLocations } from '../data/mineLocations';
import { User } from '../types';
import RiskAssessmentForm from './RiskAssessmentForm';
import ChartsPanel from './ChartsPanel';
import RecentAssessmentsTable from './RecentAssessmentsTable';
import DangerOverlay from './DangerOverlay';
import MineLocationsMap from './MineLocationsMap';
import { 
  AlertTriangle, 
  Activity, 
  Shield, 
  BarChart3, 
  FileText, 
  Clock, 
  Users, 
  MapPin,
  Bell,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  RefreshCw
} from 'lucide-react';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [showDanger, setShowDanger] = useState(false);
  const [dangerMine, setDangerMine] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [selectedMine, setSelectedMine] = useState<string>(topMineLocations[0]?.name || '');

  // Handler for the new button
  const triggerDanger = useCallback((mineName: string) => {
    setDangerMine(mineName);
    setShowDanger(true);
    setSendStatus(null);
  }, []);

  // After overlay closes, send Twilio alert
  const handleOverlayFinish = useCallback(async () => {
    setShowDanger(false);
    setSending(true);
    setSendStatus(null);
    try {
      const res = await fetch('http://localhost:8000/emergency-alert', { method: 'POST' });
      if (res.ok) {
        setSendStatus('Emergency alert sent to all numbers!');
      } else {
        setSendStatus('Failed to send emergency alert.');
      }
    } catch {
      setSendStatus('Network error sending alert.');
    }
    setSending(false);
  }, []);

  const currentTime = new Date().toLocaleString();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Danger Overlay */}
      {showDanger && dangerMine && (
        <DangerOverlay mineName={dangerMine} onFinish={handleOverlayFinish} />
      )}
      
      {/* Header Section */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Government Mining Safety Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Mining Safety Authority • Real-time Monitoring System
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-xs text-gray-500">{currentTime}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Emergency Alert Section */}
      <section className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Emergency Alert System
                  </h2>
                  <p className="text-sm text-gray-600">
                    Immediate notification system for critical safety situations
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Bell className="h-4 w-4" />
                <span>Alert Status: Ready</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Mine Location
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  value={selectedMine}
                  onChange={e => setSelectedMine(e.target.value)}
                  disabled={showDanger || sending}
                >
                  {topMineLocations.map(mine => (
                    <option key={mine.id} value={mine.name}>
                      {mine.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Action
                </label>
                <button
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => triggerDanger(selectedMine)}
                  disabled={showDanger || sending}
                >
                  {sending ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      <span>Sending Alert...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      <span>Trigger Emergency Alert</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Status Messages */}
            {sendStatus && (
              <div className={`mt-4 p-4 rounded-lg flex items-center space-x-2 ${
                sendStatus.includes('sent') 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {sendStatus.includes('sent') ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">{sendStatus}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Quick Stats Cards */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      System Overview Statistics
                    </h3>
                    <p className="text-sm text-gray-600">
                      Real-time monitoring metrics across all mining operations
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Activity className="h-4 w-4" />
                  <span>Live Data</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Sites</p>
                      <p className="text-2xl font-bold text-gray-900">24</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">High Risk Sites</p>
                      <p className="text-2xl font-bold text-red-600">3</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Assessments Today</p>
                      <p className="text-2xl font-bold text-green-600">12</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Personnel Online</p>
                      <p className="text-2xl font-bold text-blue-600">47</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Risk Assessment Section */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Risk Assessment Center
                    </h3>
                    <p className="text-sm text-gray-600">
                      Comprehensive site safety evaluation and monitoring tools
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Settings className="h-4 w-4" />
                  <span>Active Form</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <RiskAssessmentForm />
            </div>
          </div>
        </section>

        {/* Analytics Dashboard Section */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Live Analytics Dashboard
                    </h3>
                    <p className="text-sm text-white/80">
                      Real-time safety metrics • Advanced monitoring & insights
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-white/90 font-medium">LIVE</span>
                  </div>
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors cursor-pointer">
                    <RefreshCw className="h-4 w-4 text-white animate-spin" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-gray-50/50 to-white">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* Real-time Metrics Cards */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Safety Score</h4>
                  <div className="text-3xl font-bold text-green-600 mb-1">87.2%</div>
                  <p className="text-sm text-gray-600">↗ +2.1% from yesterday</p>
                  <div className="mt-3 bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full" style={{width: '87.2%'}}></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Active Alerts</h4>
                  <div className="text-3xl font-bold text-orange-600 mb-1">7</div>
                  <p className="text-sm text-gray-600">↘ -3 from last hour</p>
                  <div className="mt-3 flex space-x-1">
                    <div className="h-2 bg-red-400 rounded w-2"></div>
                    <div className="h-2 bg-red-400 rounded w-2"></div>
                    <div className="h-2 bg-yellow-400 rounded w-2"></div>
                    <div className="h-2 bg-yellow-400 rounded w-2"></div>
                    <div className="h-2 bg-yellow-400 rounded w-2"></div>
                    <div className="h-2 bg-green-400 rounded w-2"></div>
                    <div className="h-2 bg-green-400 rounded w-2"></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">System Load</h4>
                  <div className="text-3xl font-bold text-blue-600 mb-1">73%</div>
                  <p className="text-sm text-gray-600">Normal operational range</p>
                  <div className="mt-3 bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{width: '73%'}}></div>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h5 className="text-lg font-semibold text-gray-900">Analytics Charts</h5>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Live Data</span>
                  </div>
                </div>
                <div className="w-full">
                  <ChartsPanel />
                </div>
              </div>

              {/* Real-time Status Bar */}
              <div className="mt-6 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">System Status: Operational</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Last Update: {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span>Monitoring: 24 Sites</span>
                    <span>•</span>
                    <span>Data Points: 1,247</span>
                    <span>•</span>
                    <span>Uptime: 99.8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full Width Sections */}
        <div className="space-y-8">
          
          {/* Recent Assessments Table */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <FileText className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Recent Safety Assessments
                    </h3>
                    <p className="text-sm text-gray-600">
                      Latest safety evaluations and inspection reports
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Updated 2 min ago</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <RecentAssessmentsTable />
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Government Mining Safety Authority
                </p>
                <p className="text-xs text-gray-600">
                  Official monitoring and risk assessment system
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-gray-500">
                Classification: Government Use Only
              </p>
              <p className="text-xs text-gray-500">
                Last system update: {currentTime}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;