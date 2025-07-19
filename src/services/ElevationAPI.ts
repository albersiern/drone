import { ElevationService, ElevationDataType } from '../services/ElevationService';
import { getMapSource } from './mapProviders';
import { MapProvider } from '../../fleet/types';
// Note: elevationUtils is currently empty, using inline interpolation
 
// Interpolate elevation at a specific point
function interpolateElevation(
  elevations: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number
): number {
  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const x2 = Math.min(x1 + 1, width - 1);
  const y2 = Math.min(y1 + 1, height - 1);
 
  const fx = x - x1;
  const fy = y - y1;
 
  const e11 = elevations[y1 * width + x1];
  const e12 = elevations[y1 * width + x2];
  const e21 = elevations[y2 * width + x1];
  const e22 = elevations[y2 * width + x2];
 
  // Bilinear interpolation
  const e1 = e11 * (1 - fx) + e12 * fx;
  const e2 = e21 * (1 - fx) + e22 * fx;
 
  return e1 * (1 - fy) + e2 * fy;
}
 
export interface ElevationPoint {
  longitude: number;
  latitude: number;
  elevation: number;
  accuracy: 'high' | 'medium' | 'low';
}
 
export interface ElevationQuery {
  coordinates: [number, number][]; // [longitude, latitude] pairs
  provider?: MapProvider;
  dataType?: ElevationDataType;
}
 
export interface ElevationAPIResponse {
  points: ElevationPoint[];
  provider: MapProvider;
  dataType: ElevationDataType;
  resolution: number; // meters per pixel
  timestamp: number;
}
 
export class ElevationAPI {
  private elevationService: ElevationService;
  private tileCache: Map<string, ImageData> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
 
  constructor() {
    this.elevationService = new ElevationService();
  }
 
  /**
   * Get elevation data for specific coordinates
   */
  async getElevationForPoints(query: ElevationQuery): Promise<ElevationAPIResponse> {
    const provider = query.provider || 'osm';
    const dataType = query.dataType || 'terrain-rgb';
 
    const points: ElevationPoint[] = [];
 
    for (const [longitude, latitude] of query.coordinates) {
      const elevationData = await this.getElevationAtCoordinate(longitude, latitude, provider, dataType);
      points.push({
        longitude,
        latitude,
        elevation: elevationData.elevation,
        accuracy: elevationData.accuracy
      });
    }
 
    return {
      points,
      provider,
      dataType,
      resolution: this.getResolutionForZoom(14), // Default zoom level resolution
      timestamp: Date.now()
    };
  }
 
  /**
   * Get elevation at a single coordinate
   */
  async getElevationAtCoordinate(
    longitude: number, 
    latitude: number, 
    provider: MapProvider = 'osm',
    dataType: ElevationDataType = 'terrain-rgb'
  ): Promise<{ elevation: number; accuracy: 'high' | 'medium' | 'low' }> {
    try {
      // Try tile-based approach first (more reliable)
      const zoom = 14;
      const tileCoords = this.lonLatToTile(longitude, latitude, zoom);
 
      try {
        // Get tile data
        const tileData = await this.getTileElevationData(tileCoords.x, tileCoords.y, zoom, provider, dataType);
 
        if (tileData) {
          // Convert lon/lat to pixel coordinates within the tile
          const pixelCoords = this.lonLatToPixel(longitude, latitude, tileCoords.x, tileCoords.y, zoom);
 
          // Extract elevation data from tile
          const elevations = this.elevationService.decodeElevationData(tileData, dataType);
 
          // Interpolate elevation at the exact pixel coordinate
          const interpolatedElevation = interpolateElevation(
            elevations,
            256, // Standard tile size
            256,
            pixelCoords.x,
            pixelCoords.y
          );
 
          return {
            elevation: Math.round(interpolatedElevation * 10) / 10, // Round to 1 decimal place
            accuracy: zoom >= 14 ? 'high' : zoom >= 12 ? 'medium' : 'low'
          };
        }
      } catch (tileError) {
        console.debug('Tile-based elevation failed, trying API:', tileError);
      }
 
      // Fallback to API approach
      const apiElevation = await this.getElevationFromAPI(latitude, longitude);
      if (apiElevation !== null) {
        return { elevation: apiElevation, accuracy: 'medium' };
      }
 
      // If all else fails, return a reasonable default
      return { elevation: 0, accuracy: 'low' };
    } catch (error) {
      console.error('Error getting elevation at coordinate:', error);
      return { elevation: 0, accuracy: 'low' };
    }
  }
 
  /**
   * Get elevation profile along a path
   */
  async getElevationProfile(
    path: [number, number][], 
    sampleDistance: number = 10, // meters between samples
    provider: MapProvider = 'osm'
  ): Promise<ElevationPoint[]> {
    const profile: ElevationPoint[] = [];
 
    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];
 
      // Calculate number of samples based on distance
      const distance = this.haversineDistance(start[1], start[0], end[1], end[0]);
      const samples = Math.ceil(distance / sampleDistance);
 
      for (let j = 0; j <= samples; j++) {
        const ratio = j / samples;
        const interpolatedLon = start[0] + (end[0] - start[0]) * ratio;
        const interpolatedLat = start[1] + (end[1] - start[1]) * ratio;
 
        const pointElevationData = await this.getElevationAtCoordinate(
          interpolatedLon, 
          interpolatedLat, 
          provider
        );
 
        profile.push({
          longitude: interpolatedLon,
          latitude: interpolatedLat,
          elevation: pointElevationData.elevation,
          accuracy: pointElevationData.accuracy
        });
      }
    }
 
    return profile;
  }
 
  /**
   * Get terrain analysis for an area
   */
  async getTerrainAnalysis(
    bounds: [number, number, number, number], // [minLon, minLat, maxLon, maxLat]
    provider: MapProvider = 'osm'
  ): Promise<{
    minElevation: number;
    maxElevation: number;
    averageElevation: number;
    averageSlope: number;
    roughnessIndex: number;
  }> {
    // Sample grid points within bounds
    const gridSize = 10;
    const lonStep = (bounds[2] - bounds[0]) / gridSize;
    const latStep = (bounds[3] - bounds[1]) / gridSize;
 
    const elevations: number[] = [];
    const slopes: number[] = [];
 
    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const lon = bounds[0] + i * lonStep;
        const lat = bounds[1] + j * latStep;
 
        const currentElevationData = await this.getElevationAtCoordinate(lon, lat, provider);
        elevations.push(currentElevationData.elevation);
 
        // Calculate slope if we have adjacent points
        if (i > 0 && j > 0) {
          const prevLon = bounds[0] + (i - 1) * lonStep;
          const prevLat = bounds[1] + (j - 1) * latStep;
          const prevElevationData = await this.getElevationAtCoordinate(prevLon, prevLat, provider);
 
          const horizontalDistance = this.haversineDistance(lat, lon, prevLat, prevLon);
          const verticalDistance = Math.abs(currentElevationData.elevation - prevElevationData.elevation);
          const slope = Math.atan(verticalDistance / horizontalDistance) * (180 / Math.PI);
          slopes.push(slope);
        }
      }
    }
 
    const minElevation = Math.min(...elevations);
    const maxElevation = Math.max(...elevations);
    const averageElevation = elevations.reduce((sum, e) => sum + e, 0) / elevations.length;
    const averageSlope = slopes.reduce((sum, s) => sum + s, 0) / slopes.length;
 
    // Roughness index - standard deviation of elevations
    const variance = elevations.reduce((sum, e) => sum + Math.pow(e - averageElevation, 2), 0) / elevations.length;
    const roughnessIndex = Math.sqrt(variance);
 
    return {
      minElevation: Math.round(minElevation * 10) / 10,
      maxElevation: Math.round(maxElevation * 10) / 10,
      averageElevation: Math.round(averageElevation * 10) / 10,
      averageSlope: Math.round(averageSlope * 10) / 10,
      roughnessIndex: Math.round(roughnessIndex * 10) / 10
    };
  }
 
  async getTileElevationData(
    x: number, 
    y: number, 
    z: number, 
    provider: MapProvider,
    dataType: ElevationDataType
  ): Promise<ImageData | null> {
    const cacheKey = `${provider}-${dataType}-${z}-${x}-${y}`;
 
    // Check cache
    if (this.tileCache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey);
      if (expiry && expiry > Date.now()) {
        return this.tileCache.get(cacheKey)!;
      }
    }
 
    try {
      const source = getMapSource(provider, 'elevation');
      if (!source) return null;
 
      // Get tile URL (this would need to be implemented based on source type)
      const url = this.buildTileUrl(provider, x, y, z);
 
      // Load image and extract ImageData
      const imageData = await this.loadTileImage(url);
 
      // Cache the result
      this.tileCache.set(cacheKey, imageData);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
 
      return imageData;
    } catch (error) {
      console.error('Error loading tile elevation data:', error);
      return null;
    }
  }
 
  private buildTileUrl(provider: MapProvider, x: number, y: number, z: number): string {
    switch (provider) {
      case 'mapbox':
        const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
        if (mapboxToken) {
          return `https://api.mapbox.com/v4/mapbox.terrain-rgb/${z}/${x}/${y}.png?access_token=${mapboxToken}`;
        }
        // Fall through to default if no token
      case 'osm':
      case 'yandex':
      case 'google':
      default:
        // Use multiple fallback sources
        const sources = [
          `https://elevation-tiles-prod.s3.amazonaws.com/terrarium/${z}/${x}/${y}.png`,
          `https://cloud.maptiler.com/tiles/terrain-rgb/${z}/${x}/${y}.png?key=get_your_own_OpIi9ZULNHzrESv6T2vL`,
          `https://tile.nextzen.org/tilezen/terrain/v1/terrarium/${z}/${x}/${y}.png?api_key=your_key_here`
        ];
        // Return the first available source (for now just the first one)
        return sources[0];
    }
  }
 
  private async loadTileImage(url: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
 
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
 
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        resolve(imageData);
      };
 
      img.onerror = () => reject(new Error(`Failed to load tile: ${url}`));
      img.src = url;
    });
  }
 
  lonLatToTile(lon: number, lat: number, zoom: number): { x: number; y: number } {
    const latRad = lat * Math.PI / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180) / 360 * n);
    const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
 
    return { x, y };
  }
 
  private lonLatToPixel(
    lon: number, 
    lat: number, 
    tileX: number, 
    tileY: number, 
    zoom: number
  ): { x: number; y: number } {
    const n = Math.pow(2, zoom);
    const latRad = lat * Math.PI / 180;
 
    const worldX = (lon + 180) / 360 * n;
    const worldY = (1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n;
 
    const pixelX = (worldX - tileX) * 256;
    const pixelY = (worldY - tileY) * 256;
 
    return { 
      x: Math.max(0, Math.min(255, pixelX)), 
      y: Math.max(0, Math.min(255, pixelY)) 
    };
  }
 
  private getResolutionForZoom(zoom: number): number {
    // Approximate resolution in meters per pixel at equator
    const earthCircumference = 40075017; // meters
    return earthCircumference / (256 * Math.pow(2, zoom));
  }
 
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
 
  private async getElevationFromAPI(lat: number, lon: number): Promise<number | null> {
    try {
      // Try multiple elevation services
      const services = [
        // Use CORS-enabled elevation service
        `https://elevation-api.io/api/elevation?points=${lat},${lon}`,
        // Fallback to another service
        `https://api.opentopodata.org/v1/aster30m?locations=${lat},${lon}&interpolation=bilinear`,
      ];
 
      for (const serviceUrl of services) {
        try {
          const response = await fetch(serviceUrl);
 
          if (!response.ok) {
            continue; // Try next service
          }
 
          const data = await response.json();
 
          // Handle different response formats
          if (serviceUrl.includes('elevation-api.io')) {
            if (data.elevations && data.elevations.length > 0) {
              return data.elevations[0].elevation;
            }
          } else if (serviceUrl.includes('opentopodata.org')) {
            if (data.results && data.results.length > 0) {
              return data.results[0].elevation;
            }
          }
        } catch (serviceError) {
          console.debug(`Service ${serviceUrl} failed:`, serviceError);
          continue;
        }
      }
 
      return null;
    } catch (error) {
      console.warn('All elevation APIs failed:', error);
      return null;
    }
  }
}
 
// Singleton instance
export const elevationAPI = new ElevationAPI();
 
// Export types
export type { ElevationDataType } from '../services/ElevationService';