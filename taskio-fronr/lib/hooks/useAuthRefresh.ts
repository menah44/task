"use client";

import { useEffect } from "react";
import axios from "axios";
import { useAuthStore, parseJwt } from "@/lib/auth-store";

// قراءة الـ URL بتاع الباكيند من ملف البيئة أو الـ المضافة افتراضياً
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export function useAuthRefresh() {
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const checkAndRefresh = async () => {
      // 1. نجيب الـ Access Token الحالي من الـ localStorage
      const accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!accessToken) return;

      // 2. نفك تشفير التوكن عشان نقرأ منه وقت الانتهاء (exp)
      const payload = parseJwt(accessToken);
      if (!payload || !payload.exp) return;

      // 3. نحسب الوقت الحالي والوقت المتبقي بالثواني
      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeft = payload.exp - currentTime;

      // 4. تلبية للشرط: لو متبقي 60 ثانية أو أقل على انتهاء الصلاحية، نفذ الـ Silent Refresh فوراً
      if (timeLeft <= 60) {
        try {
          const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
          if (!refreshToken) return;

          // نضرب على الـ Endpoint المطلوبة (POST /auth/refresh)
          const res = await axios.post(`${baseURL}/auth/refresh`, {
            refreshToken,
          });

          // 5. لو التجديد تم بنجاح، نخزن التوكنز الجديدة
          if (res.status === 200) {
            const { accessToken: newAccess, refreshToken: newRefresh } = res.data;
            
            if (typeof window !== "undefined") {
              localStorage.setItem("accessToken", newAccess);
              if (newRefresh) {
                localStorage.setItem("refreshToken", newRefresh);
              }
            }
            console.log(
              "🔄 تم تجديد الـ JWT تلقائياً بنجاح قبل 60 ثانية من انتهائه."
            );
          }
        } catch (error) {
          // لو الـ Refresh Token كمان منتهي أو فيه مشكلة، بنخرجه فوراً لصفحة اللوجين
          console.error(
            "❌ فشل التجديد التلقائي، جاري تنظيف الجلسة والتحويل للـ login...",
            error
          );
          logout();
        }
      }
    };

    // تشغيل الفحص فوراً عند فتح التطبيق / عمل mount
    checkAndRefresh();

    // تشغيل تايمر يفحص التوكن تلقائياً كل 15 ثانية في الخلفية
    const interval = setInterval(checkAndRefresh, 15000);

    // تنظيف التايمر عند الـ unmount
    return () => clearInterval(interval);
  }, [logout]);
}
