import { Suspense, useEffect, useRef, useState, type ComponentType } from 'react';
import { siteProjects, type ProjectId } from '../content/site';
import { Part, lazyPart } from '../inspect';
import poster from '../assets/images/laparolymph-poster.webp';

const demos: Partial<Record<ProjectId, [string, ComponentType]>> = {
  spendulu: ['SpenduluDemo', lazyPart('SpenduluDemo', () => import('../demos/SpenduluDemo'))],
  browhen: ['BrowhenDemo', lazyPart('BrowhenDemo', () => import('../demos/BrowhenDemo'))],
  'powder-ping': ['PowderPingDemo', lazyPart('PowderPingDemo', () => import('../demos/PowderPingDemo'))],
};

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
        <img src={poster} alt="LaparoLymph capstone poster: software features on the left, the physical training box on the right." width={1100} height={1557} loading="lazy" decoding="async" />
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

export default function Projects() {
  return (
    <div className="projects">
      {siteProjects.map((p) => {
        const demo = demos[p.id];
        return (
          <article key={p.id} className="project" aria-labelledby={`${p.id}-name`}>
            <header className="project-head">
              <h3 id={`${p.id}-name`}>
                {p.href ? <a href={p.href}>{p.name}</a> : p.name}
              </h3>
              <span className="mono muted">{p.year}</span>
              <span className="mono muted project-stack">{p.stack}</span>
            </header>
            <p>{p.why}</p>
            <p>{p.how}</p>
            {p.note && <p className="mono muted">{p.note}</p>}
            {demo && <Demo name={demo[0]} Component={demo[1]} />}
            {p.id === 'laparolymph' && <Poster />}
          </article>
        );
      })}
    </div>
  );
}
