import React, { useState, useCallback } from 'react';
import { topMineLocations } from '../data/mineLocations';
import { User } from '../types';
import RiskAssessmentForm from './RiskAssessmentForm';
import ChartsPanel from './ChartsPanel';
import RecentAssessmentsTable from './RecentAssessmentsTable';
import DangerOverlay from './DangerOverlay';
import MineLocationsMap from './MineLocationsMap';


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

  return (
    <>
      {showDanger && dangerMine && (
        <DangerOverlay mineName={dangerMine} onFinish={handleOverlayFinish} />
      )}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-end mb-4 gap-2">
          <select
            className="border rounded px-2 py-1 mr-2"
            value={selectedMine}
            onChange={e => setSelectedMine(e.target.value)}
            disabled={showDanger || sending}
          >
            {topMineLocations.map(mine => (
              <option key={mine.id} value={mine.name}>{mine.name}</option>
            ))}
          </select>
          <button
            className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-semibold"
            onClick={() => triggerDanger(selectedMine)}
            disabled={showDanger || sending}
          >
            Trigger Rockfall Alert
          </button>
          {sending && <span className="ml-2 text-red-700 font-bold">Sending alert...</span>}
          {sendStatus && <span className="ml-2 text-green-700 font-bold">{sendStatus}</span>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Panel - Risk Assessment Form */}
          <div className="space-y-6">
            <RiskAssessmentForm />
          </div>

          {/* Right Panel - Data Visualization */}
          <div className="space-y-6">
            <ChartsPanel />
          </div>
        </div>

        {/* Bottom Section - Recent Assessments */}
        <div className="mt-8">
          <RecentAssessmentsTable />
        </div>
      </main>
    </>
  );
};

export default Dashboard;