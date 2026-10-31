// Conversation and file list ordering and filtering.
import { describe, it, expect } from 'vitest';
import { filterConversations, sortConversations, sortFiles } from '../utils/lists.js';

const untitled = (c) => `Conversation of ${c.createdUtc}`;
const conversations = [
  { id: 'a', title: 'Tides', createdUtc: '2026-10-01T00:00:00Z', lastActivityUtc: '2026-10-03T00:00:00Z' },
  { id: 'b', title: 'apples', createdUtc: '2026-10-02T00:00:00Z', lastActivityUtc: '2026-10-05T00:00:00Z' },
  { id: 'c', title: null, createdUtc: '2026-09-01T00:00:00Z' }
];

describe('conversation list', () => {
  it('sorts by activity and by name, ignoring case', () => {
    expect(sortConversations(conversations, 'recent', untitled).map((c) => c.id)).toEqual(['b', 'a', 'c']);
    expect(sortConversations(conversations, 'oldest', untitled).map((c) => c.id)).toEqual(['c', 'a', 'b']);
    expect(sortConversations(conversations, 'nameAsc', untitled).map((c) => c.id)).toEqual(['b', 'c', 'a']);
    expect(sortConversations(conversations, 'nameDesc', untitled).map((c) => c.id)).toEqual(['a', 'c', 'b']);
  });

  it('filters by the shown name, untitled ones included', () => {
    expect(filterConversations(conversations, 'TID', untitled).map((c) => c.id)).toEqual(['a']);
    expect(filterConversations(conversations, 'conversation of', untitled).map((c) => c.id)).toEqual(['c']);
    expect(filterConversations(conversations, '  ', untitled)).toHaveLength(3);
  });
});

describe('file list', () => {
  const files = [
    { path: 'report.md', sizeBytes: 2048, lastUpdateUtc: '2026-10-02T00:00:00Z' },
    { path: 'notes/a.txt', sizeBytes: 10, lastUpdateUtc: '2026-10-03T00:00:00Z' },
    { path: 'data.csv', sizeBytes: 90000, lastUpdateUtc: '2026-10-01T00:00:00Z' }
  ];
  it('sorts by age, size, and name', () => {
    expect(sortFiles(files, 'newest').map((f) => f.path)).toEqual(['notes/a.txt', 'report.md', 'data.csv']);
    expect(sortFiles(files, 'oldest').map((f) => f.path)).toEqual(['data.csv', 'report.md', 'notes/a.txt']);
    expect(sortFiles(files, 'largest').map((f) => f.path)).toEqual(['data.csv', 'report.md', 'notes/a.txt']);
    expect(sortFiles(files, 'smallest').map((f) => f.path)).toEqual(['notes/a.txt', 'report.md', 'data.csv']);
    expect(sortFiles(files, 'nameAsc').map((f) => f.path)).toEqual(['data.csv', 'notes/a.txt', 'report.md']);
    expect(sortFiles(files, 'nameDesc').map((f) => f.path)).toEqual(['report.md', 'notes/a.txt', 'data.csv']);
  });
});
