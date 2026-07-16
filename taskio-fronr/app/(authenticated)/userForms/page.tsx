"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Play, HelpCircle, Lock, MapPinOff, CheckCircle } from "lucide-react";
import apiClient from "@/lib/api/client";
import { boundaryApi } from "@/services/boundaryApi";
import SkeletonCard from "@/components/SkeletonCard";
import { hasQuestions } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { format as formatDateFns } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface FormItem {
  id: number;
  title: string;
  description?: string;
  status: string;
  updatedAt: string;
  settings?: any;
  _locationStatus?: 'available' | 'nearby' | 'blocked_directions' | 'out_of_bounds' | 'blocked' | 'accuracy_low' | 'location_denied' | 'not_required';
  _locationPayload?: any;
}

export default function UserFormsPage() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    let isMounted = true;

    const fetchFormsAndLocation = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Request GPS location wrapped in a Promise
        const getGps = (): Promise<{ lat: number; lng: number } | null> => {
          return new Promise((resolve) => {
            if (!navigator.geolocation) {
              resolve(null);
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              () => resolve(null), // User denied or error
              { enableHighAccuracy: true, timeout: 10000 }
            );
          });
        };

        // 2. Fetch forms and GPS in parallel
        const [formsRes, submissionsRes, coords] = await Promise.all([
          apiClient.get("/forms", { params: { status: "published" } }),
          apiClient.get("/responses/my-submissions"),
          getGps()
        ]);

        if (!isMounted) return;

        const items = formsRes.data.items || [];
        const submittedFormIds = new Set(submissionsRes.data.map((s: any) => s.formId));

        // Filter valid forms that have questions and haven't been submitted
        const availableForms = items.filter((form: any) => 
          hasQuestions(form) && !submittedFormIds.has(form.id)
        );

        // 3. Determine availability based on location settings
        const processedForms: FormItem[] = await Promise.all(
          availableForms.map(async (form: any) => {
            const formItem: FormItem = {
              id: form.id,
              title: form.title,
              description: form.description,
              status: form.status,
              updatedAt: form.updatedAt,
              settings: form.settings,
              _locationStatus: 'not_required'
            };

            const restrictByLocation = form.settings?.restrictByLocation;

            if (restrictByLocation) {
              if (!coords) {
                formItem._locationStatus = 'location_denied';
              } else {
                try {
                  console.log(`\n===== [UserForms] Form ${form.id} location check =====`);
                  console.log(`[UserForms] Form settings:`, JSON.stringify(form.settings, null, 2));
                  console.log(`[UserForms] User coords: lat=${coords.lat}, lng=${coords.lng}`);
                  
                  const res = await boundaryApi.validateGeofence(form.id, coords.lat, coords.lng);
                  
                  console.log(`[UserForms] Raw API response:`, res.data);
                  console.log(`[UserForms] status field:`, res.data.status);
                  console.log(`[UserForms] distance:`, res.data.distance, 'm');
                  console.log(`[UserForms] inside:`, res.data.inside);
                  console.log(`[UserForms] validationMode:`, res.data.validationMode);
                  console.log(`[UserForms] allowedRadius:`, res.data.allowedRadius);
                  console.log(`[UserForms] graceRadius:`, res.data.graceRadius);

                  const rawStatus = res.data.status;
                  const mappedStatus = rawStatus?.toLowerCase() || (res.data.inside ? 'available' : 'out_of_bounds');
                  console.log(`[UserForms] Mapped _locationStatus: "${mappedStatus}"`);
                  console.log(`=================================================\n`);
                  
                  formItem._locationStatus = mappedStatus as any;
                  formItem._locationPayload = res.data;
                } catch (err) {
                  console.error("Boundary validation error for form", form.id, err);
                  formItem._locationStatus = 'out_of_bounds';
                }
              }
            } else {
              formItem._locationStatus = 'available'; // Default available
            }

            return formItem;
          })
        );

        if (!isMounted) return;
        setForms(processedForms);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to fetch user forms:", err);
        setError(t("userForms.errorLoadingDesc"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFormsAndLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="space-y-8 text-foreground">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <ClipboardList className="w-8 h-8 text-primary" />
          {t("userForms.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("userForms.subtitle")}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 4].map((item) => (
            <SkeletonCard key={item} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 bg-card rounded-3xl border border-error/20">
          <div className="p-4 bg-error/15 rounded-full border border-red-500/25 mb-4">
            <HelpCircle className="w-12 h-12 text-error" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{t("userForms.errorLoading")}</h3>
          <p className="text-muted-foreground max-w-md text-sm">{error}</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 bg-card rounded-3xl border border-border">
          <div className="p-4 bg-primary/10 rounded-full border border-primary/25 mb-4">
            <ClipboardList className="w-12 h-12 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{t("userForms.noForms")}</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            {t("userForms.noFormsDesc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forms.map((form) => {
            const isAvailable = form._locationStatus === 'available' || form._locationStatus === 'not_required';
            const isNearby = form._locationStatus === 'nearby';
            const isDirections = form._locationStatus === 'blocked_directions';
            const isDenied = form._locationStatus === 'location_denied';
            const isOutOfBounds = form._locationStatus === 'out_of_bounds' || form._locationStatus === 'blocked' || form._locationStatus === 'accuracy_low';
            
            const isCardActive = isAvailable || isNearby || isDirections;
            
            let mapsUrl = "";
            if (isDirections && form._locationPayload?.location) {
              const { lat, lng } = form._locationPayload.location;
              mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
            }

            return (
              <div
                key={form.id}
                className={`border rounded-2xl p-6 transition-all flex flex-col justify-between ${
                  isCardActive 
                    ? "border-border hover:border-primary/50 hover:bg-muted bg-card shadow-sm hover:shadow-md" 
                    : "border-border/50 bg-muted/30 opacity-90 shadow-none"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <h3 className="font-bold text-xl text-foreground tracking-tight line-clamp-2">
                      {form.title}
                    </h3>
                    {/* Badges */}
                    {isAvailable && form.settings?.restrictByLocation && (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success/10 text-success border border-success/20">
                        <CheckCircle className="w-3.5 h-3.5" /> {t("userForms.available")}
                      </span>
                    )}
                    {isNearby && (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-warning/10 text-warning border border-warning/20">
                        <CheckCircle className="w-3.5 h-3.5" /> Nearby Access
                      </span>
                    )}
                    {isDirections && (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        <MapPinOff className="w-3.5 h-3.5" /> Directions Required
                      </span>
                    )}
                    {isOutOfBounds && (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error/10 text-error border border-error/20">
                        <MapPinOff className="w-3.5 h-3.5" /> {t("userForms.outOfLocation")}
                      </span>
                    )}
                    {isDenied && (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error/10 text-error border border-error/20">
                        <Lock className="w-3.5 h-3.5" /> {t("userForms.locationRequired")}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {form.description || t("userForms.noDescription")}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {t("userForms.updated")}: {formatDateFns(new Date(form.updatedAt), "PPP", { locale: i18n.language === "ar" ? ar : enUS })}
                  </span>
                  {(isAvailable || isNearby) ? (
                    <Link
                      href={`/studio/forms/${form.id}/fill`}
                      className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> {t("userForms.fillForm")}
                    </Link>
                  ) : isDirections ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 shadow-sm text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <MapPinOff className="w-3.5 h-3.5" /> Get Directions
                    </a>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 bg-muted/80 text-muted-foreground cursor-not-allowed shadow-sm text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 border border-border"
                    >
                      <Lock className="w-3.5 h-3.5" /> {t("userForms.locked")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
