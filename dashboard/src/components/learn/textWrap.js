// Label wrapping for the concept diagrams (LP4.1).
//
// SVG text does not wrap, and the diagrams must render the same way in the browser, in jsdom, and in the SVG export
// script, none of which can be asked for real glyph metrics in every case. So widths are estimated from character
// classes, a little on the generous side, and labels are broken greedily into lines that fit. Over-estimating costs a
// few pixels of padding; under-estimating would clip German compounds, so the table errs wide.

const CJK = /[ᄀ-ᇿ⺀-〿぀-ヿ㄀-ㇿ㈀-䶿一-鿿가-힯豈-﫿︰-﹏＀-￯]/;
// Characters a line should not start with in Chinese and Japanese text (a light form of kinsoku shori).
const NO_LINE_START = /[、。，．,.!！?？:：;；)）\]］}｝」』】〕〉》ー々ぁぃぅぇぉっゃゅょァィゥェォッャュョ]/;
const NARROW = /[iljtfrI.,:;'|!()[\]·]/;
const WIDE = /[MWmw@%]/;
const UPPER = /[A-Z0-9#&?]/;

/** Estimated advance width of one character, in em. */
export function charEm(ch, mono = false) {
  if (CJK.test(ch)) return 1;
  if (mono) return 0.62;
  if (ch === ' ') return 0.3;
  if (WIDE.test(ch)) return 0.86;
  if (UPPER.test(ch)) return 0.68;
  if (NARROW.test(ch)) return 0.34;
  return 0.56;
}

/**
 * Estimated rendered width of a string in pixels.
 * @param {string} text Text to measure.
 * @param {number} size Font size in pixels.
 * @param {{ bold?: boolean, mono?: boolean }} [options] Bold adds about 6 percent; mono uses a fixed advance.
 */
export function textWidth(text, size, options = {}) {
  let em = 0;
  for (const ch of String(text || '')) em += charEm(ch, options.mono);
  return em * size * (options.bold ? 1.06 : 1);
}

function tokenize(text) {
  // Each token carries the text to draw and whether a space separated it from the previous token.
  const tokens = [];
  let word = '';
  let spaced = false;
  const push = () => {
    if (word) tokens.push({ text: word, spaced });
    word = '';
    spaced = false;
  };
  for (const ch of String(text || '')) {
    if (ch === ' ' || ch === '\n' || ch === '\t') {
      push();
      spaced = true;
    } else if (CJK.test(ch)) {
      // Whitespace seen before a pending word belongs to that word; a CJK character right after it joins without one.
      const space = word ? false : spaced;
      push();
      // A CJK character is its own token, glued to the previous one when it may not start a line.
      if (NO_LINE_START.test(ch) && tokens.length) tokens[tokens.length - 1].text += ch;
      else tokens.push({ text: ch, spaced: space });
    } else if (NO_LINE_START.test(ch) && !word && tokens.length && !spaced) {
      tokens[tokens.length - 1].text += ch;
    } else {
      word += ch;
      // Allow a break after a slash, a hyphen, a middle dot, or an underscore (tool names such as
      // garrison_keeper_complete_tick, UXP1-V023) inside a long token.
      if (ch === '/' || ch === '·' || ch === '_' || (ch === '-' && word.length > 2)) push();
    }
  }
  push();
  return tokens;
}

function splitLong(word, maxWidth, size, options) {
  // A single word wider than the line (a long German compound) is broken into pieces that end with a hyphen.
  const pieces = [];
  let current = '';
  // An identifier in monospace is never hyphenated: a hyphen would read as part of the name.
  const latin = !CJK.test(word) && !options.mono;
  for (const ch of word) {
    const next = current + ch;
    const reserve = latin ? textWidth('-', size, options) : 0;
    if (current && textWidth(next, size, options) + reserve > maxWidth) {
      pieces.push(latin ? `${current}-` : current);
      current = ch;
    } else {
      current = next;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

/**
 * Break text into lines no wider than maxWidth. Words are kept whole when they fit; a word that cannot fit on a line
 * of its own is hyphenated. CJK text breaks between characters, never before closing punctuation.
 * @param {string} text Text to wrap.
 * @param {number} maxWidth Line width in pixels (at least one character always fits).
 * @param {number} size Font size in pixels.
 * @param {{ bold?: boolean, mono?: boolean }} [options] Passed to textWidth.
 * @returns {string[]} Lines, at least one (empty text gives an empty array).
 */
export function wrapText(text, maxWidth, size, options = {}) {
  const tokens = tokenize(text);
  const lines = [];
  let line = '';
  for (const token of tokens) {
    const joiner = line && token.spaced ? ' ' : '';
    const candidate = line + joiner + token.text;
    if (!line || textWidth(candidate, size, options) <= maxWidth) {
      if (!line && textWidth(token.text, size, options) > maxWidth) {
        const pieces = splitLong(token.text, maxWidth, size, options);
        lines.push(...pieces.slice(0, -1));
        line = pieces[pieces.length - 1] || '';
      } else {
        line = candidate;
      }
      continue;
    }
    lines.push(line);
    if (textWidth(token.text, size, options) > maxWidth) {
      const pieces = splitLong(token.text, maxWidth, size, options);
      lines.push(...pieces.slice(0, -1));
      line = pieces[pieces.length - 1] || '';
    } else {
      line = token.text;
    }
  }
  if (line) lines.push(line);
  return lines;
}
