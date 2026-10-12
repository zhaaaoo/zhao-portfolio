import type { ComponentPropsWithoutRef, PointerEventHandler, ReactNode } from 'react';

type Props = Omit<ComponentPropsWithoutRef<'div'>, 'title'> & {
  title: ReactNode;
  tone?: 'pink' | 'mint' | 'butter' | 'lilac';
  onClose?: () => void;
  onBarPointerDown?: PointerEventHandler<HTMLDivElement>;
};

export default function Window({ title, tone = 'pink', onClose, onBarPointerDown, children, className, ...rest }: Props) {
  return (
    <div className={className ? `window ${className}` : 'window'} data-tone={tone} {...rest}>
      <div className="window-bar" onPointerDown={onBarPointerDown}>
        <span className="window-title">{title}</span>
        {onClose && (
          <button type="button" className="window-close" onClick={onClose} onPointerDown={(e) => e.stopPropagation()} aria-label="Close window">
            ×
          </button>
        )}
      </div>
      <div className="window-body">{children}</div>
    </div>
  );
}
