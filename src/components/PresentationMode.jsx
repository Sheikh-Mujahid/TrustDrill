import React, { useEffect } from 'react';
import { 
  X, 
  Compass, 
  Radio, 
  AlertTriangle, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Activity, 
  ShieldAlert,
  Play,
  RotateCcw,
  FileCheck2
} from 'lucide-react';
import InteractiveWellMap from './InteractiveWellMap';
import LiveRiskPanel from './LiveRiskPanel';

export default function PresentationMode({ 
  isOpen, 
  onClose, 
  activeWell, 
  offsetWells, 
  selectedWell, 
  onSelectOffsetWell, 
  currentDepth, 
  upcomingRiskZone,
  onOpenEvidence,
  isSimulating,
  onToggleSimulation
}) {
  // Listen for Escape key to close
  useEffect(() => {
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
    <div className="fixed inset-0 z-50 bg-[#070B13] text-white flex flex-col p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200">
      
      {/* Top Presentation Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500 text-cyan-400">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-mono tracking-wider text-white">
              TRUST<span className="text-cyan-400">DRILL</span> COMMAND CENTER
            </h1>
            <p className="text-xs text-slate-300 font-mono">
              Oil India Limited • eRTMAC-NWIS | Smart India Hackathon Problem Statement 26121
            </p>
          </div>
        </div>

        {/* Presentation Telemetry & Status Badges */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>PROJECTOR PRESENTATION MODE</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Depth: <strong>{currentDepth.toFixed(1)} m MD</strong></span>
          </div>

          <button
            onClick={onToggleSimulation}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer border flex items-center gap-1.5 ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isSimulating ? 'Simulating...' : 'Drill Sim'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            title="Exit Presentation Mode (Esc)"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Exit (Esc)</span>
          </button>
        </div>
      </div>

      {/* Main Center Area: 70% Map & 30% Risk Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        
        {/* CENTER: Large Live Well Map (70% on desktop) */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
          <InteractiveWellMap
            activeWell={activeWell}
            offsetWells={offsetWells}
            selectedWell={selectedWell}
            onSelectOffsetWell={onSelectOffsetWell}
            currentDepth={currentDepth}
          />
        </div>

        {/* RIGHT: Live Risk Intelligence (30% on desktop) */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
          <LiveRiskPanel
            currentDepth={currentDepth}
            upcomingRiskZone={upcomingRiskZone}
            onOpenEvidence={onOpenEvidence}
            onSelectOffsetWell={onSelectOffsetWell}
            offsetWells={offsetWells}
          />
        </div>

      </div>

      {/* Bottom Telemetry Strip for Projector */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 shrink-0 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs font-mono">
        <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
          <span className="text-slate-400">ROP:</span>
          <span className="text-emerald-400 font-bold text-sm">{activeWell.telemetry.rop} m/h</span>
        </div>
        <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
          <span className="text-slate-400">Torque:</span>
          <span className="text-cyan-400 font-bold text-sm">{activeWell.telemetry.torque} kNm</span>
        </div>
        <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
          <span className="text-slate-400">WOB:</span>
          <span className="text-white font-bold text-sm">{activeWell.telemetry.wob} klbs</span>
        </div>
        <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
          <span className="text-slate-400">Mud Weight:</span>
          <span className="text-amber-400 font-bold text-sm">{activeWell.telemetry.mudWeight} ppg</span>
        </div>
        <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center col-span-2 sm:col-span-2">
          <span className="text-slate-400">Decision Support Standard:</span>
          <span className="text-cyan-300">IEC 62682 Human-in-the-Loop</span>
        </div>
      </div>

    </div>
  );
}
