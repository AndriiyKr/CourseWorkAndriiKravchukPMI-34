export const getDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const getControlPoint = (from, to, index, total) => {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  if (total === 1) {
    return { x: midX, y: midY };
  }
  const dist = getDistance(from, to);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const nx = -dy / dist;
  const ny = dx / dist;
  const step = 40; 
  const offset = step * (index - (total - 1) / 2);
  return {
    x: midX + nx * offset,
    y: midY + ny * offset
  };
};

export const getAdjustedPoints = (from, to, radius = 22) => {
  const dist = getDistance(from, to);
  if (dist === 0) return { from, to };
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return {
    x1: from.x + (dx * radius) / dist,
    y1: from.y + (dy * radius) / dist,
    x2: to.x - (dx * radius) / dist,
    y2: to.y - (dy * radius) / dist
  };
};

export const generatePathData = (from, to, controlPoint, isCurved) => {
  if (!isCurved) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }
  return `M ${from.x} ${from.y} Q ${controlPoint.x} ${controlPoint.y} ${to.x} ${to.y}`;
};