import axios from "axios";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "react-hot-toast";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Expires": "0",
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get latest token exclusively from the Zustand store
    const token = useAuthStore.getState().accessToken;

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
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const responseStatus = error.response?.status;
    const requestUrl = originalRequest?.url || "";

    // Prevent token refresh request itself, login, or logout from retrying (prevents infinite loops)
    const isAuthEndpoint = requestUrl.includes("/auth/refresh") || requestUrl.includes("/auth/login") || requestUrl.includes("/auth/logout");

    // 401 Unauthorized check for automatic token refresh retry
    if (responseStatus === 401 && !isAuthEndpoint && !originalRequest._retry) {
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
        return Promise.reject(err);
      }
    }

    // 403 Forbidden check & 500 Internal error check with toast notifications
    if (responseStatus === 403) {
      toast.error("Access denied");
    } else if (responseStatus === 500) {
      toast.error("Server error");
    }

    return Promise.reject(error);
  },
);

export default apiClient;
