import { Chess } from 'chess.js';

const game = new Chess();
console.log("Initial FEN:", game.fen());

const gameCopy = new Chess(game.fen());
let result = null;
try {
  result = gameCopy.move({ from: 'e2', to: 'e4' });
  console.log("Move succeeded without promotion:", result.san);
} catch (e) {
  console.log("Move failed without promotion:", e.message);
  try {
    result = gameCopy.move({ from: 'e2', to: 'e4', promotion: 'q' });
    console.log("Move succeeded WITH promotion:", result.san);
  } catch (e2) {
    console.log("Move failed WITH promotion:", e2.message);
  }
}

console.log("Final FEN:", gameCopy.fen());
