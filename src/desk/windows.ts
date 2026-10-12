import { useCallback, useState } from 'react';
import { siteProjects, type ProjectId } from '../content/site';
import { tones } from '../components/Projects';

export type ObjectId = 'globe' | 'laptop' | 'keyboard' | 'server' | 'polaroid' | 'notes' | 'books';
export type WinId = 'welcome' | 'about' | 'work' | 'projects' | 'notes' | 'earlier' | 'site' | 'terminal' | 'stickers' | `project:${ProjectId}`;

type Meta = { title: string; tone: (typeof tones)[number]; object?: ObjectId; width: number };

export function meta(id: WinId): Meta {
  if (id.startsWith('project:')) {
    const i = siteProjects.findIndex((p) => `project:${p.id}` === id);
    return { title: `${siteProjects[i].id}.app`, tone: tones[i % tones.length], object: 'laptop', width: 760 };
  }
  const table: Record<string, Meta> = {
    welcome: { title: 'welcome.txt', tone: 'pink', width: 520 },
    about: { title: 'about-me.jpg', tone: 'lilac', object: 'polaroid', width: 560 },
    work: { title: 'work — ncs', tone: 'mint', object: 'server', width: 620 },
    projects: { title: 'projects', tone: 'lilac', object: 'laptop', width: 520 },
    notes: { title: 'notes.txt', tone: 'butter', object: 'notes', width: 600 },
    earlier: { title: 'earlier.txt', tone: 'butter', object: 'books', width: 520 },
    site: { title: 'readme.md', tone: 'mint', width: 520 },
    terminal: { title: 'terminal — zsh', tone: 'lilac', object: 'keyboard', width: 560 },
    stickers: { title: 'stickers', tone: 'pink', width: 380 },
  };
  return table[id];
}

export const windowIds: WinId[] = ['welcome', 'about', 'work', 'projects', 'notes', 'earlier', 'site', 'terminal', 'stickers', ...siteProjects.map((p) => `project:${p.id}` as const)];

export type Win = { id: WinId; x: number; y: number; z: number };

let z = 1;

function place(id: WinId, count: number) {
  const width = Math.min(meta(id).width, innerWidth - 32);
  // stack windows on the right so the desk stays visible on the left
  return { x: Math.max(16, innerWidth - width - 48 - count * 26), y: 76 + count * 26 };
}

export function useDesktop() {
  const [wins, setWins] = useState<Win[]>(() => [{ id: 'welcome', ...place('welcome', 0), z: z++ }]);

  const open = useCallback((id: WinId) => {
    setWins((ws) => {
      const existing = ws.find((w) => w.id === id);
      if (existing) return ws.map((w) => (w.id === id ? { ...w, z: z++ } : w));
      return [...ws, { id, ...place(id, ws.length % 6), z: z++ }];
    });
  }, []);

  const close = useCallback((id: WinId) => setWins((ws) => ws.filter((w) => w.id !== id)), []);
  const focus = useCallback((id: WinId) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z: z++ } : w))), []);
  const move = useCallback((id: WinId, x: number, y: number) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, x, y } : w))), []);

  const top = wins.reduce<Win | undefined>((a, w) => (!a || w.z > a.z ? w : a), undefined);
  return { wins, top, open, close, focus, move };
}

export type Desktop = ReturnType<typeof useDesktop>;
