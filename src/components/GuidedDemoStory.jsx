import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Layers, 
  X, 
  Sparkles, 
  Compass, 
  FileCheck2,
  AlertTriangle,
  Flame,
  ArrowRight
} from 'lucide-react';

export default function GuidedDemoStory({ 
  isOpen, 
  onClose, 
  currentStep, 
  setCurrentStep, 
  onExecuteStepAction,
  onResetDemo
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const demoSteps = [
    {
      step: 1,
      title: 'Select Active Well (TRUST-01)',
      shortDesc: 'Establish real-time baseline',
      longDesc: 'Chief Drilling Engineer inspects TRUST-01 active exploratory well at 3,420 m MD in Nahorkatiya Extension Block.',
      actionLabel: 'Focus TRUST-01'
    },
    {
      step: 2,
      title: 'Show Nearby Offset Wells',
      shortDesc: 'Spatial 5km query',
      longDesc: 'PostGIS engine queries 5 surrounding offset wells within 5.0 km radius, ranking them by stratigraphic similarity.',
      actionLabel: 'Display Offsets'
    },
    {
      step: 3,
      title: 'Open Well-B (OIL-NHK-142)',
      shortDesc: 'Inspect closest analog',
      longDesc: 'Select WELL-B located 1.1 km NE with 94% multi-parameter geological similarity.',
      actionLabel: 'Open Well-B'
    },
    {
      step: 4,
      title: 'Show Historical Lost-Circulation Event',
      shortDesc: 'Barail sandstone fracture',
      longDesc: 'Surface historical incident at 3,485 m in NHK-142: 42 m³ lost circulation, 36 hours NPT, ₹48.5L impact.',
      actionLabel: 'Inspect Incident'
    },
    {
      step: 5,
      title: 'Start Drilling Simulation',
      shortDesc: 'eRTMAC telemetry feed',
      longDesc: 'Initiate continuous penetration rate simulation. Drill bit advances through Upper Barail siltstones.',
      actionLabel: 'Start Simulation'
    },
    {
      step: 6,
      title: 'Depth Increments (3,420m → 3,450m)',
      shortDesc: 'Active penetration',
      longDesc: 'Telemetry steps from 3,420m → 3,430m → 3,440m → 3,450m. Real-time ROP decreases as torque begins oscillation.',
      actionLabel: 'Advance Depth'
    },
    {
      step: 7,
      title: 'System Detects Approaching Risk Zone',
      shortDesc: 'Spatial hazard boundary',
      longDesc: 'At 3,445 m, TrustDrill predictive boundary triggers: bit is within 5 meters of historical Barail fracture interface.',
      actionLabel: 'Trigger Detection'
    },
    {
      step: 8,
      title: 'Display: “HISTORICAL RISK ZONE APPROACHING”',
      shortDesc: 'Industrial IEC 62682 alert',
      longDesc: 'High-visibility drilling control intelligence alert surfaces on main console: 3,450–3,520 m interval active.',
      actionLabel: 'View Alert Banner'
    },
    {
      step: 9,
      title: 'AI Copilot Explains Multi-Well Context',
      shortDesc: 'Automated synthesis',
      longDesc: 'TrustDrill Copilot explains: “Three relevant offset wells recorded significant drilling events within this interval.”',
      actionLabel: 'Consult Copilot'
    },
    {
      step: 10,
      title: 'Click “VIEW EVIDENCE”',
      shortDesc: 'Drilling engineer audit',
      longDesc: 'Operator clicks VIEW EVIDENCE on the advisory alert to inspect primary archival source records.',
      actionLabel: 'Click View Evidence'
    },
    {
      step: 11,
      title: 'Display Source WCR & DDR Documents',
      shortDesc: 'Ground-truth verification',
      longDesc: 'Examine original Well Completion Report, DDR Tour Sheet, and Mud Logs with 98.4% OCR verification and engineer sign-offs.',
      actionLabel: 'Review Dossier'
    }
  ];

  // Auto-play timer (advance every 4.5 seconds)
  useEffect(() => {
    let timer = null;
    if (isPlaying && isOpen) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < 11) {
            const next = prev + 1;
            onExecuteStepAction(next);
            return next;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 4500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isOpen]);

  if (!isOpen) return null;

  const currentStepData = demoSteps[currentStep - 1] || demoSteps[0];

  const handleNext = () => {
    if (currentStep < 11) {
      const next = currentStep + 1;
      setCurrentStep(next);
      onExecuteStepAction(next);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      onExecuteStepAction(prev);
    }
  };

  const handleJumpToStep = (s) => {
    setCurrentStep(s);
    onExecuteStepAction(s);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[480px] z-50 bg-[#0B111E]/95 border-2 border-cyan-500 rounded-xl shadow-2xl p-4 backdrop-blur-xl animate-in slide-in-from-bottom duration-300">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
            SIH 2026 SIGNATURE DEMO STORY (11 STEPS)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onResetDemo();
              setIsPlaying(false);
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            title="Close Walkthrough"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-3">
        <div 
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
          style={{ width: `${(currentStep / 11) * 100}%` }}
        />
      </div>

      {/* Step Number & Title */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs font-mono mb-0.5">
          <span className="text-cyan-400 font-bold">
            STEP {currentStep} OF 11
          </span>
          <span className="text-slate-400 text-[11px]">
            {currentStepData.shortDesc}
          </span>
        </div>
        <h4 className="text-sm font-bold text-white font-mono">
          {currentStepData.title}
        </h4>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 leading-relaxed mb-3.5 bg-slate-950/70 p-2.5 rounded border border-slate-800/80">
        {currentStepData.longDesc}
      </p>

      {/* Controls Strip */}
      <div className="flex items-center justify-between gap-2">
        {/* Play/Pause Auto-tour */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
          <span>{isPlaying ? 'Pause Auto' : 'Auto-Play'}</span>
        </button>

        {/* Prev / Next Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors cursor-pointer"
            title="Previous Step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNext}
            disabled={currentStep === 11}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer shadow-md"
          >
            <span>{currentStep === 11 ? 'Finished' : 'Next Step'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini Step Dots */}
      <div className="flex items-center justify-center gap-1 mt-3 pt-2 border-t border-slate-800/60">
        {demoSteps.map((s) => (
          <button
            key={s.step}
            onClick={() => handleJumpToStep(s.step)}
            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
              currentStep === s.step
                ? 'bg-cyan-400 scale-125'
                : currentStep > s.step
                ? 'bg-cyan-700'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
            title={`Step ${s.step}: ${s.title}`}
          />
        ))}
      </div>

    </div>
  );
}
