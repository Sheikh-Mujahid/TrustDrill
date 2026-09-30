import React from 'react';
import { 
  Columns3, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  FileCheck2, 
  Layers,
  ArrowRight
} from 'lucide-react';

export default function CrossWellComparison({ activeWell, offsetWells, onSelectOffsetWell, onOpenEvidence }) {
  const comparisonWells = [
    {
      well: activeWell,
      isActive: true,
      label: 'ACTIVE WELL',
      name: activeWell.id,
      distance: '0.0 km (Origin)',
      similarity: '100% (Subject)',
      targetDepth: `${activeWell.targetDepth} m`,
      currentDepth: `${activeWell.currentDepth} m`,
      barailTop: '3,410 m MD (Estimated 3,450m Main)',
      mudWeight: '10.4 ppg (Adjusting to 9.9–10.1)',
      bitType: '8-1/2" PDC Matrix (5x14 nozzles)',
      hazards: 'Barail loss zone approaching in 30 m',
      statusColor: 'text-cyan-400',
      actionPlan: 'Pre-stage 100 bbl CaCO3 LCM pill on pit #2'
    },
    ...offsetWells.slice(0, 3).map(w => ({
      well: w,
      isActive: false,
      label: 'OFFSET ANALOG',
      name: w.officialName,
      distance: `${w.distanceKm} km (${w.direction})`,
      similarity: `${w.similarityScore}% Multi-vector`,
      targetDepth: `${w.totalDepth} m TD`,
      currentDepth: `${w.totalDepth} m (Completed)`,
      barailTop: '3,445 m MD',
      mudWeight: '10.6 ppg (Caused induced loss)',
      bitType: '8-1/2" PDC / Roller Cone',
      hazards: w.incidents.map(i => i.type).join(' & '),
      statusColor: w.similarityScore > 90 ? 'text-amber-400' : 'text-slate-300',
      actionPlan: w.incidents[0]?.mitigation || 'Standard drilling protocol'
    }))
  ];

  return (
    <div className="bg-[#0B111E] border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4 sm:p-5">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-blue-950 border border-blue-800/60 text-blue-400">
            <Columns3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-100 uppercase">
              CROSS-WELL STRATIGRAPHIC & ENGINEERING COMPARISON
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Correlating Drilling Parameters, Mud Weight Windows & Mitigation Strategies
            </span>
          </div>
        </div>

        <button
          onClick={onOpenEvidence}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
        >
          <span>View Source WCR Dossiers</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Comparison Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
              <th className="p-3 w-44">Parameter / Metric</th>
              {comparisonWells.map((item, idx) => (
                <th key={item.name} className={`p-3 ${item.isActive ? 'bg-cyan-950/40 text-cyan-300 border-x border-cyan-800/40' : 'text-slate-200'}`}>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">{item.label}</div>
                  <div className="font-bold text-sm text-white">{item.name}</div>
                  <div className="text-[10px] font-normal text-cyan-400">{item.distance}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {/* Stratigraphic Similarity */}
            <tr className="hover:bg-slate-900/40 transition-colors">
              <td className="p-3 font-semibold text-slate-400">Geological Similarity</td>
              {comparisonWells.map((item) => (
                <td key={`sim-${item.name}`} className={`p-3 ${item.isActive ? 'bg-cyan-950/20 font-bold text-cyan-300 border-x border-cyan-800/20' : ''}`}>
                  {item.similarity}
                </td>
              ))}
            </tr>

            {/* Depth Profile */}
            <tr className="hover:bg-slate-900/40 transition-colors">
              <td className="p-3 font-semibold text-slate-400">Total / Current Depth</td>
              {comparisonWells.map((item) => (
                <td key={`depth-${item.name}`} className={`p-3 ${item.isActive ? 'bg-cyan-950/20 font-bold text-cyan-300 border-x border-cyan-800/20' : ''}`}>
                  {item.currentDepth}
                </td>
              ))}
            </tr>

            {/* Barail Sand Top */}
            <tr className="hover:bg-slate-900/40 transition-colors">
              <td className="p-3 font-semibold text-slate-400">Barail Formation Top</td>
              {comparisonWells.map((item) => (
                <td key={`top-${item.name}`} className={`p-3 ${item.isActive ? 'bg-cyan-950/20 font-bold text-cyan-300 border-x border-cyan-800/20' : ''}`}>
                  {item.barailTop}
                </td>
              ))}
            </tr>

            {/* Mud Weight Profile */}
            <tr className="hover:bg-slate-900/40 transition-colors">
              <td className="p-3 font-semibold text-slate-400">Active Mud Weight</td>
              {comparisonWells.map((item) => (
                <td key={`mud-${item.name}`} className={`p-3 ${item.isActive ? 'bg-cyan-950/20 font-bold text-cyan-300 border-x border-cyan-800/20' : ''}`}>
                  {item.mudWeight}
                </td>
              ))}
            </tr>

            {/* Bit & BHA */}
            <tr className="hover:bg-slate-900/40 transition-colors">
              <td className="p-3 font-semibold text-slate-400">Bit & BHA Specification</td>
              {comparisonWells.map((item) => (
                <td key={`bit-${item.name}`} className={`p-3 text-[11px] ${item.isActive ? 'bg-cyan-950/20 border-x border-cyan-800/20' : ''}`}>
                  {item.bitType}
                </td>
              ))}
            </tr>

            {/* Major Incidents */}
            <tr className="hover:bg-slate-900/40 transition-colors">
              <td className="p-3 font-semibold text-slate-400">Interval Incidents</td>
              {comparisonWells.map((item) => (
                <td key={`haz-${item.name}`} className={`p-3 text-[11px] ${item.isActive ? 'bg-cyan-950/20 border-x border-cyan-800/20' : ''}`}>
                  <span className={item.isActive ? 'text-cyan-300' : 'text-amber-400 font-bold'}>
                    {item.hazards}
                  </span>
                </td>
              ))}
            </tr>

            {/* Engineered Mitigation */}
            <tr className="hover:bg-slate-900/40 transition-colors bg-slate-950/50">
              <td className="p-3 font-semibold text-slate-400">Advisory Action Plan</td>
              {comparisonWells.map((item) => (
                <td key={`act-${item.name}`} className={`p-3 text-[11px] leading-snug ${item.isActive ? 'bg-cyan-950/40 text-emerald-300 border-x border-cyan-800/40 font-semibold' : 'text-slate-300'}`}>
                  {item.actionPlan}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
