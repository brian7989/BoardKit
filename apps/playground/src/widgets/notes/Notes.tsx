import type { WidgetProps } from 'boardkit-react';
import { Notes2x1 } from './Notes2x1';
import { Notes2x2 } from './Notes2x2';
import type { NotesProps } from './manifest';

export function Notes({ props, cells }: WidgetProps<NotesProps>) {
  if (cells.h > 1) return <Notes2x2 props={props} />;
  return <Notes2x1 props={props} />;
}
