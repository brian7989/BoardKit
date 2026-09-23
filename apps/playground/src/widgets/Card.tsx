import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from 'react';
import styles from './widgets.module.css';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  readonly children?: ReactNode;
  readonly ref?: Ref<HTMLDivElement>;
  readonly style?: CSSProperties;
  readonly justify?: CSSProperties['justifyContent'];
  readonly align?: CSSProperties['alignItems'];
  readonly gap?: CSSProperties['gap'];
}

// A plain layout box, not a visual card: boardkit-react's tile frame now owns the border,
// radius and default background, so this only supplies the padding/flex layout widgets need.
export function Card({ className, style, justify, align, gap, ...props }: CardProps) {
  return (
    <div
      className={className ? `${styles.card} ${className}` : styles.card}
      style={{ ...(justify ? { justifyContent: justify } : {}), ...(align ? { alignItems: align } : {}), ...(gap !== undefined ? { gap } : {}), ...style }}
      {...props}
    />
  );
}
