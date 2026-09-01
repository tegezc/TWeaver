import type { Edge, Node } from '@xyflow/react';
import type { NodeConfig, NodeKind, PatchType, ThreatFinding } from '../domain/kinds';

export type NodeData = {
  label: string;
  kind: NodeKind;
  config: NodeConfig;
  threats: ThreatFinding[];
  patches: PatchType[];
};

export type ThreatNode = Node<NodeData, 'architectureNode'>;
export type ThreatEdge = Edge;

export type ActivityEntry = {
  id: string;
  at: number;
  tool: string;
  detail: string;
  result: string;
};

export type WebmcpStatus = 'unknown' | 'ready' | 'unavailable';

export type AgentNodeView = {
  id: string;
  kind: NodeKind;
  label: string;
  config: NodeConfig;
  threats: ThreatFinding[];
  patches: PatchType[];
  position: { x: number; y: number };
};

export type AgentEdgeView = {
  id: string;
  source: string;
  target: string;
  kind: 'data' | 'threat';
};
