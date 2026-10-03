import { useId, useMemo, useState, useSyncExternalStore } from 'react';
import { platformNodes, stops, type NodeId, type Stop } from '../content/site';
import styles from './PlatformMap.module.css';

type Box = { x: number; y: number };
const W = 165;
const H = 54;

const wide: { size: [number, number]; divider: number; at: Record<NodeId, Box> } = {
  size: [760, 410],
  divider: 300,
  at: {
    shell: { x: 297, y: 16 },
    appA: { x: 20, y: 110 },
    appB: { x: 297, y: 110 },
    appC: { x: 575, y: 110 },
    library: { x: 20, y: 204 },
    api: { x: 297, y: 204 },
    analytics: { x: 575, y: 204 },
    files: { x: 20, y: 330 },
    validator: { x: 205, y: 330 },
    udp: { x: 390, y: 330 },
    servers: { x: 575, y: 330 },
  },
};

const narrow: typeof wide = {
  size: [360, 520],
  divider: 345,
  at: {
    shell: { x: 97, y: 10 },
    appA: { x: 10, y: 90 },
    appB: { x: 185, y: 90 },
    appC: { x: 10, y: 170 },
    library: { x: 185, y: 170 },
    analytics: { x: 10, y: 250 },
    api: { x: 185, y: 250 },
    files: { x: 10, y: 370 },
    validator: { x: 185, y: 370 },
    udp: { x: 10, y: 450 },
    servers: { x: 185, y: 450 },
  },
};

const edges: [NodeId, NodeId][] = [
  ['shell', 'appA'],
  ['shell', 'appB'],
  ['shell', 'appC'],
  ['appA', 'library'],
  ['appB', 'api'],
  ['appC', 'analytics'],
  ['files', 'validator'],
  ['udp', 'validator'],
  ['validator', 'servers'],
];

const toIndex = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + m - 1;
};
const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
const label = (i: number) => fmt.format(new Date(Math.floor(i / 12), i % 12));
const now = new Date();
const first = toIndex(stops[0].start);
const last = now.getFullYear() * 12 + now.getMonth();
const endOf = (s: Stop) => (s.end ? toIndex(s.end) : last);
const isActive = (s: Stop, i: number) => toIndex(s.start) <= i && i <= endOf(s);

const narrowQuery = '(max-width: 40rem)';
function useNarrow() {
  return useSyncExternalStore(
    (cb) => {
      const mq = matchMedia(narrowQuery);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => matchMedia(narrowQuery).matches,
  );
}

const centre = (b: Box) => ({ x: b.x + W / 2, y: b.y + H / 2 });

export default function PlatformMap() {
  const layout = useNarrow() ? narrow : wide;
  const [month, setMonth] = useState(last);
  const active = stops.filter((s) => isActive(s, month));
  const lit = new Set(active.flatMap((s) => s.nodes));
  const latest = active.at(-1);
  const detailId = useId();

  // S-curves between consecutive stops read as a path rather than more edges
  const path = useMemo(() => {
    const points = stops.filter((s) => s.nodes.length).map((s) => centre(layout.at[s.nodes[0]]));
    return points
      .map((p, i) => {
        if (!i) return `M${p.x} ${p.y}`;
        const prev = points[i - 1];
        const midY = (prev.y + p.y) / 2;
        return `C${prev.x} ${midY} ${p.x} ${midY} ${p.x} ${p.y}`;
      })
      .join(' ');
  }, [layout]);

  const marker = latest?.nodes.length ? layout.at[latest.nodes[0]] : null;
  const [vw, vh] = layout.size;

  return (
    <div className={styles.map}>
      <svg viewBox={`0 0 ${vw} ${vh}`} className={styles.diagram} role="img" aria-label="Diagram of the platform: a shell app with feature micro-frontends, a component library and analytics on the frontend; services, a file validation service, a packet receiver and on-premise servers behind them. Parts I worked on in the selected month are highlighted.">
        <line x1={0} x2={vw} y1={layout.divider} y2={layout.divider} className={styles.divider} />
        <text x={4} y={layout.at.shell.y + 12} className={styles.zone}>
          frontend
        </text>
        <text x={4} y={layout.divider + 18} className={styles.zone}>
          backend & infrastructure
        </text>
        {edges.map(([a, b]) => {
          const p = centre(layout.at[a]);
          const q = centre(layout.at[b]);
          return <line key={a + b} x1={p.x} y1={p.y} x2={q.x} y2={q.y} className={styles.edge} />;
        })}
        <path d={path} className={styles.route} pathLength={1} />
        {platformNodes.map((node) => {
          const { x, y } = layout.at[node.id];
          return (
            <g key={node.id} className={styles.node} data-lit={lit.has(node.id) || undefined}>
              <rect x={x} y={y} width={W} height={H} rx={3} />
              <text x={x + 12} y={y + 22} className={styles.nodeLabel}>
                {node.label}
              </text>
              <text x={x + 12} y={y + 40} className={styles.nodeSub}>
                {node.sub}
              </text>
            </g>
          );
        })}
        {marker && (
          <circle r={7} className={styles.marker} style={{ transform: `translate(${marker.x + W - 12}px, ${marker.y + 12}px)` }} />
        )}
      </svg>

      <div className={styles.scrubber}>
        <label htmlFor={`${detailId}-range`} className="mono">
          Drag through time
        </label>
        <input
          id={`${detailId}-range`}
          type="range"
          min={first}
          max={last}
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          aria-valuetext={`${label(month)}: ${active.map((s) => s.role).join(', ') || 'no project'}`}
          aria-controls={detailId}
        />
        <output className="mono">{label(month)}</output>
      </div>

      <ol className={styles.stops}>
        {stops.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={styles.stop}
              aria-pressed={isActive(s, month)}
              onClick={() => setMonth(toIndex(s.start))}
            >
              <span className="mono muted">
                {s.startLabel ?? label(toIndex(s.start))} – {s.end ? label(toIndex(s.end)) : 'now'}
              </span>
              <span>{s.role}</span>
            </button>
          </li>
        ))}
      </ol>

      <div id={detailId} className={styles.detail} aria-live="polite">
        {active.map((s) => (
          <article key={s.id}>
            <h3>{s.role}</h3>
            <p>{s.did}</p>
            {s.hard && (
              <p>
                <span className="mono muted">Hard part </span>
                {s.hard}
              </p>
            )}
            {s.changed && (
              <p>
                <span className="mono muted">What I did about it </span>
                {s.changed}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
