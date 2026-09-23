import { createContext, useContext } from 'react';
import type { WidgetProps } from './WidgetProps.js';

export const WidgetContext = createContext<WidgetProps | null>(null);

/** Widget props, for a component below the widget's own top-level component. */
export function useWidget(): WidgetProps {
  const value = useContext(WidgetContext);
  if (!value) throw new Error('useWidget must be used within a widget rendered by WidgetHost.');
  return value;
}
