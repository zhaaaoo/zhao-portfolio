import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Part } from '../inspect';

export type NavItem = { label: string; href?: string; onClick?: () => void };

const clock = new Intl.DateTimeFormat('en-SG', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Singapore' });

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return <span className="mono muted topbar-clock">{clock.format(now)} in Singapore</span>;
}

type Props = {
  nav: NavItem[];
  plain: boolean;
  canDesk: boolean;
  onView: () => void;
  theme: string;
  onTheme: () => void;
  inspecting: boolean;
  onInspect: () => void;
};

export default function Header({ nav, plain, canDesk, onView, theme, onTheme, inspecting, onInspect }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // the bar wraps on narrow screens, so publish its real height for the desk and windows to sit under
  useLayoutEffect(() => {
    const bar = ref.current!;
    const observer = new ResizeObserver(() => document.documentElement.style.setProperty('--menubar', `${bar.offsetHeight}px`));
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  return (
    <Part ref={ref} name="Header" as="header" className="topbar">
      <a href="#top" className="topbar-name">
        Wang Zhao
      </a>
      <nav aria-label="Sections" className="topbar-nav">
        {nav.map((item) =>
          item.href ? (
            <a key={item.label} href={item.href} className="mono">
              {item.label}
            </a>
          ) : (
            <button key={item.label} type="button" className="mono topbar-link" onClick={item.onClick}>
              {item.label}
            </button>
          ),
        )}
      </nav>
      <div className="topbar-tools">
        <Clock />
        <a className="button" data-variant="signal" href="/wang-zhao-resume.pdf">
          Resume
        </a>
        {canDesk && (
          <button type="button" className="button" onClick={onView}>
            {plain ? 'Desk view' : 'Plain view'}
          </button>
        )}
        <button type="button" className="button" onClick={onTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button type="button" className="button" aria-pressed={inspecting} onClick={onInspect}>
          Inspect
        </button>
      </div>
    </Part>
  );
}
