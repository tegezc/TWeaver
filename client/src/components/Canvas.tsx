import { useCallback } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { isArchitectureKind } from '../domain/kinds';
import ThreatEdge from '../edges/ThreatEdge';
import ArchitectureNode from '../nodes/ArchitectureNode';
import useStore from '../store/useStore';

const nodeTypes = {
  architectureNode: ArchitectureNode,
};

const edgeTypes = {
  threatEdge: ThreatEdge,
};

function ThreatReportHud() {
  const report = useStore((state) => state.lastThreatReport);
  if (!report) return null;
  return (
    <div className="pointer-events-none absolute top-3 left-3 z-10 max-w-md rounded-lg border border-slate-600 bg-slate-950/90 px-3 py-2 text-[11px] text-slate-100 shadow-lg">
      Threat report · {report.openThreatCount} open · {report.misconfiguredNodes.length}{' '}
      misconfigured · {report.securedNodes.length} secured
    </div>
  );
}

function CanvasApp() {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const onConnect = useStore((state) => state.onConnect);
  const addArchitectureNode = useStore((state) => state.addArchitectureNode);
  const logActivity = useStore((state) => state.logActivity);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData('application/reactflow');
      if (!isArchitectureKind(raw)) return;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const added = addArchitectureNode({ kind: raw, x: position.x, y: position.y });
      logActivity('ui.add_node', `kind=${raw}`, added.id);
    },
    [addArchitectureNode, logActivity, screenToFlowPosition],
  );

  return (
    <div className="relative h-full min-w-0 flex-1" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_event, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.35}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        colorMode="dark"
        className="bg-slate-950"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color="#1e293b" />
        <Controls />
        <MiniMap
          pannable
          zoomable
          className="!bg-slate-900 !border-slate-700"
          maskColor="rgba(2, 6, 23, 0.7)"
        />
      </ReactFlow>
      <ThreatReportHud />
    </div>
  );
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasApp />
    </ReactFlowProvider>
  );
}
