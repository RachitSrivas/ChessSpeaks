/**
 * Parse a voice transcript into a chess move ({ from, to }).
 *
 * Strategy: We normalise homophones, strip noise words, then scan every
 * combination of the 5 alternative transcripts (handled in useSpeechRecognition)
 * for a valid [file][rank] pair pattern.
 */
export function parseVoiceCommand(text) {
  if (!text) return null;
  let normalized = text.toLowerCase().trim();

  // ── 1. Remove common filler / chess move preamble words ──────────────────
  const fillerWords = [
    'move', 'go', 'play', 'put', 'place', 'pawn', 'knight', 'bishop',
    'rook', 'queen', 'king', 'piece', 'from', 'on', 'the', 'my', 'please',
    'i', 'want', 'to', 'take', 'takes', 'capture', 'captures',
  ];
  fillerWords.forEach(w => {
    normalized = normalized.replace(new RegExp(`\\b${w}\\b`, 'g'), ' ');
  });

  // ── 2. Number word → digit ─────────────────────────────────────────────────
  const wordToNum = {
    'one': '1', 'won': '1', 'wan': '1',
    'two': '2', 'too': '2',
    'three': '3', 'tree': '3', 'free': '3',
    'four': '4', 'for': '4', 'fore': '4',
    'five': '5', 'fife': '5',
    'six': '6', 'sicks': '6', 'sics': '6',
    'seven': '7', 'sev': '7',
    'eight': '8', 'ate': '8', 'ait': '8',
  };
  Object.entries(wordToNum).forEach(([word, digit]) => {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
  });

  // ── 3. Phonetic letter → chess file letter ──────────────────────────────────
  const wordToLetter = {
    // A
    'alpha': 'a', 'alfa': 'a', 'hey': 'a', 'hay': 'a', 'ay': 'a',
    // B
    'bravo': 'b', 'bee': 'b', 'be': 'b',
    // C
    'charlie': 'c', 'see': 'c', 'sea': 'c', 'si': 'c',
    // D
    'delta': 'd', 'dee': 'd',
    // E
    'echo': 'e', 'ee': 'e',
    // F
    'foxtrot': 'f', 'ef': 'f', 'eff': 'f',
    // G
    'golf': 'g', 'gee': 'g',
    // H
    'hotel': 'h', 'aitch': 'h', 'age': 'h', 'each': 'h', 'ach': 'h',
  };
  Object.entries(wordToLetter).forEach(([word, letter]) => {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), letter);
  });

  // ── 4. Strip everything except lowercase letters and digits ─────────────────
  const clean = normalized.replace(/[^a-z0-9]/g, '');

  // ── 5. Find all [a-h][1-8] square patterns ──────────────────────────────────
  const regex = /[a-h][1-8]/g;
  const matches = clean.match(regex);

  if (matches && matches.length >= 2) {
    return {
      from: matches[0],
      to: matches[1],
    };
  }

  return null;
}
