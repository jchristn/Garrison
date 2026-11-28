// App palettes (LP8.3): every preset covers all eight roles in both themes and passes WCAG AA for the text the app page
// draws on each surface, and the dashboard's color math matches the app page's (app-ui/src/utils/branding.js).

import { describe, it, expect } from 'vitest';
import { APP_COLOR_ROLES, APP_PALETTES, CUSTOM_PALETTE, applyPalette, clearAppColors, effectiveColor, setAppColor } from '../utils/appPalettes';
import { AA_TEXT, contrastRatio, deriveDarkColor, mutedOn, readableOn, textContrast, THEME_TEXT } from '../utils/appColors';
import * as appUi from '../../../app-ui/src/utils/branding.js';

const HEX6 = /^#[0-9A-F]{6}$/;

describe('app palettes', () => {
  it('has eight distinct presets, each with a light and a dark color for every role', () => {
    expect(APP_PALETTES).toHaveLength(8);
    expect(new Set(APP_PALETTES.map((p) => p.id)).size).toBe(8);
    expect(new Set(APP_PALETTES.map((p) => p.light.primary + p.dark.primary)).size).toBe(8);
    for (const p of APP_PALETTES) {
      for (const theme of ['light', 'dark']) {
        expect(Object.keys(p[theme]).sort(), `${p.id} ${theme}`).toEqual(APP_COLOR_ROLES.map((r) => r.role).sort());
        for (const value of Object.values(p[theme])) expect(value, `${p.id} ${theme}`).toMatch(HEX6);
      }
    }
  });

  it('meets WCAG AA (4.5:1) for body text on every surface in both themes', () => {
    const problems = [];
    for (const p of APP_PALETTES) {
      for (const theme of ['light', 'dark']) {
        for (const r of APP_COLOR_ROLES) {
          const color = p[theme][r.role];
          const checks = { readable: contrastRatio(color, readableOn(color)) };
          if (r.kind === 'surface') {
            checks.muted = contrastRatio(color, mutedOn(color));
            checks.themeText = contrastRatio(color, THEME_TEXT[theme]);
          }
          for (const [what, ratio] of Object.entries(checks)) if (ratio < AA_TEXT) problems.push(`${p.id} ${theme} ${r.role} ${what} ${ratio.toFixed(2)}`);
          expect(textContrast(color, theme, r.kind)).toBeCloseTo(Math.min(...Object.values(checks)), 6);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('keeps AA when the dark colors are left for the app page to derive from the light ones', () => {
    const problems = [];
    for (const p of APP_PALETTES) {
      for (const r of APP_COLOR_ROLES) {
        const ratio = textContrast(deriveDarkColor(p.light[r.role], r.kind), 'dark', r.kind);
        if (ratio < AA_TEXT) problems.push(`${p.id} ${r.role} ${ratio.toFixed(2)}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('computes readable text and dark colors exactly as the app page does', () => {
    for (let v = 0; v < 4096; v += 37) {
      const hex = `#${v.toString(16).padStart(3, '0')}`;
      expect(readableOn(hex), hex).toBe(appUi.readableOn(hex));
      expect(contrastRatio(hex, '#ffffff')).toBeCloseTo(appUi.contrastRatio(hex, '#ffffff'), 10);
      for (const kind of ['surface', 'brand']) expect(deriveDarkColor(hex, kind), `${hex} ${kind}`).toBe(appUi.deriveDarkColor(hex, kind));
    }
    for (const p of APP_PALETTES) {
      for (const r of APP_COLOR_ROLES) expect(deriveDarkColor(p.light[r.role], r.kind)).toBe(appUi.deriveDarkColor(p.light[r.role], r.kind));
    }
  });

  it('fills every color and paletteId from a preset, and turns custom on any edit', () => {
    const form = applyPalette({ name: 'x', primaryColor: '' }, 'ocean');
    expect(form.paletteId).toBe('ocean');
    expect(form.primaryColor).toBe('#0369A1');
    expect(form.darkFilesColor).toBe('#072A40');
    expect(applyPalette(form, 'missing')).toBe(form);
    const edited = setAppColor(form, 'darkAccentColor', '#FFFFFF');
    expect(edited.paletteId).toBe(CUSTOM_PALETTE);
    expect(edited.darkAccentColor).toBe('#FFFFFF');
    const cleared = clearAppColors(edited);
    expect(cleared.paletteId).toBe('');
    expect(APP_COLOR_ROLES.every((r) => cleared[r.field] === '' && cleared[r.darkField] === '')).toBe(true);
  });

  it('shows the color the app page will draw, matching its own rule', () => {
    const legacy = { backgroundColor: '#F8FAFC' };
    expect(effectiveColor(legacy, 'background', 'dark')).toEqual({ color: '#f8fafc', source: 'light' });
    expect(effectiveColor({}, 'header', 'dark')).toEqual({ color: '#111a2b', source: 'default' });
    expect(effectiveColor({}, 'header', 'light')).toEqual({ color: '#ffffff', source: 'default' });
    const custom = { backgroundColor: '#F8FAFC', paletteId: 'custom' };
    expect(effectiveColor(custom, 'backgroundColor', 'dark')).toEqual({ color: deriveDarkColor('#f8fafc'), source: 'derived' });
    const info = { ...custom, primaryColor: '#1E3A8A', darkPrimaryColor: '#93C5FD' };
    for (const theme of ['light', 'dark']) {
      const vars = appUi.brandingVariables(info, theme);
      expect(effectiveColor(info, 'primary', theme).color).toBe(vars['--app-primary']);
      expect(effectiveColor(info, 'background', theme).color).toBe(vars['--app-background']);
    }
  });
});
