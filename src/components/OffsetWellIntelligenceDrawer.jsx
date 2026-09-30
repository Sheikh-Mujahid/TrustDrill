import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Layers, 
  History, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Eye, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Activity,
  Compass,
  FileCheck2,
  Share2
} from 'lucide-react';

export default function OffsetWellIntelligenceDrawer({ 
  well, 
  onClose, 
  onOpenDocumentEvidence 
}) {
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'documents' | 'geology'

  if (!well) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-[#0B111E] border-l border-slate-700/80 shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-300">
      
      {/* Drawer Top Header */}
      <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                {well.officialName}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {well.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>{well.field}</span>
              <span>•</span>
              <span className="text-emerald-400">{well.status}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Offset Metrics Strip (WELL ID, DISTANCE, FORMATION, DEPTH, SIMILARITY) */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-4 bg-slate-950/90 border-b border-slate-800 text-xs font-mono">
        <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase">WELL ID</span>
          <span className="text-white font-bold truncate block">{well.id}</span>
        </div>

        <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase">DISTANCE</span>
          <span className="text-cyan-400 font-bold block">{well.distanceKm} km {well.direction}</span>
        </div>

        <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase">FORMATION</span>
          <span className="text-white font-bold truncate block">{well.primaryFormation}</span>
        </div>

        <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase">TOTAL DEPTH</span>
          <span className="text-white font-bold block">{well.totalDepth} m</span>
        </div>

        <div className="p-2 rounded bg-cyan-950/40 border border-cyan-800/60 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-cyan-400 block uppercase">SIMILARITY</span>
          <span className="text-cyan-300 font-bold block">{well.similarityScore}%</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-900/50 px-4 text-xs font-mono">
        <button
          onClick={() => setActiveTab('events')}
          className={`py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'events'
              ? 'border-cyan-400 text-cyan-300 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Historical Events ({well.incidents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'documents'
              ? 'border-cyan-400 text-cyan-300 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Source Documents ({well.documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('geology')}
          className={`py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'geology'
              ? 'border-cyan-400 text-cyan-300 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Stratigraphic Profile</span>
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        
        {/* TAB 1: HISTORICAL EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Drilling Dysfunctions & Incidents</span>
              <span>Total NPT: {well.incidents.reduce((acc, i) => acc + i.nptHours, 0)} Hours</span>
            </div>

            {well.incidents.map((incident) => (
              <div 
                key={incident.id}
                className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      incident.severity === 'CRITICAL' ? 'bg-red-400 animate-pulse' : 'bg-amber-400'
                    }`} />
                    <h4 className="font-bold text-white text-xs sm:text-sm font-mono">
                      {incident.type}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded ${
                      incident.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {incident.severity}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                      @ {incident.depth} m
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {incident.summary}
                </p>

                {/* Quantitative Impact Box */}
                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/80 rounded border border-slate-800/80 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px]">NPT DOWNTIME</span>
                    <span className="text-amber-400 font-bold">{incident.nptHours} Hours</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">ESTIMATED IMPACT</span>
                    <span className="text-slate-200">{incident.costImpact}</span>
                  </div>
                </div>

                {/* Mitigation Applied */}
                <div className="text-[11px] bg-cyan-950/30 border border-cyan-900/40 rounded p-2 text-cyan-200/90">
                  <span className="font-bold font-mono text-cyan-300 block mb-0.5">Applied Mitigation:</span>
                  <span>{incident.mitigation}</span>
                </div>

                {/* Linked Documents Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                  <span className="truncate">Source: {incident.documents.join(', ')}</span>
                  <button
                    onClick={() => onOpenDocumentEvidence(well.documents[0])}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Excerpt</span>
                    <Eye className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: SOURCE DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
              <span>Verified Ingestion Archives (OIL Duliajan)</span>
              <span className="text-emerald-400">OCR Confidence: 98.4%</span>
            </div>

            {well.documents.map((doc) => (
              <div 
                key={doc.id}
                className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 space-y-2.5 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded bg-slate-800 text-cyan-400 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs font-mono leading-tight">
                        {doc.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {doc.type} • {doc.pages} Pages • Date: {doc.date}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 shrink-0">
                    {doc.ocrConfidence} OCR
                  </span>
                </div>

                {/* OCR Snippet Excerpt */}
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed relative">
                  <div className="text-[9px] text-cyan-400 uppercase tracking-wider mb-1 font-bold">
                    OCR Extracted Incident Passages:
                  </div>
                  <p className="italic text-slate-300">
                    "{doc.highlightSnippet}"
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 text-xs font-mono">
                  <span className="text-[10px] text-slate-500 truncate max-w-[240px]">
                    {doc.source}
                  </span>
                  <button
                    onClick={() => onOpenDocumentEvidence(doc)}
                    className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Evidence</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: STRATIGRAPHIC PROFILE */}
        {activeTab === 'geology' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
              <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Geological & Casing Summary</span>
              </h4>
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Casing Design:</span>
                  <span className="text-slate-200">{well.casingSize}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Spud Date:</span>
                  <span className="text-slate-200">{well.spudDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Completion Date:</span>
                  <span className="text-slate-200">{well.completionDate}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Lithology Match:</span>
                  <span className="text-cyan-300">{well.lithologyMatch}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-cyan-300 text-xs leading-relaxed">
              <span className="font-bold block mb-1">Stratigraphic Correlation to TRUST-01:</span>
              Barail Sandstone top in {well.officialName} was encountered at 3,445 m (-3,130 m TVD ss), perfectly mirroring the structural contour expected in TRUST-01 at 3,450 m MD.
            </div>
          </div>
        )}

      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
        <button
          onClick={() => onOpenDocumentEvidence(well.documents[0])}
          className="flex-1 py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Open Full Evidence Pack</span>
        </button>

        <button
          onClick={onClose}
          className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

    </div>
  );
}
