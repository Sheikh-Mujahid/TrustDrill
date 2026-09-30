import React, { useState } from 'react';
import { 
  History, 
  AlertTriangle, 
  FileCheck2, 
  Droplet, 
  Anchor, 
  Flame, 
  Clock, 
  ChevronRight, 
  Calendar,
  Layers,
  ArrowDown
} from 'lucide-react';

export default function HistoricalEventTimeline({ offsetWells, onOpenEvidence, onSelectOffsetWell }) {
  const [timelineMode, setTimelineMode] = useState('DEPTH'); // 'DEPTH' | 'TIME'
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Flatten all incidents with well metadata
  const allEvents = offsetWells.flatMap(well => 
    well.incidents.map(inc => ({
      ...inc,
      wellId: well.id,
      wellName: well.officialName,
      distanceKm: well.distanceKm,
      similarityScore: well.similarityScore
    }))
  );

  // Sort by depth ascending or date
  const sortedEvents = [...allEvents].sort((a, b) => a.depth - b.depth);

  const filteredEvents = sortedEvents.filter(ev => {
    if (severityFilter === 'ALL') return true;
    return ev.severity === severityFilter;
  });

  return (
    <div className="bg-[#0B111E] border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4 sm:p-5">
      
      {/* Timeline Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-amber-950 border border-amber-800/60 text-amber-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-100 uppercase">
              CROSS-OFFSET HISTORICAL INCIDENT TIMELINE
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Depth-Indexed Drilling Events Extracted from WCR & DDR Reports
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 hidden sm:inline">Severity:</span>
          <div className="flex rounded bg-slate-900 border border-slate-800 p-0.5">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                  severityFilter === sev
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Flow */}
      <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {filteredEvents.map((item, index) => {
          const isHazardZone = item.depth >= 3450 && item.depth <= 3520;
          return (
            <div 
              key={`${item.wellId}-${item.id}-${index}`}
              className="relative group cursor-pointer"
              onClick={() => onOpenEvidence()}
            >
              {/* Timeline Node Bullet */}
              <div className={`absolute -left-6 sm:-left-8 top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-125 ${
                item.severity === 'CRITICAL'
                  ? 'bg-red-950 border-red-500 text-red-400'
                  : item.severity === 'HIGH'
                  ? 'bg-amber-950 border-amber-500 text-amber-400'
                  : 'bg-blue-950 border-blue-500 text-blue-400'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>

              {/* Event Card */}
              <div className={`p-3.5 rounded-lg border transition-all ${
                isHazardZone
                  ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/80 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs sm:text-sm">
                      {item.type}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {item.wellName} ({item.distanceKm} km)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                      {item.depth} m MD
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      item.severity === 'CRITICAL' ? 'bg-red-950 text-red-300' : 'bg-amber-950 text-amber-300'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-2 font-sans">
                  {item.summary}
                </p>

                {/* Footer Strip */}
                <div className="flex flex-wrap items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-800/80 text-slate-400 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400">NPT: {item.nptHours} hrs ({item.costImpact})</span>
                    <span>•</span>
                    <span className="text-slate-300">Formation: {item.formation}</span>
                  </div>

                  <div className="flex items-center gap-1 text-cyan-400 group-hover:text-cyan-300">
                    <span>Inspect OCR Evidence</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
