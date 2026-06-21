/**
 * ELO Rating System
 * Standard FIDE-style calculation
 */

const K_FACTOR = 32; // Sensitivity for new/unranked players

/**
 * Compute expected score for player A vs player B
 * @param {number} ratingA
 * @param {number} ratingB
 * @returns {number} expected score between 0 and 1
 */
export function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Compute new ELO rating after a game
 * @param {number} currentRating - player's current rating
 * @param {number} opponentRating - opponent's rating (use 600 for offline/computer)
 * @param {'win'|'loss'|'draw'} result
 * @returns {{ newRating: number, change: number }}
 */
export function computeNewRating(currentRating, opponentRating, result) {
  const expected = expectedScore(currentRating, opponentRating);
  const actual = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  const change = Math.round(K_FACTOR * (actual - expected));
  const newRating = Math.max(100, currentRating + change); // floor at 100
  return { newRating, change };
}
