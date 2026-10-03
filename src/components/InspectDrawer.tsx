import { useStats } from '../inspect';

export default function InspectDrawer({ onClose }: { onClose: () => void }) {
  const stats = useStats();
  const rows = [...stats].sort((a, b) => b[1].renders - a[1].renders);

  return (
    <aside className="drawer" aria-labelledby="drawer-title">
      <div className="drawer-head">
        <h2 id="drawer-title" className="mono">
          Inspect
        </h2>
        <button type="button" className="button" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="muted">
        Outlined boxes are React components. Counts come from React’s Profiler, live, so use the page and watch them move.
      </p>
      <table className="drawer-table">
        <thead>
          <tr>
            <th scope="col">Component</th>
            <th scope="col">Renders</th>
            <th scope="col">Last (ms)</th>
            <th scope="col">Lazy chunk</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, s]) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{s.renders}</td>
              <td>{s.lastMs.toFixed(1)}</td>
              <td>
                {s.chunk
                  ? `${s.chunk.kb === null ? '?' : `${s.chunk.kb.toFixed(1)} KB`}, ${Math.round(s.chunk.ms)} ms`
                  : '–'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}
