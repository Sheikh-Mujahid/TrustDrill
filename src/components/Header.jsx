import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Radio, 
  Search, 
  Maximize2, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  HelpCircle, 
  User, 
  ChevronDown, 
  Bell, 
  Database,
  Flame,
  Layers,
  Terminal,
  Compass
} from 'lucide-react';

export default function Header({ 
  currentDepth, 
  isSimulating, 
  onToggleSimulation, 
  onResetSimulation, 
  onOpenPresentation, 
  onStartGuidedTour,
  onOpenSearch,
  onOpenEvidence,
  activeAlertCount = 1
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC+05:30');
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0B111E]/95 border-b border-slate-800/80 backdrop-blur-md px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Branding & Enterprise Context */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-slate-900 border border-cyan-500/40 shadow-inner group">
            {/* Tech Icon */}
            <div className="absolute inset-0 bg-cyan-400/10 rounded-lg animate-pulse" />
            <Compass className="w-5 h-5 text-cyan-400 transform group-hover:rotate-45 transition-transform duration-300" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0B111E]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-wider text-white font-mono flex items-center gap-1.5">
                TRUST<span className="text-cyan-400">DRILL</span>
                <span className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 uppercase tracking-wider">
                  ENTERPRISE v2.4
                </span>
              </span>
              <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300 font-mono">
                PS 26121
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Oil India Limited (OIL)</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-300/90">eRTMAC–NWIS</span>
              <span className="text-slate-600">•</span>
              <span className="hidden md:inline text-slate-400">Nahorkatiya-Digboi Block</span>
            </p>
          </div>
        </div>

        {/* Center: System Status telemetry badges */}
        <div className="hidden xl:flex items-center gap-3 bg-slate-900/80 px-3.5 py-1.5 rounded-lg border border-slate-800/90 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-emerald-400 tracking-wide font-mono">SYSTEM ONLINE</span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>eRTMAC Feed:</span>
            <span className="text-cyan-300">420ms</span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>WITSML:</span>
            <span className="text-emerald-400">SYNCED</span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="text-[11px] text-slate-400 font-mono">
            {currentTime}
          </div>
        </div>

        {/* Right: Actions, Simulation Controls, Presentation & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Global Search Shortcut */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 transition-colors cursor-pointer group"
            title="Global Search (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <span className="hidden md:inline text-slate-400">Search Wells / Docs...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400 font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* SIH Guided Demo Flow Button */}
          <button
            onClick={onStartGuidedTour}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-500/50 text-cyan-200 text-xs font-medium transition-all shadow-sm shadow-cyan-950 cursor-pointer"
            title="Start Signature 11-Step SIH Judging Tour"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">SIH Demo Story</span>
            <span className="px-1 bg-cyan-400/20 text-cyan-300 rounded text-[10px] font-mono">11-Step</span>
          </button>

          {/* Simulation Toggle */}
          <button
            onClick={onToggleSimulation}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer border ${
              isSimulating
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700/90 border-slate-700 text-slate-200'
            }`}
            title="Toggle Live Drilling Telemetry Simulation"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{isSimulating ? 'Simulating...' : 'Simulate Drill'}</span>
          </button>

          {/* Presentation Mode (Projector SIH) */}
          <button
            onClick={onOpenPresentation}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-md bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
            title="Full-Screen Presentation Mode (Projector Optimized)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden md:inline">Presentation</span>
          </button>

          {/* Active Alerts Pill */}
          <button
            onClick={onOpenEvidence}
            className="relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-1.5 cursor-pointer"
            title="Active Historical Risk Alerts"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span className="font-mono font-bold text-amber-400">{activeAlertCount}</span>
            <span className="hidden lg:inline text-amber-200/90 text-[11px]">Advisory</span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                RB
              </div>
              <div className="hidden xl:block">
                <div className="text-[11px] font-medium text-slate-200 leading-tight">Er. R. Borah</div>
                <div className="text-[9px] text-slate-400">Chief Drilling Eng. (OIL)</div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500 hidden sm:block" />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-3 text-xs z-50">
                <div className="border-b border-slate-800 pb-2 mb-2">
                  <div className="font-semibold text-slate-100">Er. Rupjyoti Borah</div>
                  <div className="text-[11px] text-slate-400">Superintending Engineer (Drilling)</div>
                  <div className="text-[10px] text-cyan-400 font-mono mt-0.5">OIL Duliajan Headquarters</div>
                </div>
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between py-1 text-[11px]">
                    <span className="text-slate-400">Clearance Level:</span>
                    <span className="text-emerald-400 font-mono">Class-1 Enterprise</span>
                  </div>
                  <div className="flex justify-between py-1 text-[11px]">
                    <span className="text-slate-400">eRTMAC Station:</span>
                    <span className="text-cyan-300 font-mono">Console #04 (Assam)</span>
                  </div>
                  <div className="flex justify-between py-1 text-[11px]">
                    <span className="text-slate-400">Active Well:</span>
                    <span className="text-white font-mono">TRUST-01</span>
                  </div>
                </div>
                <div className="border-t border-slate-800 pt-2 mt-2 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>TLS 1.3 Certified</span>
                  <span className="text-cyan-500">SIH 2026</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
