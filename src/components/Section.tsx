import type { ReactNode } from 'react';
import { Part } from '../inspect';

type Props = { id: string; n: number; title: string; note?: ReactNode; children: ReactNode };

export default function Section({ id, n, title, note, children }: Props) {
  return (
    <Part name={`Section ${title}`} as="section" id={id} className="section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="section-title">
        <span className="mono muted">§{n}</span> {title}
      </h2>
      <div className="section-body">{children}</div>
      {note && <aside className="note">{note}</aside>}
    </Part>
  );
}
