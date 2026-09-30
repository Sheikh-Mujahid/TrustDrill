"use client";

import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

function createMarkerIcon(color: string, size: number, isAnchor: boolean = false, isSelected: boolean = false) {
  const border = isSelected ? "3px solid #facc15" : isAnchor ? "2.5px solid #ffffff" : "2px solid #ffffff";
  const shadow = isSelected
    ? "0 0 14px rgba(250, 204, 21, 0.9)"
    : isAnchor
    ? "0 0 12px rgba(13, 148, 136, 0.9)"
    : "0 0 6px rgba(0, 0, 0, 0.5)";
  const finalSize = isSelected ? size + 4 : size;

  return new L.DivIcon({
    className: "custom-leaflet-marker",
    html: `<div style="width:${finalSize}px;height:${finalSize}px;background:${color};border:${border};border-radius:50%;box-shadow:${shadow};transform:translate(-${finalSize / 2}px,-${finalSize / 2}px);transition:all 0.2s"></div>`,
    iconSize: [finalSize, finalSize],
    iconAnchor: [finalSize / 2, finalSize / 2],
  });
}

const anchorIcon = createMarkerIcon("#0d9488", 16, true, false);
const selectedAnchorIcon = createMarkerIcon("#0d9488", 16, true, true);
const nominalOffsetIcon = createMarkerIcon("#0284c7", 12, false, false);
const selectedNominalIcon = createMarkerIcon("#0284c7", 12, false, true);
const highRiskIcon = createMarkerIcon("#e11d48", 14, false, false);
const selectedHighRiskIcon = createMarkerIcon("#e11d48", 14, false, true);
const mediumRiskIcon = createMarkerIcon("#d97706", 13, false, false);
const selectedMediumRiskIcon = createMarkerIcon("#d97706", 13, false, true);

type Well = {
  id: string;
  well_uid: string;
  name: string;
  status: string;
  latitude: number;
  longitude: number;
  total_depth_md_m?: number;
  total_depth_tvd_m?: number;
  distance_km?: number;
  is_active_demo?: boolean;
  highest_severity?: string | null;
  formations?: string[];
  recent_events?: string[];
  event_count?: number;
  formation_count?: number;
};

function MapViewController({ targetCenter, targetZoom }: { targetCenter: [number, number]; targetZoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(targetCenter, targetZoom || map.getZoom(), { animate: true });
  }, [targetCenter, targetZoom, map]);
  return null;
}

export default function WellMap({
  center,
  radiusKm,
  wells,
  activeId,
  selectedId,
  onSelectWell,
}: {
  center: [number, number];
  radiusKm: number;
  wells: Well[];
  activeId?: string;
  selectedId?: string | null;
  onSelectWell?: (id: string) => void;
}) {
  const selectedWell = wells.find((w) => w.id === selectedId);
  const targetCenter: [number, number] = selectedWell
    ? [selectedWell.latitude, selectedWell.longitude]
    : center;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%", background: "#0b1220" }}
        scrollWheelZoom
      >
        <MapViewController targetCenter={targetCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Search Radius Circle on Anchor */}
        <Circle
          center={center}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "#0d9488",
            fillColor: "#14b8a6",
            weight: 2,
            fillOpacity: 0.08,
            dashArray: "6, 6",
          }}
        />

        {wells.map((w) => {
          const isAnchor = w.id === activeId || w.is_active_demo;
          const isSelected = w.id === selectedId;
          const sev = w.highest_severity;

          let icon;
          if (isAnchor) {
            icon = isSelected ? selectedAnchorIcon : anchorIcon;
          } else if (sev === "critical" || sev === "high") {
            icon = isSelected ? selectedHighRiskIcon : highRiskIcon;
          } else if (sev === "medium") {
            icon = isSelected ? selectedMediumRiskIcon : mediumRiskIcon;
          } else {
            icon = isSelected ? selectedNominalIcon : nominalOffsetIcon;
          }

          return (
            <Marker
              key={w.id}
              position={[w.latitude, w.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectWell && onSelectWell(w.id),
              }}
            >
              <Popup className="nwis-map-popup">
                <div className="p-1.5 min-w-[220px] text-xs space-y-1.5 text-slate-800">
                  <div className="flex items-center justify-between border-b pb-1 font-bold">
                    <span className={isAnchor ? "text-teal-700" : "text-sky-700 font-bold"}>
                      {w.well_uid} {isAnchor && "★"}
                    </span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-normal">
                      {w.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">{w.name}</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] pt-0.5">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Distance</span>
                      <span className="font-semibold text-slate-700 font-mono">
                        {isAnchor ? "0.00 km (Anchor)" : `${w.distance_km?.toFixed(2) ?? "—"} km`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Depth</span>
                      <span className="font-mono text-slate-700">{w.total_depth_md_m ?? "—"} m</span>
                    </div>
                  </div>

                  {w.formations && w.formations.length > 0 && (
                    <div className="text-[10px] text-slate-500 pt-0.5">
                      <span className="font-medium text-slate-600">Formations: </span>
                      {w.formations.join(", ")}
                    </div>
                  )}

                  {w.recent_events && w.recent_events.length > 0 && (
                    <div className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200/60 p-1 rounded">
                      <span className="font-semibold">Event: </span>
                      {w.recent_events[0]}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 pt-1 font-mono">
                    {w.latitude.toFixed(5)}°, {w.longitude.toFixed(5)}°
                  </div>
                  <div className="pt-1.5 border-t">
                    <a
                      href={`/wells/${w.id}`}
                      className="block text-center py-1 bg-teal-600 text-white rounded text-[11px] font-semibold hover:bg-teal-700 transition"
                    >
                      Open Complete Well Profile →
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}


