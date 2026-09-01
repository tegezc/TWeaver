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
      node('internet-1', 'internet', 320, 40),
      node('webserver-1', 'webserver', 320, 260, { publicAccess: true }),
      node('api-gateway-1', 'apigateway', 320, 500, { publicAccess: true, rateLimited: false }),
      node('backend-1', 'backendservice', 320, 740),
      node('database-1', 'database', 120, 980, { publicAccess: true, encrypted: false }),
      node('storage-1', 'storage', 520, 980, { publicAccess: true, encrypted: false }),
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
