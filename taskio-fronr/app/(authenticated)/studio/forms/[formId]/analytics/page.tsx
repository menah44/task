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
    if (val === null || val === undefined) return <span className="text-gray-600 italic">No Answer</span>;
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  return (
    <main className="space-y-6 text-[#c9d1d9] pb-12" dir="ltr">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d] pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-[#21262d] hover:bg-[#30363d] rounded-xl text-gray-400 hover:text-white transition-all border border-[#30363d]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              {formTitle}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              View and filter responses submitted by members of your organization.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Email Search */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-gray-500" /> Search Submitter
          </label>
          <input
            type="text"
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-500" /> From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-500" /> To Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center text-sm font-semibold">
          {error}
        </div>
      ) : filteredResponses.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-12 text-center text-gray-500">
          No matching submissions found for this form.
        </div>
      ) : (
        <div className="bg-[#161b22] rounded-2xl border border-[#30363d] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#30363d] text-left text-sm">
              <thead className="bg-[#161b22]/50 text-gray-400 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Submitter</th>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d] text-sm text-gray-300">
                {filteredResponses.map((res) => (
                  <tr key={res.id} className="hover:bg-[#1f242c] transition-colors">
                    <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                      {res.user?.email || <span className="text-gray-500 italic">Anonymous</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      {res.submittedAt ? new Date(res.submittedAt).toLocaleString() : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {res.latitude && res.longitude ? (
                        <span className="inline-flex items-center gap-1 text-blue-400 bg-blue-500/5 px-2.5 py-0.5 rounded border border-blue-500/10 text-xs font-medium">
                          <MapPin className="w-3.5 h-3.5" />
                          {res.latitude.toFixed(4)}, {res.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-gray-600 italic text-xs">No GPS Data</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedResponseId(res.id)}
                        className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/25 rounded-xl transition-all inline-flex items-center gap-1 text-xs font-bold"
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
          <div className="bg-[#161b22] border border-[#30363d] rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#30363d] flex justify-between items-center bg-[#0d1117]">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {detailData ? `Submission #${detailData.id}` : "Loading Details..."}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Submitted answers overview
                </p>
              </div>
              <button
                onClick={() => setSelectedResponseId(null)}
                className="p-1.5 hover:bg-[#21262d] rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#0d1117]/50">
              {loadingDetail || !detailData ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : (
                detailData.sections.map((sec) => (
                  <div key={sec.id} className="space-y-4">
                    <h4 className="font-bold text-md text-white border-l-4 border-blue-500 pl-3 uppercase tracking-wider text-xs">
                      {sec.title}
                    </h4>
                    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden divide-y divide-[#30363d]">
                      {sec.answers.map((ans) => (
                        <div key={ans.questionId} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <span className="font-semibold text-sm text-gray-400 md:col-span-1">
                            {ans.label}
                          </span>
                          <div className="text-sm text-white md:col-span-2">
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
            <div className="p-6 border-t border-[#30363d] flex justify-end bg-[#0d1117]">
              <button
                onClick={() => setSelectedResponseId(null)}
                className="px-5 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-white text-sm font-semibold rounded-xl transition-colors border border-[#30363d]"
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
