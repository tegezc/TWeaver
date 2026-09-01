import { useState } from 'react';
import { ARCHITECTURE_KINDS, KIND_LABELS } from '../domain/kinds';
import type { ArchitectureKind } from '../domain/kinds';
import useStore from '../store/useStore';

const SAMPLE_PROMPTS = [
  'Read the architecture and list the highest-risk nodes.',
  'Simulate a denial-of-service attack on the API gateway and information disclosure on the database.',
  'Apply a WAF in front of the API gateway, encrypt the database, and remove public access.',
  'Give me a threat report of what changed.',
];

const INSPECTOR_PAYLOADS: { id: string; tool: string; label: string; payload: object }[] = [
  {
    id: 'state',
    tool: 'get_architecture_state',
    label: 'get_architecture_state',
    payload: {},
  },
  {
    id: 'dos-gateway',
    tool: 'simulate_attack',
    label: 'simulate_attack · gateway DoS',
    payload: {
      targetNodeId: 'api-gateway-1',
      stride: 'denial_of_service',
      description:
        'Public API gateway has no rate limit; flood the edge until legitimate traffic is dropped.',
    },
  },
  {
    id: 'disclosure-db',
    tool: 'simulate_attack',
    label: 'simulate_attack · database disclosure',
    payload: {
      targetNodeId: 'database-1',
      stride: 'information_disclosure',
      description:
        'Public unencrypted database is reachable from the internet; exfiltrate stored records.',
    },
  },
  {
    id: 'waf',
    tool: 'apply_security_patch',
    label: 'apply_security_patch · WAF',
    payload: { targetNodeId: 'api-gateway-1', patchType: 'waf' },
  },
  {
    id: 'encrypt',
    tool: 'apply_security_patch',
    label: 'apply_security_patch · encrypt DB',
    payload: { targetNodeId: 'database-1', patchType: 'encrypt' },
  },
  {
    id: 'private',
    tool: 'apply_security_patch',
    label: 'apply_security_patch · private DB',
    payload: { targetNodeId: 'database-1', patchType: 'private_access' },
  },
  {
    id: 'report',
    tool: 'get_threat_report',
    label: 'get_threat_report',
    payload: {},
  },
];

function copyText(value: string): void {
  void navigator.clipboard.writeText(value).catch(() => {
    /* Clipboard may be blocked in some browsers; the Copied label still confirms the click. */
  });
}

export default function Sidebar() {
  const loadStarterArchitecture = useStore((state) => state.loadStarterArchitecture);
  const logActivity = useStore((state) => state.logActivity);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const markCopied = (key: string) => {
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current));
    }, 1500);
  };

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
          Inspector Execute
        </h2>
        <ul className="space-y-1.5">
          {INSPECTOR_PAYLOADS.map((item) => {
            const key = `payload:${item.id}`;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  title={item.tool}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-left font-mono text-[11px] leading-snug text-sky-200 hover:border-slate-600"
                  onClick={() => {
                    markCopied(key);
                    copyText(JSON.stringify(item.payload, null, 2));
                  }}
                >
                  {copiedKey === key ? 'Copied' : item.label}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[10px] text-slate-500">
          Copy JSON, then paste into Chrome Manual Tool Execution. Do not type live.
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
          Ask the agent
        </h2>
        <ul className="space-y-2">
          {SAMPLE_PROMPTS.map((prompt) => {
            const key = `prompt:${prompt}`;
            return (
              <li key={prompt}>
                <button
                  type="button"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-left text-[11px] leading-snug text-slate-300 hover:border-slate-600"
                  onClick={() => {
                    markCopied(key);
                    copyText(prompt);
                  }}
                >
                  {copiedKey === key ? 'Copied' : prompt}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[10px] text-slate-500">
          Backup path: copy and paste into ChatGPT Work. Chrome inspector Execute is the recorded
          demo path.
        </p>
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
