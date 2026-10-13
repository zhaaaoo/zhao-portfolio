import { Suspense, useEffect, useRef, useState, type CSSProperties, type ComponentType } from 'react';
import { siteProjects, type ProjectId } from '../content/site';
import { Part, lazyPart } from '../inspect';
import { useHighlight } from '../highlight';
import Window from './Window';
import poster from '../assets/images/laparolymph-poster.webp';

const demos: Partial<Record<ProjectId, [string, ComponentType]>> = {
  spendulu: ['SpenduluDemo', lazyPart('SpenduluDemo', () => import('../demos/SpenduluDemo'))],
  browhen: ['BrowhenDemo', lazyPart('BrowhenDemo', () => import('../demos/BrowhenDemo'))],
  'powder-ping': ['PowderPingDemo', lazyPart('PowderPingDemo', () => import('../demos/PowderPingDemo'))],
};

export const tones = ['mint', 'butter', 'lilac', 'pink'] as const;

function useNear<T extends Element>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { rootMargin: '600px' });
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, []);
  return [ref, near] as const;
}

function Demo({ name, Component }: { name: string; Component: ComponentType }) {
  const [ref, near] = useNear<HTMLDivElement>();
  return (
    <div ref={ref} className="demo">
      <Suspense fallback={<p className="mono muted">Loading demo…</p>}>
        {near && (
          <Part name={name}>
            <Component />
          </Part>
        )}
      </Suspense>
    </div>
  );
}

function Poster() {
  const [mine, setMine] = useState(false);
  return (
    <figure className="poster">
      <div className="poster-frame" data-mine={mine || undefined}>
        <img
          src={poster}
          alt="LaparoLymph capstone poster: software features on the left, the physical training box on the right."
          width={1100}
          height={1557}
          loading="lazy"
          decoding="async"
        />
        <span className="poster-hardware" aria-hidden="true" />
      </div>
      <figcaption>
        <button type="button" className="button" aria-pressed={mine} onClick={() => setMine(!mine)}>
          {mine ? 'Show everything' : 'Dim the hardware'}
        </button>{' '}
        <span className="mono muted">I worked on the software half.</span>
      </figcaption>
    </figure>
  );
}

type Project = (typeof siteProjects)[number];

export function ProjectBody({ project: p }: { project: Project }) {
  const demo = demos[p.id];
  return (
    <>
      <div className="project-text">
        <header className="project-head">
          <h3 id={`${p.id}-name`}>{p.href ? <a href={p.href}>{p.name}</a> : p.name}</h3>
          <span className="mono muted">{p.year}</span>
        </header>
        <p className="mono muted">{p.stack}</p>
        <p>{p.why}</p>
        <p>{p.how}</p>
        {p.note && <p className="mono muted">{p.note}</p>}
      </div>
      {demo && <Demo name={demo[0]} Component={demo[1]} />}
      {p.id === 'laparolymph' && <Poster />}
    </>
  );
}

export default function Projects() {
  const skill = useHighlight();
  return (
    <ol className="projects">
      {siteProjects.map((p, i) => (
        <li
          key={p.id}
          className="project"
          style={{ '--i': i, '--n': siteProjects.length } as CSSProperties}
          data-match={(skill && p.skills.includes(skill)) || undefined}
        >
          <Window title={demos[p.id] ? `${p.id}.app` : p.id} tone={tones[i % tones.length]} aria-labelledby={`${p.id}-name`} role="group">
            <ProjectBody project={p} />
          </Window>
        </li>
      ))}
    </ol>
  );
}
