"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Settings2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationSettingsProps {
  location?: LocationData;
  allowedRadius?: number;
  graceRadius?: number;
  validationMode?: "STRICT" | "ALLOW_NEARBY" | "DIRECTIONS";
  requireLiveLocationOnSubmit?: boolean;
  requireHighAccuracy?: boolean;
  onChange: (updates: Partial<LocationSettingsProps>) => void;
}

export default function LocationSettings({
  location,
  allowedRadius = 100,
  graceRadius = 200,
  validationMode = "STRICT",
  requireLiveLocationOnSubmit = false,
  requireHighAccuracy = false,
  onChange,
}: LocationSettingsProps) {
  const { t } = useTranslation();
  const params = useParams<{ formId: string }>();

  // Determine if location is actually set
  const hasLocation = Boolean(location?.lat && location?.lng);

  return (
    <div className="space-y-6">
      {!hasLocation ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center shadow-sm">
          <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No location has been configured yet.</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
            This form does not currently have a geographic restriction.
          </p>
          <Link
            href={`/studio/forms/${params?.formId}/map`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Configure on Map
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {t("formSettings.selectedLocation", "Selected Location")}
            </h3>
            <Link
              href={`/studio/forms/${params?.formId}/map`}
              className="text-sm text-primary hover:underline font-medium"
            >
              {t("formSettings.editOnMap", "Edit on Map")}
            </Link>
          </div>
          <div className="p-6 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">{t("formSettings.locationName", "Location Name")}</p>
              <p className="font-medium text-foreground">{location?.address || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">{t("formSettings.coordinates", "Coordinates")}</p>
              <p className="font-medium text-foreground" dir="ltr">
                {location?.lat.toFixed(6)}, {location?.lng.toFixed(6)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">{t("formSettings.allowedRadius", "Allowed Radius")}</p>
              <p className="font-medium text-foreground">{allowedRadius} m</p>
            </div>
          </div>
        </div>
      )}

      {hasLocation && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-4 text-foreground font-medium border-b border-border pb-2">
            <Settings2 className="w-4 h-4" />
            Validation Settings
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              {t("formSettings.validationMode", "Validation Mode")}
            </label>
            <select
              value={validationMode}
              onChange={(e) => onChange({ validationMode: e.target.value as any })}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="STRICT">{t("formSettings.modeStrict", "Strict (Block immediately)")}</option>
              <option value="ALLOW_NEARBY">{t("formSettings.modeNearby", "Allow Nearby (Warn user)")}</option>
              <option value="DIRECTIONS">{t("formSettings.modeDirections", "Directions Mode (Block with maps link)")}</option>
            </select>
          </div>

          {validationMode === "ALLOW_NEARBY" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                {t("formSettings.graceRadius", "Grace Radius (meters)")}
              </label>
              <input
                type="number"
                min={allowedRadius + 1}
                value={graceRadius}
                onChange={(e) => onChange({ graceRadius: parseInt(e.target.value) || graceRadius })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {t("formSettings.graceRadiusHint", "Must be larger than the allowed radius.")}
              </p>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-border">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={requireHighAccuracy}
                onChange={(e) => onChange({ requireHighAccuracy: e.target.checked })}
                className="w-4 h-4 rounded border-input text-primary focus:ring-ring"
              />
              <span className="text-sm font-medium text-foreground">
                {t("formSettings.requireHighAccuracy", "Require High Accuracy")}
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={requireLiveLocationOnSubmit}
                onChange={(e) => onChange({ requireLiveLocationOnSubmit: e.target.checked })}
                className="w-4 h-4 rounded border-input text-primary focus:ring-ring"
              />
              <span className="text-sm font-medium text-foreground">
                {t("formSettings.requireLiveLocationOnSubmit", "Require Live Location On Submit")}
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
