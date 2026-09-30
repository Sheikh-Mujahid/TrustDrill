import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Search, 
  FileCheck2, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { COPILOT_KNOWLEDGE_BASE } from '../data/drillingData';

export default function TrustDrillCopilot({ 
  onOpenEvidence, 
  onSelectOffsetWell, 
  offsetWells,
  externalQuery
}) {
  const [activeQuery, setActiveQuery] = useState(externalQuery || 'What happened near 3,500 m?');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState(COPILOT_KNOWLEDGE_BASE[0]);

  React.useEffect(() => {
    if (externalQuery) {
      handleSelectQuestion(externalQuery);
    }
  }, [externalQuery]);

  const suggestedQuestions = [
    'What happened near 3,500 m?',
    'Three relevant offset wells in interval?',
    'Which wells experienced lost circulation?',
    'What are the relevant offset wells?',
    'Show evidence for this risk.'
  ];

  const handleSelectQuestion = (q) => {
    setActiveQuery(q);
    setIsTyping(true);
    setTimeout(() => {
      // Find matching knowledge base entry
      const match = COPILOT_KNOWLEDGE_BASE.find(item => 
        item.queryMatches.some(k => q.toLowerCase().includes(k))
      ) || COPILOT_KNOWLEDGE_BASE[0];
      setCurrentResponse(match);
      setIsTyping(false);
    }, 400);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const q = inputText.trim();
    setActiveQuery(q);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const match = COPILOT_KNOWLEDGE_BASE.find(item => 
        item.queryMatches.some(k => q.toLowerCase().includes(k))
      ) || {
        title: `Search Query: "${q}"`,
        insight: `Analysis across 5 offset wells in Nahorkatiya-Digboi sector reveals high correlation with Barail fractured sandstone behaviors. Historical data supports proactive LCM staging and controlled penetration parameters.`,
        evidence: `Extracted from 14 verified incident records in OIL central repository. Mean loss rate in sector: 2.4 m³/hr across 3 offset wells.`,
        sourceWells: ['WELL-B (OIL-NHK-142)', 'WELL-C (OIL-DIG-88)'],
        sourceDocuments: [
          { doc: 'WCR-OIL-NHK142-RevC.pdf', page: 'p. 48', note: 'Primary incident documentation' }
        ],
        confidence: '98.2%',
        recommendation: 'Observe strict mud weight limits and ensure 100 bbl CaCO3 pill is available on site.'
      };

      setCurrentResponse(match);
      setIsTyping(false);
    }, 500);
  };

  return (
    <div className="bg-[#0B111E] border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4 sm:p-5 flex flex-col">
      
      {/* Copilot Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative p-1.5 rounded-lg bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-500/50 text-cyan-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold font-mono tracking-wider text-white">
                TRUST<span className="text-cyan-400">DRILL</span> COPILOT
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                AI Knowledge Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans italic">
              “Ask your drilling knowledge base.”
            </p>
          </div>
        </div>

        {/* Subtle Evidence-Backed Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/70 text-emerald-300 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Evidence-Backed • {currentResponse.confidence} Confidence</span>
        </div>
      </div>

      {/* Suggested Questions Quick Chips */}
      <div className="mb-4">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Suggested Questions:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSelectQuestion(q)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                activeQuery === q
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/60 shadow-sm shadow-cyan-950'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              “{q}”
            </button>
          ))}
        </div>
      </div>

      {/* Structured AI Response Box */}
      <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 mb-4 space-y-4">
        
        {/* Active Query Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-mono text-xs sm:text-sm font-bold text-white">
              Q: “{activeQuery}”
            </span>
          </div>
          {isTyping && (
            <span className="text-[11px] font-mono text-cyan-400 animate-pulse flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Querying PostGIS & OCR Vector Store...</span>
            </span>
          )}
        </div>

        {isTyping ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs font-mono space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            <span>Retrieving verified offset evidence...</span>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* 1. INSIGHT */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1. INSIGHT</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                {currentResponse.insight}
              </p>
            </div>

            {/* 2. EVIDENCE */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>2. QUANTITATIVE EVIDENCE</span>
              </div>
              <div className="bg-amber-950/20 border border-amber-800/40 p-3 rounded-lg font-mono text-xs text-amber-200 leading-relaxed whitespace-pre-line">
                {currentResponse.evidence}
              </div>
            </div>

            {/* 3. SOURCE WELLS & 4. SOURCE DOCUMENTS (Split 2-col) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              
              {/* SOURCE WELLS */}
              <div className="space-y-1.5">
                <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3. SOURCE WELLS</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentResponse.sourceWells.map((sw) => (
                    <button
                      key={sw}
                      onClick={() => {
                        const target = offsetWells.find(w => sw.includes(w.id) || sw.includes(w.officialName));
                        if (target) onSelectOffsetWell(target);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-700 text-[11px] font-mono text-cyan-300 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>{sw}</span>
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* SOURCE DOCUMENTS */}
              <div className="space-y-1.5">
                <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>4. SOURCE DOCUMENTS</span>
                </div>
                <div className="space-y-1">
                  {currentResponse.sourceDocuments.map((sd, i) => (
                    <button
                      key={i}
                      onClick={onOpenEvidence}
                      className="w-full text-left p-1.5 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-600/60 text-[11px] font-mono text-slate-300 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate text-amber-300/90">
                        {sd.doc} <span className="text-slate-500 font-sans">({sd.page})</span>
                      </span>
                      <span className="text-[10px] text-cyan-400 shrink-0">View PDF</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Advisory Action Recommendation */}
            {currentResponse.recommendation && (
              <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-800/50 text-xs font-mono text-cyan-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>AI Mitigation Advisory:</strong> {currentResponse.recommendation}</span>
                </div>
                <button
                  onClick={onOpenEvidence}
                  className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] uppercase transition-colors shrink-0 cursor-pointer"
                >
                  Verify
                </button>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Custom Query Input Bar */}
      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about historical Barail kicks, stuck pipe, LCM pills, mud weight..."
            className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-slate-900 border border-slate-700/80 focus:border-cyan-500 focus:outline-none text-xs text-white placeholder-slate-500 font-sans transition-colors"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
}
