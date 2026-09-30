import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  AlertTriangle, 
  Droplet, 
  Flame, 
  Layers, 
  Maximize2, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Info,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Anchor
} from 'lucide-react';

export default function InteractiveWellMap({ 
  activeWell, 
  offsetWells, 
  selectedWell, 
  onSelectOffsetWell, 
  currentDepth 
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeLayers, setActiveLayers] = useState({
    rings: true,
    riskZones: true,
    faultLines: true,
    trajectories: true,
    events: true
  });
  const [selectedIncidentFilter, setSelectedIncidentFilter] = useState('ALL');
  const [hoveredWell, setHoveredWell] = useState(null);

  const toggleLayer = (layerKey) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Center coordinate in SVG viewBox (500x500)
  const cx = 250;
  const cy = 250;

  // Conversion: 5 km = 210 pixels radius
  const kmToPx = 210 / 5.0;

  const filteredOffsetWells = offsetWells.filter(well => {
    if (selectedIncidentFilter === 'ALL') return true;
    if (selectedIncidentFilter === 'LOSS') return well.incidents.some(i => i.type.toLowerCase().includes('loss'));
    if (selectedIncidentFilter === 'STUCK') return well.incidents.some(i => i.type.toLowerCase().includes('stuck'));
    if (selectedIncidentFilter === 'GAS') return well.incidents.some(i => i.type.toLowerCase().includes('gas'));
    return true;
  });

  return (
    <div className="relative bg-[#0B111E] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[580px] lg:h-[640px]">
      
      {/* Top Map Header & Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 z-20 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-cyan-950 border border-cyan-800/60 text-cyan-400">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase">
              Spatial Offset-Well Intelligence Map
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono text-cyan-400/90 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
              PostGIS Spatial Grid (Upper Assam)
            </span>
          </div>
        </div>

        {/* Layer Toggles & Incident Filters */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-mono">
          {/* Incident Filter Dropdown */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded px-2 py-1 gap-1">
            <span className="text-slate-500 hidden sm:inline">Filter:</span>
            <select
              value={selectedIncidentFilter}
              onChange={(e) => setSelectedIncidentFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">All Hazards ({offsetWells.length})</option>
              <option value="LOSS" className="bg-slate-900 text-slate-200">Lost Circulation (Barail)</option>
              <option value="STUCK" className="bg-slate-900 text-slate-200">Stuck Pipe / Depletion</option>
              <option value="GAS" className="bg-slate-900 text-slate-200">Gas Influx / Kicks</option>
            </select>
          </div>

          {/* Layer toggles */}
          <button
            onClick={() => toggleLayer('riskZones')}
            className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer border ${
              activeLayers.riskZones 
                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Historical Hazard Polygons"
          >
            Hazard Zones
          </button>

          <button
            onClick={() => toggleLayer('trajectories')}
            className={`hidden md:inline-block px-2 py-1 rounded text-xs transition-colors cursor-pointer border ${
              activeLayers.trajectories 
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Trajectory Projections"
          >
            Trajectories
          </button>

          <button
            onClick={() => toggleLayer('faultLines')}
            className={`hidden lg:inline-block px-2 py-1 rounded text-xs transition-colors cursor-pointer border ${
              activeLayers.faultLines 
                ? 'bg-blue-950/60 text-blue-300 border-blue-800/60' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Fault Strike Lines"
          >
            Faults
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 1.8))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Interactive Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-radial-glow flex items-center justify-center select-none">
        
        {/* Subtle background industrial grid */}
        <div className="absolute inset-0 bg-tech-grid opacity-75 pointer-events-none" />

        {/* North Arrow Indicator & Compass HUD */}
        <div className="absolute top-4 left-4 z-10 bg-slate-900/90 border border-slate-800 rounded-lg p-2 font-mono text-[10px] text-slate-400 flex flex-col items-center shadow-lg">
          <div className="text-cyan-400 font-bold text-xs flex items-center gap-1">
            <span>▲</span>
            <span>N</span>
          </div>
          <span className="text-[9px] text-slate-500">000°</span>
          <div className="w-full h-px bg-slate-800 my-1" />
          <span className="text-[9px] text-slate-400">Scale: 1:25,000</span>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 font-mono text-[10px] space-y-1.5 shadow-lg backdrop-blur-md hidden sm:block">
          <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
            <span>MAP LEGEND</span>
            <span className="text-cyan-400">eRTMAC-GIS</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-500/40" />
            <span>Active Well (TRUST-01)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Offset Well (Normal/Low Risk)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Historical Lost Circulation</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span>Gas Kick / Stuck Pipe Incident</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-4 h-1.5 bg-amber-500/30 border border-amber-500/60 rounded" />
            <span>Barail Sand Loss Corridor</span>
          </div>
        </div>

        {/* SVG Graphic Map Engine */}
        <div 
          className="w-full h-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox="0 0 500 500"
            className="w-[500px] h-[500px] max-w-full max-h-full overflow-visible"
          >
            <defs>
              {/* Radial gradient for active well glow */}
              <radialGradient id="activeWellGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>

              {/* Hazard zone pattern */}
              <pattern id="hazardPattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(245, 158, 11, 0.25)" strokeWidth="2" />
              </pattern>

              {/* Gradient for offset correlation beams */}
              <linearGradient id="beamToB" x1="250" y1="250" x2="325" y2="170" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Geological Fault Strike Lines */}
            {activeLayers.faultLines && (
              <g className="fault-lines opacity-40">
                <line x1="80" y1="420" x2="420" y2="80" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6,4" />
                <line x1="120" y1="460" x2="460" y2="120" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" />
                <text x="390" y="95" fill="#60a5fa" fontSize="9" fontFamily="monospace" transform="rotate(-45 390 95)">
                  Barail Fault Trend (NE-SW)
                </text>
              </g>
            )}

            {/* Historical Risk Polygon Zones (Barail Fractured Sandstone) */}
            {activeLayers.riskZones && (
              <g className="hazard-polygons">
                <polygon
                  points="280,140 370,160 360,230 270,210"
                  fill="url(#hazardPattern)"
                  stroke="rgba(245, 158, 11, 0.5)"
                  strokeWidth="1.5"
                  className="animate-pulse"
                />
                <text x="310" y="190" fill="#f59e0b" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  HAZARD ZONE: 3,450–3,520m
                </text>
                <text x="310" y="202" fill="#fbbf24" fontSize="7.5" fontFamily="monospace">
                  (Loss / Stuck Pipe Risk)
                </text>
              </g>
            )}

            {/* Concentric Distance Rings */}
            {activeLayers.rings && (
              <g className="distance-rings">
                {/* 1.0 km Ring */}
                <circle cx={cx} cy={cy} r={1.0 * kmToPx} fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2,3" />
                <text x={cx + 1.0 * kmToPx + 4} y={cy + 3} fill="#64748b" fontSize="9" fontFamily="monospace">1.0 km</text>

                {/* 2.0 km Ring */}
                <circle cx={cx} cy={cy} r={2.0 * kmToPx} fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2,3" />
                <text x={cx + 2.0 * kmToPx + 4} y={cy + 3} fill="#64748b" fontSize="9" fontFamily="monospace">2.0 km</text>

                {/* 3.0 km Ring */}
                <circle cx={cx} cy={cy} r={3.0 * kmToPx} fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3,4" />
                <text x={cx + 3.0 * kmToPx + 4} y={cy + 3} fill="#64748b" fontSize="9" fontFamily="monospace">3.0 km</text>

                {/* 5.0 km Outer Boundary Ring */}
                <circle cx={cx} cy={cy} r={5.0 * kmToPx} fill="none" stroke="#475569" strokeWidth="1.5" />
                <text x={cx + 5.0 * kmToPx - 32} y={cy - 6} fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="bold">5.0 km</text>

                {/* Crosshair Coordinate Axis */}
                <line x1={cx - 220} y1={cy} x2={cx + 220} y2={cy} stroke="#1e293b" strokeWidth="1" />
                <line x1={cx} y1={cy - 220} x2={cx} y2={cy + 220} stroke="#1e293b" strokeWidth="1" />
              </g>
            )}

            {/* Animated Data Link Lines connecting ACTIVE WELL to Offset Wells */}
            {filteredOffsetWells.map(well => {
              const wx = cx + well.mapPos.x;
              const wy = cy + well.mapPos.y;
              const isSelected = selectedWell?.id === well.id;
              const isHighRisk = well.incidents.some(i => i.severity === 'CRITICAL');

              return (
                <g key={`link-${well.id}`}>
                  {/* Base connection vector line */}
                  <line
                    x1={cx}
                    y1={cy}
                    x2={wx}
                    y2={wy}
                    stroke={isSelected ? '#06b6d4' : isHighRisk ? 'rgba(245, 158, 11, 0.4)' : 'rgba(71, 85, 105, 0.3)'}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeDasharray={isSelected ? 'none' : '4,4'}
                  />

                  {/* Animated pulse dot moving along the link */}
                  {(isSelected || well.id === 'WELL-B') && (
                    <circle r="2.5" fill="#06b6d4">
                      <animateMotion
                        path={`M ${cx} ${cy} L ${wx} ${wy}`}
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Offset Wells Interactive Nodes */}
            {filteredOffsetWells.map(well => {
              const wx = cx + well.mapPos.x;
              const wy = cy + well.mapPos.y;
              const isSelected = selectedWell?.id === well.id;
              const isHovered = hoveredWell?.id === well.id;
              const isCritical = well.incidents.some(i => i.severity === 'CRITICAL');
              const isMedium = well.incidents.some(i => i.severity === 'HIGH' || i.severity === 'MEDIUM');

              const nodeColor = isCritical ? '#f59e0b' : isMedium ? '#fbbf24' : '#10b981';

              return (
                <g
                  key={well.id}
                  className="cursor-pointer group"
                  onClick={() => onSelectOffsetWell(well)}
                  onMouseEnter={() => setHoveredWell(well)}
                  onMouseLeave={() => setHoveredWell(null)}
                >
                  {/* Trajectory projection indicator line */}
                  {activeLayers.trajectories && (
                    <line
                      x1={wx}
                      y1={wy}
                      x2={wx + 12}
                      y2={wy + 15}
                      stroke={nodeColor}
                      strokeWidth="1.5"
                      strokeOpacity="0.6"
                    />
                  )}

                  {/* Pulsing ring on selected well */}
                  {isSelected && (
                    <circle
                      cx={wx}
                      cy={wy}
                      r="16"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="1.5"
                      className="animate-ping"
                      opacity="0.6"
                    />
                  )}

                  {/* Node Outer Halo */}
                  <circle
                    cx={wx}
                    cy={wy}
                    r={isSelected ? 10 : 8}
                    fill={nodeColor}
                    fillOpacity={isSelected ? 0.3 : 0.15}
                    stroke={nodeColor}
                    strokeWidth={isSelected ? 2 : 1.5}
                    className="transition-all duration-200"
                  />

                  {/* Center Dot */}
                  <circle
                    cx={wx}
                    cy={wy}
                    r="4"
                    fill={nodeColor}
                  />

                  {/* Well Label Badge */}
                  <g transform={`translate(${wx + 12}, ${wy - 10})`}>
                    <rect
                      x="0"
                      y="0"
                      width={well.id === 'WELL-B' ? 105 : 95}
                      height="22"
                      rx="4"
                      fill="#0f172a"
                      fillOpacity="0.9"
                      stroke={isSelected ? '#06b6d4' : '#334155'}
                      strokeWidth={isSelected ? 1.5 : 1}
                    />
                    <text
                      x="6"
                      y="14"
                      fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {well.officialName}
                    </text>
                    <text
                      x="78"
                      y="14"
                      fill="#38bdf8"
                      fontSize="8.5"
                      fontFamily="monospace"
                    >
                      {well.distanceKm}k
                    </text>
                  </g>

                  {/* Event Hazard Markers (Icon Pill) */}
                  {activeLayers.events && well.incidents.length > 0 && (
                    <g transform={`translate(${wx - 8}, ${wy + 12})`}>
                      <rect
                        x="0"
                        y="0"
                        width="16"
                        height="16"
                        rx="3"
                        fill="#451a03"
                        stroke="#f59e0b"
                        strokeWidth="1"
                      />
                      <text x="4" y="12" fill="#f59e0b" fontSize="9" fontWeight="bold">
                        !
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* CENTER: ACTIVE WELL (TRUST-01) */}
            <g className="active-well cursor-pointer">
              {/* Radar scanner sweep effect */}
              <circle
                cx={cx}
                cy={cy}
                r="65"
                fill="url(#activeWellGlow)"
              />

              {/* Pulsing Concentric Outer Ring */}
              <circle
                cx={cx}
                cy={cy}
                r="24"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1"
                className="animate-ping"
                opacity="0.4"
              />

              <circle
                cx={cx}
                cy={cy}
                r="14"
                fill="#0e7490"
                fillOpacity="0.3"
                stroke="#22d3ee"
                strokeWidth="2"
              />

              {/* Core Active Wellhead Dot */}
              <circle
                cx={cx}
                cy={cy}
                r="6"
                fill="#22d3ee"
              />

              {/* Active Well Label Plate */}
              <g transform={`translate(${cx - 55}, ${cy + 18})`}>
                <rect
                  x="0"
                  y="0"
                  width="110"
                  height="26"
                  rx="5"
                  fill="#0284c7"
                  fillOpacity="0.95"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
                <text
                  x="55"
                  y="13"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  ACTIVE: TRUST-01
                </text>
                <text
                  x="55"
                  y="22"
                  textAnchor="middle"
                  fill="#cffafe"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {currentDepth.toFixed(1)} m • DRILLING
                </text>
              </g>
            </g>

          </svg>
        </div>

        {/* Hover Well Quick Tooltip Overlay */}
        {hoveredWell && (
          <div className="absolute top-14 right-4 z-20 bg-slate-900/95 border border-cyan-500/50 rounded-lg p-3 w-64 shadow-2xl backdrop-blur-md pointer-events-none text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <span className="font-bold text-white font-mono">{hoveredWell.officialName}</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] border border-cyan-800">
                {hoveredWell.similarityScore}% SIMILAR
              </span>
            </div>
            <div className="space-y-1 font-mono text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Distance:</span>
                <span className="text-white">{hoveredWell.distanceKm} km ({hoveredWell.direction})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Depth:</span>
                <span className="text-white">{hoveredWell.totalDepth} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Formation:</span>
                <span className="text-cyan-300">{hoveredWell.primaryFormation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Incidents:</span>
                <span className="text-amber-400 font-bold">{hoveredWell.incidents.length} Recorded</span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-cyan-400 font-mono flex items-center justify-between">
              <span>Click well to open intelligence</span>
              <span>→</span>
            </div>
          </div>
        )}

      </div>

      {/* Map Bottom Status Bar */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Active Coordinate: 27°18'44.2"N 95°19'12.8"E</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 hidden sm:inline">Spatial Radius: 5.0 km</span>
          <span className="text-cyan-400">Selected Offset: {selectedWell ? selectedWell.officialName : 'None (Click node)'}</span>
        </div>
      </div>

    </div>
  );
}
