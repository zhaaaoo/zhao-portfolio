import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Header, { type NavItem } from './components/Header';
import InspectDrawer from './components/InspectDrawer';
import PlainPage from './components/PlainPage';
import Window from './components/Window';
import { email } from './components/Content';
import Desktop from './desk/Desktop';
import { useDesktop } from './desk/windows';
import { Part } from './inspect';

function setTheme(theme: string) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // private mode: the choice just won't persist
  }
}

const hasWebGL = () => {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
};

export default function App() {
  const [theme, setThemeState] = useState(() => document.documentElement.dataset.theme ?? 'light');
  const [inspecting, setInspecting] = useState(false);
  const [plain, setPlain] = useState(() => new URLSearchParams(location.search).has('plain') || !hasWebGL());
  const desktop = useDesktop();
  const help = useRef<HTMLDialogElement>(null);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      setTheme(next);
      setThemeState(next);
    };
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) apply();
    else document.startViewTransition(() => flushSync(apply));
  };

  const switchView = (toPlain: boolean) => {
    const url = new URL(location.href);
    if (toPlain) url.searchParams.set('plain', '');
    else url.searchParams.delete('plain');
    history.replaceState(null, '', url);
    setPlain(toPlain);
    scrollTo(0, 0);
  };

  useEffect(() => {
    if (inspecting) document.documentElement.dataset.inspect = '';
    else delete document.documentElement.dataset.inspect;
  }, [inspecting]);

  useEffect(() => {
    document.documentElement.classList.toggle('desk-mode', !plain);
  }, [plain]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest('input, select, textarea, [contenteditable]')) return;
      if (e.key === 'i') setInspecting((v) => !v);
      else if (e.key === 't') toggleTheme();
      else if (e.key === '?') help.current?.showModal();
      else if (e.key === '`' && !plain) {
        e.preventDefault();
        desktop.open('terminal');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const nav: NavItem[] = plain
    ? [
        { label: 'Work', href: '#work' },
        { label: 'Projects', href: '#projects' },
        { label: 'How I work', href: '#notes' },
        { label: 'Earlier', href: '#earlier' },
        { label: 'This site', href: '#colophon' },
      ]
    : [
        { label: 'About', onClick: () => desktop.open('about') },
        { label: 'Work', onClick: () => desktop.open('work') },
        { label: 'Projects', onClick: () => desktop.open('projects') },
        { label: 'Notes', onClick: () => desktop.open('notes') },
        { label: 'Earlier', onClick: () => desktop.open('earlier') },
        { label: 'Stickers', onClick: () => desktop.open('stickers') },
        { label: 'Terminal', onClick: () => desktop.open('terminal') },
        { label: 'Readme', onClick: () => desktop.open('site') },
      ];

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {plain && <div className="ribbon" aria-hidden="true" />}
      <Header
        nav={nav}
        plain={plain}
        canDesk={hasWebGL()}
        onView={() => switchView(!plain)}
        theme={theme}
        onTheme={toggleTheme}
        inspecting={inspecting}
        onInspect={() => setInspecting((v) => !v)}
      />

      {plain ? <PlainPage /> : <Desktop desktop={desktop} theme={theme} onTheme={toggleTheme} onPlain={() => switchView(true)} />}

      {plain && (
        <Part name="Footer" as="footer" className="footer">
          <p>
            <a href={`mailto:${email}`}>{email}</a>
            <a href="https://github.com/zhaaaoo">GitHub</a>
            <a href="https://www.linkedin.com/in/wangzhao-wz/">LinkedIn</a>
            <a href="https://t.me/zhaaaoo">Telegram</a>
          </p>
        </Part>
      )}

      {inspecting && <InspectDrawer onClose={() => setInspecting(false)} />}

      <dialog ref={help} className="help" aria-labelledby="help-title">
        <Window title="shortcuts" tone="butter">
          <h2 id="help-title" className="visually-hidden">
            Shortcuts
          </h2>
          <dl>
            <dt>
              <kbd>i</kbd>
            </dt>
            <dd>Inspect: outline components and show render counts</dd>
            <dt>
              <kbd>t</kbd>
            </dt>
            <dd>Switch theme</dd>
            <dt>
              <kbd>`</kbd>
            </dt>
            <dd>Open the terminal (desk view)</dd>
            <dt>
              <kbd>Esc</kbd>
            </dt>
            <dd>Close the front window</dd>
            <dt>
              <kbd>?</kbd>
            </dt>
            <dd>This list</dd>
          </dl>
          <form method="dialog">
            <button className="button">Close</button>
          </form>
        </Window>
      </dialog>
    </>
  );
}
