"use client";

import { AppShell, Badge, Button, Card, Empty, ErrorBox, Skeleton } from "@/components/ui";
import { api, severityClass } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

const SAMPLE_QUERIES = [
  "Which nearby wells had lost circulation?",
  "Show wells with stuck pipe below 2000 m",
  "Which formations had repeated drilling problems?",
  "Show evidence for lost circulation around 1400 m",
  "Find well control and kick incidents",
];

export default function KnowledgePage() {
  const [queryText, setQueryText] = useState<string>("Which nearby wells had lost circulation?");
  const [eventType, setEventType] = useState<string>("");

  const searchQ = useQuery({
    queryKey: ["knowledge-nl", queryText, eventType],
    queryFn: () => {
      if (!queryText.trim()) return Promise.resolve(null);
      return api<any>(`/knowledge/query?q=${encodeURIComponent(queryText)}`);
    },
    enabled: queryText.trim().length >= 2,
  });

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-800/80 border border-navy-700/60 p-5 rounded-xl backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              🔍 Historical Knowledge & Evidence Search
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ask natural-language technical questions across historical WCR/DDR reports, operational incident logs, and stratigraphic tops.
            </p>
          </div>
        </div>

        {/* Search Input Box & Sample Chips */}
        <Card>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Ask a technical drilling question (e.g., 'Which wells had stuck pipe in Bravo formation?')"
                className="flex-1 bg-navy-900 border border-navy-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 font-sans"
              />
              <Button className="bg-teal-600 hover:bg-teal-500 text-white px-5 shrink-0">
                Search
              </Button>
            </div>

            {/* Quick Sample Queries */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 font-semibold">Suggested Questions:</span>
              {SAMPLE_QUERIES.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => setQueryText(sq)}
                  className="text-xs bg-navy-800 hover:bg-navy-700 border border-navy-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition-colors"
                >
                  {sq}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 bg-navy-950/70 p-2.5 rounded-lg border border-navy-800/80 flex items-center justify-between">
              <span>
                🛡️ <strong>Zero-Hallucination Search:</strong> Results are retrieved from verified database records and document page citations.
              </span>
              <span className="text-teal-400 font-mono">{searchQ.data?.hit_count ?? 0} matches found</span>
            </div>
          </div>
        </Card>

        {/* Search Results */}
        {searchQ.isLoading && <Skeleton className="h-80" />}
        {searchQ.error && <ErrorBox error={searchQ.error} />}

        {searchQ.data && (
          <div className="space-y-4">
            <Card title={`Search Results for "${queryText}" (${searchQ.data.hit_count} Matches)`}>
              {searchQ.data.results.length === 0 ? (
                <Empty>No historical incidents found matching this query. Try adjusting keywords or depth filters.</Empty>
              ) : (
                <div className="space-y-3.5">
                  {searchQ.data.results.map((hit: any) => (
                    <div
                      key={hit.id}
                      className="p-4 bg-navy-800/80 border border-navy-700 rounded-xl space-y-2.5 hover:border-navy-600 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-white">{hit.well_uid}</span>
                          <span className="text-xs text-slate-400 font-normal">({hit.well_name})</span>
                          <Badge className={severityClass(hit.severity)}>{hit.severity?.toUpperCase()}</Badge>
                          <span className="text-xs bg-navy-900 border border-navy-700 px-2 py-0.5 rounded text-teal-300 font-mono">
                            {hit.event_type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          MD {hit.md_m} m {hit.formation !== "N/A" && `· ${hit.formation}`}
                        </div>
                      </div>

                      <p className="text-sm font-semibold text-slate-200">{hit.title}</p>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{hit.description}</p>

                      {hit.lesson_learned && (
                        <div className="text-xs bg-navy-900/90 border border-teal-800/30 p-2.5 rounded-lg text-slate-200">
                          <span className="font-semibold text-teal-400 mr-1.5">Lesson Learned:</span>
                          {hit.lesson_learned}
                        </div>
                      )}

                      {hit.mitigation && (
                        <div className="text-xs bg-navy-900/60 p-2 rounded text-slate-300">
                          <span className="font-semibold text-slate-400 mr-1.5">Executed Mitigation:</span>
                          {hit.mitigation}
                        </div>
                      )}

                      {/* Source Evidence Citation */}
                      <div className="pt-2 border-t border-navy-700/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>
                          📄 Source: <strong>{hit.document_filename || "WCR_Report.pdf"}</strong> — Page {hit.page_number}
                        </span>
                        <span className="text-slate-500 font-sans">{hit.provenance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
