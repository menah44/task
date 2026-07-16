import apiClient from "@/lib/api/client";

export const boundaryApi = {
  // جلب البيانات (GET)
  getBoundary: (formId: string) =>
    apiClient.get<GeoJSON.FeatureCollection>(`/spatial/forms/${formId}/boundary`),

  // حفظ البيانات (PUT)
  saveBoundary: (formId: string, data: GeoJSON.FeatureCollection) =>
    apiClient.put(`/forms/${formId}/boundary`, data),

  // التحقق من الموقع
  validateGeofence: (formId: number, latitude: number, longitude: number) =>
    apiClient.post<{
      inside: boolean;
      status?: string;
      distance?: number;
      validationMode?: string;
      allowedRadius?: number;
      graceRadius?: number | null;
      location?: { lat: number; lng: number; address?: string };
    }>(`/spatial/geofence/validate`, { formId, latitude, longitude }),
};
