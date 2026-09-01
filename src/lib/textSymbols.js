// Converts plain text into Unicode superscript/subscript characters so a
// teacher can write ANY exponent or index they need — 2^238, x^(n+1),
// H2SO4, A_max, whatever — instead of being limited to a handful of
// pre-made buttons like x² or H₂O. It's pure Unicode (no image/HTML), so it
// still works everywhere this app already works: the plain <textarea>,
// the printed/exported paper, copy-paste into Word, etc.
//
// Coverage note: Unicode only defines superscript/subscript glyphs for a
// limited set of characters (digits, +-=(), and most — not all — Latin
// letters; there's no subscript q/w/y or superscript q, for example).
// Characters without a mapping are left as-is rather than silently dropped,
// so nothing is ever blocked — the base letter still shows even if it
// can't be shrunk.

const SUPER_MAP = {
  '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074',
  '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079',
  '+': '\u207a', '-': '\u207b', '\u2212': '\u207b', '=': '\u207c', '(': '\u207d', ')': '\u207e',
  'a': '\u1d43', 'b': '\u1d47', 'c': '\u1d9c', 'd': '\u1d48', 'e': '\u1d49', 'f': '\u1da0',
  'g': '\u1d4d', 'h': '\u02b0', 'i': '\u2071', 'j': '\u02b2', 'k': '\u1d4f', 'l': '\u02e1',
  'm': '\u1d50', 'n': '\u207f', 'o': '\u1d52', 'p': '\u1d56', 'r': '\u02b3', 's': '\u02e2',
  't': '\u1d57', 'u': '\u1d58', 'v': '\u1d5b', 'w': '\u02b7', 'x': '\u02e3', 'y': '\u02b8', 'z': '\u1dbb',
}

const SUB_MAP = {
  '0': '\u2080', '1': '\u2081', '2': '\u2082', '3': '\u2083', '4': '\u2084',
  '5': '\u2085', '6': '\u2086', '7': '\u2087', '8': '\u2088', '9': '\u2089',
  '+': '\u208a', '-': '\u208b', '\u2212': '\u208b', '=': '\u208c', '(': '\u208d', ')': '\u208e',
  'a': '\u2090', 'e': '\u2091', 'h': '\u2095', 'i': '\u1d62', 'j': '\u2c7c', 'k': '\u2096',
  'l': '\u2097', 'm': '\u2098', 'n': '\u2099', 'o': '\u2092', 'p': '\u209a', 'r': '\u1d63',
  's': '\u209b', 't': '\u209c', 'u': '\u1d64', 'v': '\u1d65', 'x': '\u2093',
}

function convert(str, map) {
  return [...String(str || '')].map((ch) => map[ch.toLowerCase()] ?? ch).join('')
}

export const toSuperscript = (str) => convert(str, SUPER_MAP)
export const toSubscript = (str) => convert(str, SUB_MAP)

// True only if every character could actually be converted — used to give
// a gentle "a couple of characters can't shrink" hint, not to block anything.
export const isFullySuperscriptable = (str) => [...String(str || '')].every((ch) => SUPER_MAP[ch.toLowerCase()])
export const isFullySubscriptable = (str) => [...String(str || '')].every((ch) => SUB_MAP[ch.toLowerCase()])
