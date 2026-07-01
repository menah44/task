import axios from "axios";
import { useAuthStore } from "@/lib/auth-store";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
console.log("BASE URL =", baseURL);
function showToast(message: string) {
  if (typeof window !== "undefined") {
    alert(message);
  }
}

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get latest token from the Zustand store or localStorage
    const token = useAuthStore.getState().accessToken || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

    console.log(`[Axios Outgoing Request] URL: ${config.url} | Token Present: ${!!token}`);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[Axios Success Response] URL: ${response.config.url} | Status: ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const responseStatus = error.response?.status;
    const requestUrl = originalRequest?.url || "";

    console.log(`[Axios Error Response] URL: ${requestUrl} | Status: ${responseStatus}`);

    // Prevent token refresh request itself or login request from retrying (prevents infinite loops)
    const isAuthEndpoint = requestUrl.includes("/auth/refresh") || requestUrl.includes("/auth/login");

    // 401 Unauthorized check for automatic token refresh retry
    if (responseStatus === 401 && !isAuthEndpoint && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log(`[Axios Interceptor] Initiating silent token refresh for URL: ${requestUrl}`);

      try {
        const store = useAuthStore.getState();
        
        // Trigger token refresh through the store to ensure state sync
        await store.refreshAccessToken();
        
        const newAccessToken = useAuthStore.getState().accessToken;

        if (newAccessToken) {
          console.log(`[Axios Interceptor] Token refreshed successfully. Retrying request for URL: ${requestUrl}`);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (err) {
        console.error("[Axios Interceptor] Token refresh via interceptor failed:", err);
        return Promise.reject(err);
      }
    }

    // 403 Forbidden check & 500 Internal error check (Translate to English)
    if (responseStatus === 403) {
      showToast("Access forbidden. You do not have permissions for this resource.");
    } else if (responseStatus === 500) {
      showToast("Internal server error occurred. Please contact support.");
    }

    return Promise.reject(error);
  },
);

export default apiClient;
