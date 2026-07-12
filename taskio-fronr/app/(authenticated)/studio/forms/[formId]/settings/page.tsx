"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import SkeletonCard from "@/components/SkeletonCard";
import apiClient from "@/lib/api/client";

interface FormSettings {
  startDate: string;
  endDate: string;
  maxResponses: number | "";
  allowAnonymous: boolean;
  requireLogin: boolean;
  showProgress: boolean;
  restrictByLocation: boolean;
}

// Mock data for development (remove when API is ready)
const MOCK_SETTINGS: FormSettings = {
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  maxResponses: 100,
  allowAnonymous: true,
  requireLogin: false,
  showProgress: true,
  restrictByLocation: false,
};

export default function SettingsPage() {
  const { formId } = useParams<{ formId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [settings, setSettings] = useState<FormSettings>({
    startDate: "",
    endDate: "",
    maxResponses: "",
    allowAnonymous: false,
    requireLogin: false,
    showProgress: false,
    restrictByLocation: false,
  });

  // Fetch settings – fallback to mock if API fails
  useEffect(() => {
    if (!formId) return;

    const fetchForm = async () => {
      try {
        console.log(`📡 Fetching settings for formId: ${formId}`);
        const res = await apiClient.get(`/forms/${formId}`);
        const data = res.data;
        
        setSettings({
          startDate: data.settings?.startDate?.split("T")[0] || "",
          endDate: data.settings?.endDate?.split("T")[0] || "",
          maxResponses: data.settings?.maxResponses ?? "",
          allowAnonymous: data.settings?.allowAnonymous ?? false,
          requireLogin: data.settings?.requireLogin ?? false,
          showProgress: data.settings?.showProgress ?? false,
          restrictByLocation: data.settings?.restrictByLocation ?? false,
        });
        setError(null);
      } catch (err: unknown) {
        console.error("❌ Fetch error:", err);
        setSettings(MOCK_SETTINGS);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? value === ""
              ? ""
              : Number(value)
            : value,
    }));
  };

  // Validate dates
  const validateDates = (): boolean => {
    if (settings.startDate && settings.endDate) {
      if (new Date(settings.endDate) <= new Date(settings.startDate)) {
        setError("End date must be after start date.");
        return false;
      }
    }
    return true;
  };

  // Submit settings – with robust error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateDates()) return;
    if (!formId) {
      setError("Form ID is missing");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        settings: {
          startDate: settings.startDate || null,
          endDate: settings.endDate || null,
          maxResponses: settings.maxResponses || null,
          allowAnonymous: settings.allowAnonymous,
          requireLogin: settings.requireLogin,
          showProgress: settings.showProgress,
          restrictByLocation: settings.restrictByLocation,
        }
      };

      await apiClient.put(`/forms/${formId}`, payload);

      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      console.error("❌ Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex justify-center items-center">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/studio/forms/${formId}/builder`}
          className="inline-flex items-center text-primary hover:text-primary/80 mb-6 text-sm">
          ← Back to Builder
        </Link>

        <h1 className="text-2xl font-bold mb-6">Form Settings</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded text-green-300">
            Settings saved successfully!
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 bg-card border border-border rounded-lg p-6">
          <div>
            <label
              htmlFor="startDate"
              className="block font-medium mb-1 text-sm">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={settings.startDate}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block font-medium mb-1 text-sm">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={settings.endDate}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {settings.startDate && settings.endDate && (
              <p
                className={`text-sm mt-1 ${
                  new Date(settings.endDate) > new Date(settings.startDate)
                    ? "text-success"
                    : "text-error"
                }`}>
                {new Date(settings.endDate) > new Date(settings.startDate)
                  ? "✓ Valid range"
                  : "End date must be after start date"}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="maxResponses"
              className="block font-medium mb-1 text-sm">
              Max Responses (optional)
            </label>
            <input
              type="number"
              id="maxResponses"
              name="maxResponses"
              value={settings.maxResponses}
              onChange={handleChange}
              min="1"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="allowAnonymous"
                checked={settings.allowAnonymous}
                onChange={handleChange}
                className="accent-blue-500"
              />
              Allow Anonymous Submissions
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="requireLogin"
                checked={settings.requireLogin}
                onChange={handleChange}
                className="accent-blue-500"
              />
              Require Login to Submit
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="showProgress"
                checked={settings.showProgress}
                onChange={handleChange}
                className="accent-blue-500"
              />
              Show Progress Bar
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="restrictByLocation"
                checked={settings.restrictByLocation}
                onChange={handleChange}
                className="accent-blue-500"
              />
              Restrict by Location (Requires saved map boundary)
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
