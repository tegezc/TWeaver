import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

export default function ThreatEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      className="threat-edge"
      style={{
        ...style,
        strokeWidth: 2.5,
        stroke: '#ef4444',
      }}
    />
  );
}
