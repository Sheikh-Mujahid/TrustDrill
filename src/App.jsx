import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import TopKpiCards from './components/TopKpiCards';
import InteractiveWellMap from './components/InteractiveWellMap';
import LiveRiskPanel from './components/LiveRiskPanel';
import OffsetWellIntelligenceDrawer from './components/OffsetWellIntelligenceDrawer';
import EvidenceModal from './components/EvidenceModal';
import EngineeringAnalytics from './components/EngineeringAnalytics';
import HistoricalEventTimeline from './components/HistoricalEventTimeline';
import CrossWellComparison from './components/CrossWellComparison';
import TrustDrillCopilot from './components/TrustDrillCopilot';
import GuidedDemoStory from './components/GuidedDemoStory';
import PresentationMode from './components/PresentationMode';
import CommandPalette from './components/CommandPalette';
import Footer from './components/Footer';

import { 
  ACTIVE_WELL, 
  OFFSET_WELLS, 
  UPCOMING_RISK_ZONE, 
  SIMULATION_STEPS, 
  DEPTH_TELEMETRY_SERIES 
} from './data/drillingData';

import { 
  Compass, 
  ChevronRight, 
  Layers, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw,
  Play,
  Pause,
  ArrowRight,
  Database
} from 'lucide-react';

export default function App() {
  // Telemetry & Simulation state
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentDepth, setCurrentDepth] = useState(3420.0);
  const [activeWellData, setActiveWellData] = useState(ACTIVE_WELL);

  // UI Panels & Modals State
  const [selectedOffsetWell, setSelectedOffsetWell] = useState(null);
  const [selectedEvidenceDoc, setSelectedEvidenceDoc] = useState(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isPresentationModeOpen, setIsPresentationModeOpen] = useState(false);
  const [isGuidedTourOpen, setIsGuidedTourOpen] = useState(false);
  const [guidedStep, setGuidedStep] = useState(1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTabBelow, setActiveTabBelow] = useState('ALL'); // 'ALL' | 'TELEMETRY' | 'TIMELINE' | 'CROSSWELL' | 'COPILOT'
  const [copilotQuery, setCopilotQuery] = useState('What happened near 3,500 m?');

  const commandCenterRef = useRef(null);
  const copilotRef = useRef(null);

  // Global Keyboard Shortcuts (Ctrl+K for Search, Escape for Modals)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsEvidenceModalOpen(false);
        setIsPresentationModeOpen(false);
        setSelectedOffsetWell(null);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Simulation step progression
  useEffect(() => {
    let timer = null;
    if (isSimulating) {
      timer = setInterval(() => {
        setSimulationIndex(prev => {
          const next = (prev + 1) % SIMULATION_STEPS.length;
          applySimulationStep(next);
          return next;
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isSimulating]);

  const applySimulationStep = (index) => {
    const stepData = SIMULATION_STEPS[index];
    setCurrentDepth(stepData.depth);
    setActiveWellData(prev => ({
      ...prev,
      currentDepth: stepData.depth,
      currentTVD: stepData.tvd,
      telemetry: {
        ...prev.telemetry,
        rop: stepData.rop,
        torque: stepData.torque,
        wob: stepData.wob,
        mudWeight: stepData.mudWeight,
        flowOut: stepData.rop < 9 ? 560 : 620,
        pitVolume: 142.5 + stepData.pitVolumeDelta
      }
    }));
  };

  const handleToggleSimulation = () => {
    setIsSimulating(!isSimulating);
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setSimulationIndex(0);
    applySimulationStep(0);
  };

  const scrollToCommandCenter = () => {
    if (commandCenterRef.current) {
      commandCenterRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToCopilot = () => {
    if (copilotRef.current) {
      copilotRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Guided Demo Story 11-step execution logic
  const handleExecuteGuidedStep = (stepNumber) => {
    switch(stepNumber) {
      case 1:
        // Step 1: Select TRUST-01
        handleResetSimulation();
        setSelectedOffsetWell(null);
        scrollToCommandCenter();
        break;
      case 2:
        // Step 2: Show nearby offset wells
        setSelectedOffsetWell(null);
        scrollToCommandCenter();
        break;
      case 3:
        // Step 3: Open WELL-B
        setSelectedOffsetWell(OFFSET_WELLS[0]); // OIL-NHK-142
        break;
      case 4:
        // Step 4: Show historical lost-circulation event
        setSelectedOffsetWell(OFFSET_WELLS[0]);
        break;
      case 5:
        // Step 5: Start drilling simulation
        setIsSimulating(true);
        break;
      case 6:
        // Step 6: Depth increases: 3,420m → 3,430m → 3,440m → 3,450m
        applySimulationStep(2); // 3,440 m
        break;
      case 7:
        // Step 7: System detects approaching historical risk zone
        applySimulationStep(3); // 3,448 m
        break;
      case 8:
        // Step 8: Display “HISTORICAL RISK ZONE APPROACHING”
        applySimulationStep(4); // 3,455 m (Inside risk)
        break;
      case 9:
        // Step 9: AI Copilot explains multi-well context
        setCopilotQuery('Three relevant offset wells recorded significant drilling events within this interval.');
        setActiveTabBelow('ALL');
        setTimeout(() => {
          scrollToCopilot();
        }, 300);
        break;
      case 10:
        // Step 10: Click VIEW EVIDENCE
        setSelectedEvidenceDoc(OFFSET_WELLS[0].documents[0]);
        setIsEvidenceModalOpen(true);
        break;
      case 11:
        // Step 11: Show historical event records and source documents
        setSelectedEvidenceDoc(OFFSET_WELLS[0].documents[0]);
        setIsEvidenceModalOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex flex-col font-sans">
      
      {/* 1. STICKY ENTERPRISE HEADER */}
      <Header
        currentDepth={currentDepth}
        isSimulating={isSimulating}
        onToggleSimulation={handleToggleSimulation}
        onResetSimulation={handleResetSimulation}
        onOpenPresentation={() => setIsPresentationModeOpen(true)}
        onStartGuidedTour={() => setIsGuidedTourOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenEvidence={() => {
          setSelectedEvidenceDoc(null);
          setIsEvidenceModalOpen(true);
        }}
        activeAlertCount={currentDepth >= 3440 ? 2 : 1}
      />

      {/* 2. HOMEPAGE HERO SECTION */}
      <HeroSection
        onScrollToCommandCenter={scrollToCommandCenter}
        onStartGuidedTour={() => {
          setIsGuidedTourOpen(true);
          setGuidedStep(1);
          handleExecuteGuidedStep(1);
        }}
      />

      {/* 3. COMMAND CENTER (VISUAL CENTERPIECE) */}
      <main ref={commandCenterRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6 flex-1">
        
        {/* Enterprise Breadcrumb & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500">Asset:</span>
            <span className="text-slate-300">Upper Assam Basin</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-300">Nahorkatiya-Digboi Shelf</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-cyan-400 font-bold">Active Well: TRUST-01</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-amber-400">Section: 8-1/2" Production Hole</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 hidden sm:inline">Data Integrity:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>eRTMAC Verified</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">WITSML v2.0 Stream</span>
          </div>
        </div>

        {/* TOP KPI CARDS */}
        <TopKpiCards
          currentDepth={currentDepth}
          activeWell={activeWellData}
          offsetWellsCount={OFFSET_WELLS.length}
          activeIncidentsCount={14}
          riskZonesAheadCount={2}
          activeAlertsCount={currentDepth >= 3440 ? 2 : 1}
          onOpenEvidence={() => {
            setSelectedEvidenceDoc(null);
            setIsEvidenceModalOpen(true);
          }}
          onSelectOffsetWell={(well) => setSelectedOffsetWell(well)}
        />

        {/* MAIN COMMAND CENTER SPLIT AREA (70% MAP : 30% RISK PANEL) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* 70% MAP ON DESKTOP */}
          <div className="lg:col-span-8">
            <InteractiveWellMap
              activeWell={activeWellData}
              offsetWells={OFFSET_WELLS}
              selectedWell={selectedOffsetWell}
              onSelectOffsetWell={(well) => setSelectedOffsetWell(well)}
              currentDepth={currentDepth}
            />
          </div>

          {/* 30% LIVE RISK INTELLIGENCE ON DESKTOP */}
          <div className="lg:col-span-4">
            <LiveRiskPanel
              currentDepth={currentDepth}
              upcomingRiskZone={UPCOMING_RISK_ZONE}
              onOpenEvidence={() => {
                setSelectedEvidenceDoc(null);
                setIsEvidenceModalOpen(true);
              }}
              onSelectOffsetWell={(well) => setSelectedOffsetWell(well)}
              offsetWells={OFFSET_WELLS}
            />
          </div>

        </div>

        {/* BELOW SECTION NAVIGATION BAR */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 pt-4 gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white uppercase tracking-wider text-sm">
              ENGINEERING INTELLIGENCE SUITE
            </span>
          </div>

          {/* Section view switcher */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-1 gap-1">
            <button
              onClick={() => setActiveTabBelow('ALL')}
              className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeTabBelow === 'ALL' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unified View
            </button>
            <button
              onClick={() => setActiveTabBelow('TELEMETRY')}
              className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeTabBelow === 'TELEMETRY' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Telemetry Logs
            </button>
            <button
              onClick={() => setActiveTabBelow('TIMELINE')}
              className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeTabBelow === 'TIMELINE' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Event Timeline
            </button>
            <button
              onClick={() => setActiveTabBelow('CROSSWELL')}
              className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeTabBelow === 'CROSSWELL' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cross-Well
            </button>
            <button
              onClick={() => setActiveTabBelow('COPILOT')}
              className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeTabBelow === 'COPILOT' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              AI Copilot
            </button>
          </div>
        </div>

        {/* SECTION 1: LIVE DRILLING PARAMETERS (ENGINEERING CHARTS) */}
        {(activeTabBelow === 'ALL' || activeTabBelow === 'TELEMETRY') && (
          <EngineeringAnalytics
            telemetrySeries={DEPTH_TELEMETRY_SERIES}
            currentDepth={currentDepth}
          />
        )}

        {/* SECTION 2: HISTORICAL EVENT TIMELINE */}
        {(activeTabBelow === 'ALL' || activeTabBelow === 'TIMELINE') && (
          <HistoricalEventTimeline
            offsetWells={OFFSET_WELLS}
            onOpenEvidence={() => {
              setSelectedEvidenceDoc(null);
              setIsEvidenceModalOpen(true);
            }}
            onSelectOffsetWell={(well) => setSelectedOffsetWell(well)}
          />
        )}

        {/* SECTION 3: CROSS-WELL COMPARISON TABLE */}
        {(activeTabBelow === 'ALL' || activeTabBelow === 'CROSSWELL') && (
          <CrossWellComparison
            activeWell={activeWellData}
            offsetWells={OFFSET_WELLS}
            onSelectOffsetWell={(well) => setSelectedOffsetWell(well)}
            onOpenEvidence={() => {
              setSelectedEvidenceDoc(null);
              setIsEvidenceModalOpen(true);
            }}
          />
        )}

        {/* SECTION 4: AI COPILOT */}
        <div ref={copilotRef}>
          {(activeTabBelow === 'ALL' || activeTabBelow === 'COPILOT') && (
            <TrustDrillCopilot
              onOpenEvidence={() => {
                setSelectedEvidenceDoc(null);
                setIsEvidenceModalOpen(true);
              }}
              onSelectOffsetWell={(well) => setSelectedOffsetWell(well)}
              offsetWells={OFFSET_WELLS}
              externalQuery={copilotQuery}
            />
          )}
        </div>

      </main>

      {/* FOOTER */}
      <Footer
        onOpenEvidence={() => {
          setSelectedEvidenceDoc(null);
          setIsEvidenceModalOpen(true);
        }}
        onStartGuidedTour={() => setIsGuidedTourOpen(true)}
        onOpenPresentation={() => setIsPresentationModeOpen(true)}
      />

      {/* SLIDE-OVER OFFSET WELL INTELLIGENCE DRAWER */}
      {selectedOffsetWell && (
        <OffsetWellIntelligenceDrawer
          well={selectedOffsetWell}
          onClose={() => setSelectedOffsetWell(null)}
          onOpenDocumentEvidence={(doc) => {
            setSelectedEvidenceDoc(doc);
            setIsEvidenceModalOpen(true);
          }}
        />
      )}

      {/* HISTORICAL EVIDENCE & WCR DOSSIER MODAL */}
      <EvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => {
          setIsEvidenceModalOpen(false);
          setSelectedEvidenceDoc(null);
        }}
        activeWell={activeWellData}
        upcomingRiskZone={UPCOMING_RISK_ZONE}
        documentData={selectedEvidenceDoc}
      />

      {/* PRESENTATION MODE (PROJECTOR OPTIMIZED FOR SIH) */}
      <PresentationMode
        isOpen={isPresentationModeOpen}
        onClose={() => setIsPresentationModeOpen(false)}
        activeWell={activeWellData}
        offsetWells={OFFSET_WELLS}
        selectedWell={selectedOffsetWell}
        onSelectOffsetWell={(well) => setSelectedOffsetWell(well)}
        currentDepth={currentDepth}
        upcomingRiskZone={UPCOMING_RISK_ZONE}
        onOpenEvidence={() => {
          setSelectedEvidenceDoc(null);
          setIsEvidenceModalOpen(true);
        }}
        isSimulating={isSimulating}
        onToggleSimulation={handleToggleSimulation}
      />

      {/* GUIDED DEMO STORY CONTROLLER (11-STEP SIH JUDGING WALKTHROUGH) */}
      <GuidedDemoStory
        isOpen={isGuidedTourOpen}
        onClose={() => setIsGuidedTourOpen(false)}
        currentStep={guidedStep}
        setCurrentStep={setGuidedStep}
        onExecuteStepAction={handleExecuteGuidedStep}
        onResetDemo={() => {
          setGuidedStep(1);
          handleExecuteGuidedStep(1);
        }}
      />

      {/* GLOBAL COMMAND PALETTE (CTRL+K SEARCH) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        offsetWells={OFFSET_WELLS}
        onSelectOffsetWell={(well) => {
          setSelectedOffsetWell(well);
          setIsSearchOpen(false);
        }}
        onOpenEvidence={() => {
          setSelectedEvidenceDoc(null);
          setIsEvidenceModalOpen(true);
          setIsSearchOpen(false);
        }}
        onOpenPresentation={() => {
          setIsPresentationModeOpen(true);
          setIsSearchOpen(false);
        }}
        onStartGuidedTour={() => {
          setIsGuidedTourOpen(true);
          setIsSearchOpen(false);
        }}
      />

    </div>
  );
}
