import { Profiler, lazy, useSyncExternalStore, type ComponentPropsWithRef, type ComponentType } from 'react';

export type PartStat = { renders: number; lastMs: number; chunk?: { kb: number | null; ms: number } };

const stats = new Map<string, PartStat>();
const listeners = new Set<() => void>();
let version = 0;
let queued = false;

// Profiler callbacks fire during commit, so batch updates into a later task
// to keep the drawer from re-rendering inside someone else's render.
function emit() {
  if (queued) return;
  queued = true;
  setTimeout(() => {
    queued = false;
    version++;
    listeners.forEach((listener) => listener());
  }, 50);
}

function stat(name: string) {
  let s = stats.get(name);
  if (!s) stats.set(name, (s = { renders: 0, lastMs: 0 }));
  return s;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStats() {
  useSyncExternalStore(subscribe, () => version);
  return stats;
}

function onRender(id: string, _phase: string, actualDuration: number) {
  const s = stat(id);
  s.renders++;
  s.lastMs = actualDuration;
  emit();
}

type PartProps = ComponentPropsWithRef<'div'> & {
  name: string;
  as?: 'div' | 'section' | 'header' | 'footer' | 'figure';
};

export function Part({ name, children, as: Tag = 'div', ...rest }: PartProps) {
  return (
    <Profiler id={name} onRender={onRender}>
      <Tag data-part={name} {...rest}>
        {children}
      </Tag>
    </Profiler>
  );
}

export function lazyPart<P extends object>(name: string, load: () => Promise<{ default: ComponentType<P> }>) {
  return lazy(async () => {
    const start = performance.now();
    const mod = await load();
    const entry = performance
      .getEntriesByType('resource')
      .findLast((e) => e.name.includes(name)) as PerformanceResourceTiming | undefined;
    stat(name).chunk = { kb: entry ? entry.encodedBodySize / 1024 : null, ms: performance.now() - start };
    emit();
    return mod;
  });
}
