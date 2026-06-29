import axios from "axios";

// خطوة 4: تحديد الـ Base URL من الـ env
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// خطوة 6: الـ Token Store (الافتراضي localStorage)
export const tokenStore = {
  getAccessToken: () => localStorage.getItem("accessToken"),
  getRefreshToken: () => localStorage.getItem("refreshToken"),
  setTokens(access: string, refresh: string) {
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
  },
  clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};

// خطوة 5: دالة إظهار الـ Toast
function showToast(message: string) {
  alert(message); // سيظهر رسالة تنبيه عادية في المتصفح عند حدوث خطأ 403 أو 500
}

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// خطوة 2: الـ Request Interceptor لربط التوكن تلقائياً
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStore.getAccessToken();
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// خطوة 3: الـ Response Interceptor للـ Refresh والـ Toasts
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 -> Silent Refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = tokenStore.getRefreshToken();

        // ✨ التعديل هنا: غيرنا المسار لـ /user/refresh عشان يطابق الباكيند الحالي
        const res = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });

        if (res.status === 200) {
          const { accessToken, refreshToken: newRefresh } = res.data;
          tokenStore.setTokens(accessToken, newRefresh);
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        tokenStore.clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // خطوة 3: إظهار التوست حسب نوع الخطأ
    if (error.response?.status === 403) {
      showToast("Access denied");
    } else if (error.response?.status === 500) {
      showToast("Server error");
    }

    return Promise.reject(error);
  },
);

export default apiClient;
