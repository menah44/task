import axios from "axios";
import { useAuthStore } from "@/lib/auth-store";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

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
    // Get latest token from the Zustand store
    const token = useAuthStore.getState().accessToken || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized check for automatic token refresh retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const store = useAuthStore.getState();
        
        // Trigger token refresh through the store to ensure state sync
        await store.refreshAccessToken();
        
        const newAccessToken = useAuthStore.getState().accessToken;

        if (newAccessToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (err) {
        console.error("Token refresh via interceptor failed:", err);
        return Promise.reject(err);
      }
    }

    // 403 Forbidden check
    if (error.response?.status === 403) {
      showToast("غير مسموح لك بالوصول إلى هذا الجزء.");
    } else if (error.response?.status === 500) {
      showToast("خطأ في الخادم الداخلي.");
    }

    return Promise.reject(error);
  },
);

export default apiClient;
