"use client";

import { AppShell, Badge, Button, Card, Empty, ErrorBox, Skeleton, toast } from "@/components/ui";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

type Doc = {
  id: string;
  well_id?: string;
  original_filename: string;
  document_type?: string;
  classification_confidence?: number;
  size_bytes: number;
  page_count?: number;
  status: string;
  error_message?: string;
  created_at: string;
  ocr_used: boolean;
};

const DOC_TYPES = [
  { value: "", label: "Auto-detect Document Type" },
  { value: "WCR", label: "WCR — Well Completion Report" },
  { value: "DDR", label: "DDR — Daily Drilling Report" },
  { value: "GEOLOGICAL_REPORT", label: "Geological / Lithology Report" },
  { value: "DRILLING_REPORT", label: "Drilling Operations Report" },
  { value: "MUD_REPORT", label: "Mud & Fluid Properties Report" },
  { value: "CEMENTING_REPORT", label: "Cementing & Casing Report" },
  { value: "FORMATION_REPORT", label: "Formation Evaluation Report" },
  { value: "OTHER", label: "Other Drilling Document" },
];

export default function DocumentsPage() {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [selectedWellId, setSelectedWellId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

  const wellsQ = useQuery({
    queryKey: ["wells-catalog"],
    queryFn: () => api<any[]>("/wells"),
  });

  const list = useQuery({
    queryKey: ["docs", filterType],
    queryFn: () => api<Doc[]>(`/documents${filterType ? `?document_type=${filterType}` : ""}`),
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please select a PDF, TXT, or CSV document");
      const fd = new FormData();
      fd.append("file", file);
      if (selectedWellId) fd.append("well_id", selectedWellId);
      if (selectedType) fd.append("document_type", selectedType);
      return api<Doc>("/documents/upload", { method: "POST", body: fd });
    },
    onSuccess: (data) => {
      toast(`Document "${data.original_filename}" uploaded for AI extraction`);
      setFile(null);
      qc.invalidateQueries({ queryKey: ["docs"] });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-teal-900/80 text-teal-200 border-teal-600/40">PUBLISHED</Badge>;
      case "pending_review":
        return <Badge className="bg-amber-900/80 text-amber-200 border-amber-600/40">PENDING REVIEW</Badge>;
      case "extracting":
        return <Badge className="bg-sky-900/80 text-sky-200 border-sky-600/40">EXTRACTING</Badge>;
      case "processing":
        return <Badge className="bg-purple-900/80 text-purple-200 border-purple-600/40">PROCESSING</Badge>;
      case "failed":
        return <Badge className="bg-rose-900/80 text-rose-200 border-rose-600/40">FAILED</Badge>;
      default:
        return <Badge className="bg-slate-700 text-slate-300">{status?.toUpperCase()}</Badge>;
    }
  };

  const getDocTypeBadge = (dtype?: string) => {
    switch (dtype) {
      case "WCR":
        return <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-700/50">WCR</Badge>;
      case "DDR":
        return <Badge className="bg-cyan-950 text-cyan-300 border border-cyan-700/50">DDR</Badge>;
      case "GEOLOGICAL_REPORT":
        return <Badge className="bg-indigo-950 text-indigo-300 border border-indigo-700/50">GEOLOGY</Badge>;
      case "MUD_REPORT":
        return <Badge className="bg-amber-950 text-amber-300 border border-amber-700/50">MUD</Badge>;
      case "CEMENTING_REPORT":
        return <Badge className="bg-orange-950 text-orange-300 border border-orange-700/50">CEMENT</Badge>;
      default:
        return <Badge className="bg-navy-800 text-slate-300">{dtype || "OTHER"}</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-800/80 border border-navy-700/60 p-5 rounded-xl backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              📄 AI Document Intelligence & WCR/DDR Ingestion
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Extract structured drilling facts, operational incidents, and geological tops with traceable evidence and page citations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/knowledge">
              <Button variant="secondary" className="border-navy-600 hover:bg-navy-700">
                🔍 Knowledge Search
              </Button>
            </Link>
          </div>
        </div>

        {/* Upload Card */}
        <Card title="Upload Drilling Documents & Well Reports">
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              {/* Well Selector */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  Target Well (Optional)
                </label>
                <select
                  value={selectedWellId}
                  onChange={(e) => setSelectedWellId(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="">Auto-detect from document text</option>
                  {wellsQ.data?.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.well_uid} ({w.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Type Override */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  Document Classification
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  {DOC_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Input & Submit */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  Select PDF / TXT / CSV
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".pdf,.txt,.csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-navy-700 file:text-teal-300 hover:file:bg-navy-600 bg-navy-800 border border-navy-700 rounded-lg cursor-pointer p-1"
                  />
                  <Button
                    onClick={() => upload.mutate()}
                    disabled={!file || upload.isPending}
                    className="shrink-0 bg-teal-600 hover:bg-teal-500 text-white"
                  >
                    {upload.isPending ? "Extracting…" : "Upload"}
                  </Button>
                </div>
              </div>
            </div>

            {upload.error && <ErrorBox error={upload.error} />}

            <div className="text-[11px] text-slate-400 bg-navy-950/60 p-2.5 rounded-lg border border-navy-800/80 flex items-center justify-between">
              <span>
                💡 <strong>Evidence Integrity Rule:</strong> Unstructured facts are strictly grounded in page citations. Missing technical values are stored as null and never hallucinated.
              </span>
              <span className="text-slate-500">Max size: 15 MB</span>
            </div>
          </div>
        </Card>

        {/* Documents Ingestion History Table */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">Document Processing Queue & Archive</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter by Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-navy-800 border border-navy-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">All Document Types</option>
                <option value="WCR">WCR (Completion)</option>
                <option value="DDR">DDR (Daily Reports)</option>
                <option value="GEOLOGICAL_REPORT">Geological Reports</option>
                <option value="MUD_REPORT">Mud Reports</option>
                <option value="CEMENTING_REPORT">Cementing Reports</option>
                <option value="OTHER">Other Documents</option>
              </select>
            </div>
          </div>

          {list.isLoading && <Skeleton className="h-64" />}
          {list.error && <ErrorBox error={list.error} />}

          {list.data && (
            <Card>
              {list.data.length === 0 ? (
                <Empty>No documents uploaded yet. Upload a WCR, DDR, or drilling report above.</Empty>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-navy-800 text-slate-300 font-sans">
                      <tr>
                        <th className="p-3">Document Filename</th>
                        <th className="p-3">Classified Type</th>
                        <th className="p-3">Pages</th>
                        <th className="p-3">OCR Mode</th>
                        <th className="p-3">Processing Status</th>
                        <th className="p-3">Uploaded Date</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-700/60 font-mono">
                      {list.data.map((d) => (
                        <tr key={d.id} className="hover:bg-navy-800/40 transition-colors">
                          <td className="p-3 font-sans">
                            <Link
                              href={`/documents/${d.id}`}
                              className="font-medium text-teal-300 hover:text-teal-200 hover:underline"
                            >
                              {d.original_filename}
                            </Link>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {(d.size_bytes / 1024).toFixed(1)} KB
                            </div>
                            {d.error_message && (
                              <div className="text-[11px] text-rose-400 mt-1 font-sans">{d.error_message}</div>
                            )}
                          </td>
                          <td className="p-3 font-sans">
                            <div className="flex items-center gap-1.5">
                              {getDocTypeBadge(d.document_type)}
                              {d.classification_confidence != null && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {(d.classification_confidence * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-slate-300">{d.page_count ?? 1} pgs</td>
                          <td className="p-3 font-sans">
                            {d.ocr_used ? (
                              <Badge className="bg-purple-950 text-purple-300 border border-purple-800">
                                OCR Active
                              </Badge>
                            ) : (
                              <span className="text-slate-400">Direct Text</span>
                            )}
                          </td>
                          <td className="p-3 font-sans">{getStatusBadge(d.status)}</td>
                          <td className="p-3 text-slate-400 font-sans">
                            {new Date(d.created_at).toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-sans">
                            <Link href={`/documents/${d.id}`}>
                              <Button variant="secondary" className="text-xs px-2.5 py-1">
                                Review & Publish →
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
