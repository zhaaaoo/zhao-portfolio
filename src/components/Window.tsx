import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type Props = ComponentPropsWithoutRef<'div'> & {
  title: ReactNode;
  tone?: 'pink' | 'mint' | 'butter' | 'lilac';
};

export default function Window({ title, tone = 'pink', children, className, ...rest }: Props) {
  return (
    <div className={className ? `window ${className}` : 'window'} data-tone={tone} {...rest}>
      <div className="window-bar">
        <span className="window-title">{title}</span>
      </div>
      <div className="window-body">{children}</div>
    </div>
  );
}
