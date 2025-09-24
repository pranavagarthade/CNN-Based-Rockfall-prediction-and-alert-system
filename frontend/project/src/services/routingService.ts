import { UserLocation, SafeRoute, DangerZone, MineLocation } from '../types';

export class RoutingService {
  private dangerZones: DangerZone[] = [];
  private mineLocations: MineLocation[] = [];

  constructor(dangerZones: DangerZone[], mineLocations: MineLocation[]) {
    this.dangerZones = dangerZones;
    this.mineLocations = mineLocations;
  }

  public async calculateSafeRoute(
    start: UserLocation,
    destination: [number, number],
    avoidanceRadius: number = 2000 // meters
  ): Promise<SafeRoute[]> {
    try {
      // Get multiple route options from routing service
      const routes = await this.getRouteOptions(start, destination);
      
      // Analyze each route for safety
      const safeRoutes = routes.map(route => this.analyzRouteSafety(route, avoidanceRadius));
      
      // Sort by safety score (higher is safer)
      return safeRoutes.sort((a, b) => b.safetyScore - a.safetyScore);
    } catch (error) {
      console.error('Error calculating safe route:', error);
      return [];
    }
  }

  private async getRouteOptions(
    start: UserLocation,
    destination: [number, number]
  ): Promise<any[]> {
    // In a real implementation, you would use a routing service like:
    // - OpenRouteService
    // - Mapbox Directions API
    // - Google Directions API
    
    // For now, we'll simulate multiple route options
    return [
      {
        id: 'route-1',
        coordinates: this.generateRouteCoordinates(start, destination, 'direct'),
        distance: this.calculateDistance([start.lat, start.lng], destination),
        estimatedTime: 30
      },
      {
        id: 'route-2',
        coordinates: this.generateRouteCoordinates(start, destination, 'scenic'),
        distance: this.calculateDistance([start.lat, start.lng], destination) * 1.2,
        estimatedTime: 40
      },
      {
        id: 'route-3',
        coordinates: this.generateRouteCoordinates(start, destination, 'highway'),
        distance: this.calculateDistance([start.lat, start.lng], destination) * 1.1,
        estimatedTime: 25
      }
    ];
  }

  private generateRouteCoordinates(
    start: UserLocation,
    destination: [number, number],
    type: 'direct' | 'scenic' | 'highway'
  ): [number, number][] {
    const startCoord: [number, number] = [start.lat, start.lng];
    const coords: [number, number][] = [startCoord];
    
    // Generate intermediate points based on route type
    const steps = 5;
    for (let i = 1; i < steps; i++) {
      const progress = i / steps;
      let lat = startCoord[0] + (destination[0] - startCoord[0]) * progress;
      let lng = startCoord[1] + (destination[1] - startCoord[1]) * progress;
      
      // Add variation based on route type
      if (type === 'scenic') {
        lat += (Math.random() - 0.5) * 0.01;
        lng += (Math.random() - 0.5) * 0.01;
      } else if (type === 'highway') {
        // Simulate highway route (straighter)
        lat += (Math.random() - 0.5) * 0.005;
        lng += (Math.random() - 0.5) * 0.005;
      }
      
      coords.push([lat, lng]);
    }
    
    coords.push(destination);
    return coords;
  }

  private analyzRouteSafety(route: any, avoidanceRadius: number): SafeRoute {
    let safetyScore = 100;
    const avoidedHazards: string[] = [];
    const instructions: string[] = [];

    // Check proximity to danger zones
    route.coordinates.forEach((coord: [number, number]) => {
      this.dangerZones.forEach(zone => {
        const distance = this.calculateDistance(coord, zone.coordinates[0]);
        
        if (distance < avoidanceRadius) {
          const penalty = this.getRiskPenalty(zone.riskLevel, distance, avoidanceRadius);
          safetyScore -= penalty;
          
          if (!avoidedHazards.includes(zone.type)) {
            avoidedHazards.push(zone.type);
            instructions.push(`Avoiding ${zone.type} at ${zone.name}`);
          }
        }
      });

      // Check proximity to high-risk mines
      this.mineLocations.forEach(mine => {
        if (mine.riskLevel === 'High') {
          const distance = this.calculateDistance(coord, mine.coordinates);
          
          if (distance < avoidanceRadius / 2) {
            safetyScore -= 15;
            if (!avoidedHazards.includes('High-risk mine')) {
              avoidedHazards.push('High-risk mine');
              instructions.push(`Avoiding high-risk mine: ${mine.name}`);
            }
          }
        }
      });
    });

    return {
      id: route.id,
      name: `Safe Route ${route.id.split('-')[1]}`,
      coordinates: route.coordinates,
      distance: route.distance,
      estimatedTime: route.estimatedTime,
      safetyScore: Math.max(0, safetyScore),
      avoidedHazards,
      instructions
    };
  }

  private getRiskPenalty(riskLevel: string, distance: number, maxDistance: number): number {
    const proximityFactor = 1 - (distance / maxDistance);
    
    switch (riskLevel) {
      case 'Critical': return 50 * proximityFactor;
      case 'High': return 30 * proximityFactor;
      case 'Medium': return 15 * proximityFactor;
      default: return 5 * proximityFactor;
    }
  }

  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1[0] * Math.PI / 180;
    const φ2 = coord2[0] * Math.PI / 180;
    const Δφ = (coord2[0] - coord1[0]) * Math.PI / 180;
    const Δλ = (coord2[1] - coord1[1]) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  public findNearestSafeZone(userLocation: UserLocation): [number, number] | null {
    let nearestSafeZone: [number, number] | null = null;
    let minDistance = Infinity;

    // Define some safe zones (in a real app, these would come from a database)
    const safeZones: [number, number][] = [
      [28.6139, 77.2090], // Delhi
      [19.0760, 72.8777], // Mumbai
      [13.0827, 80.2707], // Chennai
      [22.5726, 88.3639], // Kolkata
      [12.9716, 77.5946], // Bangalore
    ];

    safeZones.forEach(zone => {
      const distance = this.calculateDistance([userLocation.lat, userLocation.lng], zone);
      if (distance < minDistance) {
        minDistance = distance;
        nearestSafeZone = zone;
      }
    });

    return nearestSafeZone;
  }
}