import { supabase } from './supabase';
import { computeNewRating } from './elo';

/**
 * Fetch the profile for the currently logged-in user.
 * Creates one if it doesn't exist yet (for existing users before migration).
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Profile not found — create it
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({ id: userId })
      .select()
      .single();
    if (createError) throw createError;
    return newProfile;
  }

  if (error) throw error;
  return data;
}

/**
 * Fetch recent game history for a user.
 */
export async function getGameHistory(userId, limit = 20) {
  const { data, error } = await supabase
    .from('game_history')
    .select('*')
    .eq('player_id', userId)
    .order('played_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/**
 * Save a completed game result and update the player's profile stats + rating.
 *
 * @param {object} params
 * @param {string}  params.userId
 * @param {string|null} params.opponentId
 * @param {'offline'|'online'|'computer'} params.gameMode
 * @param {'win'|'loss'|'draw'} params.result
 * @param {'w'|'b'} params.playerColor
 * @param {number}  params.totalMoves
 * @param {number}  params.currentRating  - caller must pass current rating
 * @param {number}  params.opponentRating - 600 default for offline/computer
 */
export async function saveGameResult({
  userId,
  opponentId = null,
  gameMode,
  result,
  playerColor,
  totalMoves,
  currentRating,
  opponentRating = 600,
}) {
  const { newRating, change } = computeNewRating(currentRating, opponentRating, result);

  // Insert game history row
  const { error: historyError } = await supabase.from('game_history').insert({
    player_id: userId,
    opponent_id: opponentId,
    game_mode: gameMode,
    result,
    player_color: playerColor,
    rating_before: currentRating,
    rating_after: newRating,
    rating_change: change,
    total_moves: totalMoves,
  });
  if (historyError) throw historyError;

  // Fetch current profile to increment counters
  const profile = await getProfile(userId);

  const updates = {
    rating: newRating,
    peak_rating: Math.max(profile.peak_rating || 600, newRating),
    total_games: (profile.total_games || 0) + 1,
    wins: (profile.wins || 0) + (result === 'win' ? 1 : 0),
    losses: (profile.losses || 0) + (result === 'loss' ? 1 : 0),
    draws: (profile.draws || 0) + (result === 'draw' ? 1 : 0),
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (profileError) throw profileError;

  return { newRating, change };
}
