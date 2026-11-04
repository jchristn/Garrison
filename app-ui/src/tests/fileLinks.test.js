import { describe, it, expect } from 'vitest';
import { fileLinkHref, fileLinkPath, filePathFromHref } from '../utils/fileLinks.js';

describe('fileLinkPath', () => {
  const listed = ['report.md', 'jev-research/jev-report.docx', 'research/report.md'];

  it('resolves sandbox: and file: links to the longest listed path they end with', () => {
    expect(fileLinkPath('sandbox:/workspaces/conversations/cnv_1/work/files/jev-research/jev-report.docx', listed)).toBe('jev-research/jev-report.docx');
    expect(fileLinkPath('file:///work/files/research/report.md', listed)).toBe('research/report.md');
    expect(fileLinkPath('sandbox:/x/work/files/report.md?x=1', listed)).toBe('report.md');
  });

  it('falls back to the part after /files/ for sandbox: and file: links nothing lists', () => {
    expect(fileLinkPath('sandbox:/w/work/files/out/new%20file.txt', [])).toBe('out/new file.txt');
    expect(fileLinkPath('sandbox:/tmp/a.txt', [])).toBe('tmp/a.txt');
    expect(fileLinkPath('sandbox:/', [])).toBeNull();
  });

  it('treats plain paths as file links only when the listing has them', () => {
    expect(fileLinkPath('./report.md', listed)).toBe('report.md');
    expect(fileLinkPath('/workspace/files/research/report.md', listed)).toBe('research/report.md');
    expect(fileLinkPath('docs/guide.md', listed)).toBeNull();
    expect(fileLinkPath('https://example.com/report.md', listed)).toBeNull();
    expect(fileLinkPath('#section', listed)).toBeNull();
    expect(fileLinkPath('mailto:a@example.com', listed)).toBeNull();
    expect(fileLinkPath('', listed)).toBeNull();
  });

  it('round-trips through the rendered href', () => {
    expect(filePathFromHref(fileLinkHref('a b/c#d.md'))).toBe('a b/c#d.md');
    expect(filePathFromHref('https://example.com')).toBeNull();
    expect(filePathFromHref('#file:%E0%A4%A')).toBe('%E0%A4%A');
  });
});
