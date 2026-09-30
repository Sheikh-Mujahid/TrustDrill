import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  MapPin, 
  FileText, 
  AlertTriangle, 
  Layers, 
  Compass, 
  ArrowRight,
  Maximize2
} from 'lucide-react';

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  offsetWells, 
  onSelectOffsetWell, 
  onOpenEvidence, 
  onOpenPresentation,
  onStartGuidedTour 
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Handle Ctrl+K shortcut globally
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    { title: 'Launch SIH 11-Step Signature Demo Story', type: 'ACTION', handler: onStartGuidedTour, icon: Layers },
    { title: 'Enter Full-Screen Projector Presentation Mode', type: 'ACTION', handler: onOpenPresentation, icon: Maximize2 },
    { title: 'Inspect Historical Barail Loss Evidence Dossier', type: 'EVIDENCE', handler: onOpenEvidence, icon: FileText }
  ];

  const searchableItems = [
    ...offsetWells.map(w => ({
      title: `${w.officialName} (${w.id}) — ${w.distanceKm} km ${w.direction}`,
      subtitle: `Formation: ${w.primaryFormation} • Similarity: ${w.similarityScore}% • ${w.incidents.length} Incidents`,
      type: 'WELL',
      item: w,
      icon: MapPin,
      handler: () => onSelectOffsetWell(w)
    })),
    {
      title: 'Barail Sandstone (Upper Fractured Member)',
      subtitle: 'Target formation at 3,450–3,520 m with known mud loss zones',
      type: 'FORMATION',
      icon: Layers,
      handler: onOpenEvidence
    },
    {
      title: 'Severe Lost Circulation Incident (42 m³ lost @ 3,485m)',
      subtitle: 'Recorded in offset well OIL-NHK-142 with 36 hrs NPT',
      type: 'INCIDENT',
      icon: AlertTriangle,
      handler: onOpenEvidence
    },
    {
      title: 'Well Completion Report (WCR) - OIL-NHK-142-RevC.pdf',
      subtitle: '142-page verified technical archive document with OCR extraction',
      type: 'DOCUMENT',
      icon: FileText,
      handler: onOpenEvidence
    }
  ];

  const filteredItems = searchTerm.trim() === '' 
    ? searchableItems 
    : searchableItems.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0B111E] border border-cyan-500/60 rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
        
        {/* Search Bar Input */}
        <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search offset wells, formations, incidents, reports, or commands..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {/* Quick Actions Header */}
          {searchTerm.trim() === '' && (
            <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              Suggested Enterprise Actions:
            </div>
          )}

          {searchTerm.trim() === '' && quickActions.map((qa, i) => {
            const Icon = qa.icon;
            return (
              <div
                key={i}
                onClick={() => {
                  qa.handler();
                  onClose();
                }}
                className="p-2.5 rounded-lg hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-slate-300 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
                  <span className="font-sans text-xs text-white">{qa.title}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400" />
              </div>
            );
          })}

          <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-2">
            Search Results ({filteredItems.length}):
          </div>

          {filteredItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => {
                  item.handler();
                  onClose();
                }}
                className="p-2.5 rounded-lg hover:bg-slate-800/80 cursor-pointer flex items-start justify-between text-slate-300 transition-colors group"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-slate-900 border border-slate-800 text-cyan-400 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">{item.title}</div>
                    <div className="text-[11px] text-slate-400 font-sans mt-0.5">{item.subtitle}</div>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-400 uppercase">
                  {item.type}
                </span>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No matching offset records found for "{searchTerm}"
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
          <span>Tip: Press [Esc] to exit search</span>
          <span className="text-cyan-500">PostGIS eRTMAC Search Index</span>
        </div>

      </div>
    </div>
  );
}
