import { useState } from 'react';
import styles from './demos.module.css';

const friends: Record<string, number[]> = {
  mel: [5, 6, 12, 13, 19],
  ben: [4, 5, 12, 18, 19],
  sam: [5, 11, 12, 13],
  dan: [6, 12, 19, 20],
};

const start = new Date();
start.setDate(start.getDate() + ((8 - start.getDay()) % 7 || 7));
const days = Array.from({ length: 21 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
const dayFmt = new Intl.DateTimeFormat('en-SG', { weekday: 'short', day: 'numeric', month: 'short' });

export default function BrowhenDemo() {
  const [mine, setMine] = useState<Set<number>>(new Set());
  const [lockedIn, setLockedIn] = useState<number | null>(null);

  const freeOn = (day: number) => [
    ...Object.entries(friends)
      .filter(([, picks]) => picks.includes(day))
      .map(([name]) => name),
    ...(mine.has(day) ? ['you'] : []),
  ];

  const toggle = (day: number) => {
    setLockedIn(null);
    setMine((prev) => {
      const next = new Set(prev);
      if (!next.delete(day)) next.add(day);
      return next;
    });
  };

  const ranked = days
    .map((_, day) => ({ day, names: freeOn(day) }))
    .filter((d) => d.names.length)
    .sort((a, b) => b.names.length - a.names.length || a.day - b.day);

  return (
    <div className={styles.chat}>
      <p className={styles.bubble}>
        <strong>dinner??</strong>
        <br />
        {ranked.slice(0, 3).map((d) => (
          <span key={d.day} className={styles.line}>
            {dayFmt.format(days[d.day])} — {d.names.join(', ')}
          </span>
        ))}
      </p>

      <div className={styles.calendar} role="group" aria-label="Tap the days you're free">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <span key={d} className="mono muted" aria-hidden="true">
            {d}
          </span>
        ))}
        {days.map((date, day) => {
          const count = freeOn(day).length;
          return (
            <button
              key={day}
              type="button"
              className={styles.day}
              aria-pressed={mine.has(day)}
              aria-label={`${dayFmt.format(date)}, ${count} free`}
              data-locked={lockedIn === day || undefined}
              onClick={() => toggle(day)}
            >
              {date.getDate()}
              {count > 0 && <sup>{count}</sup>}
            </button>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button type="button" className="button" data-variant="signal" onClick={() => setLockedIn(ranked[0]?.day ?? null)}>
          /lockin
        </button>
        <span className="mono muted" aria-live="polite">
          {lockedIn !== null
            ? `Locked in ${dayFmt.format(days[lockedIn])}: ${freeOn(lockedIn).length} of 5 free`
            : 'Tap the days you’re free'}
        </span>
      </div>
    </div>
  );
}
