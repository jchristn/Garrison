// Tool output helpers: unwrapping MCP content blocks recorded by older runs, and indenting JSON for reading.
import { describe, it, expect } from 'vitest';
import { buildPreview, prettyJson, toolOutputText } from '../utils/streamPreview';

describe('toolOutputText', () => {
  it('unwraps MCP content blocks into the tool\'s own text', () => {
    const draft = '{"id":"sdr_1","version":3}';
    expect(toolOutputText(JSON.stringify([{ type: 'text', text: draft }]))).toBe(draft);
    expect(toolOutputText(JSON.stringify([{ type: 'text', text: 'a' }, { type: 'image', data: 'x' }, { type: 'text', text: 'b' }]))).toBe('a\n[image]\nb');
  });

  it('leaves other text alone', () => {
    expect(toolOutputText('plain output')).toBe('plain output');
    expect(toolOutputText('{"id":"sdr_1"}')).toBe('{"id":"sdr_1"}');
    expect(toolOutputText('[{"name":"x"}]')).toBe('[{"name":"x"}]');
    expect(toolOutputText('[{not json')).toBe('[{not json');
    expect(toolOutputText(null)).toBe('');
  });

  it('is applied to tool results in the chat preview', () => {
    const events = [
      { sequence: 1, eventType: 'ToolCall', toolCallId: 't1', toolName: 'garrison_studio_put_item', text: '{"draftId":"sdr_1"}' },
      { sequence: 2, eventType: 'ToolResult', toolCallId: 't1', toolName: 'garrison_studio_put_item', success: true, text: JSON.stringify([{ type: 'text', text: '{"id":"sdr_1"}' }]) }
    ];
    expect(buildPreview(events).segments[0].output).toBe('{"id":"sdr_1"}');
  });
});

describe('prettyJson', () => {
  it('indents JSON and leaves other text alone', () => {
    expect(prettyJson('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(prettyJson('not json')).toBe('not json');
    expect(prettyJson('{broken')).toBe('{broken');
    expect(prettyJson('')).toBe('');
  });
});
