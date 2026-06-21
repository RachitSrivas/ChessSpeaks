/**
 * Speak text using the Web Speech API.
 */
export function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88;  // Slower for clarity, especially for blind users
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

/**
 * Convert a chess.js move object (or SAN string) into a fully natural speech
 * description that a blind person can easily understand.
 *
 * If a move object is passed, we can produce:
 *   "pawn e2 to e4"
 *   "knight g1 to f3"
 *   "bishop f1 takes c4"
 *   "castles kingside"
 *   "pawn e7 promotes to queen"
 *
 * If only a SAN string is passed, we fall back to readable SAN speech.
 *
 * @param {object|string} moveOrSan - chess.js move object or SAN string
 */
export function sanToSpeech(moveOrSan) {
  const pieceNames = {
    p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
    P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king',
  };

  // If the caller passes a chess.js move object (with .piece, .from, .to, etc.)
  if (moveOrSan && typeof moveOrSan === 'object' && moveOrSan.piece) {
    const move = moveOrSan;
    const piece = pieceNames[move.piece] || move.piece;
    const from = squareToSpeech(move.from);
    const to = squareToSpeech(move.to);

    // Castling
    if (move.san === 'O-O') return 'Castles kingside';
    if (move.san === 'O-O-O') return 'Castles queenside';

    // Promotion
    if (move.promotion) {
      const promPiece = pieceNames[move.promotion] || move.promotion;
      const verb = move.captured ? 'takes' : 'to';
      return `${piece} ${from} ${verb} ${to}, promotes to ${promPiece}`;
    }

    // Capture
    if (move.captured) {
      const capPiece = pieceNames[move.captured] || move.captured;
      return `${piece} ${from} takes ${capPiece} on ${to}`;
    }

    // Normal move
    return `${piece} ${from} to ${to}`;
  }

  // Fallback: parse SAN string
  const san = String(moveOrSan);

  if (san === 'O-O') return 'Castles kingside';
  if (san === 'O-O-O') return 'Castles queenside';

  let spoken = san
    .replace(/N/, 'Knight ')
    .replace(/B/, 'Bishop ')
    .replace(/R/, 'Rook ')
    .replace(/Q/, 'Queen ')
    .replace(/K/, 'King ')
    .replace(/x/, ' takes ')
    .replace(/\+/, ', check')
    .replace(/#/, ', checkmate')
    .replace(/=([NBRQ])/, (_, p) => `, promotes to ${pieceNames[p] || p}`)
    .replace(/([a-h])([1-8])/g, (_, f, r) => `${f.toUpperCase()} ${r}`);

  // If it starts with a lowercase letter (pawn move like "e4"), prepend "pawn"
  if (/^[A-H]/.test(spoken) && !spoken.startsWith('Knight') && !spoken.startsWith('Bishop') &&
    !spoken.startsWith('Rook') && !spoken.startsWith('Queen') && !spoken.startsWith('King')) {
    spoken = 'Pawn ' + spoken;
  }

  return spoken.trim();
}

/**
 * Convert a square like "e7" into a speech-friendly string like "E 7".
 */
function squareToSpeech(square) {
  if (!square || square.length < 2) return square;
  return `${square[0].toUpperCase()} ${square[1]}`;
}
