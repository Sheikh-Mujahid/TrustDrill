"use client";

import { AppShell, Badge, Button, Card, ErrorBox, Skeleton, toast } from "@/components/ui";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function DocumentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"well_info" | "drilling_info" | "operational_events" | "evidence" | "raw_text">("well_info");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [highlightedSnippet, setHighlightedSnippet] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["doc", id],
    queryFn: () => api<any>(`/documents/${id}`),
  });

  const publish = useMutation({
    mutationFn: async () => {
      const reviews = (q.data?.extractions || []).map((ex: any) => ({
        extraction_id: ex.id,
        reviewer_value: edits[ex.id] !== undefined ? edits[ex.id] : (ex.reviewer_value ?? ex.value),
        status: "approved",
      }));
      return api(`/documents/${id}/publish`, {
        method: "POST",
        body: JSON.stringify({ reviews }),
      });
    },
    onSuccess: () => {
      toast("Extracted facts approved & published to Well Intelligence");
      qc.invalidateQueries({ queryKey: ["doc", id] });
    },
  });

  if (q.isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 max-w-7xl mx-auto">
          <Skeleton className="h-20" />
          <Skeleton className="h-64" />
          <Skeleton className="h-80" />
        </div>
      </AppShell>
    );
  }

  if (q.error) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto py-8">
          <ErrorBox error={q.error} />
          <div className="mt-4">
            <Button onClick={() => router.push("/documents")}>Back to Documents</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const doc = q.data?.document;
  const categories = q.data?.categories || {};
  const extractions = q.data?.extractions || [];
  const evidenceList = q.data?.evidence || [];
  const rawText = q.data?.extracted_text || "";

  const renderFieldInput = (ex: any) => {
    const currentVal = edits[ex.id] !== undefined ? edits[ex.id] : (ex.reviewer_value ?? ex.value ?? "");
    const isMissing = ex.value == null && ex.reviewer_value == null;

    return (
      <div
        key={ex.id}
        className="p-3.5 bg-navy-800/80 border border-navy-700 rounded-xl space-y-2 hover:border-navy-600 transition-colors"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-teal-300">{ex.field_name}</span>
            {ex.unit && <span className="text-[10px] bg-navy-700 px-1.5 py-0.5 rounded text-slate-300 font-mono">{ex.unit}</span>}
            {isMissing && <span className="text-[10px] text-amber-400 italic">null (not found)</span>}
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            {ex.confidence != null && (
              <span className={`px-2 py-0.5 rounded text-[10px] ${ex.confidence > 0.8 ? "bg-teal-950 text-teal-300 border border-teal-800" : "bg-amber-950 text-amber-300 border border-amber-800"}`}>
                Conf: {(ex.confidence * 100).toFixed(0)}%
              </span>
            )}
            {ex.page_number != null && (
              <span className="bg-navy-900 px-2 py-0.5 rounded text-[10px] text-slate-300 border border-navy-700">
                Page {ex.page_number}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-teal-500"
            value={currentVal}
            placeholder="Not present in document (null)"
            onChange={(e) => setEdits((s) => ({ ...s, [ex.id]: e.target.value }))}
          />
        </div>

        {ex.snippet && (
          <div
            onClick={() => {
              setHighlightedSnippet(ex.snippet);
              setActiveTab("evidence");
            }}
            className="text-[11px] text-slate-400 bg-navy-950/70 p-2 rounded border border-navy-800/80 cursor-pointer hover:border-teal-700/60 transition-colors"
          >
            <span className="text-teal-400 font-semibold mr-1.5">Evidence (p.{ex.page_number}):</span>
            &quot;{ex.snippet}&quot;
          </div>
        )}
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-800/80 border border-navy-700/60 p-5 rounded-xl backdrop-blur-sm">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">{doc?.original_filename}</h1>
              <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-xs">
                {doc?.document_type || "OTHER"}
              </Badge>
              {doc?.classification_confidence != null && (
                <span className="text-xs text-slate-400 font-mono">
                  ({(doc.classification_confidence * 100).toFixed(0)}% classification match)
                </span>
              )}
              <Badge className={doc?.status === "published" ? "bg-teal-900 text-teal-200" : "bg-amber-900 text-amber-200"}>
                {doc?.status?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              File Size: {(doc?.size_bytes / 1024).toFixed(1)} KB · Pages: {doc?.page_count ?? 1} · OCR: {doc?.ocr_used ? "Active" : "Direct Text"} · Uploaded: {new Date(doc?.created_at).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => publish.mutate()}
              disabled={publish.isPending || doc?.status === "published"}
              className="bg-teal-600 hover:bg-teal-500 text-white font-medium shadow-lg shadow-teal-900/30"
            >
              {publish.isPending ? "Publishing…" : doc?.status === "published" ? "✓ Published" : "Approve & Publish to Wells"}
            </Button>
            <Link href="/documents">
              <Button variant="secondary" className="border-navy-600 hover:bg-navy-700">
                Back
              </Button>
            </Link>
          </div>
        </div>

        {/* Technical Notice Ribbon */}
        <div className="bg-navy-900/90 border border-navy-700 rounded-lg p-3 text-xs text-slate-300 flex items-center justify-between">
          <span>
            🛡️ <strong>Grounded AI Extraction:</strong> Every technical parameter is cited with page number and surrounding sentence context. Missing fields remain null to prevent hallucinations.
          </span>
          <span className="text-teal-400 font-mono text-[11px]">{extractions.length} facts extracted</span>
        </div>

        {/* Review Tabs */}
        <div className="flex border-b border-navy-700 overflow-x-auto gap-2">
          {(
            [
              { id: "well_info", label: `Well Header Info (${categories.well_info?.length || 0})` },
              { id: "drilling_info", label: `Drilling Parameters (${categories.drilling_info?.length || 0})` },
              { id: "operational_events", label: `Incidents & Formations (${categories.operational_events?.length || 0})` },
              { id: "evidence", label: `Evidence Snippets (${evidenceList.length})` },
              { id: "raw_text", label: "Page-by-Page Raw Text" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-teal-500 text-teal-300 bg-navy-800/40"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-navy-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: WELL HEADER INFO */}
        {activeTab === "well_info" && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {(categories.well_info || []).map((ex: any) => renderFieldInput(ex))}
            </div>
          </div>
        )}

        {/* TAB 2: DRILLING PARAMETERS */}
        {activeTab === "drilling_info" && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {(categories.drilling_info || []).map((ex: any) => renderFieldInput(ex))}
            </div>
          </div>
        )}

        {/* TAB 3: OPERATIONAL INCIDENTS & FORMATIONS */}
        {activeTab === "operational_events" && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {(categories.operational_events || []).map((ex: any) => renderFieldInput(ex))}
            </div>
          </div>
        )}

        {/* TAB 4: EVIDENCE SNIPPETS */}
        {activeTab === "evidence" && (
          <Card title="Source Evidence Snippets with Page Number Citations">
            <div className="space-y-3">
              {evidenceList.map((ev: any) => {
                const isSelected = highlightedSnippet && ev.snippet?.includes(highlightedSnippet);
                return (
                  <div
                    key={ev.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-teal-950/60 border-teal-500"
                        : "bg-navy-800/60 border-navy-700/80 hover:border-navy-600"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-teal-400 font-mono">
                        Page Reference: {ev.page_number != null ? `Page ${ev.page_number}` : "Page 1"}
                      </span>
                      {ev.start_char != null && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Char Offset: {ev.start_char}–{ev.end_char}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-serif bg-navy-900/80 p-2.5 rounded-lg border border-navy-800">
                      &quot;{ev.snippet}&quot;
                    </p>
                  </div>
                );
              })}
              {evidenceList.length === 0 && (
                <div className="text-sm text-slate-400 py-6 text-center">No evidence snippets recorded.</div>
              )}
            </div>
          </Card>
        )}

        {/* TAB 5: RAW EXTRACTED TEXT */}
        {activeTab === "raw_text" && (
          <Card title="Extracted Document Text (Page-Preserving)">
            <pre className="text-xs whitespace-pre-wrap max-h-[600px] overflow-auto text-slate-300 font-mono bg-navy-950 p-4 rounded-lg border border-navy-800 leading-relaxed">
              {rawText || "(No extractable text extracted)"}
            </pre>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
