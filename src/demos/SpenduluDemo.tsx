import { useEffect, useRef, useState } from 'react';
import styles from './demos.module.css';

type Row = { date: string; shop: string; amount: number; category: string };
type Result = { stage: 'parsed' | 'categorised' | 'totalled'; rows: Row[]; totals?: Record<string, number> };

const sample = `STATEMENT OF ACCOUNT  (sample, not real)
01 OCT  GRAB*RIDE SINGAPORE        14.20
02 OCT  KOPITIAM TAMPINES           6.80
03 OCT  FAIRPRICE XTRA             48.35
04 OCT  BOULDER PLUS               28.00
05 OCT  SPOTIFY P0C8               11.98
06 OCT  GRAB*FOOD 4KX2             23.60
08 OCT  UNIQLO BUGIS               59.90
09 OCT  BUS/MRT 6721                3.48
11 OCT  TOAST BOX                   7.20
12 OCT  SHENG SIONG                31.10
14 OCT  PAYNOW TRANSFER-ALEX       40.00
15 OCT  NETFLIX.COM                19.98`;

const stages = ['parsed', 'categorised', 'totalled'] as const;

export default function SpenduluDemo() {
  const worker = useRef<Worker | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => () => worker.current?.terminate(), []);

  const run = () => {
    worker.current?.terminate();
    worker.current = new Worker(new URL('./statement.worker.ts', import.meta.url), { type: 'module' });
    worker.current.onmessage = (e: MessageEvent<Result>) => setResult(e.data);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    worker.current.postMessage({ text: sample, delay: reduced ? 0 : 500 });
  };

  const totals = Object.entries(result?.totals ?? {}).sort((a, b) => b[1] - a[1]);
  const max = totals[0]?.[1] ?? 1;
  const reached = result ? stages.indexOf(result.stage) : -1;

  return (
    <div className={styles.spendulu}>
      <div className={styles.actions}>
        <button type="button" className="button" data-variant="signal" onClick={run}>
          {result ? 'Run again' : 'Import sample statement'}
        </button>
        <ol className={styles.stages} aria-live="polite">
          {stages.map((s, i) => (
            <li key={s} data-done={i <= reached || undefined} className="mono">
              {s}
            </li>
          ))}
        </ol>
      </div>

      {result && (
        <div className={styles.split}>
          <table className={styles.rows}>
            <caption className="visually-hidden">Transactions read from the sample statement</caption>
            <tbody>
              {result.rows.slice(0, 6).map((row) => (
                <tr key={row.date + row.shop}>
                  <td className="mono muted">{row.date}</td>
                  <td>{row.shop}</td>
                  <td className="mono">{row.amount.toFixed(2)}</td>
                  <td className="mono" data-unknown={row.category === 'Ask the LLM' || undefined}>
                    {row.category}
                  </td>
                </tr>
              ))}
            </tbody>
            {result.rows.length > 6 && (
              <tfoot>
                <tr>
                  <td colSpan={4} className="mono muted">
                    + {result.rows.length - 6} more rows
                  </td>
                </tr>
              </tfoot>
            )}
          </table>

          {totals.length > 0 && (
            <ul className={styles.bars} aria-label="Spending by category">
              {totals.map(([category, total]) => (
                <li key={category}>
                  <span>{category}</span>
                  <span className={styles.bar} style={{ inlineSize: `${(total / max) * 100}%` }} />
                  <span className="mono">${total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
