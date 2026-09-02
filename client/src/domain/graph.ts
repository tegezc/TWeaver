type GraphEdge = {
  source: string;
  target: string;
  type?: string;
};

type ThreatRootNode = {
  id: string;
  data: { kind: string; threats: unknown[] };
};

export function dataDescendants(rootId: string, edges: GraphEdge[]): string[] {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.type === 'threatEdge') continue;
    const list = adjacency.get(edge.source) ?? [];
    list.push(edge.target);
    adjacency.set(edge.source, list);
  }

  const result: string[] = [];
  const visited = new Set<string>([rootId]);
  const queue = [rootId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    for (const next of adjacency.get(current) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      result.push(next);
      queue.push(next);
    }
  }
  return result;
}

export function computeBlastExposedBy(
  nodes: ThreatRootNode[],
  edges: GraphEdge[],
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const node of nodes) {
    if (node.data.kind === 'attacker' || node.data.threats.length === 0) continue;
    for (const descendantId of dataDescendants(node.id, edges)) {
      const roots = map[descendantId] ?? [];
      if (!roots.includes(node.id)) roots.push(node.id);
      map[descendantId] = roots;
    }
  }
  return map;
}
