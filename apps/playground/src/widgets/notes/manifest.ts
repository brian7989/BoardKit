import dayjs from 'dayjs';
import { faker } from '@faker-js/faker';
import { defineWidget } from 'boardkit-react';
import { Notes } from './Notes';

export interface NotesProps extends Record<string, unknown> {
  readonly body: string;
  readonly editedAt: string;
}

export const notesWidget = defineWidget<NotesProps>({
  type: 'notes',
  title: 'Notes',
  sizes: ['2x1', '2x2'],
  defaultProps: {
    body: faker.lorem.sentences(5),
    editedAt: dayjs().subtract(faker.number.int({ min: 1, max: 20 }), 'hour').format('MMM D, h:mm A'),
  },
  component: Notes,
});
