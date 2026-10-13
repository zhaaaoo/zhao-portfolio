import { useEffect, useRef, useState } from 'react';
import styles from './demos.module.css';

const hotels = ['Nozawa Onsen · ryokan', 'Nozawa Onsen · lodge', 'Myoko Akakura · hotel'];
const checks = ['sold out', 'sold out', 'sold out', 'not open yet', 'open'];
const time = new Intl.DateTimeFormat('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false });

export default function PowderPingDemo() {
  const [hotel, setHotel] = useState(hotels[0]);
  const [checkIn, setCheckIn] = useState('2026-12-25');
  const [nights, setNights] = useState(7);
  const [log, setLog] = useState<string[]>([]);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => clearInterval(timer.current), []);

  const watch = () => {
    clearInterval(timer.current);
    setLog([]);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock = new Date();
    let i = 0;
    timer.current = window.setInterval(
      () => {
        // each tick stands in for one 30-minute scheduled run
        clock.setMinutes(clock.getMinutes() + 30);
        const line = `${time.format(clock)}  ${checks[i]}`;
        setLog((prev) => [...prev, line]);
        if (++i === checks.length) clearInterval(timer.current);
      },
      reduced ? 0 : 650,
    );
  };

  const opened = log.length === checks.length;
  const date = new Date(checkIn).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });

  return (
    <div className={styles.powder}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          watch();
        }}
      >
        <label>
          <span className="mono muted">Stay</span>
          <select value={hotel} onChange={(e) => setHotel(e.target.value)}>
            {hotels.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="mono muted">Check-in</span>
          <input type="date" value={checkIn} required onChange={(e) => setCheckIn(e.target.value)} />
        </label>
        <label>
          <span className="mono muted">Nights</span>
          <input type="number" min={1} max={14} value={nights} onChange={(e) => setNights(Number(e.target.value))} />
        </label>
        <button type="submit" className="button" data-variant="signal">
          /addwatch
        </button>
      </form>

      <ol className={styles.log} aria-label="Scheduled checks">
        {log.map((line, i) => (
          <li key={i} className="mono">
            {line}
          </li>
        ))}
      </ol>

      <div aria-live="polite">
        {opened && (
          <p className={styles.bubble}>
            <strong>Room open</strong>
            <br />
            {hotel}, {nights} night{nights > 1 ? 's' : ''} from {date}. Book before it goes.
          </p>
        )}
      </div>
      <p className="mono muted">Simulated. The real bot checks the booking engines every 30 minutes on GitHub Actions.</p>
    </div>
  );
}
