"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Play, HelpCircle, Lock, MapPinOff, CheckCircle } from "lucide-react";
import apiClient from "@/lib/api/client";
import { boundaryApi } from "@/services/boundaryApi";
import SkeletonCard from "@/components/SkeletonCard";
import { hasQuestions } from "@/lib/utils";

interface FormItem {
  id: number;
  title: string;
  description?: string;
  status: string;
  updatedAt: string;
  settings?: any;
  _locationStatus?: 'available' | 'out_of_bounds' | 'location_denied' | 'not_required';
}

export default function UserFormsPage() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                  // Validate using backend API
                  console.log("[Available Forms] Validation started for form", form.id);
                  console.log("[Available Forms] Browser coords:", coords.lat, coords.lng);
                  console.log("[Available Forms] API payload:", { formId: form.id, latitude: coords.lat, longitude: coords.lng });
                  
                  const res = await boundaryApi.validateGeofence(form.id, coords.lat, coords.lng);
                  
                  console.log("[Available Forms] API response:", res.data);
                  console.log("[Available Forms] Validation result (inside?):", res.data.inside);
                  
                  formItem._locationStatus = res.data.inside ? 'available' : 'out_of_bounds';
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
        setError("Could not load your organization's forms. Please try again later.");
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
    <main className="space-y-8 text-foreground" dir="ltr">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <ClipboardList className="w-8 h-8 text-primary" />
          Available Forms
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select an active form below to submit responses for your organization.
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
          <h3 className="text-xl font-bold text-foreground mb-2">Error Loading Forms</h3>
          <p className="text-muted-foreground max-w-md text-sm">{error}</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 bg-card rounded-3xl border border-border">
          <div className="p-4 bg-primary/10 rounded-full border border-primary/25 mb-4">
            <ClipboardList className="w-12 h-12 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Active Forms</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            There are currently no published forms available for your organization.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forms.map((form) => {
            const isAvailable = form._locationStatus === 'available' || form._locationStatus === 'not_required';
            const isDenied = form._locationStatus === 'location_denied';
            const isOutOfBounds = form._locationStatus === 'out_of_bounds';

            return (
              <div
                key={form.id}
                className={`border rounded-2xl p-6 transition-all flex flex-col justify-between ${
                  isAvailable 
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
                        <CheckCircle className="w-3.5 h-3.5" /> Available
                      </span>
                    )}
                    {isOutOfBounds && (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-warning/10 text-warning border border-warning/20">
                        <MapPinOff className="w-3.5 h-3.5" /> Out of Location
                      </span>
                    )}
                    {isDenied && (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error/10 text-error border border-error/20">
                        <Lock className="w-3.5 h-3.5" /> Location Required
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {form.description || "No description provided for this form."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Updated: {new Date(form.updatedAt).toLocaleDateString()}
                  </span>
                  {isAvailable ? (
                    <Link
                      href={`/studio/forms/${form.id}/fill`}
                      className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Fill Form
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 bg-muted/80 text-muted-foreground cursor-not-allowed shadow-sm text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 border border-border"
                    >
                      <Lock className="w-3.5 h-3.5" /> Locked
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
