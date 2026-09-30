import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  FileCheck2, 
  ArrowRight, 
  Activity, 
  Layers, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  TrendingDown,
  Droplet,
  Flame,
  Gauge,
  Info
} from 'lucide-react';

export default function LiveRiskPanel({ 
  currentDepth, 
  upcomingRiskZone, 
  onOpenEvidence,
  onSelectOffsetWell,
  offsetWells
}) {
  const distanceToRisk = Math.max(0, Math.round(upcomingRiskZone.topDepth - currentDepth));
  const isInside = currentDepth >= upcomingRiskZone.topDepth;
  const isHighRiskProximity = currentDepth >= 3440 && currentDepth < 3450;

  // Calculate estimated lead time based on current ROP (14.8 m/h)
  const estimatedHours = (distanceToRisk / 14.8).toFixed(1);

  return (
    <div className="bg-[#0B111E] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[580px] lg:h-[640px]">
      
      {/* Top Header */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-950 border border-amber-800/60 text-amber-400">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">
              Live Risk Intelligence
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Depth-Aware Offset Risk Engine
            </span>
          </div>
        </div>

        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
          isInside 
            ? 'bg-red-950 text-red-300 border-red-800 animate-pulse' 
            : isHighRiskProximity 
            ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse' 
            : 'bg-cyan-950 text-cyan-300 border-cyan-800'
        }`}>
          {isInside ? 'CRITICAL RISK' : isHighRiskProximity ? 'IMMINENT RISK' : 'ADVISORY MONITORING'}
        </span>
      </div>

      {/* Main Panel Content */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        
        {/* Core Industrial Warning Card */}
        <div className={`rounded-xl p-4 border transition-all ${
          isInside
            ? 'bg-red-950/40 border-red-500/70 shadow-lg shadow-red-950/60 ring-1 ring-red-500/40'
            : isHighRiskProximity
            ? 'bg-amber-950/40 border-amber-500/70 shadow-lg shadow-amber-950/60 ring-1 ring-amber-500/40'
            : 'bg-slate-900/80 border-amber-500/50 hover:border-amber-500/70'
        }`}>
          {/* Header row with hazard badge */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${
                isInside ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className={`text-xs font-mono font-extrabold uppercase tracking-wider ${
                  isInside ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {isInside ? '⚠️ HAZARD INTERVAL ACTIVE' : '⚠️ HISTORICAL RISK ZONE APPROACHING'}
                </div>
                <div className="text-[11px] text-slate-300 font-sans">
                  Barail Fractured Sandstone Loss Corridor
                </div>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                isInside ? 'bg-red-900/40 text-red-300 border-red-700' : 'bg-amber-900/40 text-amber-300 border-amber-700'
              }`}>
                {isInside ? '0 m TO TOP' : `${distanceToRisk} m AHEAD`}
              </span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs font-mono mb-3">
            <div>
              <span className="text-slate-500 block text-[10px]">CURRENT DEPTH</span>
              <span className="text-white font-bold text-sm">{currentDepth.toFixed(1)} m</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">HISTORICAL RISK</span>
              <span className="text-amber-400 font-bold text-sm">3,450–3,520 m</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">RELEVANT WELLS</span>
              <span className="text-cyan-400 font-bold text-sm">3 Offset Wells</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">LEAD TIME</span>
              <span className="text-slate-200 text-sm">
                {isInside ? 'Entered' : `~${estimatedHours} hrs @ ROP`}
              </span>
            </div>
          </div>

          {/* Historical Events Badges */}
          <div className="space-y-1.5 mb-3">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
              Documented Offset Events in this Interval:
            </span>
            <div className="space-y-1">
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/90 border border-slate-800 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Lost Circulation</span>
                </span>
                <span className="text-slate-400">2.4–6.1 m³/hr (42 m³ in NHK-142)</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/90 border border-slate-800 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Torque Spike</span>
                </span>
                <span className="text-slate-400">38.4 kNm peak (DIG-88)</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/90 border border-slate-800 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-red-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span>Stuck Pipe (Differential)</span>
                </span>
                <span className="text-slate-400">48 hrs NPT (NHK-142)</span>
              </div>
            </div>
          </div>

          {/* Signature Action Button: [VIEW EVIDENCE] */}
          <button
            onClick={onOpenEvidence}
            className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase font-mono tracking-wider transition-all shadow-md shadow-amber-950 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>VIEW EVIDENCE & SOURCE REPORTS</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Stratigraphic Depth Progress Gauge */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bit Stratigraphy Column</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              3,410–3,550m Window
            </span>
          </div>

          {/* Visual Column */}
          <div className="relative h-16 w-full rounded bg-slate-950 border border-slate-800 overflow-hidden flex flex-col font-mono text-[9px]">
            {/* Kopili / Upper Barail boundary */}
            <div className="h-5 bg-slate-800/80 px-2 flex items-center justify-between text-slate-400 border-b border-slate-700/50">
              <span>Upper Barail Siltstone (3,410–3,450m)</span>
              <span className="text-emerald-400">STABLE</span>
            </div>

            {/* High Risk Interval (3,450 - 3,520m) */}
            <div className="h-7 bg-amber-950/50 px-2 flex items-center justify-between text-amber-300 border-b border-amber-800/50 relative">
              <span className="font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Barail Fractured Sandstone (3,450–3,520m)</span>
              </span>
              <span className="text-amber-400 font-bold">HAZARD ZONE</span>
            </div>

            {/* Disang boundary */}
            <div className="h-4 bg-slate-900 px-2 flex items-center justify-between text-slate-500">
              <span>Disang Shale Base (3,520m+)</span>
              <span>OVERPRESSURED</span>
            </div>

            {/* Current Bit Indicator Line */}
            {currentDepth >= 3410 && currentDepth <= 3550 && (
              <div 
                className="absolute left-0 right-0 z-10 flex items-center pointer-events-none transition-all duration-300"
                style={{
                  top: `${((currentDepth - 3410) / (3550 - 3410)) * 100}%`
                }}
              >
                <div className="w-full h-0.5 bg-cyan-400 shadow-sm shadow-cyan-400" />
                <div className="absolute right-1 -top-2 bg-cyan-500 text-slate-950 px-1 py-0.2 rounded text-[8px] font-bold">
                  BIT: {currentDepth.toFixed(0)}m
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommended Mitigation Protocol Checklist */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recommended Pre-Entry Protocol</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              OIL Rig #14 SOP
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {upcomingRiskZone.mitigationAdvisory.slice(0, 3).map((item) => (
              <div key={item.step} className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200 text-[11px] font-sans">
                    {item.step}. {item.action}
                  </span>
                  <span className={`text-[9px] font-mono px-1 rounded ${
                    item.priority === 'CRITICAL' ? 'bg-red-950 text-red-300' : 'bg-amber-950 text-amber-300'
                  }`}>
                    {item.priority}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Status Tag */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span>Verified by eRTMAC Rule Model #OIL-Barail-Loss</span>
        <span className="text-cyan-400">Confidence: 98.4%</span>
      </div>

    </div>
  );
}
