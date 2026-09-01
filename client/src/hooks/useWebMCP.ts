import { useEffect } from 'react';
import {
  ARCHITECTURE_KINDS,
  PATCH_TYPES,
  STRIDE,
  isArchitectureKind,
  isPatchType,
  isStride,
} from '../domain/kinds';
import useStore from '../store/useStore';

function asRecord(input: object): Record<string, unknown> {
  return input as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function summarize(input: object): string {
  const keys = Object.keys(input);
  if (keys.length === 0) return '(no args)';
  return keys
    .map((key) => `${key}=${JSON.stringify((input as Record<string, unknown>)[key])}`)
    .join(', ');
}

function summarizeResult(result: unknown): string {
  if (typeof result === 'string') return result;
  try {
    const text = JSON.stringify(result);
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
  } catch {
    return 'ok';
  }
}

function isErrorPayload(result: unknown): boolean {
  return (
    typeof result === 'object' &&
    result !== null &&
    'error' in result &&
    typeof (result as { error: unknown }).error === 'string'
  );
}

const emptyObjectSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
};

export function useWebMCP() {
  useEffect(() => {
    const modelContext = document.modelContext;
    if (typeof modelContext?.registerTool !== 'function') {
      useStore.getState().setWebmcpStatus('unavailable');
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const wrap = (
      tool: string,
      readOnly: boolean,
      execute: (input: object) => unknown,
    ) => {
      return async (input: object) => {
        if (!readOnly) useStore.getState().setAgentWriting(true);
        try {
          const result = execute(input);
          const failed = isErrorPayload(result);
          useStore.getState().logActivity(
            tool,
            summarize(input),
            summarizeResult(result),
            !failed,
          );
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          useStore.getState().logActivity(tool, summarize(input), `error: ${message}`, false);
          throw error;
        } finally {
          if (!readOnly) {
            window.setTimeout(() => {
              useStore.getState().setAgentWriting(false);
            }, 700);
          }
        }
      };
    };

    const registrations = [
      modelContext.registerTool(
        {
          name: 'get_architecture_state',
          title: 'Read architecture graph',
          description:
            'Read the live ThreatWeaver canvas. Returns semantic node kinds (internet, database, waf, ...), labels, security config, STRIDE threats, patches, positions, and edges marked data or threat. Call this before simulating attacks or applying patches.',
          inputSchema: emptyObjectSchema,
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute: wrap('get_architecture_state', true, () =>
            useStore.getState().getArchitectureState(),
          ),
        },
        { signal },
      ),
      modelContext.registerTool(
        {
          name: 'get_threat_report',
          title: 'Threat report',
          description:
            'Summarize current STRIDE findings, secured nodes, misconfigured nodes (public unencrypted datastores, or public gateways/web without rate limiting), active threat edges, and openThreatCount. Use after simulate_attack or apply_security_patch to explain what changed. A node can be in securedNodes (a patch was applied) and still appear in misconfiguredNodes.',
          inputSchema: emptyObjectSchema,
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute: wrap('get_threat_report', true, () => useStore.getState().getThreatReport()),
        },
        { signal },
      ),
      modelContext.registerTool(
        {
          name: 'load_starter_architecture',
          title: 'Load insecure starter architecture',
          description:
            'Replace the canvas with the built-in insecure 3-tier architecture (Internet, Web Server, API Gateway, Backend, Database, Object Storage). Use when the canvas is empty or the user asks to reset the demo.',
          inputSchema: emptyObjectSchema,
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: wrap('load_starter_architecture', false, () =>
            useStore.getState().loadStarterArchitecture(),
          ),
        },
        { signal },
      ),
      modelContext.registerTool(
        {
          name: 'add_node',
          title: 'Add architecture node',
          description:
            'Add a component to the canvas, including security nodes (waf, vpc). Returns the stable node id (for example api-gateway-2). Use connect_nodes after adding.',
          inputSchema: {
            type: 'object',
            properties: {
              kind: {
                type: 'string',
                enum: [...ARCHITECTURE_KINDS],
                description: 'Component kind to add',
              },
              label: {
                type: 'string',
                description: 'Optional display label',
              },
              x: { type: 'number', description: 'Optional canvas X position' },
              y: { type: 'number', description: 'Optional canvas Y position' },
            },
            required: ['kind'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: wrap('add_node', false, (input) => {
            const rec = asRecord(input);
            const kind = asString(rec.kind);
            if (!kind || !isArchitectureKind(kind)) {
              return { error: 'kind must be a supported architecture component' };
            }
            return useStore.getState().addArchitectureNode({
              kind,
              label: asString(rec.label),
              x: asNumber(rec.x),
              y: asNumber(rec.y),
            });
          }),
        },
        { signal },
      ),
      modelContext.registerTool(
        {
          name: 'connect_nodes',
          title: 'Connect nodes',
          description:
            'Draw a data-flow edge from sourceId to targetId. Do not use this for attack paths; use simulate_attack instead.',
          inputSchema: {
            type: 'object',
            properties: {
              sourceId: { type: 'string', description: 'Existing source node id' },
              targetId: { type: 'string', description: 'Existing target node id' },
            },
            required: ['sourceId', 'targetId'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: wrap('connect_nodes', false, (input) => {
            const rec = asRecord(input);
            const sourceId = asString(rec.sourceId);
            const targetId = asString(rec.targetId);
            if (!sourceId || !targetId) {
              return { error: 'sourceId and targetId are required' };
            }
            return useStore.getState().connectNodes(sourceId, targetId);
          }),
        },
        { signal },
      ),
      modelContext.registerTool(
        {
          name: 'update_node',
          title: 'Update node properties',
          description:
            'Change a node label or security config flags (publicAccess, encrypted, rateLimited). Prefer apply_security_patch when the user asked to mitigate a threat, because that also updates visuals and threat edges.',
          inputSchema: {
            type: 'object',
            properties: {
              nodeId: { type: 'string', description: 'Node id to update' },
              label: { type: 'string', description: 'New display label' },
              publicAccess: {
                type: 'boolean',
                description: 'Whether the component is reachable from the public internet',
              },
              encrypted: {
                type: 'boolean',
                description: 'Whether data at rest is encrypted',
              },
              rateLimited: {
                type: 'boolean',
                description: 'Whether the component has rate limiting',
              },
            },
            required: ['nodeId'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: wrap('update_node', false, (input) => {
            const rec = asRecord(input);
            const nodeId = asString(rec.nodeId);
            if (!nodeId) return { error: 'nodeId is required' };
            return useStore.getState().updateNode({
              nodeId,
              label: asString(rec.label),
              publicAccess: asBoolean(rec.publicAccess),
              encrypted: asBoolean(rec.encrypted),
              rateLimited: asBoolean(rec.rateLimited),
            });
          }),
        },
        { signal },
      ),
      modelContext.registerTool(
        {
          name: 'simulate_attack',
          title: 'Simulate STRIDE attack',
          description:
            'Act as a red team. Draw an Attacker node and an animated red threat edge to targetNodeId, then attach a STRIDE finding. Call get_architecture_state first so ids are current.',
          inputSchema: {
            type: 'object',
            properties: {
              targetNodeId: {
                type: 'string',
                description: 'Id of the node under attack, for example api-gateway-1',
              },
              stride: {
                type: 'string',
                enum: [...STRIDE],
                description: 'STRIDE category for this finding',
              },
              description: {
                type: 'string',
                description: 'Short explanation of the vulnerability and attack path',
              },
            },
            required: ['targetNodeId', 'stride', 'description'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: wrap('simulate_attack', false, (input) => {
            const rec = asRecord(input);
            const targetNodeId = asString(rec.targetNodeId);
            const stride = asString(rec.stride);
            const description = asString(rec.description);
            if (!targetNodeId || !stride || !description) {
              return { error: 'targetNodeId, stride, and description are required' };
            }
            if (!isStride(stride)) return { error: 'stride must be a STRIDE category' };
            return useStore.getState().simulateAttack({ targetNodeId, stride, description });
          }),
        },
        { signal },
      ),
      modelContext.registerTool(
        {
          name: 'apply_security_patch',
          title: 'Apply security patch',
          description:
            'Act as a blue team. Mutate the live graph: waf inserts a WAF node on incoming data edges; vpc adds a Private VPC node and closes public access; encrypt, private_access, and rate_limit update config. Clears STRIDE findings and threat edges on the target.',
          inputSchema: {
            type: 'object',
            properties: {
              targetNodeId: {
                type: 'string',
                description: 'Node to harden',
              },
              patchType: {
                type: 'string',
                enum: [...PATCH_TYPES],
                description: 'Mitigation to apply',
              },
            },
            required: ['targetNodeId', 'patchType'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: wrap('apply_security_patch', false, (input) => {
            const rec = asRecord(input);
            const targetNodeId = asString(rec.targetNodeId);
            const patchType = asString(rec.patchType);
            if (!targetNodeId || !patchType) {
              return { error: 'targetNodeId and patchType are required' };
            }
            if (!isPatchType(patchType)) return { error: 'patchType is not supported' };
            return useStore.getState().applySecurityPatch({ targetNodeId, patchType });
          }),
        },
        { signal },
      ),
    ];

    void Promise.all(registrations)
      .then(() => {
        if (!signal.aborted) useStore.getState().setWebmcpStatus('ready');
      })
      .catch((error: unknown) => {
        console.error('WebMCP registration failed', error);
        if (!signal.aborted) useStore.getState().setWebmcpStatus('unavailable');
      });

    return () => {
      controller.abort();
    };
  }, []);
}
