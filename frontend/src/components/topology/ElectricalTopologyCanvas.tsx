import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TransformerData, IncidentData, PoleData } from '../../types';
import { SCADAHelpToggle } from './SCADAHelpToggle';
import { useSimulationStore } from '../../store/useSimulationStore';

interface Props {
  transformers: TransformerData[];
  selectedIncident: IncidentData | null;
  onSelectIncident: (incident: IncidentData) => void;
}

interface RenderNode {
  id: string;
  code: string;
  type: 'SUBSTATION' | 'TRANSFORMER' | 'POLE';
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

// 47-Node Connected Electrical Network Dataset (SSOT: NETWORK_TOPOLOGY_SPEC.md)
const FALLBACK_TRANSFORMERS: TransformerData[] = [
  {
    id: 'dt-fallback-01',
    feederId: 'F-07',
    transformerCode: 'D-0101',
    latitude: 12.9716,
    longitude: 77.6412,
    ward: 'W-084',
    status: 'ACTIVE',
    inferredEdges: [],
    poles: Array.from({ length: 25 }, (_, i) => {
      const num = i + 1;
      const code = `P-${num.toString().padStart(3, '0')}`;
      let parentPoleId: string | null = null;
      if (num === 2 || num === 3 || num === 4) parentPoleId = `P-${(num - 1).toString().padStart(3, '0')}`;
      else if (num === 5) parentPoleId = 'P-002'; // Branch split 1
      else if (num >= 6 && num <= 12) parentPoleId = `P-${(num - 1).toString().padStart(3, '0')}`;
      else if (num === 13) parentPoleId = 'P-001'; // Branch split 2 (Spur B)
      else if (num >= 14 && num <= 25) parentPoleId = `P-${(num - 1).toString().padStart(3, '0')}`;

      return {
        id: code,
        transformerId: 'dt-fallback-01',
        parentPoleId,
        sequenceNumber: num,
        latitude: 12.9716 + num * 0.0001,
        longitude: 77.6412 + num * 0.0001,
        ward: 'W-084',
        pincode: '560078',
        poleType: num % 2 === 0 ? 'STEEL' : 'CONCRETE',
        topologySource: 'SURVEYED',
        currentState: 'LIVE',
        hasDevice: true,
      };
    }),
  },
  {
    id: 'dt-fallback-02',
    feederId: 'F-07',
    transformerCode: 'D-0102',
    latitude: 12.9725,
    longitude: 77.6425,
    ward: 'W-085',
    status: 'ACTIVE',
    inferredEdges: [],
    poles: Array.from({ length: 20 }, (_, i) => {
      const num = i + 26;
      const code = `P-${num.toString().padStart(3, '0')}`;
      let parentPoleId: string | null = null;
      if (num >= 27 && num <= 35) parentPoleId = `P-${(num - 1).toString().padStart(3, '0')}`;
      else if (num === 36) parentPoleId = 'P-026'; // Branch split (Spur D)
      else if (num >= 37 && num <= 45) parentPoleId = `P-${(num - 1).toString().padStart(3, '0')}`;

      return {
        id: code,
        transformerId: 'dt-fallback-02',
        parentPoleId,
        sequenceNumber: num,
        latitude: 12.9725 + (num - 25) * 0.0001,
        longitude: 77.6425 + (num - 25) * 0.0001,
        ward: 'W-085',
        pincode: '560078',
        poleType: 'CONCRETE',
        topologySource: 'SURVEYED',
        currentState: 'LIVE',
        hasDevice: true,
      };
    }),
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

  // Particle & Keyframe Time Reference
  const animTimeRef = useRef<number>(0);

  // Camera Animation Matrix State
  const cameraAnimRef = useRef<{
    active: boolean;
    startTime: number;
    duration: number;
    startPan: { x: number; y: number };
    targetPan: { x: number; y: number };
    startZoom: number;
    targetZoom: number;
  }>({
    active: false,
    startTime: 0,
    duration: 650,
    startPan: { x: 50, y: 30 },
    targetPan: { x: 50, y: 30 },
    startZoom: 1.0,
    targetZoom: 1.0,
  });

  const { isGuidedMode, activeScript, currentStepIndex } = useSimulationStore();

  const activeTransformers =
    transformers && transformers.length > 0 ? transformers : FALLBACK_TRANSFORMERS;

  // Compute 47-Node Asymmetric Feeder Graph Coordinates (SSOT: GRAPH_LAYOUT_ENGINE.md)
  const computeGraphLayout = useCallback((): { nodes: RenderNode[]; edges: RenderEdge[] } => {
    const nodes: RenderNode[] = [];
    const edges: RenderEdge[] = [];

    // Get current active script step for Guided Demo Mode state synchronization
    const currentStep = isGuidedMode && activeScript?.steps ? activeScript.steps[currentStepIndex] : null;
    const scriptDarkPoleCodes = currentStep?.expectedState?.darkPoleCodes || [];
    const scriptIsolatedSpan = currentStep?.narration?.isolatedSpan || currentStep?.expectedState?.isolatedSpan;

    // Substation Node (SUB-01) at x:540, y:40
    const subX = 540;
    const subY = 40;
    nodes.push({
      id: 'sub-01',
      code: 'SUB-01 (33kV)',
      type: 'SUBSTATION',
      transformerId: 'sub-01',
      transformerCode: 'SUB-01',
      x: subX,
      y: subY,
      state: 'LIVE',
      isDark: false,
      isSensorAnomaly: false,
      parentPoleId: null,
      ward: 'SUBSTATION CONTROL',
      pincode: '560078',
    });

    const transformerSpacing = 580;
    const levelHeight = 85;

    activeTransformers.forEach((transformer, dtIdx) => {
      const dtX = 260 + dtIdx * transformerSpacing;
      const dtY = 130;

      // Connect Substation to DT via Feeder F-07
      edges.push({
        fromId: 'sub-01',
        toId: transformer.id,
        fromX: subX,
        fromY: subY,
        toX: dtX,
        toY: dtY,
        isFaultSpan: false,
        isEnergized: true,
      });

      // Add Transformer Node (Yellow Industrial Square)
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
        const xOffset = (rootIdx - (rootCount - 1) / 2) * (rootWidth / rootCount);
        const rootX = dtX + xOffset;
        const rootY = dtY + 90;

        const rootCode = rootPole.id.startsWith('P-') ? rootPole.id : `P-${rootPole.id.substring(0, 6)}`;
        const isRootScriptDark = scriptDarkPoleCodes.includes(rootCode);
        const rootState = rootPole.poleState?.currentState || rootPole.currentState;
        const isRootEnergized = !isRootScriptDark && rootState !== 'DARK';

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
          levelHeight,
          scriptDarkPoleCodes,
          scriptIsolatedSpan
        );
      });
    });

    return { nodes, edges };
  }, [activeTransformers, selectedIncident, isGuidedMode, activeScript, currentStepIndex]);

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
    lvlHeight: number,
    scriptDarkPoleCodes: string[],
    scriptIsolatedSpan?: { parentCode: string; childCode: string }
  ) => {
    const poleCode = pole.id.startsWith('P-') ? pole.id : `P-${pole.id.substring(0, 6)}`;
    const isScriptDark = scriptDarkPoleCodes.includes(poleCode);
    const dbState = pole.poleState?.currentState || pole.currentState;
    const isDark = isScriptDark || dbState === 'DARK';
    const currentState = isDark ? 'DARK' : 'LIVE';
    const children = childrenMap.get(pole.id) || [];

    const isSensorAnomaly =
      isDark &&
      children.length > 0 &&
      children.every(
        (c) => (c.poleState?.currentState || c.currentState) !== 'DARK'
      );

    nodes.push({
      id: pole.id,
      code: pole.id.startsWith('P-') ? pole.id : `P-${pole.id.substring(0, 6)}`,
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

    const spreadWidth = Math.max(90 * children.length, 100);

    children.forEach((child, idx) => {
      const skew = idx % 2 === 0 ? -15 : 15;
      const childX = x - spreadWidth / 2 + (idx + 0.5) * (spreadWidth / children.length) + skew;
      const childY = y + lvlHeight + (idx % 2 === 0 ? 0 : 10);

      const parentCode = pole.id.startsWith('P-') ? pole.id : `P-${pole.id.substring(0, 6)}`;
      const childCode = child.id.startsWith('P-') ? child.id : `P-${child.id.substring(0, 6)}`;
      const isChildScriptDark = scriptDarkPoleCodes.includes(childCode);
      const childState = child.poleState?.currentState || child.currentState;
      const isChildDark = isChildScriptDark || childState === 'DARK';

      let isFaultSpan = false;
      if (scriptIsolatedSpan && scriptIsolatedSpan.parentCode === parentCode && scriptIsolatedSpan.childCode === childCode) {
        isFaultSpan = true;
      } else if (selectedInc && selectedInc.faultType === 'SPAN') {
        if (
          (selectedInc.decisionCard?.suspectedParentPoleCode === parentCode || selectedInc.suspectedParentPoleId === pole.id) &&
          (selectedInc.decisionCard?.suspectedChildPoleCode === childCode || selectedInc.suspectedChildPoleId === child.id)
        ) {
          isFaultSpan = true;
        }
      }

      const isEnergized = isSensorAnomaly ? true : !isDark && !isChildDark;

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
        lvlHeight,
        scriptDarkPoleCodes,
        scriptIsolatedSpan
      );
    });
  };

  // Camera Auto-Pan Trigger on Guided Step or Incident Selection (SSOT: CAMERA_ANIMATION_SPEC.md)
  useEffect(() => {
    const { nodes, edges } = computeGraphLayout();
    let targetNode: RenderNode | undefined;

    if (isGuidedMode && activeScript?.steps) {
      const currentStep = activeScript.steps[currentStepIndex];
      const focusId = currentStep?.narration?.focusAssetId || currentStep?.expectedState?.darkPoleCodes?.[0];
      if (focusId) {
        targetNode = nodes.find((n) => n.code === focusId || n.id === focusId || n.code.includes(focusId));
      }
    }

    if (!targetNode && selectedIncident) {
      if (selectedIncident.faultType === 'SPAN') {
        const faultEdge = edges.find((e) => e.isFaultSpan);
        if (faultEdge) {
          targetNode = nodes.find((n) => n.id === faultEdge.toId);
        }
      } else {
        targetNode = nodes.find((n) => n.transformerId === selectedIncident.transformerId);
      }
    }

    if (targetNode && containerRef.current) {
      const W = containerRef.current.clientWidth;
      const H = containerRef.current.clientHeight;
      const targetZoom = 1.45;

      // Quartic Offset Centroid Formula (SSOT: CAMERA_ANIMATION_SPEC.md)
      const targetDx = W / 2 - targetNode.x * targetZoom;
      const targetDy = H / 3.2 - targetNode.y * targetZoom;

      cameraAnimRef.current = {
        active: true,
        startTime: performance.now(),
        duration: 650,
        startPan: { ...panOffset },
        targetPan: { x: targetDx, y: targetDy },
        startZoom: zoomLevel,
        targetZoom: targetZoom,
      };
    } else if (!selectedIncident && (!isGuidedMode || currentStepIndex === 0)) {
      // Smooth return to default overview bounds at 50% scale (650ms Quartic Out)
      cameraAnimRef.current = {
        active: true,
        startTime: performance.now(),
        duration: 650,
        startPan: { ...panOffset },
        targetPan: { x: 50, y: 30 },
        startZoom: zoomLevel,
        targetZoom: 0.5,
      };
    }
  }, [selectedIncident, isGuidedMode, activeScript, currentStepIndex, computeGraphLayout]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = (time: number) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // 1. PROCESS CAMERA ANIMATION MATRIX (650ms Quartic Out)
      if (cameraAnimRef.current.active) {
        const elapsed = time - cameraAnimRef.current.startTime;
        const progress = Math.min(1.0, elapsed / cameraAnimRef.current.duration);

        // Quartic Out Easing: f(t) = 1 - (1 - t)^4
        const eased = 1 - Math.pow(1 - progress, 4);

        const currentZoom =
          cameraAnimRef.current.startZoom +
          (cameraAnimRef.current.targetZoom - cameraAnimRef.current.startZoom) * eased;
        const currentPanX =
          cameraAnimRef.current.startPan.x +
          (cameraAnimRef.current.targetPan.x - cameraAnimRef.current.startPan.x) * eased;
        const currentPanY =
          cameraAnimRef.current.startPan.y +
          (cameraAnimRef.current.targetPan.y - cameraAnimRef.current.startPan.y) * eased;

        setZoomLevel(currentZoom);
        setPanOffset({ x: currentPanX, y: currentPanY });

        if (progress >= 1.0) {
          cameraAnimRef.current.active = false;
        }
      }

      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoomLevel, zoomLevel);

      const { nodes, edges } = computeGraphLayout();
      animTimeRef.current = time / 1000; // time in seconds

      // 2. DRAW EDGES (Electrical Spans & Current Particles)
      edges.forEach((edge) => {
        const isSelectedTransformer =
          selectedIncident &&
          nodes.find((n) => n.id === edge.fromId)?.transformerId === selectedIncident.transformerId;

        // Visual Attention Model: Dim unrelated branches to 15% opacity
        const edgeOpacity = selectedIncident === null || isSelectedTransformer ? 1 : 0.15;

        ctx.save();
        ctx.globalAlpha = edgeOpacity;

        if (edge.isFaultSpan) {
          // FAULT FRONTIER RED GLOW POLYLINE (SSOT: ELECTRICAL_EFFECTS_SPEC.md)
          const glowPulse = 6 + 10 * Math.sin(animTimeRef.current * 4);
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 5;
          ctx.shadowColor = '#EF4444';
          ctx.shadowBlur = glowPulse;
          ctx.beginPath();
          ctx.moveTo(edge.fromX, edge.fromY);
          ctx.lineTo(edge.toX, edge.toY);
          ctx.stroke();

          // Animated crimson dash offset
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -animTimeRef.current * 45;
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

          // ENERGIZED CURRENT FLOW PARTICLES (45 px/s, SSOT: PARTICLE_PHYSICS_SPEC.md)
          if (edge.isEnergized) {
            const dx = edge.toX - edge.fromX;
            const dy = edge.toY - edge.fromY;
            const distance = Math.hypot(dx, dy);

            if (distance > 0) {
              const velocity = 45; // 45 px/s
              const particleCount = 2;

              for (let i = 0; i < particleCount; i++) {
                const offset = i * (distance / particleCount);
                const progress = ((animTimeRef.current * velocity + offset) % distance) / distance;
                const px = edge.fromX + dx * progress;
                const py = edge.fromY + dy * progress;

                // Bright Mint Emerald Current Dot (#6EE7B7)
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

      // 3. DRAW NODES (Substation, Transformers, Poles)
      nodes.forEach((node) => {
        const isSelectedTransformer =
          selectedIncident && node.transformerId === selectedIncident.transformerId;
        const nodeOpacity = selectedIncident === null || isSelectedTransformer ? 1 : 0.2;

        ctx.save();
        ctx.globalAlpha = nodeOpacity;

        if (node.type === 'SUBSTATION') {
          // Substation Node: Dual-concentric Diamond in #3B82F6 (SSOT: NETWORK_TOPOLOGY_SPEC.md)
          const size = 32;
          ctx.save();
          ctx.translate(node.x, node.y);
          ctx.rotate(Math.PI / 4);

          ctx.fillStyle = '#3B82F6';
          ctx.shadowColor = '#3B82F6';
          ctx.shadowBlur = 14;
          ctx.fillRect(-size / 2, -size / 2, size, size);

          ctx.strokeStyle = '#60A5FA';
          ctx.lineWidth = 2;
          ctx.strokeRect(-size / 2 + 4, -size / 2 + 4, size - 8, size - 8);
          ctx.restore();

          ctx.fillStyle = '#93C5FD';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(node.code, node.x, node.y - 22);
        } else if (node.type === 'TRANSFORMER') {
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
          // Pole Node with 1.8s Dark Radial Pulse (SSOT: ELECTRICAL_EFFECTS_SPEC.md)
          const isDark = node.isDark;

          if (node.isSensorAnomaly) {
            // SENSOR ANOMALY: Amber Warning Ring
            ctx.fillStyle = '#F59E0B';
            ctx.shadowColor = '#F59E0B';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 7, 0, Math.PI * 2);
            ctx.fill();
          } else if (isDark) {
            // DARK OUTAGE POLE: 1.8s Radial Pulse Sine Wave R(t) = 7 * (1 + 0.25 * sin(2pi t / 1.8))
            const pulseScale = 1 + 0.25 * Math.sin((2 * Math.PI * animTimeRef.current) / 1.8);
            const radius = 7 * pulseScale;
            const shadow = 6 + 14 * Math.pow(Math.sin((Math.PI * animTimeRef.current) / 1.8), 2);

            ctx.fillStyle = '#EF4444';
            ctx.shadowColor = '#EF4444';
            ctx.shadowBlur = shadow;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // LIVE POLE NODE (Emerald Green)
            ctx.fillStyle = '#10B981';
            ctx.shadowColor = '#10B981';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 7, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.strokeStyle = '#0D1117';
          ctx.lineWidth = 1.5;
          ctx.stroke();

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

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [computeGraphLayout, panOffset, zoomLevel, selectedIncident]);

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
    // Manual drag cancels camera auto-pan matrix (SSOT: CAMERA_ANIMATION_SPEC.md)
    cameraAnimRef.current.active = false;
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
    // Wheel zoom cancels auto-pan
    cameraAnimRef.current.active = false;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoomLevel((prev) => Math.max(0.5, Math.min(2.5, prev * zoomFactor)));
  };

  const { nodes, edges } = computeGraphLayout();

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

      {/* Hover Node Tooltip with PINCODE & Lineman Dispatch Action */}
      {hoveredNode && (
        <div
          className="absolute pointer-events-none bg-[#161B22]/95 border border-[#30363D] p-3 rounded-xl text-xs font-mono text-gray-200 shadow-2xl backdrop-blur z-[1000] min-w-[210px] space-y-1"
          style={{
            left: hoveredNode.x * zoomLevel + panOffset.x + 15,
            top: hoveredNode.y * zoomLevel + panOffset.y - 15,
          }}
        >
          <div className="font-bold text-amber-400 border-b border-[#30363D] pb-1 flex justify-between items-center">
            <span>{hoveredNode.type === 'SUBSTATION' ? hoveredNode.code : hoveredNode.type === 'TRANSFORMER' ? `DT ${hoveredNode.code}` : `POLE ${hoveredNode.code}`}</span>
            <span className="text-[10px] text-gray-400 font-normal">{hoveredNode.type}</span>
          </div>
          <div>Status: <span className={hoveredNode.isDark ? 'text-rose-400 font-bold shadow-rose-500' : 'text-emerald-400 font-bold'}>{hoveredNode.state}</span></div>
          {hoveredNode.isSensorAnomaly && <div className="text-amber-400 font-bold text-[10px]">⚠ SENSOR ANOMALY (Live Children)</div>}
          <div>Ward: <span className="text-white">{hoveredNode.ward}</span></div>
          <div>PINCODE: <span className="text-emerald-400 font-bold">{hoveredNode.pincode || '560078'}</span></div>
          {hoveredNode.isDark && (
            <div className="mt-1.5 pt-1 border-t border-[#30363D] text-[10px] text-blue-400 flex items-center gap-1 font-bold animate-pulse">
              ⚡ LINEMAN CREW DISPATCH READY
            </div>
          )}
        </div>
      )}

      {/* Floating SCADA Help & Diagnostics Buttons */}
      <SCADAHelpToggle
        renderedNodesCount={nodes.length}
        renderedEdgesCount={edges.length}
        selectedOutage={selectedIncident ? selectedIncident.decisionCard?.transformerCode || 'Active' : 'None'}
        zoomLevel={zoomLevel}
        panOffset={panOffset}
      />

      {/* Floating Map Traversal & Zoom Controls Bar (+ / - / RECENTER) */}
      <div className="absolute bottom-4 right-4 z-[1000] flex items-center gap-1.5 bg-[#161B22]/90 border border-[#30363D] p-1.5 rounded-xl backdrop-blur shadow-2xl font-mono select-none">
        {/* Zoom Out Button (-) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            cameraAnimRef.current.active = false;
            setZoomLevel((prev) => Math.max(0.5, prev - 0.25));
          }}
          className="w-8 h-8 flex items-center justify-center bg-[#0D1117] hover:bg-[#21262D] text-gray-300 hover:text-white rounded-lg border border-[#30363D] transition-all active:scale-95 text-base font-bold shadow cursor-pointer"
          title="Zoom Out (-)"
        >
          -
        </button>

        {/* Current Zoom Level Badge */}
        <span className="px-2 text-[11px] font-bold text-emerald-400 min-w-[45px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>

        {/* Zoom In Button (+) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            cameraAnimRef.current.active = false;
            setZoomLevel((prev) => Math.min(2.5, prev + 0.25));
          }}
          className="w-8 h-8 flex items-center justify-center bg-[#0D1117] hover:bg-[#21262D] text-gray-300 hover:text-white rounded-lg border border-[#30363D] transition-all active:scale-95 text-base font-bold shadow cursor-pointer"
          title="Zoom In (+)"
        >
          +
        </button>

        <div className="w-px h-5 bg-[#30363D] mx-0.5" />

        {/* Recenter Grid Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            cameraAnimRef.current = {
              active: true,
              startTime: performance.now(),
              duration: 650,
              startPan: { ...panOffset },
              targetPan: { x: 50, y: 30 },
              startZoom: zoomLevel,
              targetZoom: 0.5,
            };
          }}
          className="px-2.5 h-8 flex items-center gap-1 bg-[#0D1117] hover:bg-[#21262D] text-amber-400 hover:text-amber-300 rounded-lg border border-[#30363D] transition-all active:scale-95 text-[11px] font-bold shadow cursor-pointer"
          title="Recenter Macro View (50%)"
        >
          <span>🎯 RECENTER</span>
        </button>
      </div>
    </div>
  );
};
