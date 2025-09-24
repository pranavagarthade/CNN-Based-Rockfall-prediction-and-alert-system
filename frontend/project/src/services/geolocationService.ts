import { UserLocation } from '../types';

export class GeolocationService {
  private watchId: number | null = null;
  private callbacks: ((location: UserLocation) => void)[] = [];
  private lastKnownLocation: UserLocation | null = null;

  constructor() {
    this.checkGeolocationSupport();
  }

  private checkGeolocationSupport(): boolean {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return false;
    }
    return true;
  }

  public startTracking(callback: (location: UserLocation) => void): void {
    if (!this.checkGeolocationSupport()) return;

    this.callbacks.push(callback);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000 // 5 seconds
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        this.lastKnownLocation = userLocation;
        this.notifyCallbacks(userLocation);
      },
      (error) => {
        console.error('Error getting initial position:', error);
        this.handleGeolocationError(error);
      },
      options
    );

    // Start continuous tracking
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const userLocation: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        this.lastKnownLocation = userLocation;
        this.notifyCallbacks(userLocation);
      },
      (error) => {
        console.error('Error watching position:', error);
        this.handleGeolocationError(error);
      },
      options
    );
  }

  public stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.callbacks = [];
  }

  public getLastKnownLocation(): UserLocation | null {
    return this.lastKnownLocation;
  }

  private notifyCallbacks(location: UserLocation): void {
    this.callbacks.forEach(callback => callback(location));
  }

  private handleGeolocationError(error: GeolocationPositionError): void {
    let message = 'Unknown geolocation error';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out';
        break;
    }
    
    console.error('Geolocation error:', message);
    // You could emit this error to the UI here
  }
}

export const geolocationService = new GeolocationService();