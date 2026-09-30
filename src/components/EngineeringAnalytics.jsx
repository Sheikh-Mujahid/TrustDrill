import React, { useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Gauge, 
  Layers, 
  AlertCircle,
  HelpCircle,
  Maximize2
} from 'lucide-react';

export default function EngineeringAnalytics({ telemetrySeries, currentDepth }) {
  const [hoveredData, setHoveredData] = useState(null);
  const [selectedChartTab, setSelectedChartTab] = useState('ALL'); // 'ALL' | 'ROP' | 'TORQUE' | 'MUD'

  // Filter or take series up to current depth plus upcoming
  const depths = telemetrySeries.map(d => d.depth);
  const minDepth = 3380;
  const maxDepth = 3520;
  const depthRange = maxDepth - minDepth;

  // Chart dimensions
  const width = 280;
  const height = 180;
  const padLeft = 38;
  const padRight = 14;
  const padTop = 18;
  const padBottom = 26;

  // Helper to map depth (Y axis inverted, deeper down)
  const getY = (d) => padTop + ((d - minDepth) / depthRange) * (height - padTop - padBottom);

  // 1. ROP Scale: 0 to 20 m/hr (X axis)
  const getX_Rop = (rop) => padLeft + (rop / 20) * (width - padLeft - padRight);

  // 2. Torque Scale: 15 to 45 kNm (X axis)
  const getX_Torque = (t) => padLeft + ((t - 15) / (45 - 15)) * (width - padLeft - padRight);

  // 3. WOB Scale: 15 to 35 klbs (X axis)
  const getX_Wob = (w) => padLeft + ((w - 15) / (35 - 15)) * (width - padLeft - padRight);

  // 4. Mud Window Scale: 8 to 15 ppg (X axis)
  const getX_Mud = (m) => padLeft + ((m - 8) / (15 - 8)) * (width - padLeft - padRight);

  // Generate SVG path strings
  const ropPath = telemetrySeries.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX_Rop(pt.rop)} ${getY(pt.depth)}`).join(' ');
  const offsetRopPath = telemetrySeries.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX_Rop(pt.offsetRop)} ${getY(pt.depth)}`).join(' ');

  const torquePath = telemetrySeries.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX_Torque(pt.torque)} ${getY(pt.depth)}`).join(' ');
  const offsetTorquePath = telemetrySeries.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX_Torque(pt.offsetTorque)} ${getY(pt.depth)}`).join(' ');

  const wobPath = telemetrySeries.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX_Wob(pt.wob)} ${getY(pt.depth)}`).join(' ');

  const mudPath = telemetrySeries.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX_Mud(pt.mudWeight)} ${getY(pt.depth)}`).join(' ');
  const porePressPath = telemetrySeries.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX_Mud(pt.porePressure)} ${getY(pt.depth)}`).join(' ');
  const fracGradPath = telemetrySeries.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX_Mud(pt.fracGradient)} ${getY(pt.depth)}`).join(' ');

  // Current Depth Y position
  const currentY = getY(Math.min(maxDepth, Math.max(minDepth, currentDepth)));

  return (
    <div className="bg-[#0B111E] border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4 sm:p-5">
      
      {/* Header & Metric Controls */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-cyan-950 border border-cyan-800/60 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-100 uppercase">
              LIVE DRILLING PARAMETERS & FORMATION LOGS
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Depth-Synchronized Offset Correlation • Real-time WITSML Rig Telemetry
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
            <span>Active (TRUST-01)</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-3 h-0.5 bg-amber-400 border-t border-dashed inline-block" />
            <span>Offset (NHK-142)</span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 bg-amber-500/20 rounded inline-block" />
            <span>Hazard Interval (3,450–3,520m)</span>
          </span>
        </div>
      </div>

      {/* Grid of 4 Engineering Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* CHART 1: DEPTH VS ROP */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 relative group">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-white font-bold">DEPTH vs ROP</span>
            <span className="text-cyan-400">m/hr</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mb-2">Penetration Rate Drop Alert</p>

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            {/* Hazard Zone Shading */}
            <rect
              x={padLeft}
              y={getY(3450)}
              width={width - padLeft - padRight}
              height={getY(3520) - getY(3450)}
              fill="rgba(245, 158, 11, 0.12)"
              stroke="rgba(245, 158, 11, 0.3)"
              strokeWidth="0.5"
            />

            {/* Depth Grid Lines */}
            {[3380, 3420, 3450, 3480, 3520].map(d => (
              <g key={`d-rop-${d}`}>
                <line x1={padLeft} y1={getY(d)} x2={width - padRight} y2={getY(d)} stroke="#1e293b" strokeWidth="0.8" />
                <text x={padLeft - 6} y={getY(d) + 3} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">{d}</text>
              </g>
            ))}

            {/* X-axis Ticks (0, 10, 20 m/h) */}
            {[0, 10, 20].map(val => (
              <text key={`x-rop-${val}`} x={getX_Rop(val)} y={height - 6} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">
                {val}
              </text>
            ))}

            {/* Offset ROP line */}
            <path d={offsetRopPath} fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.75" />

            {/* Active Well ROP line */}
            <path d={ropPath} fill="none" stroke="#06b6d4" strokeWidth="2" />

            {/* Current Bit Horizontal Depth Cursor */}
            <line x1={padLeft} y1={currentY} x2={width - padRight} y2={currentY} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />
            <circle cx={getX_Rop(14.8)} cy={currentY} r="3.5" fill="#38bdf8" />
          </svg>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-800">
            <span>At Bit: <strong className="text-white">14.8 m/h</strong></span>
            <span className="text-amber-400">Threshold: &lt; 8 m/h</span>
          </div>
        </div>

        {/* CHART 2: DEPTH VS TORQUE */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 relative group">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-white font-bold">DEPTH vs TORQUE</span>
            <span className="text-cyan-400">kNm</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mb-2">Torsional Stick-Slip Monitoring</p>

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            {/* Hazard Zone */}
            <rect
              x={padLeft}
              y={getY(3450)}
              width={width - padLeft - padRight}
              height={getY(3520) - getY(3450)}
              fill="rgba(245, 158, 11, 0.12)"
              stroke="rgba(245, 158, 11, 0.3)"
              strokeWidth="0.5"
            />

            {/* Critical Torque Limit (35 kNm) */}
            <line x1={getX_Torque(35)} y1={padTop} x2={getX_Torque(35)} y2={height - padBottom} stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
            <text x={getX_Torque(35)} y={padTop - 4} fill="#ef4444" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
              MAX: 35 kNm
            </text>

            {/* Depth Lines */}
            {[3380, 3420, 3450, 3480, 3520].map(d => (
              <g key={`d-torq-${d}`}>
                <line x1={padLeft} y1={getY(d)} x2={width - padRight} y2={getY(d)} stroke="#1e293b" strokeWidth="0.8" />
                <text x={padLeft - 6} y={getY(d) + 3} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">{d}</text>
              </g>
            ))}

            {/* X-axis Ticks (15, 30, 45 kNm) */}
            {[15, 30, 45].map(val => (
              <text key={`x-torq-${val}`} x={getX_Torque(val)} y={height - 6} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">
                {val}
              </text>
            ))}

            {/* Offset Torque line */}
            <path d={offsetTorquePath} fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.75" />

            {/* Active Torque line */}
            <path d={torquePath} fill="none" stroke="#06b6d4" strokeWidth="2" />

            {/* Current Cursor */}
            <line x1={padLeft} y1={currentY} x2={width - padRight} y2={currentY} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />
            <circle cx={getX_Torque(24.5)} cy={currentY} r="3.5" fill="#38bdf8" />
          </svg>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-800">
            <span>Current: <strong className="text-white">24.5 kNm</strong></span>
            <span className="text-emerald-400">Normal Range</span>
          </div>
        </div>

        {/* CHART 3: DEPTH VS WOB */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 relative group">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-white font-bold">DEPTH vs WOB</span>
            <span className="text-cyan-400">klbs</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mb-2">Bit Loading Optimization</p>

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            {/* Hazard Zone */}
            <rect
              x={padLeft}
              y={getY(3450)}
              width={width - padLeft - padRight}
              height={getY(3520) - getY(3450)}
              fill="rgba(245, 158, 11, 0.12)"
              stroke="rgba(245, 158, 11, 0.3)"
              strokeWidth="0.5"
            />

            {/* Depth Lines */}
            {[3380, 3420, 3450, 3480, 3520].map(d => (
              <g key={`d-wob-${d}`}>
                <line x1={padLeft} y1={getY(d)} x2={width - padRight} y2={getY(d)} stroke="#1e293b" strokeWidth="0.8" />
                <text x={padLeft - 6} y={getY(d) + 3} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">{d}</text>
              </g>
            ))}

            {/* X-axis Ticks (15, 25, 35 klbs) */}
            {[15, 25, 35].map(val => (
              <text key={`x-wob-${val}`} x={getX_Wob(val)} y={height - 6} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">
                {val}
              </text>
            ))}

            {/* WOB Curve */}
            <path d={wobPath} fill="none" stroke="#38bdf8" strokeWidth="2" />

            {/* Current Cursor */}
            <line x1={padLeft} y1={currentY} x2={width - padRight} y2={currentY} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />
            <circle cx={getX_Wob(26.8)} cy={currentY} r="3.5" fill="#38bdf8" />
          </svg>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-800">
            <span>WOB: <strong className="text-white">26.8 klbs</strong></span>
            <span className="text-cyan-300">PDC 8-1/2" Bit</span>
          </div>
        </div>

        {/* CHART 4: MUD WINDOW VS DEPTH (PORE PRESSURE & FRAC GRADIENT) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 relative group">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-white font-bold">MUD WEIGHT vs DEPTH</span>
            <span className="text-cyan-400">ppg</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mb-2">Safe Drilling Margin Window</p>

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            {/* Safe Drilling Window Area between Pore Pressure & Frac Gradient */}
            <rect
              x={padLeft}
              y={getY(3450)}
              width={width - padLeft - padRight}
              height={getY(3520) - getY(3450)}
              fill="rgba(245, 158, 11, 0.12)"
              stroke="rgba(245, 158, 11, 0.3)"
              strokeWidth="0.5"
            />

            {/* Depth Lines */}
            {[3380, 3420, 3450, 3480, 3520].map(d => (
              <g key={`d-mud-${d}`}>
                <line x1={padLeft} y1={getY(d)} x2={width - padRight} y2={getY(d)} stroke="#1e293b" strokeWidth="0.8" />
                <text x={padLeft - 6} y={getY(d) + 3} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">{d}</text>
              </g>
            ))}

            {/* X-axis Ticks (8, 11, 14 ppg) */}
            {[8, 11, 14].map(val => (
              <text key={`x-mud-${val}`} x={getX_Mud(val)} y={height - 6} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">
                {val}
              </text>
            ))}

            {/* Pore Pressure Curve (Red dashed) */}
            <path d={porePressPath} fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3,3" />

            {/* Fracture Gradient Curve (Purple dashed) */}
            <path d={fracGradPath} fill="none" stroke="#a855f7" strokeWidth="1.2" strokeDasharray="3,3" />

            {/* Active Mud Weight Curve (Cyan bold) */}
            <path d={mudPath} fill="none" stroke="#06b6d4" strokeWidth="2" />

            {/* Current Cursor */}
            <line x1={padLeft} y1={currentY} x2={width - padRight} y2={currentY} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />
            <circle cx={getX_Mud(10.4)} cy={currentY} r="3.5" fill="#38bdf8" />
          </svg>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-800">
            <span>Active: <strong className="text-white">10.4 ppg</strong></span>
            <span className="text-cyan-300">Window: 9.6 - 13.8</span>
          </div>
        </div>

      </div>

    </div>
  );
}
