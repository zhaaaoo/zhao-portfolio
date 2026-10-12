import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { skills } from '../content/resume';

export type Sticker = { id: number; skill: string; x: number; y: number; rot: number };

const palette = ['var(--pink)', 'var(--mint)', 'var(--butter)', 'var(--lilac)'];
const colour = (skill: string) => palette[[...skill].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
let nextId = 1;

// drag, toss and settle; calls onSettle with the skill once a sticker stops moving
export function useStickers(onSettle: (skill: string) => void) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const update = (id: number, patch: Partial<Sticker>) => setStickers((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const toss = useCallback(
    (sticker: Sticker, vx: number, vy: number) => {
      let { x, y } = sticker;
      let last = performance.now();
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      // velocities are in px per 16ms; scaling by elapsed time keeps the toss the same at any frame rate
      const step = () => {
        const now = performance.now();
        const k = Math.min(4, (now - last) / 16);
        last = now;
        x += vx * k;
        y += vy * k;
        vx *= 0.9 ** k;
        vy *= 0.9 ** k;
        // bounce off the viewport edges, losing some speed
        if (x < 30 || x > innerWidth - 30) vx = -vx * 0.6;
        if (y < 70 || y > innerHeight - 30) vy = -vy * 0.6;
        x = Math.min(innerWidth - 30, Math.max(30, x));
        y = Math.min(innerHeight - 30, Math.max(70, y));
        update(sticker.id, { x, y });
        if (!reduced && Math.hypot(vx, vy) > 0.4) frame.current = requestAnimationFrame(step);
        else onSettle(sticker.skill);
      };
      step();
    },
    [onSettle],
  );

  const grab = useCallback(
    (skill: string, e: ReactPointerEvent) => {
      const sticker: Sticker = { id: nextId++, skill, x: e.clientX, y: e.clientY, rot: Math.random() * 24 - 12 };
      setStickers((all) => [...all.slice(-11), sticker]);
      let last = { x: e.clientX, y: e.clientY, t: performance.now() };
      let v = { x: 0, y: 0 };
      const moved = { far: false };
      const onMove = (ev: PointerEvent) => {
        const t = performance.now();
        v = { x: ((ev.clientX - last.x) / Math.max(1, t - last.t)) * 16, y: ((ev.clientY - last.y) / Math.max(1, t - last.t)) * 16 };
        last = { x: ev.clientX, y: ev.clientY, t };
        if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) > 6) moved.far = true;
        update(sticker.id, { x: ev.clientX, y: ev.clientY });
      };
      const onUp = () => {
        removeEventListener('pointermove', onMove);
        removeEventListener('pointerup', onUp);
        // a click without a drag still gets a gentle toss so something happens
        if (!moved.far) v = { x: (Math.random() - 0.5) * 30, y: -14 };
        toss({ ...sticker, x: last.x, y: last.y }, v.x, v.y);
      };
      addEventListener('pointermove', onMove);
      addEventListener('pointerup', onUp);
    },
    [toss],
  );

  const place = useCallback(
    (skill: string) => {
      const sticker: Sticker = { id: nextId++, skill, x: innerWidth * (0.3 + Math.random() * 0.3), y: innerHeight * 0.6, rot: Math.random() * 24 - 12 };
      setStickers((all) => [...all.slice(-11), sticker]);
      toss(sticker, (Math.random() - 0.5) * 24, -10);
    },
    [toss],
  );

  const remove = useCallback((id: number) => setStickers((all) => all.filter((s) => s.id !== id)), []);

  return { stickers, grab, place, remove };
}

export function StickerSheet({ onGrab, onPlace }: { onGrab: (skill: string, e: ReactPointerEvent) => void; onPlace: (skill: string) => void }) {
  return (
    <div className="sticker-sheet">
      <p className="muted">Drag a sticker out and toss it. It lights up everywhere I’ve actually used that skill.</p>
      <div className="sticker-grid">
        {skills
          .flatMap((g) => g.items)
          .map((skill) => (
            <button
              key={skill}
              type="button"
              className="sticker"
              style={{ background: colour(skill) }}
              onPointerDown={(e) => {
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                e.preventDefault();
                onGrab(skill, e);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPlace(skill);
                }
              }}
            >
              {skill}
            </button>
          ))}
      </div>
    </div>
  );
}

export function StickerLayer({ stickers, onRemove }: { stickers: Sticker[]; onRemove: (id: number) => void }) {
  return (
    <div className="sticker-layer">
      {stickers.map((s) => (
        <button
          key={s.id}
          type="button"
          className="sticker sticker-free"
          style={{ background: colour(s.skill), translate: `${s.x}px ${s.y}px`, rotate: `${s.rot}deg` }}
          onClick={() => onRemove(s.id)}
          aria-label={`Remove ${s.skill} sticker`}
        >
          {s.skill}
        </button>
      ))}
    </div>
  );
}
