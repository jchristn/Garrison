// Unit tests for run guard and per-run time limit helpers (P3.15).
import { describe, it, expect } from 'vitest';
import i18n from '../i18n/index.js';
import { guardOutcome, timeLimitBounds, validateTimeLimit, presetAllowed, secondsLabel, TIME_LIMIT_PRESETS } from '../utils/runGuards';
import { runtimeLimits } from '../utils/settings';
import { translateServerText } from '../utils/serverText';

const en = i18n.getFixedT('en');
const de = i18n.getFixedT('de');

describe('guardOutcome', () => {
  it('recognizes the repetition and no-progress guards', () => {
    expect(guardOutcome({ outcome: 'RepetitionDetected' })).toBe('RepetitionDetected');
    expect(guardOutcome({ outcome: 'NoProgress' })).toBe('NoProgress');
  });
  it('treats OutputLimitExceeded as a guard stop only for the maxAssistantChars limit', () => {
    expect(guardOutcome({ outcome: 'OutputLimitExceeded', errorMessage: "Assistant text passed the run's maxAssistantChars limit of 200,000 characters." })).toBe('OutputLimitExceeded');
    expect(guardOutcome({ outcome: 'OutputLimitExceeded', errorMessage: 'Harness stdout exceeded maxOutputBytes.' })).toBeNull();
  });
  it('ignores every other outcome', () => {
    for (const outcome of ['Succeeded', 'HarnessFailed', 'TimedOut', 'Cancelled', 'None', undefined]) expect(guardOutcome({ outcome })).toBeNull();
    expect(guardOutcome(null)).toBeNull();
  });
});

describe('time limit', () => {
  const bounds = timeLimitBounds({ name: 'timeoutSeconds', validation: 'IntegerRange', pattern: '30,1800' }, 1200);
  it('reads the IntegerRange rule and the cluster cap', () => {
    expect(bounds).toEqual({ min: 30, max: 1800, cap: 1200 });
    expect(timeLimitBounds({ validation: 'Any' }, null)).toEqual({ min: null, max: null, cap: null });
    expect(timeLimitBounds({ validation: 'IntegerRange', pattern: 'x,y' }, '3600')).toEqual({ min: null, max: null, cap: 3600 });
  });
  it('accepts empty and in-range whole numbers', () => {
    expect(validateTimeLimit('', bounds)).toBeNull();
    expect(validateTimeLimit('300', bounds)).toBeNull();
    expect(validateTimeLimit('1200', bounds)).toBeNull();
  });
  it('rejects non-integers, values outside the rule, and values above the cap', () => {
    expect(validateTimeLimit('1.5', bounds)).toEqual({ key: 'notInteger', params: {} });
    expect(validateTimeLimit('0', bounds)).toEqual({ key: 'notInteger', params: {} });
    expect(validateTimeLimit('10', bounds)).toEqual({ key: 'range', params: { min: 30, max: 1800 } });
    expect(validateTimeLimit('1801', bounds)).toEqual({ key: 'range', params: { min: 30, max: 1800 } });
    expect(validateTimeLimit('1500', bounds)).toEqual({ key: 'aboveCap', params: { max: 1200 } });
  });
  it('offers only presets that fit', () => {
    expect(TIME_LIMIT_PRESETS.filter((p) => presetAllowed(p, bounds))).toEqual([30, 60, 300, 900]);
    expect(TIME_LIMIT_PRESETS.filter((p) => presetAllowed(p, { min: 60, max: 600, cap: null }))).toEqual([60, 300]);
  });
  it('labels durations in whole hours, minutes, or seconds', () => {
    expect(secondsLabel(en, 30)).toBe('30 s');
    expect(secondsLabel(en, 300)).toBe('5 min');
    expect(secondsLabel(en, 3600)).toBe('1 h');
    expect(secondsLabel(en, 90)).toBe('90 s');
    expect(secondsLabel(i18n.getFixedT('ja'), 900)).toBe('15 分');
  });
});

describe('runtime limits from settings', () => {
  it('picks the Runtime.* values with editor types', () => {
    const r = runtimeLimits({
      fields: [
        { path: 'Runtime.MaxRunSeconds', type: 'int', value: '3600' },
        { path: 'Runtime.RepetitionGuard', type: 'bool', value: 'true' },
        { path: 'Runtime.MaxAssistantChars', type: 'int', value: '200000' }
      ]
    });
    expect(r).toEqual({ maxRunSeconds: 3600, repetitionGuard: true, maxAssistantChars: 200000, noProgressSeconds: null });
  });
});

describe('guard messages translate', () => {
  const messages = [
    'Repetition guard: the last 2,000 characters of assistant text are the 3-character unit "* \\n" repeated 666 times.',
    'Repetition guard: the last 1,000 characters of assistant text contain no letters or digits (only whitespace, punctuation, or symbols), ending with " \\n* \\n* \\n* \\n*".',
    'The run made no progress for 300 seconds (no assistant text, thinking, tool call, or tool result, and no tool call open); its noProgressSeconds limit is 300.',
    "Assistant text passed the run's maxAssistantChars limit of 200,000 characters."
  ];
  it('round-trips in English and translates in German with every value kept', () => {
    for (const m of messages) {
      expect(translateServerText(en, m)).toBe(m);
      const german = translateServerText(de, m);
      expect(german).not.toBe(m);
    }
    expect(translateServerText(de, messages[0])).toContain('„* \\n“');
    expect(translateServerText(de, messages[0])).toContain('666');
    expect(translateServerText(de, messages[3])).toContain('200,000');
  });
});
