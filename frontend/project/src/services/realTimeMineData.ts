import { MineLocation, EmergencyAlert, DangerZone } from '../types';

export class RealTimeMineDataService {
  private websocket: WebSocket | null = null;
  private callbacks: {
    onMineUpdate?: (mine: MineLocation) => void;
    onEmergencyAlert?: (alert: EmergencyAlert) => void;
    onDangerZoneUpdate?: (zone: DangerZone) => void;
  } = {};

  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    // In a real implementation, this would connect to your WebSocket server
    // For demo purposes, we'll simulate real-time updates
    this.simulateRealTimeUpdates();
  }

  private simulateRealTimeUpdates(): void {
    // Simulate real-time mine data updates every 30 seconds
    setInterval(() => {
      this.generateMockMineUpdate();
    }, 30000);

    // Simulate emergency alerts occasionally
    setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every minute
        this.generateMockEmergencyAlert();
      }
    }, 60000);
  }

  private generateMockMineUpdate(): void {
    if (!this.callbacks.onMineUpdate) return;

    const mockMine: MineLocation = {
      id: 'jharia-coal',
      name: 'Jharia Coalfield',
      coordinates: [23.7400, 86.4000],
      type: 'Coal',
      state: 'Jharkhand',
      production: '35 MT/year',
      operationalStatus: 'Active',
      riskLevel: 'High',
      lastUpdated: new Date().toISOString(),
      realTimeData: {
        gasLevels: Math.random() * 100,
        temperature: 45 + Math.random() * 20,
        seismicActivity: Math.random() * 10,
        airQuality: 50 + Math.random() * 50,
        emergencyStatus: Math.random() > 0.9 ? 'Alert' : 'Normal'
      }
    };

    this.callbacks.onMineUpdate(mockMine);
  }

  private generateMockEmergencyAlert(): void {
    if (!this.callbacks.onEmergencyAlert) return;

    const alertTypes: EmergencyAlert['type'][] = ['Fire', 'Gas Leak', 'Landslide', 'Explosion', 'Evacuation'];
    const severities: EmergencyAlert['severity'][] = ['Critical', 'High', 'Medium'];

    const alert: EmergencyAlert = {
      id: `alert-${Date.now()}`,
      type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
      location: [23.7400 + (Math.random() - 0.5) * 0.1, 86.4000 + (Math.random() - 0.5) * 0.1],
      radius: 1000 + Math.random() * 2000,
      severity: severities[Math.floor(Math.random() * severities.length)],
      message: 'Emergency situation detected. Immediate evacuation recommended.',
      timestamp: Date.now(),
      isActive: true
    };

    this.callbacks.onEmergencyAlert(alert);
  }

  public subscribe(callbacks: {
    onMineUpdate?: (mine: MineLocation) => void;
    onEmergencyAlert?: (alert: EmergencyAlert) => void;
    onDangerZoneUpdate?: (zone: DangerZone) => void;
  }): void {
    this.callbacks = callbacks;
  }

  public unsubscribe(): void {
    this.callbacks = {};
    if (this.websocket) {
      this.websocket.close();
    }
  }

  // Simulate fetching live mine data from API
  public async fetchLiveMineData(mineId: string): Promise<MineLocation | null> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock live data
      return {
        id: mineId,
        name: 'Live Mine Data',
        coordinates: [23.7400, 86.4000],
        type: 'Coal',
        state: 'Jharkhand',
        production: '35 MT/year',
        operationalStatus: 'Active',
        riskLevel: 'High',
        lastUpdated: new Date().toISOString(),
        realTimeData: {
          gasLevels: Math.random() * 100,
          temperature: 45 + Math.random() * 20,
          seismicActivity: Math.random() * 10,
          airQuality: 50 + Math.random() * 50,
          emergencyStatus: Math.random() > 0.8 ? 'Alert' : 'Normal'
        }
      };
    } catch (error) {
      console.error('Error fetching live mine data:', error);
      return null;
    }
  }
}

export const realTimeMineDataService = new RealTimeMineDataService();