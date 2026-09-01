import { create } from 'zustand';
import type {
  Connection,
  EdgeChange,
  NodeChange,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
} from '@xyflow/react';
import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import {
  KIND_LABELS,
  defaultConfig,
  isPatchType,
  nextNodeId,
  type ArchitectureKind,
  type PatchType,
  type Stride,
} from '../domain/kinds';
import { createStarterArchitecture } from '../domain/starter';
import type {
  ActivityEntry,
  AgentEdgeView,
  AgentNodeView,
  ReportRing,
  ThreatEdge,
  ThreatNode,
  ThreatReport,
  WebmcpStatus,
} from './types';

type AppState = {
  nodes: ThreatNode[];
  edges: ThreatEdge[];
  selectedNodeId: string | null;
  activity: ActivityEntry[];
  webmcpStatus: WebmcpStatus;
  agentWriting: boolean;
  lastThreatReport: ThreatReport | null;
  reportHighlightUntil: number;
  onNodesChange: OnNodesChange<ThreatNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setSelectedNodeId: (id: string | null) => void;
  setWebmcpStatus: (status: WebmcpStatus) => void;
  setAgentWriting: (value: boolean) => void;
  logActivity: (tool: string, detail: string, result: string, ok?: boolean) => void;
  loadStarterArchitecture: () => { nodeCount: number; edgeCount: number };
  addArchitectureNode: (input: {
    kind: ArchitectureKind;
    label?: string;
    x?: number;
    y?: number;
  }) => { id: string; kind: ArchitectureKind };
  connectNodes: (sourceId: string, targetId: string) => { id: string } | { error: string };
  updateNode: (input: {
    nodeId: string;
    label?: string;
    publicAccess?: boolean;
    encrypted?: boolean;
    rateLimited?: boolean;
  }) => { id: string } | { error: string };
  simulateAttack: (input: {
    targetNodeId: string;
    stride: Stride;
    description: string;
  }) => { edgeId: string } | { error: string };
  applySecurityPatch: (input: {
    targetNodeId: string;
    patchType: PatchType;
  }) => { applied: PatchType; addedNodeId?: string } | { error: string };
  getArchitectureState: () => { nodes: AgentNodeView[]; edges: AgentEdgeView[] };
  getThreatReport: () => ThreatReport;
};

function toAgentNode(node: ThreatNode): AgentNodeView {
  return {
    id: node.id,
    kind: node.data.kind,
    label: node.data.label,
    config: node.data.config,
    threats: node.data.threats,
    patches: node.data.patches,
    position: node.position,
  };
}

function toAgentEdge(edge: ThreatEdge): AgentEdgeView {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    kind: edge.type === 'threatEdge' ? 'threat' : 'data',
  };
}

function isMisconfigured(node: AgentNodeView): boolean {
  if (node.kind === 'database' || node.kind === 'storage') {
    return node.config.publicAccess || !node.config.encrypted;
  }
  if (
    node.kind === 'apigateway' ||
    node.kind === 'webserver' ||
    node.kind === 'loadbalancer'
  ) {
    return node.config.publicAccess && !node.config.rateLimited;
  }
  return false;
}

let activitySeq = 0;

const starter = createStarterArchitecture();

const useStore = create<AppState>((set, get) => ({
  nodes: starter.nodes,
  edges: starter.edges,
  selectedNodeId: null,
  activity: [],
  webmcpStatus: 'unknown',
  agentWriting: false,
  lastThreatReport: null,
  reportHighlightUntil: 0,

  onNodesChange: (changes: NodeChange<ThreatNode>[]) => {
    const removedIds = changes
      .filter((change) => change.type === 'remove')
      .map((change) => change.id);
    const selectedNodeId = get().selectedNodeId;
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      selectedNodeId:
        selectedNodeId && removedIds.includes(selectedNodeId) ? null : selectedNodeId,
    });
    for (const id of removedIds) {
      get().logActivity('ui.delete', `nodeId=${id}`, 'removed');
    }
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const result = get().connectNodes(connection.source, connection.target);
    if ('error' in result) {
      get().logActivity(
        'ui.connect',
        `${connection.source} -> ${connection.target}`,
        result.error,
        false,
      );
      return;
    }
    get().logActivity(
      'ui.connect',
      `${connection.source} -> ${connection.target}`,
      result.id,
    );
  },
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setWebmcpStatus: (status) => set({ webmcpStatus: status }),
  setAgentWriting: (value) => set({ agentWriting: value }),

  logActivity: (tool, detail, result, ok = true) => {
    activitySeq += 1;
    const entry: ActivityEntry = {
      id: `act-${activitySeq}`,
      at: Date.now(),
      tool,
      detail,
      result,
      ok,
    };
    set({ activity: [entry, ...get().activity].slice(0, 40) });
  },

  loadStarterArchitecture: () => {
    const next = createStarterArchitecture();
    set({
      nodes: next.nodes,
      edges: next.edges,
      selectedNodeId: null,
      lastThreatReport: null,
      reportHighlightUntil: 0,
    });
    return { nodeCount: next.nodes.length, edgeCount: next.edges.length };
  },

  addArchitectureNode: ({ kind, label, x, y }) => {
    const id = nextNodeId(kind, get().nodes.map((node) => node.id));
    const offset = get().nodes.length * 24;
    const node: ThreatNode = {
      id,
      type: 'architectureNode',
      position: { x: x ?? 120 + offset, y: y ?? 80 + offset },
      data: {
        label: label?.trim() || KIND_LABELS[kind],
        kind,
        config: defaultConfig(kind),
        threats: [],
        patches: [],
      },
    };
    set({ nodes: [...get().nodes, node] });
    return { id, kind };
  },

  connectNodes: (sourceId, targetId) => {
    if (sourceId === targetId) {
      return { error: 'source and target must be different nodes' };
    }
    const ids = new Set(get().nodes.map((node) => node.id));
    if (!ids.has(sourceId) || !ids.has(targetId)) {
      return { error: 'sourceId or targetId does not exist' };
    }
    const exists = get().edges.some(
      (edge) => edge.source === sourceId && edge.target === targetId && edge.type !== 'threatEdge',
    );
    if (exists) {
      return { error: 'data edge already exists' };
    }
    const id = `edge-${sourceId}-${targetId}`;
    const edge: ThreatEdge = { id, source: sourceId, target: targetId };
    set({ edges: [...get().edges, edge] });
    return { id };
  },

  updateNode: ({ nodeId, label, publicAccess, encrypted, rateLimited }) => {
    const current = get().nodes.find((node) => node.id === nodeId);
    if (!current) return { error: `node ${nodeId} not found` };
    set({
      nodes: get().nodes.map((node) => {
        if (node.id !== nodeId) return node;
        return {
          ...node,
          data: {
            ...node.data,
            label: label?.trim() || node.data.label,
            config: {
              ...node.data.config,
              publicAccess: publicAccess ?? node.data.config.publicAccess,
              encrypted: encrypted ?? node.data.config.encrypted,
              rateLimited: rateLimited ?? node.data.config.rateLimited,
            },
          },
        };
      }),
    });
    return { id: nodeId };
  },

  simulateAttack: ({ targetNodeId, stride, description }) => {
    const target = get().nodes.find((node) => node.id === targetNodeId);
    if (!target) return { error: `node ${targetNodeId} not found` };
    if (target.data.kind === 'attacker') {
      return { error: 'cannot attack the attacker node' };
    }

    let nodes = get().nodes;
    let attacker = nodes.find((node) => node.data.kind === 'attacker');
    if (!attacker) {
      attacker = {
        id: 'attacker-1',
        type: 'architectureNode',
        position: { x: 40, y: 200 },
        data: {
          label: KIND_LABELS.attacker,
          kind: 'attacker',
          config: defaultConfig('attacker'),
          threats: [],
          patches: [],
        },
      };
      nodes = [...nodes, attacker];
    }

    nodes = nodes.map((node) => {
      if (node.id !== targetNodeId) return node;
      return {
        ...node,
        data: {
          ...node.data,
          threats: [...node.data.threats, { stride, description }],
        },
      };
    });

    const edgeId = `threat-${attacker.id}-${targetNodeId}`;
    const threatEdge: ThreatEdge = {
      id: edgeId,
      source: attacker.id,
      target: targetNodeId,
      type: 'threatEdge',
      animated: true,
    };
    const edges = [
      ...get().edges.filter(
        (edge) =>
          !(
            edge.type === 'threatEdge' &&
            edge.source === attacker.id &&
            edge.target === targetNodeId
          ),
      ),
      threatEdge,
    ];

    set({ nodes, edges });
    return { edgeId };
  },

  applySecurityPatch: ({ targetNodeId, patchType }) => {
    if (!isPatchType(patchType)) return { error: `unknown patchType ${patchType}` };
    const target = get().nodes.find((node) => node.id === targetNodeId);
    if (!target) return { error: `node ${targetNodeId} not found` };
    if (target.data.kind === 'attacker') {
      return { error: 'cannot patch the attacker node' };
    }

    let nodes = get().nodes;
    let edges = get().edges;
    let addedNodeId: string | undefined;

    if (patchType === 'waf') {
      const alreadyInline = edges.some((edge) => {
        if (edge.type === 'threatEdge' || edge.target !== targetNodeId) return false;
        const source = nodes.find((node) => node.id === edge.source);
        return source?.data.kind === 'waf';
      });
      if (!alreadyInline) {
        const wafId = nextNodeId('waf', nodes.map((node) => node.id));
        addedNodeId = wafId;
        const wafNode: ThreatNode = {
          id: wafId,
          type: 'architectureNode',
          position: {
            x: target.position.x,
            y: target.position.y - 120,
          },
          data: {
            label: KIND_LABELS.waf,
            kind: 'waf',
            config: { ...defaultConfig('waf'), rateLimited: true },
            threats: [],
            patches: [],
          },
        };
        nodes = [...nodes, wafNode];
        edges = edges.map((edge) => {
          if (edge.type === 'threatEdge' || edge.target !== targetNodeId) return edge;
          return {
            ...edge,
            id: `edge-${edge.source}-${wafId}`,
            target: wafId,
          };
        });
        edges = [
          ...edges,
          { id: `edge-${wafId}-${targetNodeId}`, source: wafId, target: targetNodeId },
        ];
      }
    }

    if (patchType === 'vpc') {
      const hasVpc = nodes.some(
        (node) =>
          node.data.kind === 'vpc' &&
          edges.some((edge) => edge.source === node.id && edge.target === targetNodeId),
      );
      if (!hasVpc) {
        addedNodeId = nextNodeId('vpc', nodes.map((node) => node.id));
        const vpcNode: ThreatNode = {
          id: addedNodeId,
          type: 'architectureNode',
          position: {
            x: target.position.x - 240,
            y: target.position.y,
          },
          data: {
            label: KIND_LABELS.vpc,
            kind: 'vpc',
            config: { ...defaultConfig('vpc'), publicAccess: false },
            threats: [],
            patches: [],
          },
        };
        nodes = [...nodes, vpcNode];
        edges = [
          ...edges,
          { id: `edge-${addedNodeId}-${targetNodeId}`, source: addedNodeId, target: targetNodeId },
        ];
      }
    }

    nodes = nodes.map((node) => {
      if (node.id !== targetNodeId) return node;
      const patches = node.data.patches.includes(patchType)
        ? node.data.patches
        : [...node.data.patches, patchType];
      return {
        ...node,
        data: {
          ...node.data,
          threats: [],
          patches,
          config: {
            ...node.data.config,
            encrypted: patchType === 'encrypt' ? true : node.data.config.encrypted,
            publicAccess:
              patchType === 'private_access' || patchType === 'vpc'
                ? false
                : node.data.config.publicAccess,
            rateLimited:
              patchType === 'rate_limit' || patchType === 'waf'
                ? true
                : node.data.config.rateLimited,
          },
        },
      };
    });

    edges = edges.filter(
      (edge) => !(edge.type === 'threatEdge' && edge.target === targetNodeId),
    );

    set({ nodes, edges });
    return addedNodeId ? { applied: patchType, addedNodeId } : { applied: patchType };
  },

  getArchitectureState: () => ({
    nodes: get().nodes.map(toAgentNode),
    edges: get().edges.map(toAgentEdge),
  }),

  getThreatReport: () => {
    const nodes = get().nodes.map(toAgentNode);
    const threatEdges = get()
      .edges.filter((edge) => edge.type === 'threatEdge')
      .map(toAgentEdge);
    const report: ThreatReport = {
      totalNodes: nodes.length,
      vulnerableNodes: nodes.filter((node) => node.threats.length > 0),
      securedNodes: nodes.filter((node) => node.patches.length > 0),
      misconfiguredNodes: nodes.filter(isMisconfigured),
      threatEdges,
      openThreatCount: threatEdges.length,
    };
    const reportHighlightUntil = Date.now() + 4000;
    set({ lastThreatReport: report, reportHighlightUntil });
    window.setTimeout(() => {
      if (get().reportHighlightUntil === reportHighlightUntil) {
        set({ reportHighlightUntil: 0 });
      }
    }, 4000);
    return report;
  },
}));

export function reportRingFor(
  nodeId: string,
  report: ThreatReport | null,
  highlightUntil: number,
  now = Date.now(),
): ReportRing | null {
  if (!report || now >= highlightUntil) return null;
  if (report.vulnerableNodes.some((node) => node.id === nodeId)) return 'threat';
  if (report.misconfiguredNodes.some((node) => node.id === nodeId)) return 'misconfigured';
  if (report.securedNodes.some((node) => node.id === nodeId)) return 'secured';
  return null;
}

export default useStore;
