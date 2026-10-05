import { useEffect, useState } from 'react';
import { Part } from '../inspect';

export const sections = [
  { id: 'work', title: 'Work' },
  { id: 'projects', title: 'Projects' },
  { id: 'notes', title: 'How I work' },
  { id: 'earlier', title: 'Earlier' },
  { id: 'colophon', title: 'This site' },
];

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
  theme: string;
  onTheme: () => void;
  inspecting: boolean;
  onInspect: () => void;
};

export default function Header({ theme, onTheme, inspecting, onInspect }: Props) {
  return (
    <Part name="Header" as="header" className="topbar">
      <a href="#top" className="topbar-name">
        Wang Zhao
      </a>
      <nav aria-label="Sections" className="topbar-nav">
        {sections.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className="mono">
            §{i + 1} {s.title}
          </a>
        ))}
      </nav>
      <div className="topbar-tools">
        <Clock />
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
