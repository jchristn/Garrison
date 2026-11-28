// LP4.1 to LP4.3: the diagram kit (wrapping, mirroring, the list toggle), the seven diagrams, the Learn page and its
// route, the sidebar entry, and the Explainer link to a diagram.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { textWidth, wrapText } from '../components/learn/textWrap';
import { layoutDiagram } from '../components/learn/diagramLayout';
import Diagram, { diagramTexts } from '../components/learn/Diagram';
import { DIAGRAMS, LABELLED_ARROWS, findDiagram } from '../components/learn/diagrams';
import { EXPLAINER_SECTIONS, GLOSSARY, LEARN_SECTIONS, TOUR_IDS, learnPathForTopic } from '../components/learn/learnSections';
import LearnView from '../views/LearnView';
import Explainer from '../components/Explainer';
import { HUBS, PAGES, findPage, pathFor } from '../config/navConfig';
import { PAGE_VIEWS } from '../views/hubs/hubPanels';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

function mount(element) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<MemoryRouter initialEntries={['/dashboard/learn']}>{element}</MemoryRouter>));
  return container;
}

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

afterEach(async () => {
  if (root) act(() => root.unmount());
  container?.remove();
  root = null;
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
  await i18n.changeLanguage('en');
});

describe('label wrapping', () => {
  it('keeps every line of a long German label inside the width, without losing a word', () => {
    const text = 'Prüfungen bei Zulassung und Wecken in der Steuerungsebene, nie durch den Agenten';
    const lines = wrapText(text, 140, 13, { bold: true });
    expect(lines.length).toBeGreaterThan(2);
    for (const line of lines) expect(textWidth(line, 13, { bold: true })).toBeLessThanOrEqual(140);
    expect(lines.join(' ')).toBe(text);
  });

  it('hyphenates a compound longer than the line and breaks after a hyphen', () => {
    const lines = wrapText('Organisationsrevisionsrückgängigmachung', 90, 13);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.slice(0, -1).every((l) => l.endsWith('-'))).toBe(true);
    expect(wrapText('Rückgängig-Entwurf', 90, 13)).toEqual(['Rückgängig-', 'Entwurf']);
  });

  it('breaks CJK text between characters but never before closing punctuation', () => {
    const lines = wrapText('守護者是一個有常設任務的代理程式，這項任務寫成一份職責。', 80, 12);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(/^[，。]/.test(line)).toBe(false);
  });

  it('grows boxes for German labels so nothing is clipped', async () => {
    await i18n.changeLanguage('de');
    const t = i18n.getFixedT('de');
    for (const def of DIAGRAMS) {
      const layout = layoutDiagram(def, diagramTexts(def, t));
      const m = layout.metrics;
      for (const box of layout.boxes) {
        expect(box.contentHeight, `${def.id}.${box.id}`).toBeLessThanOrEqual(box.h);
        for (const line of box.titleLines) expect(textWidth(line, m.titleSize, { bold: true }), `${def.id}.${box.id}`).toBeLessThanOrEqual(box.w - m.padX * 2);
        for (const line of box.bodyLines) expect(textWidth(line, m.bodySize), `${def.id}.${box.id}`).toBeLessThanOrEqual(box.w - m.padX * 2);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.w).toBeLessThanOrEqual(layout.width);
      }
    }
  });
});

describe('right-to-left mirroring', () => {
  const def = findDiagram('request');
  const texts = diagramTexts(def, i18n.getFixedT('en'));

  it('mirrors boxes, groups, and arrows across the same width', () => {
    const ltr = layoutDiagram(def, texts, { dir: 'ltr' });
    const rtl = layoutDiagram(def, texts, { dir: 'rtl' });
    expect(rtl.width).toBe(ltr.width);
    for (const box of ltr.boxes) {
      const mirrored = rtl.boxes.find((b) => b.id === box.id);
      expect(mirrored.x).toBeCloseTo(ltr.width - box.x - box.w, 5);
      expect(mirrored.y).toBe(box.y);
    }
    const caller = rtl.boxes.find((b) => b.id === 'caller');
    const queued = rtl.boxes.find((b) => b.id === 'queued');
    expect(caller.x).toBeGreaterThan(queued.x);
    const arrow = rtl.arrows.find((a) => a.id === 'sends');
    expect(arrow.points[1][0]).toBeLessThan(arrow.points[0][0]);
    const group = rtl.groups.find((g) => g.id === 'controlPlane');
    expect(group.labelAnchor).toBe('end');
  });

  it('renders the SVG mirrored in the pseudo right-to-left locale', async () => {
    await i18n.changeLanguage('zz');
    const el = mount(<Diagram id="runtime" list={false} />);
    expect(el.querySelector('svg').getAttribute('data-dir')).toBe('rtl');
  });
});

describe('diagram definitions', () => {
  it('has the seven diagrams, each with a page and a doc on every box and a label for every labelled arrow', () => {
    expect(DIAGRAMS.map((d) => d.id)).toEqual(['runtime', 'request', 'autonomy', 'teams', 'organization', 'selfRevision', 'brakes']);
    for (const def of DIAGRAMS) {
      const ids = new Set(def.boxes.map((b) => b.id));
      for (const box of def.boxes) {
        expect(findPage(box.page), `${def.id}.${box.id} page`).not.toBeNull();
        expect(box.doc, `${def.id}.${box.id} doc`).toMatch(/^[A-Z_]+\.md(#[a-z0-9-]+)?$/);
        expect(i18n.exists(`learn.diagrams.${def.id}.boxes.${box.id}.title`)).toBe(true);
      }
      for (const arrow of def.arrows) {
        expect(ids.has(arrow.from) && ids.has(arrow.to), `${def.id}.${arrow.id}`).toBe(true);
      }
      for (const id of LABELLED_ARROWS[def.id]) expect(i18n.exists(`learn.diagrams.${def.id}.arrows.${id}`), `${def.id}.${id}`).toBe(true);
    }
  });
});

describe('the text alternative', () => {
  it('carries a desc and toggles between the diagram and a nested list with the same parts', () => {
    const el = mount(<Diagram id="brakes" list={false} />);
    const desc = el.querySelector('svg desc').textContent;
    expect(desc).toContain('Freezes, the kill switch');
    expect(desc).toContain('Admission and wake checks');
    const toggle = el.querySelector('[data-testid="learn-toggle-brakes"]');
    expect(toggle.textContent).toBe('Show as list');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    act(() => toggle.click());
    expect(el.querySelector('svg')).toBeNull();
    const list = el.querySelector('[data-testid="learn-list-brakes"]');
    expect(list.querySelectorAll('[data-list-box]').length).toBe(findDiagram('brakes').boxes.length);
    expect(list.querySelector('[data-list-group="newWork"] [data-list-box="freeze"]')).not.toBeNull();
    expect(list.querySelector('.learn-list-connections').textContent).toContain('Admission and wake checks → Refused run: new run');
    expect(toggle.textContent).toBe('Show as diagram');
    act(() => toggle.click());
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('starts as a list below 768 pixels', () => {
    const original = window.matchMedia;
    window.matchMedia = (q) => ({ matches: q.includes('max-width: 767px'), media: q, addEventListener() {}, removeEventListener() {} });
    try {
      const el = mount(<Diagram id="teams" />);
      expect(el.querySelector('[data-testid="learn-list-teams"]')).not.toBeNull();
      expect(el.querySelector('svg')).toBeNull();
    } finally {
      window.matchMedia = original;
    }
  });

  it('links each box to its page', () => {
    const el = mount(<Diagram id="runtime" list={false} />);
    expect(el.querySelector('[data-testid="learn-box-deployment"]').getAttribute('href')).toBe(pathFor('deployments'));
  });
});

describe('the Learn page', () => {
  it('is a route-only page that the sidebar opens', () => {
    const hub = HUBS.find((h) => h.key === 'learn');
    expect(hub).toBeTruthy();
    expect(hub.hidden).toBe(true);
    expect(PAGES.find((p) => p.id === 'learn')).toBeTruthy();
    expect(pathFor('learn')).toBe('/dashboard/learn');
    expect(PAGE_VIEWS.learn).toBe(LearnView);
    expect(i18n.t('nav.learn')).toBe('Learn');
  });

  it('shows the sections in learning order, a tour button each, and the glossary', () => {
    const started = [];
    const el = mount(<LearnView startTour={(id) => started.push(id)} />);
    const sections = [...el.querySelectorAll('[data-testid^="learn-section-"]')].map((s) => s.getAttribute('data-testid').replace('learn-section-', ''));
    expect(sections).toEqual(LEARN_SECTIONS.map((s) => s.id));
    for (const s of LEARN_SECTIONS) expect(TOUR_IDS).toContain(s.tour);
    act(() => el.querySelector('[data-testid="learn-section-brakes"] [data-tour-id]').click());
    act(() => el.querySelector('[data-testid="learn-tour-first-look"]').click());
    expect(started).toEqual(['keep-it-safe', 'first-look']);
    expect(el.querySelectorAll('.learn-glossary-row').length).toBe(GLOSSARY.length);
    expect(el.querySelector('[data-term="harnessProfile"] dd').textContent).toContain('Connections');
  });
});

describe('Explainer links', () => {
  it('shows See the diagram only for topics a diagram draws', () => {
    expect(learnPathForTopic('freezes')).toBe('/dashboard/learn#learn-brakes');
    expect(learnPathForTopic('secrets')).toBeNull();
    const el = mount(
      <>
        <Explainer topic="keepers" />
        <Explainer topic="secrets" />
      </>
    );
    const link = el.querySelector('[data-testid="explainer-diagram-keepers"]');
    expect(link.textContent).toBe('See the diagram');
    expect(link.getAttribute('href')).toBe('/dashboard/learn#learn-autonomy');
    expect(el.querySelector('[data-testid="explainer-diagram-secrets"]')).toBeNull();
    for (const section of Object.values(EXPLAINER_SECTIONS)) expect(LEARN_SECTIONS.some((s) => s.id === section)).toBe(true);
  });
});
