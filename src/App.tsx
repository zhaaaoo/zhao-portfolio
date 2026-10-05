import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Header from './components/Header';
import Section from './components/Section';
import PlatformMap from './components/PlatformMap';
import Projects from './components/Projects';
import InspectDrawer from './components/InspectDrawer';
import Window from './components/Window';
import { Part } from './inspect';
import { intro, notes } from './content/site';
import { certifications, education, experience, skills } from './content/resume';
import photo from './assets/images/zhao.webp';

const email = '081101wangzhao@gmail.com';

function setTheme(theme: string) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // private mode: the choice just won't persist
  }
}

const isScript = (e: PerformanceEntry) => /\.(js|tsx?)(\?|$)/.test(e.name);
const kb = (entries: PerformanceEntry[]) =>
  entries.filter(isScript).reduce((sum, e) => sum + (e as PerformanceResourceTiming).encodedBodySize, 0) / 1024;

function ScriptWeight() {
  const [total, setTotal] = useState(() => kb(performance.getEntriesByType('resource')));
  useEffect(() => {
    const observer = new PerformanceObserver((list) => setTotal((t) => t + kb(list.getEntries())));
    observer.observe({ type: 'resource' });
    return () => observer.disconnect();
  }, []);
  return <>{total.toFixed(0)} KB</>;
}

export default function App() {
  const [theme, setThemeState] = useState(() => document.documentElement.dataset.theme ?? 'light');
  const [inspecting, setInspecting] = useState(false);
  const [copied, setCopied] = useState(false);
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

  useEffect(() => {
    if (inspecting) document.documentElement.dataset.inspect = '';
    else delete document.documentElement.dataset.inspect;
  }, [inspecting]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest('input, select, textarea, [contenteditable]')) return;
      if (e.key === 'i') setInspecting((v) => !v);
      else if (e.key === 't') toggleTheme();
      else if (e.key === '?') help.current?.showModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="ribbon" aria-hidden="true" />
      <Header theme={theme} onTheme={toggleTheme} inspecting={inspecting} onInspect={() => setInspecting((v) => !v)} />

      <main id="main">
        <Part name="Intro" as="section" id="top" className="intro" aria-label="Introduction">
          <Window title="wangzhao.app">
            <div>
              <h1>Wang Zhao</h1>
              <p className="intro-line">{intro.line}</p>
              <p className="mono muted">{intro.open}</p>
              <p className="intro-links">
                <a className="button" data-variant="signal" href="/wang-zhao-resume.pdf">
                  Resume (PDF)
                </a>
                <button type="button" className="button" onClick={copyEmail}>
                  {copied ? 'Copied' : 'Copy email'}
                </button>
                <a href="https://github.com/zhaaaoo">GitHub</a>
                <a href="https://www.linkedin.com/in/wangzhao-wz/">LinkedIn</a>
              </p>
              <p className="visually-hidden" aria-live="polite">
                {copied ? 'Email address copied' : ''}
              </p>
            </div>
            <figure className="polaroid">
              <img src={photo} alt="Wang Zhao" width={960} height={1280} fetchPriority="high" />
              <figcaption className="mono muted">zhao</figcaption>
            </figure>
          </Window>
        </Part>

        <Section
          id="work"
          n={1}
          title="Work"
          file="platform.map"
          note={
            <>
              <p>NCS, Software Engineer, Jul 2024 – now.</p>
              <p>
                The project is for a defence client, so the diagram is kept general. Scroll, drag the slider or pick a stop to see what I
                was working on.
              </p>
            </>
          }
        >
          <Part name="PlatformMap">
            <PlatformMap />
          </Part>
        </Section>

        <Section
          id="projects"
          n={2}
          title="Projects"
          file="projects"
          tone="lilac"
          note={<p>Side projects I built with Claude Code, plus my final-year project. The demos are small rebuilds, not the real apps.</p>}
        >
          <Projects />
        </Section>

        <Section id="notes" n={3} title="How I work" file="notes.txt" tone="mint">
          <div className="notes">
            {notes.map((n) => (
              <article key={n.title}>
                <h3>{n.title}</h3>
                <p>{n.body}</p>
              </article>
            ))}
          </div>
          <dl className="skills">
            {skills.map((row) => (
              <div key={row.group}>
                <dt className="mono muted">{row.group}</dt>
                <dd>
                  {row.items.map((item) => (
                    <span key={item} className="chip">
                      {item}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="earlier" n={4} title="Earlier" file="earlier.txt" tone="butter">
          <ul className="plain-list">
            {experience.slice(1).map((role) => (
              <li key={role.company + role.title}>
                <strong>
                  {role.title}, {role.company}
                </strong>{' '}
                <span className="mono muted">{role.period}</span>
                <br />
                {role.points[0]}
              </li>
            ))}
            {education.map((item) => (
              <li key={item.school}>
                <strong>{item.school}</strong> <span className="mono muted">{item.period}</span>
                <br />
                {item.detail}
              </li>
            ))}
            <li>{certifications.join(', ')}</li>
          </ul>
        </Section>

        <Section id="colophon" n={5} title="This site" file="readme.md" tone="mint">
          <ul className="plain-list">
            <li>
              React 19 and TypeScript, built with Vite. Plain CSS with custom properties; no UI kit or animation library. The scroll effects
              are CSS scroll-driven animations, plus one scroll listener for the timeline.
            </li>
            <li>Type is Atkinson Hyperlegible Next and Mono, from the Braille Institute, picked for legibility.</li>
            <li>
              JavaScript loaded so far: <ScriptWeight />. The demos only load when you scroll near them.
            </li>
            <li>The resume PDF is printed by Playwright from the same content file as this page.</li>
            <li>No analytics, no cookies.</li>
            <li>
              Press <kbd>i</kbd> to inspect, <kbd>t</kbd> for theme, <kbd>?</kbd> for shortcuts.{' '}
              <a href="https://github.com/zhaaaoo/zhao-portfolio">Source on GitHub</a>.
            </li>
          </ul>
          <p className="muted">Off screen: bouldering, diving, snowboarding, dance.</p>
        </Section>
      </main>

      <Part name="Footer" as="footer" className="footer">
        <p>
          <a href={`mailto:${email}`}>{email}</a>
          <a href="https://github.com/zhaaaoo">GitHub</a>
          <a href="https://www.linkedin.com/in/wangzhao-wz/">LinkedIn</a>
          <a href="https://t.me/zhaaaoo">Telegram</a>
        </p>
      </Part>

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
