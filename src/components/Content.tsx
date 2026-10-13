import { useEffect, useState } from 'react';
import { interests, intro, notes } from '../content/site';
import { certifications, education, experience, skills } from '../content/resume';
import { useHighlight } from '../highlight';
import photo from '../assets/images/zhao.webp';

export const email = '081101wangzhao@gmail.com';

export function IntroText({ heading = true }: { heading?: boolean }) {
  const [copied, setCopied] = useState(false);
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
    <div>
      {heading ? <h1>Wang Zhao</h1> : <p className="intro-name">Wang Zhao</p>}
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
  );
}

export function Polaroid() {
  return (
    <figure className="polaroid">
      <img src={photo} alt="Wang Zhao" width={960} height={1280} />
      <figcaption className="mono muted">zhao</figcaption>
    </figure>
  );
}

export function Interests() {
  return <p className="muted">Off screen: {interests.join(', ')}.</p>;
}

export function Notes() {
  const skill = useHighlight();
  return (
    <>
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
                <span key={item} className="chip" data-match={item === skill || undefined}>
                  {item}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}

export function Earlier() {
  return (
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
  );
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

export function Colophon() {
  return (
    <ul className="plain-list">
      <li>React 19 and TypeScript, built with Vite. Plain CSS with custom properties; no UI kit or animation library.</li>
      <li>
        The desk is React Three Fiber on WebGL2, built from boxes and spheres in code rather than a modelled scene. It loads after the menu bar,
        and the plain view is the same content as a normal page.
      </li>
      <li>Type is Atkinson Hyperlegible Next and Mono, from the Braille Institute, picked for legibility.</li>
      <li>
        JavaScript loaded so far: <ScriptWeight />. The 3D scene and the demos are separate chunks.
      </li>
      <li>The resume PDF is printed by Playwright from the same content file as this page.</li>
      <li>No analytics, no cookies.</li>
      <li>
        Press <kbd>i</kbd> to inspect, <kbd>t</kbd> for theme, <kbd>`</kbd> for the terminal, <kbd>?</kbd> for shortcuts.{' '}
        <a href="https://github.com/zhaaaoo/zhao-portfolio">Source on GitHub</a>.
      </li>
    </ul>
  );
}
