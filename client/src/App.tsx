import { ShieldAlert } from 'lucide-react';
import ActivityLog from './components/ActivityLog';
import Canvas from './components/Canvas';
import Inspector from './components/Inspector';
import Sidebar from './components/Sidebar';
import { useWebMCP } from './hooks/useWebMCP';
import useStore from './store/useStore';

function WebmcpBadge() {
  const status = useStore((state) => state.webmcpStatus);
  if (status === 'ready') {
    return (
      <span className="rounded-full border border-emerald-700 bg-emerald-950 px-2.5 py-1 text-xs text-emerald-200">
        WebMCP ready · 8 tools
      </span>
    );
  }
  if (status === 'unavailable') {
    return (
      <span className="rounded-full border border-amber-700 bg-amber-950 px-2.5 py-1 text-xs text-amber-200">
        WebMCP unavailable — use ChatGPT desktop or Chrome flag
      </span>
    );
  }
  return (
    <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
      Checking WebMCP…
    </span>
  );
}

function App() {
  useWebMCP();
  const agentWriting = useStore((state) => state.agentWriting);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900 px-5 py-3">
        <ShieldAlert className="text-red-400" size={26} />
        <div>
          <h1 className="text-lg font-semibold tracking-tight">ThreatWeaver</h1>
          <p className="text-xs text-slate-400">Security-by-design architecture canvas</p>
        </div>
        <div className="ml-auto">
          <WebmcpBadge />
        </div>
      </header>

      {agentWriting && (
        <div className="shrink-0 border-b border-sky-800 bg-sky-950 px-5 py-2 text-sm text-sky-100">
          Agent is editing the canvas…
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <Canvas />
        <aside className="flex w-80 shrink-0 flex-col border-l border-slate-800 bg-slate-950">
          <Inspector />
          <ActivityLog />
        </aside>
      </div>
    </div>
  );
}

export default App;
