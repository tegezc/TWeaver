import { ARCHITECTURE_KINDS, KIND_LABELS } from '../domain/kinds';
import type { ArchitectureKind } from '../domain/kinds';
import useStore from '../store/useStore';

const SAMPLE_PROMPTS = [
  'Read the architecture and list the highest-risk nodes.',
  'Simulate denial_of_service on api-gateway-1 and information_disclosure on database-1.',
  'Apply a WAF on api-gateway-1, encrypt database-1, and close public access.',
];

export default function Sidebar() {
  const loadStarterArchitecture = useStore((state) => state.loadStarterArchitecture);
  const logActivity = useStore((state) => state.logActivity);

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-800 bg-slate-950 p-4">
      <div>
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
          Components
        </h2>
        <div className="grid gap-1.5">
          {ARCHITECTURE_KINDS.map((kind) => (
            <PaletteItem key={kind} kind={kind} />
          ))}
        </div>
      </div>

      <button
        type="button"
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-800"
        onClick={() => {
          const result = loadStarterArchitecture();
          logActivity('ui.reset', 'starter architecture', JSON.stringify(result));
        }}
      >
        Reset insecure starter
      </button>

      <div>
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
          Ask the agent
        </h2>
        <ul className="space-y-2">
          {SAMPLE_PROMPTS.map((prompt) => (
            <li key={prompt}>
              <button
                type="button"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-left text-[11px] leading-snug text-slate-300 hover:border-slate-600"
                onClick={() => {
                  void navigator.clipboard.writeText(prompt);
                }}
              >
                {prompt}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] text-slate-500">Click to copy. Paste into ChatGPT.</p>
      </div>
    </aside>
  );
}

function PaletteItem({ kind }: { kind: ArchitectureKind }) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('application/reactflow', kind);
        event.dataTransfer.effectAllowed = 'move';
      }}
      className="cursor-grab rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:border-slate-600 hover:bg-slate-800"
    >
      {KIND_LABELS[kind]}
    </div>
  );
}
