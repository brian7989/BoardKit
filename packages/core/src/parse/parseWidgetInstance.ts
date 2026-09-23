import { err, ok, widgetId, type Result } from '../shared/index.js';
import type { Issue } from '../issues/index.js';
import type { WidgetInstance } from '../model/index.js';
import { readObject } from './readers/readObject.js';
import { readString } from './readers/readString.js';

export function parseWidgetInstance(value: unknown, path: string): Result<WidgetInstance, readonly Issue[]> {
  const object = readObject(value, path);
  if (!object.ok) return err([object.error]);

  const id = readString(object.value['id'], `${path}.id`);
  if (!id.ok) return err([id.error]);
  const type = readString(object.value['type'], `${path}.type`);
  if (!type.ok) return err([type.error]);

  const props = object.value['props'];
  const displayName = object.value['displayName'];
  return ok({
    id: widgetId(id.value),
    type: type.value,
    ...(isPropsBag(props) ? { props } : {}),
    ...(typeof displayName === 'string' ? { displayName } : {}),
  });
}

function isPropsBag(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
