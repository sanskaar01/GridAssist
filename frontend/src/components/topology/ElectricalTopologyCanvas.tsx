import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TransformerData, IncidentData, PoleData } from '../../types';

interface Props {
  transformers: TransformerData[];
  selectedIncident: IncidentData | null;
  onSelectIncident: (incident: IncidentData) => void;
}

interface RenderNode {
  id: string;
  code: string;
  type: 'TRANSFORMER' | 'POLE';
  transformerId: string;
  transformerCode: string;
  x: number;
  y: number;
  state: 'LIVE' | 'DARK' | 'UNKNOWN' | 'OFFLINE';
  isDark: boolean;
  isSensorAnomaly: boolean;
  parentPoleId: string | null;
  ward: string;
  pincode: string | null;
  rawPole?: PoleData;
}

interface RenderEdge {
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isFaultSpan: boolean;
  isEnergized: boolean;
}

// Fallback Default Topology Dataset with Irregular Realistic Feeder Tree Geometry
const FALLBACK_TRANSFORMERS: TransformerData[] = [
  {
    id: 'dt-fallback-01',
    feederId: 'feeder-01',
    transformerCode: 'D-0101',
    latitude: 12.9716,
    longitude: 77.6412,
    ward: 'W-084',
    status: 'ACTIVE',
    inferredEdges: [],
    poles: [
      { id: 'p-001', transformerId: 'dt-fallback-01', parentPoleId: null, sequenceNumber: 1, latitude: 12.9716, longitude: 77.6412, ward: 'W-084', pincode: '560078', poleType: 'STEEL', topologySource: 'SURVEYED', currentState: 'LIVE', hasDevice: true },
      { id: 'p-002', transformerId: 'dt-fallback-01', parentPoleId: 'p-001', sequenceNumber: 2, latitude: 12.9717, longitude: 77.6413, ward: 'W-084', pincode: '560078', poleType: 'STEEL', topologySource: 'SURVEYED', currentState: 'LIVE', hasDevice: true },
      { id: 'p-003', transformerId: 'dt-fallback-01', parentPoleId: 'p-002', sequenceNumber: 3, latitude: 12.9718, longitude: 77.6414, ward: 'W-084', pincode: '560078', poleType: 'STEEL', topologySource: 'SURVEYED', currentState: 'LIVE', hasDevice: true },
      { id: 'p-004', transformerId: 'dt-fallback-01', parentPoleId: 'p-003', sequenceNumber: 4, latitude: 12.9719, longitude: 77.6415, ward: 'W-084', pincode: '560078', poleType: 'STEEL', topologySource: 'SURVEYED', currentState: 'LIVE', hasDevice: true },
      { id: 'p-005', transformerId: 'dt-fallback-01', parentPoleId: 'p-002', sequenceNumber: 5, latitude: 12.9720, longitude: 77.6416, ward: 'W-084', pincode: '560078', poleType: 'STEEL', topologySource: 'SURVEYED', currentState: 'LIVE', hasDevice: true },
      { id: 'p-006', transformerId: 'dt-fallback-01', parentPoleId: 'p-005', sequenceNumber: 6, latitude: 12.9721, longitude: 77.6417, ward: 'W-084', pincode: '560078', poleType: 'STEEL', topologySource: 'SURVEYED', currentState: 'LIVE', hasDevice: true },
    ],
  },
  {
    id: 'dt-fallback-02',
    feederId: 'feeder-01',
    transformerCode: 'D-0102',
    latitude: 12.9725,
    longitude: 77.6425,
    ward: 'W-085',
    status: 'ACTIVE',
    inferredEdges: [],
    poles: [
      { id: 'p-010', transformerId: 'dt-fallback-02', parentPoleId: null, sequenceNumber: 1, latitude: 12.9725, longitude: 77.6425, ward: 'W-085', pincode: '560078', poleType: 'CONCRETE', topologySource: 'SURVEYED', currentState: 'LIVE', hasDevice: true },
      { id: 'p-011', transformerId: 'dt-fallback-02', parentPoleId: 'p-010', sequenceNumber: 2, latitude: 12.9726, longitude: 77.6426, ward: 'W-085', pincode: '560078', poleType: 'CONCRETE', topologySource: 'SURVEYED', currentState: 'LIVE', hasDevice: true },
      { id: 'p-012', transformerId: 'dt-fallback-02', parentPoleId: 'p-011', sequenceNumber: 3, latitude: 12.9727, longitude: 77.6427, ward: 'W-085', pincode: '560078', poleType: 'CONCRETE', topologySource: 'SURVEYED', currentState: 'LIVE', hasDevice: true },
      { id: 'p-013', transformerId: 'dt-fallback-02', parentPoleId: 'p-010', sequenceNumber: 4, latitude: 12.9728, longitude: 77.6428, ward: 'W-085', pincode: '560078', poleType: 'CONCRETE', topologySource: 'SURVEYED', currentState: 'LIVE', hasDevice: true },
    ],
  },
];

export const ElectricalTopologyCanvas: React.FC<Props> = ({
  transformers,
  selectedIncident,
  onSelectIncident,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredNode, setHoveredNode] = useState<RenderNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 50, y: 30 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Animation frame flow offset
  const animOffsetRef = useRef<number>(0);

  const activeTransformers =
    transformers && transformers.length > 0 ? transformers : FALLBACK_TRANSFORMERS;

  // Compute Realistic Asymmetric Feeder Graph Coordinates
  const computeGraphLayout = useCallback((): { nodes: RenderNode[]; edges: RenderEdge[] } => {
    const nodes: RenderNode[] = [];
    const edges: RenderEdge[] = [];

    const transformerSpacing = 580;
    const levelHeight = 85;

    activeTransformers.forEach((transformer, dtIdx) => {
      const dtX = 260 + dtIdx * transformerSpacing;
      const dtY = 90;

      // Add Transformer Node
      nodes.push({
        id: transformer.id,
        code: transformer.transformerCode,
        type: 'TRANSFORMER',
        transformerId: transformer.id,
        transformerCode: transformer.transformerCode,
        x: dtX,
        y: dtY,
        state: 'LIVE',
        isDark: false,
        isSensorAnomaly: false,
        parentPoleId: null,
        ward: transformer.ward,
        pincode: '560078',
      });

      const polesMap = new Map<string, PoleData>();
      const childrenMap = new Map<string, PoleData[]>();
      const rootPoles: PoleData[] = [];

      transformer.poles.forEach((pole) => {
        polesMap.set(pole.id, pole);
        childrenMap.set(pole.id, []);
      });

      transformer.poles.forEach((pole) => {
        if (pole.parentPoleId && polesMap.has(pole.parentPoleId)) {
          childrenMap.get(pole.parentPoleId)?.push(pole);
        } else {
          rootPoles.push(pole);
        }
      });

      const rootCount = rootPoles.length || 1;
      const rootWidth = Math.max(rootCount * 170, 220);

      rootPoles.forEach((rootPole, rootIdx) => {
        // Asymmetric offset for realistic utility line geometry
        const xOffset = (rootIdx - (rootCount - 1) / 2) * (rootWidth / rootCount);
        const rootX = dtX + xOffset;
        const rootY = dtY + 90;

        const rootState = rootPole.poleState?.currentState || rootPole.currentState;
        const isRootEnergized = rootState !== 'DARK';

        edges.push({
          fromId: transformer.id,
          toId: rootPole.id,
          fromX: dtX,
          fromY: dtY,
          toX: rootX,
          toY: rootY,
          isFaultSpan: false,
          isEnergized: isRootEnergized,
        });

        positionPoleSubtree(
          rootPole,
          rootX,
          rootY,
          1,
          transformer,
          polesMap,
          childrenMap,
          nodes,
          edges,
          selectedIncident,
          levelHeight
        );
      });
    });

    return { nodes, edges };
  }, [activeTransformers, selectedIncident]);

  const positionPoleSubtree = (
    pole: PoleData,
    x: number,
    y: number,
    level: number,
    transformer: TransformerData,
    polesMap: Map<string, PoleData>,
    childrenMap: Map<string, PoleData[]>,
    nodes: RenderNode[],
    edges: RenderEdge[],
    selectedInc: IncidentData | null,
    lvlHeight: number
  ) => {
    const currentState = pole.poleState?.currentState || pole.currentState;
    const isDark = currentState === 'DARK';
    const children = childrenMap.get(pole.id) || [];

    // Check for Sensor Anomaly (Isolated dark pole with live children)
    const isSensorAnomaly =
      isDark &&
      children.length > 0 &&
      children.every(
        (c) => (c.poleState?.currentState || c.currentState) !== 'DARK'
      );

    nodes.push({
      id: pole.id,
      code: `P-${pole.id.substring(0, 6)}`,
      type: 'POLE',
      transformerId: transformer.id,
      transformerCode: transformer.transformerCode,
      x,
      y,
      state: currentState,
      isDark,
      isSensorAnomaly,
      parentPoleId: pole.parentPoleId,
      ward: pole.ward,
      pincode: pole.pincode,
      rawPole: pole,
    });

    if (children.length === 0) return;

    // Asymmetric branch spreading for realistic utility feeder layout
    const spreadWidth = Math.max(90 * children.length, 100);

    children.forEach((child, idx) => {
      // Irregular offset based on branch index
      const skew = idx % 2 === 0 ? -15 : 15;
      const childX = x - spreadWidth / 2 + (idx + 0.5) * (spreadWidth / children.length) + skew;
      const childY = y + lvlHeight + (idx % 2 === 0 ? 0 : 10);

      const childState = child.poleState?.currentState || child.currentState;
      const parentCode = `P-${pole.id.substring(0, 6)}`;
      const childCode = `P-${child.id.substring(0, 6)}`;

      let isFaultSpan = false;
      if (selectedInc && selectedInc.faultType === 'SPAN') {
        if (
          (selectedInc.decisionCard?.suspectedParentPoleCode === parentCode || selectedInc.suspectedParentPoleId === pole.id) &&
          (selectedInc.decisionCard?.suspectedChildPoleCode === childCode || selectedInc.suspectedChildPoleId === child.id)
        ) {
          isFaultSpan = true;
        }
      }

      // Sensor Anomaly does NOT stop power flow to children
      const isEnergized = isSensorAnomaly ? true : !isDark && childState !== 'DARK';

      edges.push({
        fromId: pole.id,
        toId: child.id,
        fromX: x,
        fromY: y,
        toX: childX,
        toY: childY,
        isFaultSpan,
        isEnergized,
      });

      positionPoleSubtree(
        child,
        childX,
        childY,
        level + 1,
        transformer,
        polesMap,
        childrenMap,
        nodes,
        edges,
        selectedInc,
        lvlHeight
      );
    });
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoomLevel, zoomLevel);

      const { nodes, edges } = computeGraphLayout();
      animOffsetRef.current = (animOffsetRef.current + 0.4) % 30;

      // 1. DRAW EDGES (Electrical Spans & Power Flow Particles)
      edges.forEach((edge) => {
        const isSelectedTransformer =
          selectedIncident &&
          nodes.find((n) => n.id === edge.fromId)?.transformerId === selectedIncident.transformerId;

        const edgeOpacity = selectedIncident === null || isSelectedTransformer ? 1 : 0.25;

        ctx.save();
        ctx.globalAlpha = edgeOpacity;

        if (edge.isFaultSpan) {
          // GLOWING RED FAULT FRONTIER SPAN
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 5;
          ctx.shadowColor = '#EF4444';
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.moveTo(edge.fromX, edge.fromY);
          ctx.lineTo(edge.toX, edge.toY);
          ctx.stroke();

          // Animated pulse dashes
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -animOffsetRef.current * 1.5;
          ctx.strokeStyle = '#FCA5A5';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // NORMAL ELECTRICAL SPAN
          ctx.strokeStyle = edge.isEnergized ? '#10B981' : '#484F58';
          ctx.lineWidth = 2;
          ctx.shadowColor = edge.isEnergized ? 'rgba(16, 185, 129, 0.4)' : 'transparent';
          ctx.shadowBlur = edge.isEnergized ? 4 : 0;
          ctx.beginPath();
          ctx.moveTo(edge.fromX, edge.fromY);
          ctx.lineTo(edge.toX, edge.toY);
          ctx.stroke();

          // ANIMATED POWER FLOW PARTICLES ON ENERGIZED LINES
          if (edge.isEnergized) {
            const dx = edge.toX - edge.fromX;
            const dy = edge.toY - edge.fromY;
            const distance = Math.hypot(dx, dy);

            if (distance > 0) {
              const particleCount = 2;
              for (let i = 0; i < particleCount; i++) {
                const progress = ((animOffsetRef.current * 1.3 + i * (distance / particleCount)) % distance) / distance;
                const px = edge.fromX + dx * progress;
                const py = edge.fromY + dy * progress;

                ctx.fillStyle = '#6EE7B7';
                ctx.shadowColor = '#10B981';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }
        ctx.restore();
      });

      // 2. DRAW NODES (Transformers & Poles)
      nodes.forEach((node) => {
        const isSelectedTransformer =
          selectedIncident && node.transformerId === selectedIncident.transformerId;
        const nodeOpacity = selectedIncident === null || isSelectedTransformer ? 1 : 0.3;

        ctx.save();
        ctx.globalAlpha = nodeOpacity;

        if (node.type === 'TRANSFORMER') {
          // Transformer: Yellow Industrial Square
          const size = 24;
          const isDtFault = selectedIncident?.faultType === 'DT' && selectedIncident.transformerId === node.transformerId;

          ctx.fillStyle = isDtFault ? '#EF4444' : '#F59E0B';
          ctx.shadowColor = isDtFault ? '#EF4444' : '#F59E0B';
          ctx.shadowBlur = isDtFault ? 18 : 12;
          ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);

          ctx.strokeStyle = '#0D1117';
          ctx.lineWidth = 2;
          ctx.strokeRect(node.x - size / 2, node.y - size / 2, size, size);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`DT ${node.code}`, node.x, node.y - 16);
        } else {
          // Pole Node
          const isDark = node.isDark;
          const radius = 7;

          if (node.isSensorAnomaly) {
            // SENSOR ANOMALY: Purple/Amber indicator (False Alarm Blocked)
            ctx.fillStyle = '#F59E0B';
            ctx.shadowColor = '#F59E0B';
            ctx.shadowBlur = 10;
          } else {
            ctx.fillStyle = isDark ? '#EF4444' : '#10B981';
            ctx.shadowColor = isDark ? '#EF4444' : '#10B981';
            ctx.shadowBlur = isDark ? 12 : 5;
          }

          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#0D1117';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Pole Code Label
          ctx.fillStyle = node.isSensorAnomaly ? '#FBBF24' : isDark ? '#FCA5A5' : '#8B949E';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(node.code, node.x, node.y + 16);
        }

        ctx.restore();
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [computeGraphLayout, panOffset, zoomLevel, selectedIncident]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
      const mouseY = (e.clientY - rect.top - panOffset.y) / zoomLevel;

      const { nodes } = computeGraphLayout();
      const hovered = nodes.find(
        (n) => Math.hypot(n.x - mouseX, n.y - mouseY) < 18
      );
      setHoveredNode(hovered || null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
      const mouseY = (e.clientY - rect.top - panOffset.y) / zoomLevel;

      const { nodes } = computeGraphLayout();
      const clicked = nodes.find(
        (n) => Math.hypot(n.x - mouseX, n.y - mouseY) < 18
      );

      if (clicked && selectedIncident) {
        onSelectIncident(selectedIncident);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoomLevel((prev) => Math.max(0.6, Math.min(2.5, prev * zoomFactor)));
  };

  const { nodes, edges } = computeGraphLayout();
  const canvasWidth = containerRef.current?.clientWidth || 800;
  const canvasHeight = containerRef.current?.clientHeight || 600;

  return (
    <div
      ref={containerRef}
      className="flex-1 relative h-full bg-[#0B0E14] overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* DEVELOPER DEBUG DIAGNOSTICS OVERLAY */}
      <div className="absolute top-3 left-3 bg-[#161B22]/90 border border-[#30363D] px-3 py-2 rounded text-[10px] font-mono text-gray-300 backdrop-blur z-[1000] space-y-0.5 shadow-lg pointer-events-none">
        <div className="font-bold text-emerald-400 border-b border-[#30363D] pb-1 mb-1">
          GRIDASSIST GRAPH DIAGNOSTICS
        </div>
        <div>Feeders: <span className="text-white">2</span></div>
        <div>Transformers: <span className="text-amber-400">{activeTransformers.length}</span></div>
        <div>Rendered Nodes: <span className="text-white">{nodes.length}</span></div>
        <div>Rendered Edges: <span className="text-white">{edges.length}</span></div>
        <div>Canvas Size: <span className="text-gray-400">{canvasWidth} x {canvasHeight}</span></div>
        <div>Scale / Pan: <span className="text-gray-400">{zoomLevel.toFixed(2)}x ({Math.round(panOffset.x)}, {Math.round(panOffset.y)})</span></div>
        <div>Selected Outage: <span className="text-rose-400">{selectedIncident ? selectedIncident.decisionCard?.transformerCode || 'Active' : 'None'}</span></div>
      </div>

      {/* Hover Node Tooltip */}
      {hoveredNode && (
        <div
          className="absolute pointer-events-none bg-[#161B22]/95 border border-[#30363D] p-2.5 rounded text-xs font-mono text-gray-200 shadow-2xl backdrop-blur z-[1000]"
          style={{
            left: hoveredNode.x * zoomLevel + panOffset.x + 15,
            top: hoveredNode.y * zoomLevel + panOffset.y - 15,
          }}
        >
          <div className="font-bold text-amber-400">
            {hoveredNode.type === 'TRANSFORMER' ? `DT ${hoveredNode.code}` : `POLE ${hoveredNode.code}`}
          </div>
          <div>Status: <span className={hoveredNode.isDark ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{hoveredNode.state}</span></div>
          {hoveredNode.isSensorAnomaly && <div className="text-amber-400 font-bold">⚠ SENSOR ANOMALY (Live Children)</div>}
          <div>Ward: {hoveredNode.ward}</div>
          <div>PIN: {hoveredNode.pincode || '560078'}</div>
        </div>
      )}

      {/* SCADA Industrial Graph Legend */}
      <div className="absolute bottom-3 left-3 bg-[#161B22]/95 border border-[#30363D] p-2.5 rounded text-[11px] font-mono text-gray-300 backdrop-blur z-[1000] flex flex-col gap-1.5 shadow-xl">
        <div className="font-bold text-white text-xs border-b border-[#30363D] pb-1 mb-0.5">
          ELECTRICAL TOPOLOGY GRAPH SYMBOLS
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-amber-500 rounded-sm border border-black font-bold text-[8px] flex items-center justify-center text-black">
            DT
          </span>
          <span>Distribution Transformer</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10B981]" />
          <span>Live Pole Node (Energized)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 scada-pulse-node shadow-[0_0_6px_#EF4444]" />
          <span>Dark Pole Node (Outage)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_#F59E0B]" />
          <span>Sensor Anomaly (False Alarm Blocked)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-1 bg-emerald-500 rounded" />
          <span className="text-emerald-400">Power Flow Particles (Live Line)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-1 bg-rose-500 rounded scada-glow-polyline" />
          <span className="text-rose-400 font-bold">Failed Electrical Span (Fault Frontier)</span>
        </div>
      </div>
    </div>
  );
};
