"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ClipboardList, Calendar, Search, MapPin, Eye, Loader2, X } from "lucide-react";
import apiClient from "@/lib/api/client";

interface UserInfo {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface FormInfo {
  id: number;
  title: string;
}

interface FormResponse {
  id: number;
  formId: number;
  status: string;
  submittedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  user: UserInfo | null;
  form?: FormInfo | null;
}

interface Answer {
  questionId: string;
  label: string;
  required: boolean;
  value: any;
}

interface ResponseSection {
  id: string;
  title: string;
  answers: Answer[];
}

interface FullResponseDetail {
  id: number;
  formTitle: string;
  sections: ResponseSection[];
}

export default function GlobalResponsesPage() {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [formsList, setFormsList] = useState<FormInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [selectedFormId, setSelectedFormId] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal State for detail view
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<FullResponseDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load responses list
  useEffect(() => {
    const fetchResponses = async () => {
      setLoading(true);
      setError(null);
      try {
        const [resResp, formsResp] = await Promise.all([
          apiClient.get("/responses"),
          apiClient.get("/forms"),
        ]);
        setResponses(resResp.data || []);
        setFormsList(formsResp.data.items || []);
      } catch (err) {
        console.error("Failed to load responses:", err);
        setError("Unable to load organization submissions.");
      } finally {
        setLoading(false);
      }
    };
    fetchResponses();
  }, []);

  // Load response detail when selected
  useEffect(() => {
    if (!selectedResponseId) {
      setDetailData(null);
      return;
    }
    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await apiClient.get<FullResponseDetail>(`/responses/${selectedResponseId}/full`);
        setDetailData(res.data);
      } catch (err) {
        console.error("Failed to load details:", err);
        alert("Failed to load response details.");
        setSelectedResponseId(null);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [selectedResponseId]);

  // Filtered responses
  const filteredResponses = useMemo(() => {
    return responses.filter((res) => {
      // 1. Form Filter
      if (selectedFormId && res.formId !== parseInt(selectedFormId, 10)) {
        return false;
      }
      // 2. Email Search
      const email = res.user?.email || "anonymous";
      const name = `${res.user?.firstName || ""} ${res.user?.lastName || ""}`.toLowerCase();
      const query = searchEmail.toLowerCase();
      if (searchEmail && !email.toLowerCase().includes(query) && !name.includes(query)) {
        return false;
      }
      // 3. Start Date
      if (startDate) {
        const subDate = new Date(res.submittedAt || res.createdAt);
        const limitDate = new Date(startDate);
        if (subDate < limitDate) return false;
      }
      // 4. End Date
      if (endDate) {
        const subDate = new Date(res.submittedAt || res.createdAt);
        const limitDate = new Date(endDate);
        // Set limitDate to end of day
        limitDate.setHours(23, 59, 59, 999);
        if (subDate > limitDate) return false;
      }
      return true;
    });
  }, [responses, selectedFormId, searchEmail, startDate, endDate]);

  const renderAnswerValue = (val: any) => {
    if (val === null || val === undefined) return <span className="text-muted-foreground italic">No Answer</span>;
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "object") {
      if (val.lat !== undefined && val.lng !== undefined) {
        return (
          <span className="inline-flex items-center gap-1 text-primary bg-blue-500/5 px-2.5 py-0.5 rounded border border-blue-500/10 text-xs font-medium">
            {val.lat.toFixed(4)}, {val.lng.toFixed(4)}
          </span>
        );
      }
      if (val.mediaId) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";
        const fileUrl = `${baseUrl}/files/${val.mediaId}`;
        return (
          <div className="flex items-center gap-4 border border-border p-3 rounded-xl bg-muted/20 w-max max-w-full overflow-hidden">
            <div className="flex items-center gap-2 truncate">
              <span className="text-sm font-medium truncate">{val.fileName || "Uploaded File"}</span>
              {val.fileSize && <span className="text-xs text-muted-foreground whitespace-nowrap">({Math.round(val.fileSize / 1024)} KB)</span>}
            </div>
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-lg hover:bg-secondary/80 transition">
                View
              </a>
              <a href={fileUrl} download={val.fileName || "download"} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition">
                Download
              </a>
            </div>
          </div>
        );
      }
      return JSON.stringify(val);
    }
    return String(val);
  };

  return (
    <main className="space-y-6 text-foreground pb-12" dir="ltr">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-blue-500" />
            Submitted Responses
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and review submitted responses across all active forms in your organization.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Form Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Filter by Form
          </label>
          <select
            value={selectedFormId}
            onChange={(e) => setSelectedFormId(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-colors"
          >
            <option value="">All Forms</option>
            {formsList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
        </div>

        {/* Email Search */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Search Submitter
          </label>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-colors"
          />
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-colors"
          />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            To Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-colors"
          />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-error/15 border border-error/20 text-error p-6 rounded-2xl text-center text-sm font-semibold">
          {error}
        </div>
      ) : filteredResponses.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          No matching submissions found.
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60 text-left text-sm">
              <thead className="bg-card/50 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Form</th>
                  <th className="px-6 py-4">Submitter</th>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm text-muted-foreground">
                {filteredResponses.map((res) => {
                  const submitterName = `${res.user?.firstName || ""} ${res.user?.lastName || ""}`.trim();
                  const submitterDisplay = submitterName
                    ? `${submitterName} (${res.user?.email})`
                    : res.user?.email || "Anonymous";

                  return (
                    <tr key={res.id} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">
                        {res.form?.title || `Form #${res.formId}`}
                      </td>
                      <td className="px-6 py-4 text-foreground whitespace-nowrap">
                        {submitterDisplay}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {res.submittedAt ? new Date(res.submittedAt).toLocaleString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {res.latitude && res.longitude ? (
                          <span className="inline-flex items-center gap-1 text-primary bg-blue-500/5 px-2.5 py-0.5 rounded border border-blue-500/10 text-xs font-medium">
                            <MapPin className="w-3.5 h-3.5" />
                            {res.latitude.toFixed(4)}, {res.longitude.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">No GPS Data</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedResponseId(res.id)}
                          className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-primary/20 rounded-xl transition-all inline-flex items-center gap-1 text-xs font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Viewer Modal */}
      {selectedResponseId !== null && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex justify-between items-center bg-background">
              <div>
                <h3 className="text-xl font-bold text-foreground tracking-tight">
                  {detailData ? `Submission Details` : "Loading Details..."}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {detailData ? detailData.formTitle : "Please wait"}
                </p>
              </div>
              <button
                onClick={() => setSelectedResponseId(null)}
                className="p-1.5 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-card">
              {loadingDetail || !detailData ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : (
                detailData.sections.map((sec) => (
                  <div key={sec.id} className="space-y-4">
                    <h4 className="font-bold text-md text-foreground border-l-4 border-blue-500 pl-3 uppercase tracking-wider text-xs">
                      {sec.title}
                    </h4>
                    <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/60">
                      {sec.answers.map((ans) => (
                        <div key={ans.questionId} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <span className="font-semibold text-sm text-muted-foreground md:col-span-1">
                            {ans.label}
                          </span>
                          <div className="text-sm text-foreground md:col-span-2">
                            {renderAnswerValue(ans.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border flex justify-end bg-background">
              <button
                onClick={() => setSelectedResponseId(null)}
                className="px-5 py-2.5 bg-muted hover:bg-accent text-foreground text-sm font-semibold rounded-xl transition-colors border border-border"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
