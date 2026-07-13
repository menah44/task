"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ClipboardList, Calendar, Search, MapPin, Eye, Loader2, X, ArrowLeft, FileText, CheckCircle2, XCircle, MapIcon } from "lucide-react";
import * as turf from "@turf/turf";
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
  status?: string;
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

const LocationAddressDisplay = ({ val }: { val: any }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  let lat = 0;
  let lng = 0;
  let hasPoint = false;
  let insideAllowed: boolean | undefined = undefined;
  let geofenceCenter: any = null;

  if (val && typeof val === "object") {
    if (val.lat !== undefined && val.lng !== undefined) {
      lat = Number(val.lat);
      lng = Number(val.lng);
      hasPoint = true;
      if (val.insideGeofence !== undefined) insideAllowed = val.insideGeofence;
      if (val.insideAllowedArea !== undefined) insideAllowed = val.insideAllowedArea;
      if (val.geofenceCenter) geofenceCenter = val.geofenceCenter;
    } else if (val.type === 'FeatureCollection' || val.type === 'Polygon' || val.type === 'Point') {
      try {
        const center = turf.centroid(val);
        lng = center.geometry.coordinates[0];
        lat = center.geometry.coordinates[1];
        hasPoint = true;
        if (val.insideGeofence !== undefined) insideAllowed = val.insideGeofence;
      } catch(e) {}
    } else if (val.geojson) {
      try {
        const center = turf.centroid(val.geojson);
        lng = center.geometry.coordinates[0];
        lat = center.geometry.coordinates[1];
        hasPoint = true;
        if (val.insideGeofence !== undefined) insideAllowed = val.insideGeofence;
        if (val.geofenceCenter) geofenceCenter = val.geofenceCenter;
      } catch(e) {}
    }
  }

  useEffect(() => {
    if (!hasPoint) return;
    let isMounted = true;
    setIsGeocoding(true);
    
    apiClient.get(`/spatial/reverse-geocode?lat=${lat}&lng=${lng}`)
    .then(res => {
      if (isMounted && res.data && res.data.address) {
        setAddress(res.data.address);
      }
    })
    .catch(err => console.error("Geocoding failed", err))
    .finally(() => {
      if (isMounted) setIsGeocoding(false);
    });

    return () => { isMounted = false; };
  }, [lat, lng, hasPoint]);

  if (!hasPoint) {
    return <span className="text-muted-foreground italic">Invalid Location Data</span>;
  }

  let mapLat = lat;
  let mapLng = lng;
  if (geofenceCenter) {
    if (geofenceCenter.lat !== undefined) { mapLat = geofenceCenter.lat; mapLng = geofenceCenter.lng; }
    else if (Array.isArray(geofenceCenter)) { mapLng = geofenceCenter[0]; mapLat = geofenceCenter[1]; }
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-muted/20 border border-border rounded-xl">
      <div>
        <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">User Location</h5>
        {isGeocoding ? (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> Resolving address...
          </div>
        ) : address ? (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">{address.split(',')[0]}</p>
              <p className="text-xs text-muted-foreground">{address.split(',').slice(1).join(',').trim()}</p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Latitude: {lat.toFixed(5)}</p>
            <p>Longitude: {lng.toFixed(5)}</p>
          </div>
        )}
      </div>

      {(insideAllowed !== undefined || geofenceCenter) && (
        <div className="pt-3 border-t border-border/50 flex flex-col gap-2">
          {insideAllowed !== undefined && (
            <div>
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Location Status</h5>
              <p className="text-sm font-medium">
                {insideAllowed ? (
                  <span className="text-green-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Inside Allowed Area</span>
                ) : (
                  <span className="text-error flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Outside Allowed Area</span>
                )}
              </p>
            </div>
          )}
          
          {geofenceCenter && (
            <div className="mt-1">
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${mapLat},${mapLng}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <MapIcon className="w-3.5 h-3.5" /> Open in Google Maps
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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

  // Derived state for Forms View
  const formsWithSubmissions = useMemo(() => {
    const grouped = new Map<number, { title: string; count: number; lastSubmission: Date | null; status: string }>();
    
    // Initialize with forms list to get titles
    formsList.forEach(f => {
      grouped.set(f.id, { title: f.title, count: 0, lastSubmission: null, status: f.status || 'DRAFT' });
    });

    responses.forEach(r => {
      let formInfo = grouped.get(r.formId);
      if (!formInfo) {
        // Fallback if form not in formsList
        formInfo = { title: r.form?.title || `Form #${r.formId}`, count: 0, lastSubmission: null, status: r.form?.status || 'UNKNOWN' };
        grouped.set(r.formId, formInfo);
      }
      formInfo.count++;
      const subDate = new Date(r.submittedAt || r.createdAt);
      if (!formInfo.lastSubmission || subDate > formInfo.lastSubmission) {
        formInfo.lastSubmission = subDate;
      }
    });

    // Return all forms, even with 0 submissions
    return Array.from(grouped.entries())
      .map(([id, data]) => ({ id, ...data }));
  }, [responses, formsList]);

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
      if (
        (val.lat !== undefined && val.lng !== undefined) ||
        val.type === 'FeatureCollection' ||
        val.type === 'Polygon' ||
        val.type === 'Point' ||
        val.geojson
      ) {
        return <LocationAddressDisplay val={val} />;
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
            {selectedFormId ? "Form Submissions" : "Submitted Responses"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedFormId
              ? "Browse and review submissions for the selected form."
              : "Browse and review submitted responses across all active forms in your organization."}
          </p>
        </div>
        {selectedFormId && (
          <button
            onClick={() => setSelectedFormId("")}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl transition-colors text-sm font-semibold border border-border"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Forms
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-error/15 border border-error/20 text-error p-6 rounded-2xl text-center text-sm font-semibold">
          {error}
        </div>
      ) : !selectedFormId ? (
        // --- FORMS LIST VIEW ---
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60 text-left text-sm">
              <thead className="bg-card/50 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Form Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total Responses</th>
                  <th className="px-6 py-4">Last Submission</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm text-muted-foreground">
                {formsWithSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      No forms found.
                    </td>
                  </tr>
                ) : (
                  formsWithSubmissions.map((f) => (
                    <tr key={f.id} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">
                        {f.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-muted text-foreground px-2.5 py-1 rounded-full text-xs font-semibold border border-border">
                          {f.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {f.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {f.lastSubmission ? new Date(f.lastSubmission).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedFormId(f.id.toString())}
                          className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-primary/20 rounded-xl transition-all inline-flex items-center gap-1 text-xs font-bold"
                        >
                          View Responses
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // --- SUBMISSIONS LIST VIEW ---
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-card border border-border rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {filteredResponses.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
              No matching submissions found for this form.
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/60 text-left text-sm">
                  <thead className="bg-card/50 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">User Name</th>
                      <th className="px-6 py-4">User Email</th>
                      <th className="px-6 py-4">Submitted At</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm text-muted-foreground">
                    {filteredResponses.map((res) => {
                      const submitterName = `${res.user?.firstName || ""} ${res.user?.lastName || ""}`.trim();

                      return (
                        <tr key={res.id} className="hover:bg-muted transition-colors">
                          <td className="px-6 py-4 text-foreground font-medium whitespace-nowrap">
                            {submitterName || "Anonymous"}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                            {res.user?.email || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                            {res.submittedAt ? new Date(res.submittedAt).toLocaleString() : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap min-w-[200px] max-w-[280px]">
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
                              View
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
