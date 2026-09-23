import { describe, expect, it } from 'vitest';
import { parseWidgetInstance } from './parseWidgetInstance.js';
import { IssueKind } from '../issues/IssueKind.js';
import { widgetId } from '../shared/ids/WidgetId.js';

describe('parseWidgetInstance', () => {
  it('parses id and type, with props and displayName absent when not given', () => {
    const result = parseWidgetInstance({ id: 'w0', type: 'demo.widget' }, '$.item');
    expect(result).toEqual({ ok: true, value: { id: widgetId('w0'), type: 'demo.widget' } });
  });

  it('carries an object props bag through, but drops a non-object one', () => {
    const withProps = parseWidgetInstance({ id: 'w0', type: 'demo.widget', props: { color: 'red' } }, '$.item');
    expect(withProps).toEqual({ ok: true, value: { id: widgetId('w0'), type: 'demo.widget', props: { color: 'red' } } });

    const badProps = parseWidgetInstance({ id: 'w0', type: 'demo.widget', props: 'red' }, '$.item');
    expect(badProps.ok && !('props' in badProps.value)).toBe(true);
  });

  it('treats an array as a non-object props bag too', () => {
    const result = parseWidgetInstance({ id: 'w0', type: 'demo.widget', props: [1, 2] }, '$.item');
    expect(result.ok && !('props' in result.value)).toBe(true);
  });

  it('carries a string displayName through, but drops a non-string one', () => {
    const withName = parseWidgetInstance({ id: 'w0', type: 'demo.widget', displayName: 'My Widget' }, '$.item');
    expect(withName).toEqual({ ok: true, value: { id: widgetId('w0'), type: 'demo.widget', displayName: 'My Widget' } });

    const badName = parseWidgetInstance({ id: 'w0', type: 'demo.widget', displayName: 42 }, '$.item');
    expect(badName.ok && !('displayName' in badName.value)).toBe(true);
  });

  it('rejects a missing or non-string id', () => {
    const result = parseWidgetInstance({ type: 'demo.widget' }, '$.item');
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.item.id', message: 'Expected a string at $.item.id.' }] });
  });

  it('rejects a missing or non-string type', () => {
    const result = parseWidgetInstance({ id: 'w0' }, '$.item');
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.item.type', message: 'Expected a string at $.item.type.' }] });
  });

  it('rejects a non-object value entirely', () => {
    const result = parseWidgetInstance(null, '$.item');
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.item', message: 'Expected an object at $.item.' }] });
  });
});
