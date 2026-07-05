import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1",
  headers: { "Content-Type": "application/json" },
});

export const boundaryApi = {
  // جلب البيانات (GET)
  getBoundary: (formId: string) =>
    apiClient.get<GeoJSON.FeatureCollection>(`/forms/${formId}/boundary`),

  // حفظ البيانات (PUT)
  saveBoundary: (formId: string, data: GeoJSON.FeatureCollection) =>
    apiClient.put(`/forms/${formId}/boundary`, data),
};
