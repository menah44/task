"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import maplibregl, { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  TerraDraw,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import area from "@turf/area";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import apiClient from "@/lib/api/client";
import BuilderTopNav from "@/components/builder/BuilderTopNav";
import {
  PenLine,
  MousePointer2,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Ruler,
  Map as MapIconLucide,
  Satellite,
} from "lucide-react";

type DrawMode = "polygon" | "select" | "static";
type Basemap = "streets" | "satellite";

// ============================================================
// Basemap style definitions
// ============================================================
const STREETS_STYLE_URL = "https://demotiles.maplibre.org/style.json";

// Esri World Imagery — free, no API key required, real satellite/aerial photography
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
  const drawRef = useRef<TerraDraw | null>(null);

  const [basemap, setBasemap] = useState<Basemap>("satellite");
  const [activeMode, setActiveMode] = useState<DrawMode>("static");
  const [areaKm2, setAreaKm2] = useState<number>(0);
  const [hasPolygon, setHasPolygon] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSwitchingBasemap, setIsSwitchingBasemap] = useState(false);
  const [isLoadingBoundary, setIsLoadingBoundary] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // ============================================================
  // Recompute the displayed area from the current draw snapshot
  // ============================================================
  const recomputeArea = useCallback(() => {
    const draw = drawRef.current;
    if (!draw) return;

    const snapshot = draw.getSnapshot() as Feature<Polygon>[];
    const polygons = snapshot.filter((f) => f.geometry?.type === "Polygon");

    if (polygons.length === 0) {
      setAreaKm2(0);
      setHasPolygon(false);
      return;
    }

    const totalSqMeters = polygons.reduce(
      (sum, feature) => sum + area(feature),
      0,
    );
    setAreaKm2(totalSqMeters / 1_000_000);
    setHasPolygon(true);
  }, []);

  // ============================================================
  // Build a fresh TerraDraw instance bound to the current map/style
  // and restore any previously drawn features into it
  // ============================================================
  const attachDraw = useCallback(
    (map: maplibregl.Map, restoreFeatures?: Feature[]) => {
      const draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [
          new TerraDrawPolygonMode(),
          new TerraDrawSelectMode({
            flags: {
              polygon: {
                feature: {
                  draggable: true,
                  coordinates: {
                    midpoints: true,
                    draggable: true,
                    deletable: true,
                  },
                },
              },
            },
          }),
        ],
      });

      draw.start();

      draw.on("finish", () => {
        recomputeArea();
        setIsDirty(true);
        draw.setMode("select");
        setActiveMode("select");
      });

      draw.on("change", () => {
        recomputeArea();
        setIsDirty(true);
      });

      drawRef.current = draw;

      if (restoreFeatures?.length) {
        draw.addFeatures(
          restoreFeatures as unknown as Parameters<typeof draw.addFeatures>[0],
        );
        draw.setMode("select");
        setActiveMode("select");
      } else {
        draw.setMode("static");
        setActiveMode("static");
      }

      recomputeArea();
    },
    [recomputeArea],
  );

  // ============================================================
  // Initialize the map canvas (starts on satellite imagery by default)
  // ============================================================
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: SATELLITE_STYLE,
      center: [31.2357, 30.0444], // default center, replaced by fitBounds once a boundary loads
      zoom: 5,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on("load", () => {
      attachDraw(map);
      mapRef.current = map;
      setIsMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // Toggle between the satellite imagery basemap and the vector
  // streets basemap, preserving any drawn polygon across the switch
  // ============================================================
  const handleToggleBasemap = () => {
    const map = mapRef.current;
    if (!map || isSwitchingBasemap) return;

    const nextBasemap: Basemap =
      basemap === "satellite" ? "streets" : "satellite";
    const snapshot = (drawRef.current?.getSnapshot() as Feature[]) ?? [];

    setIsSwitchingBasemap(true);
    drawRef.current = null;

    map.once("styledata", () => {
      attachDraw(map, snapshot);
      setIsSwitchingBasemap(false);
    });

    map.setStyle(
      nextBasemap === "satellite" ? SATELLITE_STYLE : STREETS_STYLE_URL,
    );
    setBasemap(nextBasemap);
  };

  // ============================================================
  // Load the previously saved boundary (GeoJSON) once ready
  // ============================================================
  useEffect(() => {
    if (!isMapReady || !formId) return;

    const loadBoundary = async () => {
      setIsLoadingBoundary(true);
      setError(null);

      try {
        const response = await apiClient.get(`/spatial/forms/${formId}/boundary`);
        const geojson: FeatureCollection | null =
          response.data?.geojson || response.data || null;

        if (geojson?.features?.length && drawRef.current && mapRef.current) {
          drawRef.current.addFeatures(
            geojson.features.map((feature) => ({
              ...feature,
              properties: { ...feature.properties, mode: "polygon" },
            })) as unknown as Parameters<typeof drawRef.current.addFeatures>[0],
          );

          recomputeArea();
          setIsDirty(false);
          drawRef.current.setMode("select");
          setActiveMode("select");

          const bounds = new maplibregl.LngLatBounds();
          geojson.features.forEach((feature) => {
            if (feature.geometry.type === "Polygon") {
              feature.geometry.coordinates[0].forEach((coord) => {
                bounds.extend(coord as [number, number]);
              });
            }
          });
          if (!bounds.isEmpty()) {
            mapRef.current.fitBounds(bounds, {
              padding: 60,
              maxZoom: 14,
              duration: 0,
            });
          }
        }
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number } };
        // No boundary saved yet is expected on first visit — not a real error
        if (axiosError.response?.status !== 404) {
          console.error("Failed to load form boundary:", err);
          setError(
            "Couldn't load the saved boundary. You can still draw a new one.",
          );
        }
      } finally {
        setIsLoadingBoundary(false);
      }
    };

    loadBoundary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapReady, formId]);

  const handleSetMode = (mode: DrawMode) => {
    if (!drawRef.current) return;
    drawRef.current.setMode(mode);
    setActiveMode(mode);
  };

  const handleClear = () => {
    if (!drawRef.current) return;
    drawRef.current.clear();
    drawRef.current.setMode("static");
    setActiveMode("static");
    setAreaKm2(0);
    setHasPolygon(false);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!drawRef.current || !hasPolygon || !formId) return;

    setIsSaving(true);
    setError(null);

    try {
      const snapshot = drawRef.current.getSnapshot() as Feature<Polygon>[];
      const featureCollection: FeatureCollection = {
        type: "FeatureCollection",
        features: snapshot.map((feature) => ({
          type: "Feature",
          geometry: feature.geometry,
          properties: {},
        })),
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
          "Couldn't save the boundary. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      <BuilderTopNav
        formId={formId}
        subtitle={`Form ID: ${formId} — ${hasPolygon ? `${areaKm2.toFixed(3)} km² covered` : "no boundary set"}`}
        actions={
          <>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-lg">
              <Ruler className="w-4 h-4" />
              {hasPolygon ? `${areaKm2.toFixed(3)} km²` : "0 km²"}
            </div>
            <button
              onClick={handleSave}
              disabled={!hasPolygon || !isDirty || isSaving}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5">
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

      {/* Warning / error banner, matching the Builder page's inline banner style */}
      {error && (
        <div className="px-6 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500 text-xs flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </span>
          <button onClick={() => setError(null)} className="hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-[#0d1117] border-b border-[#30363d] shrink-0">
        <button
          type="button"
          onClick={() => handleSetMode("polygon")}
          disabled={!isMapReady}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            activeMode === "polygon"
              ? "bg-blue-600 text-white border-blue-500/20"
              : "bg-[#161b22] text-gray-300 border-[#30363d] hover:bg-[#21262d]"
          } disabled:opacity-50 disabled:cursor-not-allowed`}>
          <PenLine className="w-4 h-4" /> Draw Polygon
        </button>

        <button
          type="button"
          onClick={() => handleSetMode("select")}
          disabled={!isMapReady || !hasPolygon}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            activeMode === "select"
              ? "bg-blue-600 text-white border-blue-500/20"
              : "bg-[#161b22] text-gray-300 border-[#30363d] hover:bg-[#21262d]"
          } disabled:opacity-50 disabled:cursor-not-allowed`}>
          <MousePointer2 className="w-4 h-4" /> Edit Vertices
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={!isMapReady || !hasPolygon}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-red-400 bg-[#161b22] border border-[#30363d] hover:bg-red-500/10 hover:border-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Trash2 className="w-4 h-4" /> Clear
        </button>

        <div className="w-px h-5 bg-[#30363d] mx-1" />

        {/* Basemap toggle — Streets (vector) vs Satellite (real aerial imagery) */}
        <button
          type="button"
          onClick={handleToggleBasemap}
          disabled={!isMapReady || isSwitchingBasemap}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-gray-300 bg-[#161b22] border border-[#30363d] hover:bg-[#21262d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isSwitchingBasemap ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : basemap === "satellite" ? (
            <MapIconLucide className="w-4 h-4" />
          ) : (
            <Satellite className="w-4 h-4" />
          )}
          {basemap === "satellite"
            ? "Switch to Streets"
            : "Switch to Satellite"}
        </button>

        <p className="text-xs text-gray-500 ml-2">
          Click <span className="text-gray-300 font-medium">Draw Polygon</span>,
          place vertices, and double-click to finish. Use{" "}
          <span className="text-gray-300 font-medium">Edit Vertices</span> to
          drag points afterward.
        </p>
      </div>

      {/* Map canvas */}
      <div className="relative flex-1 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full" />

        {(isLoadingBoundary || !isMapReady) && (
          <div className="absolute inset-0 bg-[#0d1117]/70 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-400">
                {isMapReady ? "Loading saved boundary..." : "Loading map..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
