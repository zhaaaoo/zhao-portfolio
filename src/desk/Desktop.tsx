import { Suspense, lazy, useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { siteProjects, stories } from '../content/site';
import { HighlightContext } from '../highlight';
import { Part } from '../inspect';
import Window from '../components/Window';
import WorkStories from '../components/WorkStories';
import { ProjectBody } from '../components/Projects';
import { Colophon, Earlier, Interests, IntroText, Notes, Polaroid } from '../components/Content';
import Terminal from './Terminal';
import { StickerLayer, StickerSheet, useStickers } from './Stickers';
import { meta, type Desktop as DesktopApi, type ObjectId, type Win, type WinId } from './windows';

const DeskScene = lazy(() => import('./DeskScene'));

const dock: { id: WinId; label: string; glyph: string; tone: string }[] = [
  { id: 'about', label: 'About', glyph: '♡', tone: 'var(--lilac)' },
  { id: 'work', label: 'Work', glyph: '▤', tone: 'var(--mint)' },
  { id: 'projects', label: 'Projects', glyph: '▣', tone: 'var(--pink)' },
  { id: 'notes', label: 'Notes', glyph: '✎', tone: 'var(--butter)' },
  { id: 'earlier', label: 'Earlier', glyph: '✦', tone: 'var(--lilac)' },
  { id: 'stickers', label: 'Stickers', glyph: '★', tone: 'var(--pink)' },
  { id: 'terminal', label: 'Terminal', glyph: '>_', tone: 'var(--mint)' },
  { id: 'site', label: 'Readme', glyph: '?', tone: 'var(--butter)' },
];

const objectWindow: Record<ObjectId, WinId> = {
  globe: 'welcome',
  laptop: 'projects',
  keyboard: 'terminal',
  server: 'work',
  polaroid: 'about',
  notes: 'notes',
  books: 'earlier',
};

type Props = { desktop: DesktopApi; theme: string; onTheme: () => void; onPlain: () => void };

function DesktopWindow({ win, desktop, children }: { win: Win; desktop: DesktopApi; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { title, tone, width } = meta(win.id);
  const titleId = `win-${win.id.replace(':', '-')}`;

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  const drag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (matchMedia('(max-width: 48rem)').matches || e.button !== 0) return;
    const start = { x: e.clientX, y: e.clientY, wx: win.x, wy: win.y };
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    desktop.focus(win.id);
    const onMove = (ev: PointerEvent) =>
      desktop.move(
        win.id,
        Math.min(innerWidth - 80, Math.max(-width + 120, start.wx + ev.clientX - start.x)),
        Math.min(innerHeight - 40, Math.max(56, start.wy + ev.clientY - start.y)),
      );
    const onUp = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  };

  return (
    <div
      ref={ref}
      className="desk-window"
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      style={{ translate: `${win.x}px ${win.y}px`, zIndex: 10 + win.z, width }}
      onPointerDown={() => desktop.focus(win.id)}
    >
      <Window title={<span id={titleId}>{title}</span>} tone={tone} onClose={() => desktop.close(win.id)} onBarPointerDown={drag}>
        {children}
      </Window>
    </div>
  );
}

export default function Desktop({ desktop, theme, onTheme, onPlain }: Props) {
  const [skill, setSkill] = useState<string | null>(null);
  const { stickers, grab, place, remove } = useStickers(useCallback((s: string) => setSkill(s), []));
  const { wins, top, open, close } = desktop;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && top) close(top.id);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [top, close]);

  const content = (id: WinId): ReactNode => {
    if (id.startsWith('project:')) return <ProjectBody project={siteProjects.find((p) => `project:${p.id}` === id)!} />;
    switch (id) {
      case 'welcome':
        return (
          <>
            <IntroText heading={false} />
            <p className="muted desk-hint">
              Click things on the desk, or use the menu. Prefer a normal page? Use Plain view in the menu bar.
            </p>
          </>
        );
      case 'about':
        return (
          <div className="about">
            <Polaroid />
            <div>
              <IntroText heading={false} />
              <Interests />
            </div>
          </div>
        );
      case 'work':
        return <WorkStories />;
      case 'projects':
        return (
          <div className="app-grid">
            {siteProjects.map((p) => (
              <button key={p.id} type="button" onClick={() => open(`project:${p.id}`)}>
                <span aria-hidden="true" className="app-icon" />
                {p.name}
              </button>
            ))}
          </div>
        );
      case 'notes':
        return <Notes />;
      case 'earlier':
        return <Earlier />;
      case 'site':
        return (
          <>
            <Colophon />
            <Interests />
          </>
        );
      case 'terminal':
        return <Terminal onOpen={open} onTheme={onTheme} onPlain={onPlain} />;
      case 'stickers':
        return <StickerSheet onGrab={grab} onPlace={place} />;
    }
  };

  const evidence = skill
    ? [
        ...stories.filter((s) => s.skills.includes(skill)).map((s) => ({ label: s.title, id: 'work' as WinId })),
        ...siteProjects.filter((p) => p.skills.includes(skill)).map((p) => ({ label: p.name, id: `project:${p.id}` as WinId })),
      ]
    : [];

  return (
    <HighlightContext.Provider value={skill}>
      <main id="main" className="desktop">
        <h1 className="visually-hidden">Wang Zhao, software engineer</h1>
        <Suspense fallback={<p className="desk-loading mono muted">loading the desk…</p>}>
          <DeskScene theme={theme} focus={(top && meta(top.id).object) ?? null} onPick={(o) => open(objectWindow[o])} onOpen={open} />
        </Suspense>

        {wins.map((win) => (
          <Part key={win.id} name={`Window ${meta(win.id).title}`}>
            <DesktopWindow win={win} desktop={desktop}>
              {content(win.id)}
            </DesktopWindow>
          </Part>
        ))}

        <nav className="dock" aria-label="Sections">
          {dock.map((d) => (
            <button key={d.id} type="button" onClick={() => open(d.id)} aria-pressed={wins.some((w) => w.id === d.id)}>
              <span className="dock-icon" style={{ background: d.tone }} aria-hidden="true">
                {d.glyph}
              </span>
              <span className="dock-label">{d.label}</span>
            </button>
          ))}
        </nav>

        <StickerLayer stickers={stickers} onRemove={remove} />

        {skill && (
          <aside className="evidence" aria-live="polite">
            <p>
              <strong>{skill}</strong> {evidence.length ? 'shows up in:' : 'is on my skills list; open How I work to see it.'}
            </p>
            <p className="evidence-links">
              {evidence.map((e) => (
                <button key={e.label} type="button" className="button" onClick={() => open(e.id)}>
                  {e.label}
                </button>
              ))}
              <button type="button" className="button" onClick={() => setSkill(null)}>
                Clear
              </button>
            </p>
          </aside>
        )}
      </main>
    </HighlightContext.Provider>
  );
}
