import React, { useState, useRef, useEffect } from 'react';

const GraphCanvas = ({ 
  nodes = [], setNodes, edges = [], setEdges, 
  activeTool, isDirected,
  highlightedNodes = [], highlightedEdges = [],
  onOpenWeightModal,
  onOpenRenameModal,
  onAddNode
}) => {
  const svgRef = useRef(null);
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [pulledEdge, setPulledEdge] = useState(null);
  const [connectionStart, setConnectionStart] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const getCoords = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    return { 
      x: (clientX - viewTransform.x) / viewTransform.k, 
      y: (clientY - viewTransform.y) / viewTransform.k 
    };
  };
  const isLeft = (a, b, c) => ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) > 0;

  const getEffectiveCurvature = (edge, allEdges) => {
    if (edge.curvature !== 0) return edge.curvature;
    const samePair = allEdges.filter(e => (e.from === edge.from && e.to === edge.to) || (e.from === edge.to && e.to === edge.from));
    if (samePair.length <= 1) return 0;
    const idx = samePair.findIndex(e => e.id === edge.id);
    return (idx - (samePair.length - 1) / 2) * 50;
  };

  const getLoopPath = (node, edge, allEdges) => {
    const { x, y } = node;
    const sameNodeLoops = allEdges.filter(e => e.from === edge.from && e.to === edge.to);
    const idx = sameNodeLoops.findIndex(e => e.id === edge.id);
    const h = 85 + (edge.curvature || 0) + idx * 30; 
    const w = 35 + idx * 20; 
    return `M ${x},${y} C ${x - w},${y - h} ${x + w},${y - h} ${x},${y}`;
  };

  const getControlPoint = (edge, nodes, allEdges) => {
    const from = nodes.find(n => n.id === edge.from);
    const to = nodes.find(n => n.id === edge.to);
    if (!from || !to) return { x: 0, y: 0 };
    const curv = getEffectiveCurvature(edge, allEdges);
    const dx = to.x - from.x, dy = to.y - from.y, dist = Math.hypot(dx, dy);
    return {
      x: (from.x + to.x) / 2 + (curv * dy) / (dist || 1),
      y: (from.y + to.y) / 2 - (curv * dx) / (dist || 1)
    };
  };

  const handleWheel = (e) => {
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newScale = Math.min(Math.max(0.1, viewTransform.k + delta), 5);
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const scaleRatio = newScale / viewTransform.k;
    setViewTransform({
      k: newScale,
      x: mouseX - (mouseX - viewTransform.x) * scaleRatio,
      y: mouseY - (mouseY - viewTransform.y) * scaleRatio
    });
  };

  const handleMouseDown = (e) => {
    if (e.button === 1 || activeTool === 'hand') { 
      setIsPanning(true);
      return;
    }
    const coords = getCoords(e);
    const node = nodes.find(n => Math.hypot(n.x - coords.x, n.y - coords.y) < 22);
    if (activeTool === 'label' && node) {
      onOpenRenameModal(node.id, node.label);
      return;
    }
    if (activeTool === 'loop' && node) {
      setEdges([...edges, { 
        id: Date.now(), from: node.id, to: node.id, 
        weight: 1, hasWeight: false, curvature: 0, 
        isDirected: isDirected 
      }]);
      return;
    }
    if (activeTool === 'eraser' && node) {
      setNodes(nodes.filter(n => n.id !== node.id));
      setEdges(edges.filter(edge => edge.from !== node.id && edge.to !== node.id));
      return;
    }
    if (node) {
      if (activeTool === 'edge' || activeTool === 'arc') setConnectionStart(node);
      else if (activeTool === 'select') setDraggedNode(node.id);
    } else {
      if (activeTool === 'vertex') {
        onAddNode(coords); 
      } else {
        setIsPanning(true);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setViewTransform(prev => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
      return;
    }
    const coords = getCoords(e);
    setMousePos(coords);
    if (draggedNode) {
      setNodes(prev => prev.map(n => n.id === draggedNode ? { ...n, x: coords.x, y: coords.y } : n));
    }
    if (pulledEdge) {
      setEdges(prev => prev.map(edge => {
        if (edge.id !== pulledEdge) return edge;
        const from = nodes.find(n => n.id === edge.from);
        const to = nodes.find(n => n.id === edge.to);
        const midX = (from.x + to.x) / 2, midY = (from.y + to.y) / 2;
        const newCurv = Math.hypot(coords.x - midX, coords.y - midY) * 2 * (isLeft(from, to, coords) ? -1 : 1);
        return { ...edge, curvature: newCurv };
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (connectionStart && (activeTool === 'edge' || activeTool === 'arc')) {
      const target = nodes.find(n => Math.hypot(n.x - mousePos.x, n.y - mousePos.y) < 20);
      if (target && target.id !== connectionStart.id) {
        setEdges([...edges, { 
          id: Date.now(), from: connectionStart.id, to: target.id, 
          weight: 1, hasWeight: false, curvature: 0, 
          isDirected: activeTool === 'arc' ? true : isDirected 
        }]);
      }
    }
    setDraggedNode(null); setConnectionStart(null); setPulledEdge(null);
  };

  const renderGrid = () => (
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
      </pattern>
    </defs>
  );

  const renderEdge = (edge) => {    
    const from = nodes.find(n => n.id === edge.from);
    const to = nodes.find(n => n.id === edge.to);
    if (!from || !to) return null;
    const isLoop = edge.from === edge.to;
    let path;
    let labelX, labelY;
    if (isLoop) {
        path = getLoopPath(from, edge, edges);
        labelX = from.x;
        labelY = from.y - 100;
    } else {
        const ctrl = getControlPoint(edge, nodes, edges);
        path = `M${from.x},${from.y} Q${ctrl.x},${ctrl.y} ${to.x},${to.y}`;
        const midX = (from.x + 2 * ctrl.x + to.x) / 4;
        const midY = (from.y + 2 * ctrl.y + to.y) / 4;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const chordMidX = (from.x + to.x) / 2;
        const chordMidY = (from.y + to.y) / 2;
        const curveDirX = midX - chordMidX;
        const curveDirY = midY - chordMidY;
        const curveLen = Math.hypot(curveDirX, curveDirY);
        const offsetDistance = 18;
        if (curveLen > 1) {
             labelX = midX + (curveDirX / curveLen) * offsetDistance;
             labelY = midY + (curveDirY / curveLen) * offsetDistance;
        } else {
             labelX = midX + nx * offsetDistance;
             labelY = midY + ny * offsetDistance;
        }
    }

    const isHighlighted = highlightedEdges.includes(edge.id);
    const strokeColor = isHighlighted ? "#ef4444" : "#94a3b8";
    return (
      <g key={edge.id}>
        <path id={`path-${edge.id}`} d={path} fill="none" />
        <path 
          d={path} 
          stroke="transparent" 
          strokeWidth="20" 
          fill="none" 
          className="cursor-pointer"
          onMouseDown={(e) => {
            e.stopPropagation();
            if (activeTool === 'eraser') {
              setEdges(edges.filter(ed => ed.id !== edge.id));
            } else if (activeTool === 'weight') {
              onOpenWeightModal(edge.id, edge.weight);
            } else if (activeTool === 'select') {
              setPulledEdge(edge.id);
            }
          }}
        />

        <path 
          d={path} 
          stroke={strokeColor} 
          strokeWidth="2.5" 
          fill="none" 
          pointerEvents="none" 
          markerEnd={edge.isDirected ? (isHighlighted ? "url(#arrow-highlight)" : "url(#arrow)") : ""} 
        />

        {edge.hasWeight && (
          <g transform={`translate(${labelX}, ${labelY})`}>
            <rect x="-10" y="-10" width="20" height="20" rx="4" fill="white" fillOpacity="0.8"/>
            <text textAnchor="middle" dominantBaseline="middle" className={`text-[12px] font-bold select-none pointer-events-none ${isHighlighted ? "fill-red-600" : "fill-slate-800"}`}>
              {edge.weight}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="w-full h-full bg-white rounded-2xl shadow-inner border border-slate-200 overflow-hidden select-none">
      <svg 
        ref={svgRef} 
        className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`} 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
          </pattern>
          <marker id="arrow" markerWidth="12" markerHeight="10" refX="25" refY="5" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L12,5 L0,10 Z" fill="#94a3b8"/>
          </marker>
          <marker id="arrow-highlight" markerWidth="12" markerHeight="10" refX="25" refY="5" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L12,5 L0,10 Z" fill="#ef4444"/>
          </marker>
        </defs>
        <rect 
            x={-50000} y={-50000} width={100000} height={100000} 
            fill="url(#grid)" 
            transform={`translate(${viewTransform.x}, ${viewTransform.y}) scale(${viewTransform.k})`}
            style={{ pointerEvents: 'none' }}
        />
        <g transform={`translate(${viewTransform.x}, ${viewTransform.y}) scale(${viewTransform.k})`}>
            {edges.map(renderEdge)}
            {nodes.map(node => {
              const isHighlighted = highlightedNodes.includes(node.id);
              const fill = isHighlighted ? "#ef4444" : (node.color || "white");
              const stroke = isHighlighted ? "#b91c1c" : "#1e293b";
              const textColor = isHighlighted ? "white" : "#1e293b";
              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`} className="cursor-pointer">
                  <circle r="18" cy="2" fill="rgba(0,0,0,0.1)" />
                  <circle r="18" fill={fill} stroke={stroke} strokeWidth="2.5" className="transition-colors duration-300" />
                  <text textAnchor="middle" dy=".3em" fill={textColor} className="text-[13px] font-bold pointer-events-none select-none">
                    {node.label}
                  </text>
                </g>
              );
            })}
            {connectionStart && (
              <line x1={connectionStart.x} y1={connectionStart.y} x2={mousePos.x} y2={mousePos.y} stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
            )}
        </g>
      </svg>
    </div>
  );
};
export default GraphCanvas;