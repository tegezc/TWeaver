import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AlertTriangle, Server, ShieldCheck } from 'lucide-react';
import { PATCH_LABELS, STRIDE_LABELS } from '../domain/kinds';
import type { ThreatNode } from '../store/types';
import { KIND_ICONS } from './kindIcons';

export default function ArchitectureNode({ id, data, selected }: NodeProps<ThreatNode>) {
  const Icon = KIND_ICONS[data.kind] ?? Server;
  const isAttacker = data.kind === 'attacker';
  const isSecurity = data.kind === 'waf' || data.kind === 'vpc';
  const hasThreats = data.threats.length > 0;
  const hasPatches = data.patches.length > 0;

  const frame = isAttacker
    ? 'border-red-500 bg-red-950/90 text-red-100'
    : hasThreats
      ? 'border-red-500 bg-slate-900 text-slate-100'
      : hasPatches || isSecurity
        ? 'border-emerald-500 bg-slate-900 text-slate-100'
        : 'border-slate-600 bg-slate-900 text-slate-100';

  const iconWrap = isAttacker
    ? 'bg-red-900 text-red-300'
    : hasThreats
      ? 'bg-red-900 text-red-300'
      : hasPatches || isSecurity
        ? 'bg-emerald-900 text-emerald-300'
        : 'bg-slate-800 text-sky-300';

  return (
    <div
      className={`relative w-56 rounded-xl border-2 p-3 shadow-xl ${frame} ${
        selected ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${iconWrap}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{data.label}</div>
          <div className="truncate font-mono text-[10px] text-slate-400">{id}</div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
        {data.config.publicAccess && (
          <span className="rounded bg-amber-950 px-1.5 py-0.5 text-amber-200">public</span>
        )}
        {!data.config.publicAccess && data.kind !== 'attacker' && (
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">private</span>
        )}
        {data.config.encrypted && (
          <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-emerald-200">encrypted</span>
        )}
        {data.config.rateLimited && (
          <span className="rounded bg-sky-950 px-1.5 py-0.5 text-sky-200">rate-limit</span>
        )}
      </div>

      {hasThreats && (
        <div className="mt-2 rounded border border-red-800 bg-red-950/80 p-2 text-[11px] text-red-100">
          <AlertTriangle size={12} className="mr-1 inline" />
          {STRIDE_LABELS[data.threats[0].stride]}
          {data.threats.length > 1 ? ` (+${data.threats.length - 1})` : ''}
        </div>
      )}

      {hasPatches && (
        <div className="mt-2 rounded border border-emerald-800 bg-emerald-950/80 p-2 text-[11px] text-emerald-100">
          <ShieldCheck size={12} className="mr-1 inline" />
          {PATCH_LABELS[data.patches[0]]}
          {data.patches.length > 1 ? ` (+${data.patches.length - 1})` : ''}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
}
