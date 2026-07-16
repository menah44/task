/**
 * Calculates the Haversine distance between two coordinates in meters.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks if a point [lng, lat] is inside a GeoJSON Polygon coordinates array.
 * Jordan Curve Theorem / Ray-Casting algorithm.
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: number[][][],
): boolean {
  const x = point[0]; // longitude
  const y = point[1]; // latitude

  const exteriorRing = polygon[0];
  if (!isPointInRing(x, y, exteriorRing)) {
    return false;
  }

  // Check if point falls inside any interior holes
  for (let i = 1; i < polygon.length; i++) {
    if (isPointInRing(x, y, polygon[i])) {
      return false;
    }
  }

  return true;
}

function isPointInRing(x: number, y: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Unified geofence validation.
 * Extracts polygon coordinates from various boundary structures and validates if a point is inside.
 * Supports: FeatureCollection, Feature, Polygon, and { geojson, areaKm2 } wrapper.
 */
export function isPointInBoundary(point: [number, number], boundaryObj: any): boolean {
  if (!boundaryObj) return false;

  const geojson = boundaryObj.geojson ?? boundaryObj;
  
  if (
    geojson.type === 'FeatureCollection' &&
    Array.isArray(geojson.features) &&
    geojson.features.length > 0
  ) {
    for (const feature of geojson.features) {
      if (feature.geometry?.type === 'Polygon') {
        if (isPointInPolygon(point, feature.geometry.coordinates)) return true;
      } else if (feature.geometry?.type === 'MultiPolygon') {
        for (const polygon of feature.geometry.coordinates) {
          if (isPointInPolygon(point, polygon)) return true;
        }
      }
    }
    return false;
  }
  
  if (
    geojson.type === 'Feature' &&
    geojson.geometry &&
    geojson.geometry.type === 'Polygon'
  ) {
    return isPointInPolygon(point, geojson.geometry.coordinates);
  }
  
  if (geojson.type === 'Polygon') {
    return isPointInPolygon(point, geojson.coordinates);
  }
  
  return false;
}

/**
 * Validates whether the GeoJSON input is a structurally sound Polygon.
 */
export function validateGeoJsonPolygon(polygon: any): boolean {
  if (!polygon || typeof polygon !== 'object') return false;
  if (polygon.type !== 'Polygon') return false;
  if (!Array.isArray(polygon.coordinates)) return false;
  if (polygon.coordinates.length === 0) return false;

  const exterior = polygon.coordinates[0];
  if (!Array.isArray(exterior) || exterior.length < 4) return false;

  const first = exterior[0];
  const last = exterior[exterior.length - 1];
  if (
    !Array.isArray(first) ||
    !Array.isArray(last) ||
    first.length < 2 ||
    last.length < 2
  )
    return false;
  if (first[0] !== last[0] || first[1] !== last[1]) return false;

  return true;
}
