import { KIND_LABELS, PATCH_LABELS, STRIDE_LABELS } from '../domain/kinds';
import useStore from '../store/useStore';

export default function Inspector() {
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const node = useStore((state) => state.nodes.find((item) => item.id === selectedNodeId));

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
          <div className="text-slate-400">
            public={String(node.data.config.publicAccess)} · encrypted=
            {String(node.data.config.encrypted)} · rateLimited=
            {String(node.data.config.rateLimited)}
          </div>
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
