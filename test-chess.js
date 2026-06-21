const { Chess } = require('chess.js');
const chess = new Chess();
try {
  const move1 = chess.move({ from: 'e2', to: 'e4', promotion: 'q' });
  console.log("Move 1 successful:", move1.san);
} catch (e) {
  console.error("Move 1 failed:", e.message);
}
try {
  const move2 = chess.move({ from: 'e7', to: 'e5', promotion: 'p' });
  console.log("Move 2 successful:", move2.san);
} catch (e) {
  console.error("Move 2 failed:", e.message);
}
