import useStore from '../store/useStore';

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function ActivityLog() {
  const activity = useStore((state) => state.activity);

  return (
    <section className="flex min-h-0 flex-1 flex-col border-t border-slate-800">
      <h2 className="shrink-0 px-3 py-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        Agent activity
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {activity.length === 0 ? (
          <p className="text-[11px] text-slate-500">
            Tool calls from ChatGPT or Chrome WebMCP appear here. Human canvas edits are
            logged as ui.*
          </p>
        ) : (
          <ol className="space-y-2">
            {activity.map((entry) => {
              const failed = entry.ok === false;
              return (
                <li
                  key={entry.id}
                  className={`rounded-lg border p-2 ${
                    failed
                      ? 'border-red-800 bg-red-950/60'
                      : 'border-slate-800 bg-slate-900'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div
                      className={`font-mono text-[11px] ${
                        failed ? 'text-red-300' : 'text-sky-300'
                      }`}
                    >
                      {entry.tool}
                    </div>
                    <div className="shrink-0 font-mono text-[10px] text-slate-500">
                      {formatTime(entry.at)}
                    </div>
                  </div>
                  <div className="mt-1 break-words text-[10px] text-slate-400">
                    {entry.detail}
                  </div>
                  <div
                    className={`mt-1 break-words text-[10px] ${
                      failed ? 'text-red-200' : 'text-slate-300'
                    }`}
                  >
                    {entry.result}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
