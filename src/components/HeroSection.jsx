import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  FileText, 
  Cpu, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  Play, 
  CheckCircle2, 
  ChevronRight,
  Shield,
  Activity,
  HardDrive
} from 'lucide-react';

export default function HeroSection({ onScrollToCommandCenter, onStartGuidedTour }) {
  const [activeStep, setActiveStep] = useState(3); // default highlight AI Correlation

  const pipelineSteps = [
    {
      id: 1,
      title: 'ACTIVE WELL',
      subtitle: 'Real-Time WITSML',
      desc: 'Live telemetry stream (Depth, ROP, Torque, WOB, Mud Weight) from eRTMAC rig sensors.',
      icon: Compass,
      tag: 'eRTMAC Live Feed',
      metrics: '3,420 m MD • Barail Sand'
    },
    {
      id: 2,
      title: 'NEARBY OFFSET WELLS',
      subtitle: 'Spatial PostGIS Index',
      desc: 'Dynamic spatial radius & structural dip alignment across historical exploratory & development wells.',
      icon: MapPin,
      tag: '5 Offset Wells • 5km Radius',
      metrics: 'NHK-142 (1.1km) • DIG-88 (2.3km)'
    },
    {
      id: 3,
      title: 'HISTORICAL KNOWLEDGE',
      subtitle: 'OCR & NER Ingestion',
      desc: 'Synthesizing Well Completion Reports (WCR), Daily Drilling Reports (DDR), mud logs, and NPT records.',
      icon: FileText,
      tag: '14 Extracted Incidents',
      metrics: 'WCR/DDR PDFs • 98.4% Confidence'
    },
    {
      id: 4,
      title: 'AI CORRELATION',
      subtitle: 'Depth & Formation Match',
      desc: 'Stratigraphic formation alignment correlating lithological risk signatures at bit depth.',
      icon: Cpu,
      tag: 'ML Multi-Vector Correlation',
      metrics: '94% Similarity Index'
    },
    {
      id: 5,
      title: 'RISK INTELLIGENCE',
      subtitle: 'Proactive Alert & Action',
      desc: 'Predictive hazard warnings with verified historical evidence, casing advisories, and LCM pill formulas.',
      icon: AlertTriangle,
      tag: 'Advisory Decision Support',
      metrics: '30m Lead Time • Zero NPT'
    }
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-12 border-b border-slate-800/80 bg-gradient-to-b from-[#0B111E] via-[#0F172A] to-[#0B111E]">
      {/* Background Subtle Industrial Grid & Glowing Accent */}
      <div className="absolute inset-0 bg-tech-grid opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
      
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Top Tag & Enterprise Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>OIL INDIA LIMITED • SMART INDIA HACKATHON 2026 (PS 26121)</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Advisory Decision Support</span>
            </span>
            <span>•</span>
            <span className="text-slate-300">IEC 62682 Industrial Alarm Standard</span>
          </div>
        </div>

        {/* Hero Title & Value Proposition */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-3 font-mono">
            TRUST<span className="text-cyan-400">DRILL</span>
          </h1>
          <h2 className="text-sm sm:text-base lg:text-lg font-semibold tracking-wider text-cyan-200/90 uppercase mb-3 font-mono">
            AI-POWERED OFFSET-WELL INTELLIGENCE & PREDICTIVE DRILLING RISK PLATFORM
          </h2>
          <p className="text-lg sm:text-2xl font-light italic text-slate-300 tracking-wide mb-6">
            “KNOW WHAT HAPPENED. PREDICT WHAT’S NEXT.”
          </p>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate non-productive time (NPT) and severe drilling dysfunctions. TrustDrill continuously correlates real-time active telemetry with historical offset-well reports to predict lost circulation, stuck pipe, and pressure anomalies before the bit penetrates high-risk intervals.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
            <button
              onClick={onScrollToCommandCenter}
              className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all duration-200 shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer group"
            >
              <span>Launch Command Center</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onStartGuidedTour}
              className="px-5 py-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-100 font-medium text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Play className="w-4 h-4 text-cyan-400" />
              <span>SIH 11-Step Signature Demo</span>
            </button>
          </div>
        </div>

        {/* Sophisticated Pipeline Architecture Visualization */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-7 shadow-2xl relative">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                Continuous Offset-Well Knowledge Pipeline
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
              Interactive Flow: Click any step to inspect mechanism
            </div>
          </div>

          {/* Connected Steps Grid / Flow */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              const isSelected = activeStep === step.id;
              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`relative rounded-lg p-3.5 cursor-pointer transition-all duration-300 border ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-400 shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-500/50'
                      : 'bg-slate-900/60 hover:bg-slate-800/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Subtle step numbering badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      0{step.id}
                    </span>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  </div>

                  {/* Title & Subtitle */}
                  <h4 className="text-xs font-bold text-white font-mono leading-tight mb-0.5">
                    {step.title}
                  </h4>
                  <div className="text-[10px] text-cyan-400/90 font-mono mb-2">
                    {step.subtitle}
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-slate-300 leading-snug mb-3">
                    {step.desc}
                  </p>

                  {/* Metric pill */}
                  <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span className="truncate">{step.metrics}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </div>

                  {/* Visual Connection Arrow between steps on desktop */}
                  {idx < pipelineSteps.length - 1 && (
                    <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-20 text-cyan-500/70">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Step Deep-Dive Banner */}
          <div className="mt-4 p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="font-mono text-cyan-300 font-semibold">
                Step 0{pipelineSteps[activeStep - 1].id}: {pipelineSteps[activeStep - 1].title}
              </span>
              <span className="text-slate-400 hidden sm:inline">— {pipelineSteps[activeStep - 1].desc}</span>
            </div>
            <div className="text-slate-400 font-mono text-[11px] flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
                {pipelineSteps[activeStep - 1].tag}
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
