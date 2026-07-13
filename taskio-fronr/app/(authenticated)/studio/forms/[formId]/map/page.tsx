"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import maplibregl, { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import type { Feature, Polygon } from "geojson";
import apiClient from "@/lib/api/client";
import BuilderTopNav from "@/components/builder/BuilderTopNav";
import {
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Ruler,
  Map as MapIconLucide,
  Satellite,
  MapPin,
} from "lucide-react";

type Basemap = "streets" | "satellite";

// ============================================================
// Basemap style definitions
// ============================================================
const STREETS_STYLE_URL = "https://demotiles.maplibre.org/style.json";

// Esri World Imagery
const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "esri-satellite": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [
    {
      id: "esri-satellite-layer",
      type: "raster",
      source: "esri-satellite",
    },
  ],
};

export default function FormBoundaryMapPage() {
  const params = useParams<{ formId: string }>();
  const formId = params?.formId;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [basemap, setBasemap] = useState<Basemap>("satellite");
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [radiusMeters, setRadiusMeters] = useState<number>(100);
  const [areaKm2, setAreaKm2] = useState<number>(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoadingBoundary, setIsLoadingBoundary] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Keep a ref to the latest radius for fast access in drag events without stale closures
  const radiusMetersRef = useRef(radiusMeters);
  useEffect(() => {
    radiusMetersRef.current = radiusMeters;
  }, [radiusMeters]);

  // Generate GeoJSON circle
  const getCircleFeature = useCallback(
    (c: [number, number], r: number) => {
      return turf.circle(c, r, { steps: 64, units: "meters" });
    },
    []
  );

  // Recompute area based on radius
  const recomputeArea = useCallback((r: number) => {
    // Area of a circle = pi * r^2
    const totalSqMeters = Math.PI * Math.pow(r, 2);
    setAreaKm2(totalSqMeters / 1_000_000);
  }, []);

  // Update Map UI with marker and circle
  const updateMapUI = useCallback(
    (c: [number, number] | null, r: number) => {
      const map = mapRef.current;
      if (!map) return;

      if (c) {
        if (!markerRef.current) {
          markerRef.current = new maplibregl.Marker({ draggable: true })
            .setLngLat(c)
            .addTo(map);

          markerRef.current.on("drag", () => {
            const lngLat = markerRef.current!.getLngLat();
            // Instant circle preview update without React re-rendering
            if (map.isStyleLoaded()) {
              const source = map.getSource("radius-circle") as maplibregl.GeoJSONSource;
              if (source) {
                source.setData(getCircleFeature([lngLat.lng, lngLat.lat], radiusMetersRef.current));
              }
            }
          });

          markerRef.current.on("dragend", () => {
            const lngLat = markerRef.current!.getLngLat();
            setCenter([lngLat.lng, lngLat.lat]);
            setIsDirty(true);
          });
        } else {
          markerRef.current.setLngLat(c);
        }

        const circle = getCircleFeature(c, r);

        if (map.isStyleLoaded()) {
          const source = map.getSource("radius-circle") as maplibregl.GeoJSONSource;
          if (source) {
            source.setData(circle);
          } else {
            map.addSource("radius-circle", {
              type: "geojson",
              data: circle,
            });
            map.addLayer({
              id: "radius-circle-fill",
              type: "fill",
              source: "radius-circle",
              paint: {
                "fill-color": "#3b82f6",
                "fill-opacity": 0.2,
              },
            });
            map.addLayer({
              id: "radius-circle-outline",
              type: "line",
              source: "radius-circle",
              paint: {
                "line-color": "#3b82f6",
                "line-width": 2,
              },
            });
          }
        }
      } else {
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
        if (map.isStyleLoaded()) {
          const source = map.getSource("radius-circle") as maplibregl.GeoJSONSource;
          if (source) {
            source.setData(turf.featureCollection([]));
          }
        }
      }
    },
    [getCircleFeature]
  );

  // Sync state to Map UI
  useEffect(() => {
    if (isMapReady) {
      updateMapUI(center, radiusMeters);
      recomputeArea(radiusMeters);
    }
  }, [center, radiusMeters, isMapReady, updateMapUI, recomputeArea]);

  // Handle map click
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    const onClick = (e: maplibregl.MapMouseEvent) => {
      setCenter([e.lngLat.lng, e.lngLat.lat]);
      setIsDirty(true);
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [isMapReady]);

  // Reverse Geocoding
  useEffect(() => {
    if (!center) {
      setAddress(null);
      return;
    }

    const [lng, lat] = center;
    setIsGeocoding(true);

    const fetchAddress = async () => {
      try {
        const res = await apiClient.get(`/spatial/reverse-geocode?lat=${lat}&lng=${lng}`);
        
        if (res.data && res.data.address) {
          setAddress(res.data.address);
        } else {
          setAddress(null);
        }
      } catch (err) {
        console.error("Geocoding error:", err);
        setAddress(null);
      } finally {
        setIsGeocoding(false);
      }
    };

    // Debounce to prevent spamming while dragging
    const timeout = setTimeout(fetchAddress, 600);
    return () => clearTimeout(timeout);
  }, [center]);

  // Initialize the map canvas
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: SATELLITE_STYLE,
      center: [31.2357, 30.0444],
      zoom: 5,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on("load", () => {
      mapRef.current = map;
      setIsMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Toggle basemap
  const handleToggleBasemap = () => {
    const map = mapRef.current;
    if (!map) return;

    const nextBasemap: Basemap =
      basemap === "satellite" ? "streets" : "satellite";

    map.once("styledata", () => {
      updateMapUI(center, radiusMeters);
    });

    map.setStyle(
      nextBasemap === "satellite" ? SATELLITE_STYLE : STREETS_STYLE_URL
    );
    setBasemap(nextBasemap);
  };

  // Load boundary
  useEffect(() => {
    if (!isMapReady || !formId) return;

    const loadBoundary = async () => {
      setIsLoadingBoundary(true);
      setError(null);

      try {
        const response = await apiClient.get(`/spatial/forms/${formId}/boundary`);
        const geojson = response.data?.geojson || response.data || null;

        if (geojson?.features?.length) {
          const feature = geojson.features[0] as Feature<Polygon>;
          const centerPoint = turf.centroid(feature);
          const c = centerPoint.geometry.coordinates as [number, number];
          
          let r = 100;
          if (feature.geometry.coordinates[0]?.length) {
            const firstCoord = feature.geometry.coordinates[0][0];
            r = turf.distance(centerPoint, turf.point(firstCoord), { units: "meters" });
          }

          setCenter(c);
          setRadiusMeters(Math.round(r));
          setIsDirty(false);

          mapRef.current?.flyTo({ center: c, zoom: 14, duration: 0 });
        }
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number } };
        if (axiosError.response?.status !== 404) {
          console.error("Failed to load form boundary:", err);
          setError("Couldn't load the saved boundary. You can still set a new one.");
        }
      } finally {
        setIsLoadingBoundary(false);
      }
    };

    loadBoundary();
  }, [isMapReady, formId]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        const newCenter: [number, number] = [longitude, latitude];
        setCenter(newCenter);
        setIsDirty(true);
        mapRef.current?.flyTo({ center: newCenter, zoom: 14, duration: 1500 });
      },
      (geoError) => {
        setIsLocating(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError("Location permission denied. Please allow location access in your browser.");
            break;
          case geoError.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case geoError.TIMEOUT:
            setError("The request to get user location timed out.");
            break;
          default:
            setError("An unknown error occurred while requesting location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleClear = () => {
    setCenter(null);
    setAreaKm2(0);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!center || !formId) return;

    setIsSaving(true);
    setError(null);

    try {
      const circleFeature = getCircleFeature(center, radiusMeters);
      const featureCollection = {
        type: "FeatureCollection",
        features: [circleFeature],
      };

      await apiClient.put(`/forms/${formId}/boundary`, {
        geojson: featureCollection,
        areaKm2: Number(areaKm2.toFixed(4)),
      });

      setIsDirty(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (err: unknown) {
      console.error("Failed to save form boundary:", err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError.response?.data?.message ||
          "Couldn't save the boundary. Try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <BuilderTopNav
        formId={formId as string}
        subtitle={`Form ID: ${formId} — ${center ? `${areaKm2.toFixed(3)} km² covered` : "no boundary set"}`}
        actions={
          <>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-primary text-sm font-medium rounded-lg">
              <Ruler className="w-4 h-4" />
              {center ? `${areaKm2.toFixed(3)} km²` : "0 km²"}
            </div>
            <button
              onClick={handleSave}
              disabled={!center || !isDirty || isSaving}
              className="px-4 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : savedFlash ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Boundary
                </>
              )}
            </button>
          </>
        }
      />

      {error && (
        <div className="px-6 py-2 bg-warning/15 border-b border-warning/20 text-warning text-xs flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </span>
          <button onClick={() => setError(null)} className="hover:text-foreground">
            ✕
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-background border-b border-border shrink-0">
        
        {center && (
          <div className="flex flex-col gap-3 p-3 bg-card border border-border rounded-lg shadow-sm min-w-[280px]">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-muted-foreground">Radius (meters)</label>
              <input
                type="number"
                min="50"
                max="5000"
                step="10"
                value={radiusMeters}
                onChange={(e) => {
                  let val = Number(e.target.value);
                  if (val > 5000) val = 5000;
                  if (val < 50) val = 50;
                  setRadiusMeters(val);
                  setIsDirty(true);
                }}
                className="bg-background border border-border rounded px-2 py-1 text-sm w-24 text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-right"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="5000"
                step="10"
                value={radiusMeters}
                onChange={(e) => {
                  setRadiusMeters(Number(e.target.value));
                  setIsDirty(true);
                }}
                className="flex-1 accent-primary cursor-pointer"
              />
              <span className="text-sm font-medium text-muted-foreground w-12 text-right shrink-0">
                {radiusMeters} m
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={isLocating || !isMapReady}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground bg-card border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
          Use Current Location
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={!center}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-error bg-card border border-border hover:bg-error/15 hover:border-error/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Trash2 className="w-4 h-4" /> Clear
        </button>

        <div className="w-px h-5 bg-accent mx-1" />

        <button
          type="button"
          onClick={handleToggleBasemap}
          disabled={!isMapReady}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground bg-card border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {basemap === "satellite" ? (
            <MapIconLucide className="w-4 h-4" />
          ) : (
            <Satellite className="w-4 h-4" />
          )}
          {basemap === "satellite" ? "Switch to Streets" : "Switch to Satellite"}
        </button>

        <p className="text-xs text-muted-foreground ml-2">
          Click anywhere on the map to place the center marker, then adjust the radius.
        </p>
      </div>

      {/* Map canvas */}
      <div className="relative flex-1 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full" />

        {(isLoadingBoundary || !isMapReady) && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                {isMapReady ? "Loading saved boundary..." : "Loading map..."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Address Display */}
      {center && (
        <div className="bg-card border-t border-border p-5 flex items-start gap-4 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-10">
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl shrink-0 mt-0.5">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1">
            {isGeocoding ? (
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> Resolving address...
              </p>
            ) : address ? (
              <>
                <p className="text-sm font-bold text-foreground">
                  {address.split(',')[0]}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {address.split(',').slice(1).join(',').trim()}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-foreground">
                {center[1].toFixed(6)}, {center[0].toFixed(6)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
