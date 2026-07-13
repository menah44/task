"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { BarChart3, ArrowLeft, Calendar, Search, MapPin, Eye, Loader2, X } from "lucide-react";
import apiClient from "@/lib/api/client";

interface UserInfo {
  id: number;
  email: string;
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
  form?: {
    id: number;
    title: string;
  } | null;
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

const TableRowLocationCell = ({ lat, lng }: { lat: number; lng: number }) => {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    apiClient.get(`/spatial/reverse-geocode?lat=${lat}&lng=${lng}`)
    .then(res => {
      if (isMounted && res.data && res.data.address) {
        setAddress(res.data.address);
      }
    })
    .catch(() => {});
    return () => { isMounted = false; };
  }, [lat, lng]);

  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <a 
      href={mapsUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex items-start gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 p-1.5 -ml-1.5 rounded-lg transition-colors group max-w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
      <div className="flex flex-col text-left overflow-hidden">
        {address ? (
          <>
            <span className="text-sm font-semibold text-foreground truncate">{address.split(',')[0]}</span>
            <span className="text-[11px] text-muted-foreground truncate">{address.split(',').slice(1).join(',').trim()}</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground font-mono">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        )}
      </div>
    </a>
  );
};

export default function AnalyticsPage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const formId = params?.formId;

  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchEmail, setSearchEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal State for detail view
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<FullResponseDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load responses list
  useEffect(() => {
    if (!formId) return;
    const fetchResponses = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get("/responses", {
          params: { formId },
        });
        setResponses(res.data || []);
      } catch (err) {
        console.error("Failed to load responses:", err);
        setError("Unable to load submissions for this form.");
      } finally {
        setLoading(false);
      }
    };
    fetchResponses();
  }, [formId]);

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
      // 1. Email Search
      const email = res.user?.email || "anonymous";
      if (searchEmail && !email.toLowerCase().includes(searchEmail.toLowerCase())) {
        return false;
      }
      // 2. Start Date
      if (startDate) {
        const subDate = new Date(res.submittedAt || res.createdAt);
        const limitDate = new Date(startDate);
        if (subDate < limitDate) return false;
      }
      // 3. End Date
      if (endDate) {
        const subDate = new Date(res.submittedAt || res.createdAt);
        const limitDate = new Date(endDate);
        // Set limitDate to end of day
        limitDate.setHours(23, 59, 59, 999);
        if (subDate > limitDate) return false;
      }
      return true;
    });
  }, [responses, searchEmail, startDate, endDate]);

  const formTitle = responses[0]?.form?.title || "Form Submissions";

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-muted hover:bg-accent rounded-xl text-muted-foreground hover:text-foreground transition-all border border-border"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              {formTitle}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              View and filter responses submitted by members of your organization.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Email Search */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground" /> Search Submitter
          </label>
          <input
            type="text"
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-colors"
          />
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> From Date
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
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> To Date
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
          No matching submissions found for this form.
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60 text-left text-sm">
              <thead className="bg-card/50 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Submitter</th>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm text-muted-foreground">
                {filteredResponses.map((res) => (
                  <tr key={res.id} className="hover:bg-muted transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">
                      {res.user?.email || <span className="text-muted-foreground italic">Anonymous</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {res.submittedAt ? new Date(res.submittedAt).toLocaleString() : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {res.latitude && res.longitude ? (
                        <TableRowLocationCell lat={res.latitude} lng={res.longitude} />
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
                ))}
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
                  {detailData ? `Submission #${detailData.id}` : "Loading Details..."}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Submitted answers overview
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
