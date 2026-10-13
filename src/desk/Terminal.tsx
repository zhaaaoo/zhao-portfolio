import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { beforeStories, intro, interests, notes, siteProjects, stories } from '../content/site';
import { education, experience } from '../content/resume';
import type { WinId } from './windows';

type Props = { onOpen: (id: WinId) => void; onTheme: () => void; onPlain: () => void; onScene: (scene: 'island' | 'desk') => void };

const files: Record<string, () => string[]> = {
  'notes.txt': () => notes.flatMap((n) => [`# ${n.title}`, n.body, '']),
  'earlier.txt': () => [
    ...experience.slice(1).map((r) => `${r.title}, ${r.company} (${r.period}): ${r.points[0]}`),
    ...education.map((e) => `${e.school}, ${e.detail} (${e.period})`),
  ],
  'about.txt': () => [intro.line, intro.open, `Off screen: ${interests.join(', ')}.`],
  ...Object.fromEntries(stories.map((s) => [`work/${s.id}.md`, () => [`# ${s.title} (${s.when})`, ...s.points.map((p) => `- ${p}`)]])),
};

const openable: Record<string, WinId> = {
  work: 'work',
  projects: 'projects',
  notes: 'notes',
  earlier: 'earlier',
  about: 'about',
  stickers: 'stickers',
  readme: 'site',
  ...Object.fromEntries(siteProjects.map((p) => [p.id, `project:${p.id}` as WinId])),
};

const commands = ['help', 'ls', 'cat', 'open', 'whoami', 'theme', 'plain', 'clear'];

export default function Terminal({ onOpen, onTheme, onPlain, onScene }: Props) {
  const [lines, setLines] = useState<string[]>(['type `help` to see what this can do']);
  const [input, setInput] = useState('');
  const history = useRef<string[]>([]);
  const cursor = useRef(0);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [lines]);

  const run = (raw: string) => {
    const [cmd, ...args] = raw.trim().split(/\s+/);
    const arg = args.join(' ');
    const out: string[] = [];
    switch (cmd) {
      case '':
        break;
      case 'help':
        out.push('ls [work]       list files', 'cat <file>      print a file', 'open <name>     open a window or project', 'whoami', 'theme           switch light/dark', 'plain           plain page view', 'clear');
        break;
      case 'ls':
        if (arg === 'work' || arg === 'work/') out.push(...stories.map((s) => `${s.id}.md`), beforeStories);
        else out.push('work/  notes.txt  earlier.txt  about.txt  resume.pdf', `apps: ${Object.keys(openable).join('  ')}`);
        break;
      case 'cat':
        if (arg === 'resume.pdf') out.push('binary file. try `open resume`');
        else if (files[arg] ?? files[`work/${arg}`] ?? files[`work/${arg}.md`]) out.push(...(files[arg] ?? files[`work/${arg}`] ?? files[`work/${arg}.md`])());
        else out.push(`cat: ${arg || '(nothing)'}: no such file`);
        break;
      case 'open':
        if (arg === 'desk' || arg === 'island') {
          onScene(arg);
          out.push(arg === 'desk' ? 'you found the old desk. `open island` to go back' : 'back to the island');
        } else if (arg === 'resume' || arg === 'resume.pdf') {
          window.open('/wang-zhao-resume.pdf', '_blank', 'noopener');
          out.push('opening resume.pdf');
        } else if (openable[arg]) {
          onOpen(openable[arg]);
          out.push(`opening ${arg}`);
        } else out.push(`open: ${arg || '(nothing)'}: not found. try \`ls\``);
        break;
      case 'whoami':
        out.push('wang zhao', intro.line);
        break;
      case 'theme':
        onTheme();
        out.push('switched theme');
        break;
      case 'plain':
        onPlain();
        break;
      case 'clear':
        setLines([]);
        return;
      default:
        out.push(`zsh: command not found: ${cmd}`);
    }
    setLines((prev) => [...prev, `~ $ ${raw}`, ...out].slice(-200));
  };

  const complete = () => {
    const parts = input.split(' ');
    const pool = parts.length === 1 ? commands : parts[0] === 'open' ? [...Object.keys(openable), 'resume'] : Object.keys(files);
    const matches = pool.filter((p) => p.startsWith(parts.at(-1)!));
    if (matches.length === 1) setInput([...parts.slice(0, -1), matches[0]].join(' ') + (parts.length === 1 ? ' ' : ''));
    else if (matches.length > 1) setLines((prev) => [...prev, matches.join('  ')]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      run(input);
      if (input.trim()) history.current.push(input);
      cursor.current = history.current.length;
      setInput('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      cursor.current = Math.max(0, Math.min(history.current.length, cursor.current + (e.key === 'ArrowUp' ? -1 : 1)));
      setInput(history.current[cursor.current] ?? '');
    }
  };

  return (
    <div className="terminal">
      <div className="terminal-out" aria-live="polite">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
        <div ref={end} />
      </div>
      <label className="terminal-prompt">
        <span aria-hidden="true">~ $</span>
        <span className="visually-hidden">Terminal command</span>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} spellCheck={false} autoCapitalize="off" autoComplete="off" />
      </label>
    </div>
  );
}
