import type { Edge } from '@xyflow/react';
import type { ThreatNode } from '../store/types';
import { KIND_LABELS, defaultConfig } from './kinds';
import type { ArchitectureKind } from './kinds';

function node(
  id: string,
  kind: ArchitectureKind,
  x: number,
  y: number,
  configOverrides: Partial<ReturnType<typeof defaultConfig>> = {},
): ThreatNode {
  return {
    id,
    type: 'architectureNode',
    position: { x, y },
    data: {
      label: KIND_LABELS[kind],
      kind,
      config: { ...defaultConfig(kind), ...configOverrides },
      threats: [],
      patches: [],
    },
  };
}

function dataEdge(source: string, target: string): Edge {
  return {
    id: `edge-${source}-${target}`,
    source,
    target,
  };
}

export function createStarterArchitecture(): { nodes: ThreatNode[]; edges: Edge[] } {
  return {
    nodes: [
      node('internet-1', 'internet', 40, 220),
      node('webserver-1', 'webserver', 300, 220, { publicAccess: true }),
      node('api-gateway-1', 'apigateway', 560, 220, { publicAccess: true, rateLimited: false }),
      node('backend-1', 'backendservice', 820, 220),
      node('database-1', 'database', 1080, 80, { publicAccess: true, encrypted: false }),
      node('storage-1', 'storage', 1080, 360, { publicAccess: true, encrypted: false }),
    ],
    edges: [
      dataEdge('internet-1', 'webserver-1'),
      dataEdge('webserver-1', 'api-gateway-1'),
      dataEdge('api-gateway-1', 'backend-1'),
      dataEdge('backend-1', 'database-1'),
      dataEdge('backend-1', 'storage-1'),
    ],
  };
}
