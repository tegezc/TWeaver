import { KIND_LABELS, PATCH_LABELS, STRIDE_LABELS } from '../domain/kinds';
import useStore from '../store/useStore';

export default function Inspector() {
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const node = useStore((state) => state.nodes.find((item) => item.id === selectedNodeId));
  const updateNode = useStore((state) => state.updateNode);

  return (
    <section className="shrink-0 border-b border-slate-800 px-3 py-3">
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        Inspector
      </h2>
      {!node ? (
        <p className="text-[11px] text-slate-500">Select a node to inspect threats and patches.</p>
      ) : (
        <div className="space-y-2 text-[11px] text-slate-200">
          <div>
            <div className="font-semibold">{node.data.label}</div>
            <div className="font-mono text-slate-400">{node.id}</div>
            <div className="text-slate-400">{KIND_LABELS[node.data.kind]}</div>
          </div>
          {node.data.kind === 'attacker' ? (
            <div className="text-slate-400">
              public={String(node.data.config.publicAccess)} · encrypted=
              {String(node.data.config.encrypted)} · rateLimited=
              {String(node.data.config.rateLimited)}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="flex items-center justify-between gap-2 text-slate-300">
                <span>Public access</span>
                <input
                  type="checkbox"
                  checked={node.data.config.publicAccess}
                  onChange={(event) =>
                    updateNode({ nodeId: node.id, publicAccess: event.target.checked })
                  }
                  className="accent-amber-400"
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-slate-300">
                <span>Encrypted</span>
                <input
                  type="checkbox"
                  checked={node.data.config.encrypted}
                  onChange={(event) =>
                    updateNode({ nodeId: node.id, encrypted: event.target.checked })
                  }
                  className="accent-emerald-400"
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-slate-300">
                <span>Rate limited</span>
                <input
                  type="checkbox"
                  checked={node.data.config.rateLimited}
                  onChange={(event) =>
                    updateNode({ nodeId: node.id, rateLimited: event.target.checked })
                  }
                  className="accent-sky-400"
                />
              </label>
              <p className="text-[10px] leading-snug text-slate-500">
                Toggles update flags only. They do not insert a WAF or clear red threat edges —
                that is <span className="font-mono">apply_security_patch</span>.
              </p>
            </div>
          )}
          {node.data.threats.length > 0 && (
            <ul className="space-y-1 text-red-200">
              {node.data.threats.map((threat, index) => (
                <li key={`${threat.stride}-${index}`}>
                  {STRIDE_LABELS[threat.stride]}: {threat.description}
                </li>
              ))}
            </ul>
          )}
          {node.data.patches.length > 0 && (
            <ul className="space-y-1 text-emerald-200">
              {node.data.patches.map((patch) => (
                <li key={patch}>{PATCH_LABELS[patch]}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
