import { describe, it, expect } from 'vitest';
import { DEFAULT_PRIMARY, applyBranding, brandingVariables, contrastRatio, normalizeColor, readableOn } from '../utils/branding.js';
import { appPath, parseAppPath } from '../utils/location.js';

describe('branding', () => {
  it('accepts only hex colors', () => {
    expect(normalizeColor('#ABC')).toBe('#aabbcc');
    expect(normalizeColor(' #1E40AF ')).toBe('#1e40af');
    expect(normalizeColor('red')).toBeNull();
    expect(normalizeColor('#123; background: url(x)')).toBeNull();
    expect(brandingVariables({ primaryColor: 'javascript:alert(1)' })['--app-primary']).toBe(DEFAULT_PRIMARY);
  });

  it('picks a text color with at least 4.5:1 contrast for any brand color', () => {
    for (let r = 0; r < 256; r += 17) {
      for (let g = 0; g < 256; g += 17) {
        for (let b = 0; b < 256; b += 17) {
          const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
          expect(contrastRatio(hex, readableOn(hex))).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
    expect(readableOn('#ffffff')).toBe('#000000');
    expect(readableOn('#1e3a8a')).toBe('#ffffff');
  });

  it('sets CSS variables and the page title at runtime', () => {
    const vars = applyBranding({ slug: 'demo', displayName: 'Research Desk', primaryColor: '#1e3a8a', accentColor: '#fde047' });
    const style = document.documentElement.style;
    expect(style.getPropertyValue('--app-primary')).toBe('#1e3a8a');
    expect(style.getPropertyValue('--app-on-primary')).toBe('#ffffff');
    expect(style.getPropertyValue('--app-accent')).toBe('#fde047');
    expect(style.getPropertyValue('--app-on-accent')).toBe('#000000');
    expect(vars['--app-primary']).toBe('#1e3a8a');
    expect(document.title).toBe('Research Desk');
  });
});

describe('app paths', () => {
  it('reads the slug and conversation from the URL', () => {
    expect(parseAppPath('/apps/demo/')).toEqual({ slug: 'demo', conversationId: null });
    expect(parseAppPath('/apps/demo')).toEqual({ slug: 'demo', conversationId: null });
    expect(parseAppPath('/apps/research-desk/c/cnv_01HX')).toEqual({ slug: 'research-desk', conversationId: 'cnv_01HX' });
    expect(parseAppPath('/apps/_ui/x.js').slug).toBeNull();
    expect(parseAppPath('/apps/').slug).toBeNull();
    expect(parseAppPath('/apps/Demo/').slug).toBeNull();
    expect(parseAppPath('/dashboard').slug).toBeNull();
    expect(appPath('demo', null)).toBe('/apps/demo/');
    expect(appPath('demo', 'cnv_1')).toBe('/apps/demo/c/cnv_1');
  });
});
