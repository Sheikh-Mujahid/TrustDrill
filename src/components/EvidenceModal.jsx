import React, { useState } from 'react';
import { 
  X, 
  FileCheck2, 
  Download, 
  Printer, 
  ShieldCheck, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Database,
  Search,
  Maximize2
} from 'lucide-react';

export default function EvidenceModal({ isOpen, onClose, documentData, activeWell, upcomingRiskZone }) {
  const [selectedDocTab, setSelectedDocTab] = useState(documentData ? 'custom' : 'wcr'); // 'custom' | 'wcr' | 'ddr' | 'mudlog'

  React.useEffect(() => {
    if (documentData) {
      setSelectedDocTab('custom');
    }
  }, [documentData]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0B111E] border border-cyan-500/50 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-mono tracking-wide text-white">
                  HISTORICAL EVIDENCE PACK & AUDIT TRAIL
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  OCR VERIFIED • 98.6%
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Oil India Limited Central Archive • eRTMAC-NWIS PS 26121 • {documentData ? documentData.source : 'Well OIL-NHK-142'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer border border-slate-700"
              title="Print Dossier"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Verification Metadata Banner */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-3 text-slate-300">
            <span className="text-slate-500">Document Archive Hash:</span>
            <span className="text-cyan-400">SHA256: 7f4a9b21e8d4c...b901a</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Ingestion Engine: <strong className="text-white">eRTMAC OCR v3.2</strong></span>
            <span>•</span>
            <span>Sign-off: <strong className="text-emerald-400">Verified by OIL Duliajan</strong></span>
          </div>
        </div>

        {/* Document Selection Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 text-xs font-mono overflow-x-auto">
          {documentData && (
            <button
              onClick={() => setSelectedDocTab('custom')}
              className={`py-2.5 px-3.5 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
                selectedDocTab === 'custom'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate max-w-[200px]">{documentData.title}</span>
            </button>
          )}

          <button
            onClick={() => setSelectedDocTab('wcr')}
            className={`py-2.5 px-3.5 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              selectedDocTab === 'wcr'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Well Completion Report (WCR) #NHK-142</span>
          </button>

          <button
            onClick={() => setSelectedDocTab('ddr')}
            className={`py-2.5 px-3.5 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              selectedDocTab === 'ddr'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Daily Drilling Report (DDR) #Day-48</span>
          </button>

          <button
            onClick={() => setSelectedDocTab('mudlog')}
            className={`py-2.5 px-3.5 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              selectedDocTab === 'mudlog'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Composite Mud Loss Log (.LAS)</span>
          </button>
        </div>

        {/* Modal Scrollable Content: Scanned-Look Dossier */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-gradient-to-b from-[#0B111E] to-[#080D17]">
          
          {/* TAB 0: CUSTOM SELECTED DOCUMENT */}
          {selectedDocTab === 'custom' && documentData && (
            <div className="bg-slate-950 border border-cyan-700/60 rounded-lg p-5 sm:p-6 shadow-inner font-mono text-xs text-slate-300 space-y-4 relative">
              <div className="sm:absolute sm:top-5 sm:right-6 border-2 border-cyan-500/70 text-cyan-400 rounded px-3 py-1 text-center font-bold uppercase tracking-wider text-[11px] mb-3 sm:mb-0">
                <span>OIL ARCHIVE</span><br />
                <span>{documentData.ocrConfidence} OCR CONFIDENCE</span>
              </div>

              <div className="border-b border-slate-800 pb-3">
                <div className="text-slate-400 text-[10px]">OIL INDIA LIMITED • INGESTION ARCHIVE</div>
                <div className="text-white text-sm sm:text-base font-bold">{documentData.title}</div>
                <div className="text-cyan-400 text-[11px]">{documentData.source} • Date: {documentData.date} • {documentData.pages} Pages</div>
              </div>

              <div className="bg-cyan-950/30 border-l-4 border-cyan-400 p-3.5 rounded-r text-cyan-100 space-y-1.5 leading-relaxed">
                <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>EXTRACTED OCR INCIDENT & DRILLING RECORD</span>
                </div>
                <p className="text-xs text-slate-200 font-sans italic">
                  “{documentData.highlightSnippet}”
                </p>
              </div>

              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Document Type:</span>
                  <span className="text-white">{documentData.type}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Verification Method:</span>
                  <span className="text-emerald-400">LayoutLMv3 Multi-modal OCR + NER Extraction</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Audit Signature:</span>
                  <span className="text-slate-300">Verified by Superintending Engineer (Drilling)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: WCR REPORT */}
          {selectedDocTab === 'wcr' && (
            <div className="bg-slate-950 border border-slate-700/80 rounded-lg p-5 sm:p-6 shadow-inner font-mono text-xs text-slate-300 space-y-4 relative">
              {/* Document Stamp Top Right */}
              <div className="sm:absolute sm:top-5 sm:right-6 border-2 border-red-500/70 text-red-400 rounded px-3 py-1 text-center font-bold rotate-1 uppercase tracking-wider text-[11px] mb-3 sm:mb-0">
                <span>OIL INDIA LIMITED</span><br />
                <span>OFFICIAL FIELD ARCHIVE</span>
              </div>

              {/* Document Header */}
              <div className="border-b border-slate-800 pb-3">
                <div className="text-slate-400 text-[10px]">OIL INDIA LIMITED • EXPLORATION & DEVELOPMENT DIRECTORATE</div>
                <div className="text-white text-sm sm:text-base font-bold">WELL COMPLETION REPORT: OIL-NHK-142</div>
                <div className="text-cyan-400 text-[11px]">Interval: 3,450.0 m to 3,550.0 m MD (Barail Formation)</div>
              </div>

              {/* OCR Highlight Box */}
              <div className="bg-amber-950/30 border-l-4 border-amber-500 p-3.5 rounded-r text-amber-200 space-y-1.5 leading-relaxed">
                <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>EXTRACTED INCIDENT RECORD (CONFIDENCE: 98.8%)</span>
                </div>
                <p className="text-xs text-slate-200 font-sans">
                  “At measured depth <strong>3,485.4 m</strong>, drilling bit penetrated an intensely fractured facies of the Upper Barail Sandstone. Active mud loss initiated immediately at <strong>2.4 m³/hr</strong>, escalating rapidly to <strong>6.1 m³/hr</strong>. Total mud volume lost to the formation prior to stabilization was <strong>42.2 m³</strong> of 10.6 ppg HP-WBM mud.”
                </p>
                <div className="text-[10px] text-amber-300/80 font-mono pt-1">
                  Primary Cause: Induced fracture propagation in depleted Barail sand under 480 psi overbalance.
                </div>
              </div>

              {/* Data Table */}
              <div className="space-y-1.5">
                <div className="text-slate-400 text-[11px] font-bold">Table 4.2 — Well Incident Chronology:</div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-slate-800 text-left text-[11px]">
                    <thead className="bg-slate-900 text-slate-300">
                      <tr>
                        <th className="p-2 border-b border-slate-800">Time (hrs)</th>
                        <th className="p-2 border-b border-slate-800">Depth (m)</th>
                        <th className="p-2 border-b border-slate-800">Pit Volume</th>
                        <th className="p-2 border-b border-slate-800">Loss Rate</th>
                        <th className="p-2 border-b border-slate-800">Action Taken</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr>
                        <td className="p-2">04:15</td>
                        <td className="p-2">3,482.0</td>
                        <td className="p-2">142.0 m³</td>
                        <td className="p-2 text-emerald-400">0.0 m³/hr</td>
                        <td className="p-2">Normal drilling, 14 m/hr ROP</td>
                      </tr>
                      <tr className="bg-amber-950/20">
                        <td className="p-2 font-bold text-amber-400">04:30</td>
                        <td className="p-2 font-bold text-amber-400">3,485.4</td>
                        <td className="p-2 font-bold text-amber-400">137.5 m³ (-4.5m³)</td>
                        <td className="p-2 font-bold text-amber-400">2.4 m³/hr</td>
                        <td className="p-2 text-amber-200">Loss observed; flow differential alarm</td>
                      </tr>
                      <tr className="bg-red-950/20">
                        <td className="p-2 font-bold text-red-400">05:10</td>
                        <td className="p-2 font-bold text-red-400">3,487.0</td>
                        <td className="p-2 font-bold text-red-400">118.0 m³ (-24m³)</td>
                        <td className="p-2 font-bold text-red-400">6.1 m³/hr</td>
                        <td className="p-2 text-red-200">Pumps shut down, string pulled to casing shoe</td>
                      </tr>
                      <tr>
                        <td className="p-2">09:40</td>
                        <td className="p-2">3,485.0</td>
                        <td className="p-2">Stabilized</td>
                        <td className="p-2 text-emerald-400">0.0 m³/hr</td>
                        <td className="p-2">Spotted 2x 25 bbl Calcium Carbonate pills</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Remedial Recommendation Signed */}
              <div className="pt-2 border-t border-slate-800 text-slate-300 space-y-1">
                <span className="font-bold text-white block">Official Recommendation for Subsequent Offset Wells:</span>
                <p className="text-slate-400 leading-relaxed font-sans text-xs">
                  “All future wells drilling into the Barail Sandstone block (including TRUST-01) must pre-stage 100 bbl blended Calcium Carbonate LCM pills (150/400 mesh) prior to crossing 3,448 m depth, and reduce drilling ROP below 8 m/hr.”
                </p>
                <div className="pt-2 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Sign-off: Er. D. K. Gogoi (Superintending Drilling Engineer)</span>
                  <span className="text-cyan-400">Archive Ref #OIL-NHK-2022-WCR</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DDR SHIFT REPORT */}
          {selectedDocTab === 'ddr' && (
            <div className="bg-slate-950 border border-slate-700/80 rounded-lg p-5 font-mono text-xs text-slate-300 space-y-3">
              <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
                <div>
                  <span className="font-bold text-white text-sm">DAILY DRILLING REPORT (DDR) — DAY 48</span>
                  <div className="text-slate-400 text-[10px]">Rig: OIL Rig-11 (Cyber 1500 HP) • Date: 28-Feb-2022</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px]">Shift A & B</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-2 bg-slate-900 rounded">
                <div><span className="text-slate-500">24hr Progress:</span> 18 m</div>
                <div><span className="text-slate-500">Mud Density:</span> 10.6 ppg</div>
                <div><span className="text-slate-500">Pump Press:</span> 2,850 psi</div>
                <div><span className="text-slate-500">NPT this shift:</span> 14.5 hrs</div>
              </div>

              <div className="space-y-1 text-slate-300">
                <span className="font-bold text-amber-300">Driller's Narrative Log:</span>
                <p className="text-slate-400 leading-relaxed font-sans text-xs">
                  “04:30 hrs: Drilled ahead 8-1/2" hole from 3,482 m to 3,485 m. Sudden drop in active pit #1 detected (-35 bbls in 15 min). Checked flowline sensor — zero returns at surface. Sounded rig alarm. Stopped rotary and picked up off bottom to 3,460 m. Circulated at 150 gpm with no returns. Commenced mixing 50 bbl heavy LCM pill (Calcium carbonate coarse + medium, 40 ppb). Pushed pill to bit at 08:30 hrs.”
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: MUD LOG EXTRACT */}
          {selectedDocTab === 'mudlog' && (
            <div className="bg-slate-950 border border-slate-700/80 rounded-lg p-5 font-mono text-xs text-slate-300 space-y-3">
              <div className="border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-sm">COMPOSITE MUD LOSS & GAS RATIO (.LAS)</span>
                <div className="text-slate-400 text-[10px]">Well: OIL-NHK-142 • Interval: 3,440–3,520 m MD</div>
              </div>

              <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Track 1: Pit Volume Delta (m³)</span>
                  <span className="text-red-400 font-bold">Max Loss: -42.2 m³ @ 3,485m</span>
                </div>
                <div className="h-10 bg-slate-950 rounded flex items-center px-2 relative overflow-hidden">
                  <div className="w-[60%] h-4 bg-emerald-500/20 rounded-l" />
                  <div className="w-[40%] h-4 bg-red-500/50 rounded-r animate-pulse" />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white">
                    Sudden Pit Drop: -42.2 m³ between 3,485m - 3,488m
                  </span>
                </div>

                <div className="flex justify-between text-slate-400 text-[11px] pt-2">
                  <span>Track 2: Standpipe Pressure (psi)</span>
                  <span className="text-amber-400">Drop: 3,100 psi → 2,650 psi</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Advisory Decision Support — Ready for Chief Drilling Engineer Action</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
}
