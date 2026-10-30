// Every secret kind the dashboard offers has a guide, and every step of every guide has text in every catalog.

import { describe, it, expect } from 'vitest';
import { ENUMS } from '../utils/constants';
import { MULTILINE_SECRET_KINDS, SECRET_GUIDES, secretGuide } from '../utils/secretGuides';
import resources from '../i18n/resources';

const lookup = (catalog, key) => key.split('.').reduce((n, part) => (n && typeof n === 'object' ? n[part] : undefined), catalog);

describe('secret guides', () => {
  it('cover every secret kind', () => {
    expect(Object.keys(SECRET_GUIDES).sort()).toEqual([...ENUMS.secretKind].sort());
    expect(secretGuide('NoSuchKind')).toBeNull();
    expect(MULTILINE_SECRET_KINDS.every((k) => ENUMS.secretKind.includes(k))).toBe(true);
  });

  it('have text for every step and note in every locale', () => {
    const missing = [];
    for (const [code, bundle] of Object.entries(resources)) {
      const catalog = bundle.translation || bundle;
      for (const [kind, guide] of Object.entries(SECRET_GUIDES)) {
        const keys = [...guide.steps.map((s) => s.key), ...(guide.note ? ['note'] : [])];
        for (const key of keys) if (typeof lookup(catalog, `components.secretGuide.${kind}.${key}`) !== 'string') missing.push(`${code}: ${kind}.${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('tell how to make a Claude Code token and a Codex login', () => {
    expect(SECRET_GUIDES.ClaudeCodeOAuthToken.steps.map((s) => s.code).filter(Boolean)).toContain('claude setup-token');
    expect(SECRET_GUIDES.CodexAuthJson.steps.map((s) => s.code).join('\n')).toContain('codex login');
    expect(SECRET_GUIDES.AnthropicApiKey.steps[0].link).toBe('https://console.anthropic.com/settings/keys');
  });
});
