import apiClient from "@/lib/api/client";

export const spatialApi = {
  // Validate if a point is inside geofence boundary (POST)
  validateGeofence: (formId: number, latitude: number, longitude: number) =>
    apiClient.post<{ inside: boolean }>("/spatial/geofence/validate", {
      formId,
      latitude,
      longitude,
    }),

  // Get cached form boundary (GET)
  getBoundary: (formId: string) =>
    apiClient.get<any>(`/spatial/forms/${formId}/boundary`),

  // Check if a polygon contains a point (POST)
  contains: (polygon: any, point: { latitude: number; longitude: number }) =>
    apiClient.post<{ inside: boolean }>("/spatial/contains", {
      polygon,
      point,
    }),

  // Find nearby response locations within radius (POST)
  nearby: (latitude: number, longitude: number, radiusMeters: number) =>
    apiClient.post<any[]>("/spatial/nearby", {
      latitude,
      longitude,
      radiusMeters,
    }),
};
