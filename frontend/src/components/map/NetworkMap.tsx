import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { TransformerData, IncidentData, CrewData } from '../../types';
import L from 'leaflet';

interface Props {
  transformers: TransformerData[];
  incidents: IncidentData[];
  crews: CrewData[];
  selectedIncident: IncidentData | null;
  onSelectIncident: (incident: IncidentData) => void;
}

// Custom SCADA Map Icons
const createDotIcon = (color: string, pulse: boolean = false) =>
  L.divIcon({
    className: 'custom-scada-icon',
    html: `<div style="
      width: 10px;
      height: 10px;
      background-color: ${color};
      border-radius: 50%;
      border: 1px solid #000;
      box-shadow: 0 0 6px ${color};
      ${pulse ? 'animation: scada-pulse-node 2s ease-in-out infinite;' : ''}
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

const transformerIcon = L.divIcon({
  className: 'custom-transformer-icon',
  html: `<div style="
    width: 14px;
    height: 14px;
    background-color: #F59E0B;
    border: 2px solid #0D1117;
    border-radius: 2px;
    box-shadow: 0 0 8px #F59E0B;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000;
    font-weight: bold;
    font-size: 8px;
    font-family: monospace;
  ">T</div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const crewIcon = L.divIcon({
  className: 'custom-crew-icon',
  html: `<div style="
    width: 16px;
    height: 16px;
    background-color: #3B82F6;
    border: 1.5px solid #FFF;
    border-radius: 50%;
    box-shadow: 0 0 8px #3B82F6;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFF;
    font-weight: bold;
    font-size: 9px;
  ">🚚</div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Map View Controller to center on selected fault
const MapViewController: React.FC<{ selectedIncident: IncidentData | null }> = ({ selectedIncident }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedIncident) {
      map.flyTo([selectedIncident.latitude, selectedIncident.longitude], 17, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [selectedIncident, map]);
  return null;
};

export const NetworkMap: React.FC<Props> = ({
  transformers,
  crews,
  selectedIncident,
}) => {
  // Center coordinates (Bengaluru / Karnataka LT grid default)
  const defaultCenter: [number, number] = [12.9716, 77.6412];

  return (
    <div className="flex-1 relative h-full bg-[#0B0E14] overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        <MapViewController selectedIncident={selectedIncident} />

        {/* Electrical Network Graph Rendering */}
        {transformers.map((transformer) => {
          const isTransformerActiveInSelected =
            selectedIncident?.transformerId === transformer.id;

          return (
            <React.Fragment key={transformer.id}>
              {/* Distribution Transformer Marker */}
              <Marker
                position={[transformer.latitude, transformer.longitude]}
                icon={transformerIcon}
              >
                <Popup className="scada-popup">
                  <div className="font-mono text-xs">
                    <strong className="text-amber-400">DT {transformer.transformerCode}</strong>
                    <div>Ward: {transformer.ward}</div>
                    <div>Poles: {transformer.poles.length}</div>
                  </div>
                </Popup>
              </Marker>

              {/* Render Pole Nodes and Electrical Spans */}
              {transformer.poles.map((pole) => {
                const poleState = pole.poleState?.currentState || pole.currentState;
                const isDark = poleState === 'DARK';

                // Find parent pole for electrical line span
                const parentPole = transformer.poles.find((p) => p.id === pole.parentPoleId);

                let isSpanFault = false;
                if (parentPole && selectedIncident) {
                  const parentCode = `P-${parentPole.id.substring(0, 6)}`;
                  const childCode = `P-${pole.id.substring(0, 6)}`;

                  if (
                    selectedIncident.decisionCard?.suspectedParentPoleCode === parentCode &&
                    selectedIncident.decisionCard?.suspectedChildPoleCode === childCode
                  ) {
                    isSpanFault = true;
                  }
                }

                // Opacity dimming when another incident is selected
                const opacity =
                  selectedIncident === null || isTransformerActiveInSelected ? 1 : 0.25;

                return (
                  <React.Fragment key={pole.id}>
                    {/* Electrical Line Span (Parent to Child Line) */}
                    {parentPole && (
                      <Polyline
                        positions={[
                          [parentPole.latitude, parentPole.longitude],
                          [pole.latitude, pole.longitude],
                        ]}
                        pathOptions={{
                          color: isSpanFault ? '#EF4444' : isDark ? '#6E7681' : '#10B981',
                          weight: isSpanFault ? 5 : 2,
                          opacity: isSpanFault ? 1 : opacity * 0.7,
                          className: isSpanFault ? 'scada-glow-polyline' : '',
                        }}
                      />
                    )}

                    {/* Pole Marker Node */}
                    <Marker
                      position={[pole.latitude, pole.longitude]}
                      icon={createDotIcon(isDark ? '#EF4444' : '#10B981', isDark)}
                      opacity={opacity}
                    >
                      <Popup>
                        <div className="font-mono text-xs">
                          <strong className={isDark ? 'text-rose-400' : 'text-emerald-400'}>
                            Pole P-{pole.id.substring(0, 6)}
                          </strong>
                          <div>Status: {poleState}</div>
                          <div>Ward: {pole.ward}</div>
                          <div>PIN: {pole.pincode || 'N/A'}</div>
                          <div>Topology: {pole.topologySource}</div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Render Field Crews */}
        {crews.map((crew) => (
          <Marker
            key={crew.id}
            position={[12.9720 + Math.random() * 0.004, 77.6410 + Math.random() * 0.004]}
            icon={crewIcon}
          >
            <Popup font-mono>
              <div className="font-mono text-xs">
                <strong className="text-blue-400">{crew.name} ({crew.code})</strong>
                <div>Status: {crew.status}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* SCADA Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-[#161B22]/90 border border-[#30363D] p-2.5 rounded text-[11px] font-mono text-gray-300 backdrop-blur z-[1000] flex flex-col gap-1.5 shadow-xl">
        <div className="font-bold text-white text-xs border-b border-[#30363D] pb-1 mb-0.5">
          NETWORK SYMBOLS
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-amber-500 rounded-sm border border-black font-bold text-[8px] flex items-center justify-center text-black">
            T
          </span>
          <span>Distribution Transformer</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10B981]" />
          <span>Live Pole Node (Power OK)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 scada-pulse-node shadow-[0_0_6px_#EF4444]" />
          <span>Dark Pole Node (Power Loss)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-1 bg-rose-500 rounded scada-glow-polyline" />
          <span className="text-rose-400 font-bold">Failed Electrical Line Span</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center text-[8px]">
            🚚
          </span>
          <span>Field Repair Crew</span>
        </div>
      </div>
    </div>
  );
};
