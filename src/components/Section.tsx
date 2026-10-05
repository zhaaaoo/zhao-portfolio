import type { ReactNode } from 'react';
import { Part } from '../inspect';
import Sparkle from './Sparkle';
import Window from './Window';

type Props = {
  id: string;
  n: number;
  title: string;
  file: string;
  tone?: 'pink' | 'mint' | 'butter' | 'lilac';
  note?: ReactNode;
  children: ReactNode;
};

export default function Section({ id, n, title, file, tone, note, children }: Props) {
  return (
    <Part name={`Section ${title}`} as="section" id={id} aria-labelledby={`${id}-title`}>
      <Window title={file} tone={tone}>
        <h2 id={`${id}-title`} className="section-title">
          <span className="mono muted">§{n}</span> {title} <Sparkle />
          <Sparkle />
        </h2>
        {note && <aside className="sticky-note">{note}</aside>}
        {children}
      </Window>
    </Part>
  );
}
