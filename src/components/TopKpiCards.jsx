import React from 'react';
import { 
  ArrowDownCircle, 
  Layers, 
  MapPin, 
  History, 
  AlertOctagon, 
  BellRing, 
  AlertTriangle,
  Flame,
  Gauge,
  TrendingDown
} from 'lucide-react';

export default function TopKpiCards({ 
  currentDepth, 
  activeWell, 
  offsetWellsCount = 5, 
  activeIncidentsCount = 14, 
  riskZonesAheadCount = 2, 
  activeAlertsCount = 1,
  onOpenEvidence,
  onSelectOffsetWell
}) {
  const tvd = (currentDepth * 0.9095).toFixed(1);
  const isApproachingRisk = currentDepth >= 3440 && currentDepth < 3450;
  const isInsideRisk = currentDepth >= 3450;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      
      {/* 1. CURRENT DEPTH */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 hover:border-cyan-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">Current Depth</span>
          <ArrowDownCircle className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            {currentDepth.toFixed(1)}
          </span>
          <span className="text-xs font-mono text-cyan-400">m MD</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800/80">
          <span>TVD: {tvd} m</span>
          <span className="text-emerald-400">ROP: {activeWell.telemetry.rop} m/h</span>
        </div>
      </div>

      {/* 2. FORMATION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 hover:border-cyan-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">Formation</span>
          <Layers className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="text-sm sm:text-base font-bold text-white truncate font-sans">
          Barail Sandstone
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800/80">
          <span>Target: 3,720 m</span>
          <span className="text-cyan-300">Upper Member</span>
        </div>
      </div>

      {/* 3. NEARBY WELLS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 hover:border-cyan-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">Nearby Wells</span>
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold font-mono text-white">
            {offsetWellsCount}
          </span>
          <span className="text-xs text-slate-400 font-mono">in 5.0 km</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800/80">
          <span className="text-emerald-400">Closest: 1.1 km</span>
          <span className="text-slate-300">3 Correlated</span>
        </div>
      </div>

      {/* 4. HISTORICAL EVENTS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 hover:border-cyan-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">Historical Events</span>
          <History className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-300">
            {activeIncidentsCount}
          </span>
          <span className="text-xs text-slate-400 font-mono">Extracted</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800/80">
          <span className="text-amber-400">Loss: 6</span>
          <span className="text-red-400">Stuck: 4</span>
          <span className="text-blue-400">Gas: 4</span>
        </div>
      </div>

      {/* 5. RISK ZONES AHEAD */}
      <div className={`rounded-lg p-3 border transition-all ${
        isInsideRisk
          ? 'bg-red-950/40 border-red-500/60 shadow-md shadow-red-950/50'
          : isApproachingRisk
          ? 'bg-amber-950/40 border-amber-500/60 shadow-md shadow-amber-950/50'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
      }`}>
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">Risk Zones</span>
          <AlertOctagon className={`w-3.5 h-3.5 ${isInsideRisk ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-xl sm:text-2xl font-bold font-mono ${isInsideRisk ? 'text-red-400' : 'text-amber-400'}`}>
            {riskZonesAheadCount}
          </span>
          <span className="text-xs text-slate-400 font-mono">Ahead</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono mt-1 pt-1 border-t border-slate-800/80">
          <span className={isInsideRisk ? 'text-red-400 font-bold' : isApproachingRisk ? 'text-amber-300 font-bold' : 'text-slate-300'}>
            {isInsideRisk ? 'INSIDE 3,450m' : isApproachingRisk ? '3,450–3,520m' : '3,450–3,520m'}
          </span>
          <span className={isInsideRisk ? 'text-red-400 animate-pulse' : 'text-cyan-400'}>
            {isInsideRisk ? 'ACTIVE' : `${Math.max(0, Math.round(3450 - currentDepth))}m away`}
          </span>
        </div>
      </div>

      {/* 6. ACTIVE ALERTS */}
      <div 
        onClick={onOpenEvidence}
        className={`rounded-lg p-3 border cursor-pointer transition-all ${
          isInsideRisk
            ? 'bg-red-900/30 border-red-500/70 hover:bg-red-900/40 ring-1 ring-red-500/40'
            : isApproachingRisk
            ? 'bg-amber-900/30 border-amber-500/70 hover:bg-amber-900/40 ring-1 ring-amber-500/40'
            : 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-mono tracking-wider text-amber-300 uppercase font-semibold">Active Alerts</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-300">
            {activeAlertsCount}
          </span>
          <span className="text-xs text-amber-400/90 font-mono">
            {isInsideRisk ? 'CRITICAL RISK' : isApproachingRisk ? 'HIGH ADVISORY' : 'ADVISORY'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-amber-300/90 font-mono mt-1 pt-1 border-t border-amber-500/30">
          <span>Click to View Evidence</span>
          <span className="text-xs">→</span>
        </div>
      </div>

    </div>
  );
}
