import React from 'react';
import { ShieldCheck, Compass, Radio, ExternalLink, HardDrive } from 'lucide-react';

export default function Footer({ onOpenEvidence, onStartGuidedTour, onOpenPresentation }) {
  return (
    <footer className="mt-12 border-t border-slate-800 bg-[#070B13] text-slate-400 font-mono text-xs">
      
      {/* Upper Footer: Enterprise Details & Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Col 1: Platform & Identity */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold tracking-wider text-white">
                TRUST<span className="text-cyan-400">DRILL</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                eRTMAC-NWIS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-md">
              AI-Powered Offset-Well Intelligence & Predictive Drilling Risk Platform. Designed for Oil India Limited (OIL) real-time drilling monitoring centers and rig floor engineering teams.
            </p>
            <div className="pt-2 text-cyan-300/90 text-xs italic font-sans font-semibold">
              “Decision Support — Not Autonomous Drilling Control.”
            </div>
          </div>

          {/* Col 2: Hackathon & Problem Statement */}
          <div className="space-y-1.5">
            <div className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">
              Smart India Hackathon 2026
            </div>
            <ul className="space-y-1 text-[11px] text-slate-400 font-sans">
              <li>• Problem Statement ID: <strong className="text-slate-200 font-mono">SIH26121</strong></li>
              <li>• Title: eRTMAC-NWIS Nearby Wells Intelligence</li>
              <li>• Ministry: Ministry of Petroleum & Natural Gas</li>
              <li>• Target Operator: Oil India Limited (OIL)</li>
            </ul>
          </div>

          {/* Col 3: Compliance & Architecture */}
          <div className="space-y-1.5">
            <div className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">
              System Governance
            </div>
            <ul className="space-y-1 text-[11px] text-slate-400 font-sans">
              <li>• Human-in-the-Loop Decision Support</li>
              <li>• Standard: IEC 62682 Alarm Management</li>
              <li>• Data Stream: WITSML 2.0 / ETP Real-time</li>
              <li>• Spatial Index: PostGIS Multi-well Correlator</li>
            </ul>
          </div>

        </div>

        {/* Lower Footer: Copyright & Sign-off */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © 2026 TRUSTDRILL™ • eRTMAC-NWIS Platform • Oil India Limited (OIL) Field Demonstration
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onStartGuidedTour}
              className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              SIH Demo Story
            </button>
            <span>•</span>
            <button 
              onClick={onOpenPresentation}
              className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Projector Mode
            </button>
            <span>•</span>
            <button 
              onClick={onOpenEvidence}
              className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Archival Evidence Pack
            </button>
          </div>
        </div>

      </div>

    </footer>
  );
}
