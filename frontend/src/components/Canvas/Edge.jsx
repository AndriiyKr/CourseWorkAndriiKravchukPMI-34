import React from 'react';

const Edge = ({ 
  edge, 
  nodes, 
  allEdges, 
  isHighlighted, 
  onClick 
}) => {
  const fromNode = nodes.find(n => n.id === edge.from);
  const toNode = nodes.find(n => n.id === edge.to);

  if (!fromNode || !toNode) return null;
  const parallelEdges = allEdges.filter(e => 
    (e.from === edge.from && e.to === edge.to) || 
    (e.from === edge.to && e.to === edge.from)
  );

  const edgeIndex = parallelEdges.findIndex(e => e.id === edge.id);
  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const dr = Math.sqrt(dx * dx + dy * dy) || 1;
  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;

  let pathData;
  let labelX;
  let labelY;

  if (parallelEdges.length === 1) {
    pathData = `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`;
    labelX = midX;
    labelY = midY;
  } else {
    const curveStep = 50; 
    const offset = curveStep * (edgeIndex - (parallelEdges.length - 1) / 2);
    const qx = midX + (offset * dy) / dr;
    const qy = midY - (offset * dx) / dr;
    pathData = `M ${fromNode.x} ${fromNode.y} Q ${qx} ${qy} ${toNode.x} ${toNode.y}`;
    labelX = (fromNode.x + 2 * qx + toNode.x) / 4;
    labelY = (fromNode.y + 2 * qy + toNode.y) / 4;
  }

  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle > 90 || angle < -90) {
    angle += 180;
  }

  const strokeColor = isHighlighted ? "#ef4444" : "#64748b";
  const strokeWidth = isHighlighted ? 4 : 2;
  const markerId = edge.isDirected 
    ? (isHighlighted ? "url(#arrowhead-highlight)" : "url(#arrowhead)") 
    : "";

  return (
    <g 
      className="group cursor-pointer" 
      onClick={(e) => {
        e.stopPropagation();
        onClick(edge.id);
      }}
    >
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        style={{ pointerEvents: 'stroke' }}
      />
      <path
        id={`path-${edge.id}`}
        d={pathData}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        markerEnd={markerId}
        className="transition-all duration-300 group-hover:stroke-blue-400"
      />
      {edge.weight !== undefined && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x="-12" 
            y="-9"
            width="24" 
            height="18"
            rx="4"
            fill="white"
            fillOpacity="1"
            stroke={isHighlighted ? "#ef4444" : "#cbd5e1"}
            strokeWidth="1"
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            className={`text-[11px] font-black select-none pointer-events-none ${
              isHighlighted ? "fill-red-600" : "fill-slate-800"
            }`}
            y="1"
          >
            {edge.weight}
          </text>
        </g>
      )}
    </g>
  );
};
export default Edge;
