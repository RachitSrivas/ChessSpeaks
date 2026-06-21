import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { FaMicrophone, FaMicrophoneSlash, FaRedo, FaChess, FaUsers, FaLaptop, FaGlobe, FaTachometerAlt, FaRobot } from 'react-icons/fa';
import { speak, sanToSpeech } from '../utils/voice';
import { parseVoiceCommand } from '../utils/parser';
import { useGroqVoice } from '../hooks/useGroqVoice';
import { useEngine } from '../hooks/useEngine';
import { socket } from '../utils/socket';
import { supabase } from '../utils/supabase';
import { getProfile, saveGameResult } from '../utils/db';
import '../index.css';

// Utility to cleanly execute a move bypassing strict promotion errors
function executeMoveSafely(gameInstance, from, to, promotion = 'q') {
  console.log('executeMoveSafely called with:', { from, to, promotion });
  try {
    const move = gameInstance.move({ from, to });
    console.log('executeMoveSafely standard move success:', move);
    return move;
  } catch (e) {
    console.log('executeMoveSafely standard move failed, trying promotion:', e.message);
    try {
      const pMove = gameInstance.move({ from, to, promotion });
      console.log('executeMoveSafely promotion move success:', pMove);
      return pMove;
    } catch (e2) {
      console.log('executeMoveSafely promotion move failed:', e2.message);
      return null;
    }
  }
}

import { useLocation, useNavigate } from 'react-router-dom';

export default function GamePage({ session, profile, setProfile }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Game Mode State from Router
  const gameMode = location.state?.mode || 'offline';
  const computerRating = location.state?.rating || 1500;

  // Core Game State
  const game = useRef(new Chess());
  const [fen, setFen] = useState(game.current.fen());
  const [moveHistory, setMoveHistory] = useState([]);
  const [status, setStatus] = useState('Game in progress');
  const [isInCheck, setIsInCheck] = useState(false);
  
  // Highlight State
  const [optionSquares, setOptionSquares] = useState({});
  const [lastMoveSquares, setLastMoveSquares] = useState({});
  const [moveFrom, setMoveFrom] = useState('');
  const moveHistoryRef = useRef(null);

  // Voice & UI State
  const [lastHeard, setLastHeard] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false); // Default voice toggled off
  
  // Custom speak wrapper
  const handleSpeak = useCallback((text) => {
    if (voiceEnabled) {
      speak(text);
    }
  }, [voiceEnabled]);
  
  // Multiplayer State
  const [roomId, setRoomId] = useState('');
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [playerColor, setPlayerColor] = useState('w');
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [connectionMsg, setConnectionMsg] = useState('');
  const [opponentName, setOpponentName] = useState('Opponent');

  // Dashboard + Profile State
  const [gameResultSaved, setGameResultSaved] = useState(false); // prevent double-save

  // Stockfish Engine
  const { engineReady, bestMove, evaluatePosition, setRating, setBestMove } = useEngine();

  // Engine turn handling
  useEffect(() => {
    if (gameMode === 'computer') {
      setRating(computerRating);
    }
    if (gameMode === 'computer' && game.current.turn() !== playerColor && !game.current.isGameOver()) {
      evaluatePosition(game.current.fen(), 15);
    }
  }, [fen, gameMode, playerColor, computerRating, evaluatePosition, setRating]);

  // Execute computer move when bestMove is received
  useEffect(() => {
    if (gameMode === 'computer' && bestMove && game.current.turn() !== playerColor && !game.current.isGameOver()) {
      const from = bestMove.substring(0, 2);
      const to = bestMove.substring(2, 4);
      const promotion = bestMove.length > 4 ? bestMove[4] : 'q';
      
      const result = executeMoveSafely(game.current, from, to, promotion);
      if (result) {
        setFen(game.current.fen());
        setMoveHistory((history) => [...history, result]);
        setLastMoveSquares({
          [result.from]: { background: 'rgba(255, 255, 0, 0.4)' },
          [result.to]: { background: 'rgba(255, 255, 0, 0.4)' }
        });
        handleSpeak(`Computer plays: ${sanToSpeech(result)}`);
      }
      setBestMove(''); // Clear it so it doesn't fire again
    }
  }, [bestMove, gameMode, playerColor, setBestMove, handleSpeak]);

  // Update game status + check state
  const updateStatus = useCallback(() => {
    const inCheck = game.current.isCheck();
    setIsInCheck(inCheck);
    if (game.current.isCheckmate()) {
      const winnerColor = game.current.turn() === 'w' ? 'b' : 'w';
      let winnerName = winnerColor === 'w' ? 'White' : 'Black';
      if (gameMode === 'online') {
        winnerName = winnerColor === playerColor ? (profile?.username || 'You') : opponentName;
      } else if (gameMode === 'computer') {
        winnerName = winnerColor === playerColor ? (profile?.username || 'You') : `Computer (${computerRating})`;
      } else {
        winnerName = winnerColor === 'w' ? (profile?.username || 'White') : 'Black';
      }
      setStatus(`Checkmate! ${winnerName} wins.`);
    } else if (game.current.isDraw()) {
      setStatus('Draw!');
    } else if (inCheck) {
      setStatus('Check!');
    } else {
      setStatus(`${game.current.turn() === 'w' ? 'White' : 'Black'} to move`);
    }
  }, []);

  useEffect(() => {
    updateStatus();
  }, [fen, updateStatus]);

  // Detect game over and save result to Supabase
  useEffect(() => {
    if (!game.current.isGameOver() || gameResultSaved || !session?.user?.id || !gameMode) return;

    const isCheckmate = game.current.isCheckmate();
    const isDraw = game.current.isDraw();

    // In checkmate, the side whose TURN it is lost
    let result = 'draw';
    if (isCheckmate) {
      if (gameMode === 'online') {
        // Our color won if the OTHER side is in checkmate (it's their turn)
        result = game.current.turn() !== playerColor ? 'win' : 'loss';
      } else {
        // Offline: White wins if it's Black's turn and checkmate, etc.
        result = game.current.turn() === 'w' ? 'loss' : 'win'; // white made last move if black is in checkmate
      }
    }

    setGameResultSaved(true);
    saveGameResult({
      userId: session.user.id,
      opponentId: null,
      gameMode,
      result,
      playerColor: gameMode === 'online' ? playerColor : (game.current.turn() === 'w' ? 'b' : 'w'),
      totalMoves: moveHistory.length,
      currentRating: profile?.rating ?? 600,
      opponentRating: gameMode === 'computer' ? computerRating : 600,
    })
      .then(({ newRating, change }) => {
        setProfile((prev) => prev ? { ...prev, rating: newRating } : prev);
        const sign = change >= 0 ? '+' : '';
        handleSpeak(`Game over. ${result}. Rating changed by ${sign}${change}`);
      })
      .catch(console.error);
  }, [fen]);

  // Socket logic
  useEffect(() => {
    const handlePlayerJoined = () => {
      // Someone joined our room — both are now connected
      setOpponentConnected(true);
      handleSpeak('Opponent joined the room');
      socket.emit('share-username', { roomId, username: profile?.username || 'Player' });
    };

    const handlePlayerLeft = () => {
      setOpponentConnected(false);
      setOpponentName('Opponent');
      handleSpeak('Opponent has left the room');
    };

    // Server sends this back to the joiner: how many people are now in the room
    const handleRoomStatus = ({ count }) => {
      // If count >= 2 it means someone else was already there → both connected
      if (count >= 2) {
        setOpponentConnected(true);
        handleSpeak('Joined room. Opponent is already here!');
        socket.emit('share-username', { roomId, username: profile?.username || 'Player' });
      }
    };

    const handleOpponentUsername = (name) => {
      setOpponentName(name || 'Opponent');
    };

    const handleMoveMade = (moveData) => {
      // If we're receiving a move, the opponent is clearly connected
      setOpponentConnected(true);
      const result = executeMoveSafely(game.current, moveData.from, moveData.to, moveData.promotion);
      if (result) {
        setFen(game.current.fen());
        setMoveHistory((history) => [...history, result]);
        setLastMoveSquares({
          [result.from]: { background: 'rgba(255, 255, 0, 0.4)' },
          [result.to]: { background: 'rgba(255, 255, 0, 0.4)' }
        });
        handleSpeak(`Opponent plays: ${sanToSpeech(result)}`);
      }
    };

    const handleGameReset = () => {
      game.current.reset();
      setFen(game.current.fen());
      setMoveHistory([]);
      setOptionSquares({});
      setLastMoveSquares({});
      handleSpeak('Opponent reset the game');
    };

    socket.on('player-joined', handlePlayerJoined);
    socket.on('player-left', handlePlayerLeft);
    socket.on('room-status', handleRoomStatus);
    socket.on('opponent-username', handleOpponentUsername);
    socket.on('move-made', handleMoveMade);
    socket.on('game-reset', handleGameReset);

    return () => {
      socket.off('player-joined', handlePlayerJoined);
      socket.off('player-left', handlePlayerLeft);
      socket.off('room-status', handleRoomStatus);
      socket.off('opponent-username', handleOpponentUsername);
      socket.off('move-made', handleMoveMade);
      socket.off('game-reset', handleGameReset);
    };
  }, [roomId, profile]);

  const joinRoom = (color) => {
    if (!roomId.trim()) return;
    setPlayerColor(color);
    socket.connect();
    socket.emit('join-room', roomId);
    setIsMultiplayer(true);
    setOpponentConnected(false);
    handleSpeak(`Joined room as ${color === 'w' ? 'White' : 'Black'}`);
  };

  const leaveRoom = () => {
    if (roomId) socket.emit('leave-room', roomId);
    socket.disconnect();
    setIsMultiplayer(false);
    setOpponentConnected(false);
    setOpponentName('Opponent');
    setRoomId('');
    setConnectionMsg('');
  };

  const makeAMove = useCallback((from, to, promotion = 'q') => {
    console.log(`makeAMove called: from=${from}, to=${to}, promotion=${promotion}`);
    const result = executeMoveSafely(game.current, from, to, promotion);

    if (result) {
      console.log('Move successful, updating state...');
      setFen(game.current.fen());
      setMoveHistory((history) => [...history, result]);
      
      // Highlight last move
      setLastMoveSquares({
        [result.from]: { background: 'rgba(255, 255, 0, 0.4)' },
        [result.to]: { background: 'rgba(255, 255, 0, 0.4)' }
      });
      setOptionSquares({}); // Clear drag options
      setMoveFrom(''); // Clear click-to-move state

      const colorText = result.color === 'w' ? 'White' : 'Black';
      handleSpeak(`${colorText} plays: ${sanToSpeech(result)}`);
      
      if (isMultiplayer) {
        socket.emit('make-move', { roomId, move: { from, to, promotion } });
      }
      return result;
    }
    console.log('Move failed.');
    return null;
  }, [isMultiplayer, roomId, handleSpeak]);

  const handleVoiceCommand = useCallback((transcript) => {
    if (!voiceEnabled) return;
    
    setLastHeard(transcript);
    const parsed = parseVoiceCommand(transcript);
    
    if (!parsed) {
      handleSpeak("I couldn't understand that move.");
      return;
    }

    // Voice respects turn in multiplayer
    if (isMultiplayer && game.current.turn() !== playerColor) {
      handleSpeak("It is not your turn.");
      return;
    }

    const move = makeAMove(parsed.from, parsed.to, 'q');
    if (!move) {
      handleSpeak("Illegal move.");
    }
  }, [makeAMove, isMultiplayer, playerColor, voiceEnabled, handleSpeak]);

  const { isListening, isProcessing, startListening, stopListening, lastTranscript, error: voiceError } = useGroqVoice(handleVoiceCommand);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  // F  → toggle Voice ON/OFF
  // Space (hold) → push-to-talk (start recording on keydown, stop on keyup)
  useEffect(() => {
    const onKeyDown = (e) => {
      // Ignore when user is typing in an input / textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'KeyF' && !e.repeat) {
        setVoiceEnabled((v) => !v);
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault(); // prevent page scroll
        if (voiceEnabled && !isProcessing) {
          startListening();
        }
      }
    };

    const onKeyUp = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (voiceEnabled && isListening) {
          stopListening();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [voiceEnabled, isListening, isProcessing, startListening, stopListening]);


  function getMoveOptions(square) {
    // Restrict highlighting opponent's pieces in multiplayer
    if (isMultiplayer && game.current.turn() !== playerColor) return false;
    
    const moves = game.current.moves({ square, verbose: true });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares = {};
    moves.map((move) => {
      newSquares[move.to] = {
        background:
          game.current.get(move.to) && game.current.get(move.to).color !== game.current.get(square).color
            ? "radial-gradient(circle, rgba(0,0,0,.4) 85%, transparent 85%)" // Capture style
            : "radial-gradient(circle, rgba(0,0,0,.4) 20%, transparent 20%)", // Normal style
        borderRadius: "50%",
      };
    });
    newSquares[square] = { background: "rgba(255, 255, 0, 0.4)" };
    setOptionSquares(newSquares);
    return true;
  }

  function onPieceClick(source) {
    console.log('onPieceClick triggered with:', source);
    const square = typeof source === 'object' && source !== null ? source.square : source;
    if (!square) return;

    if (moveFrom === square) {
      setMoveFrom('');
      setOptionSquares({});
      return;
    }
    
    if (moveFrom) {
      console.log(`onPieceClick attempting capture from ${moveFrom} to ${square}`);
      const move = makeAMove(moveFrom, square, 'q');
      if (move) {
        setMoveFrom('');
        return;
      }
    }
    
    const hasOptions = getMoveOptions(square);
    if (hasOptions) setMoveFrom(square);
  }

  function onPieceDragBegin(source) {
    console.log('onPieceDragBegin triggered with:', source);
    const square = typeof source === 'object' && source !== null ? source.square : source;
    if (square) {
      setMoveFrom(square);
      getMoveOptions(square);
    }
  }

  function onSquareClick(source) {
    console.log('onSquareClick triggered with:', source);
    const square = typeof source === 'object' && source !== null ? source.square : source;
    if (!square) return;

    if (moveFrom) {
      console.log(`onSquareClick attempting move from ${moveFrom} to ${square}`);
      const move = makeAMove(moveFrom, square, 'q');
      if (!move) {
        setMoveFrom('');
        setOptionSquares({});
      }
    }
  }

  function onDrop(source, target) {
    console.log('onDrop triggered with source:', source, 'target:', target);
    let sourceSquare = source;
    let targetSquare = target;
    
    // Support react-chessboard v5 where an object is passed
    if (typeof source === 'object' && source !== null) {
      sourceSquare = source.sourceSquare;
      targetSquare = source.targetSquare;
      console.log('onDrop destructured object to:', sourceSquare, targetSquare);
    }

    if (!sourceSquare || !targetSquare) return false;

    if (isMultiplayer && game.current.turn() !== playerColor) {
      console.log('onDrop failed: Not your turn.');
      setOptionSquares({});
      return false; 
    }
    if (gameMode === 'computer' && game.current.turn() !== playerColor) {
      console.log('onDrop failed: Not your turn (computer is playing).');
      setOptionSquares({});
      return false;
    }
    const move = makeAMove(sourceSquare, targetSquare, 'q');
    if (move === null) {
      console.log('onDrop failed: Invalid move.');
      setOptionSquares({});
      return false;
    }
    console.log('onDrop succeeded!');
    return true;
  }

  const resetGame = () => {
    game.current.reset();
    setFen(game.current.fen());
    setMoveHistory([]);
    setOptionSquares({});
    setLastMoveSquares({});
    setGameResultSaved(false); // allow saving next game
    handleSpeak('Game reset.');
    if (isMultiplayer) {
      socket.emit('reset-game', roomId);
    }
  };

  const handleChangeMode = () => {
    if (isMultiplayer) {
      // Leave room if online
      socket.emit('leave-room', roomId);
    }
    navigate('/mode');
  };

  const currentTurn = game.current.turn();
  const isP1Turn = currentTurn === 'w';
  const isP2Turn = currentTurn === 'b';

  // Compute check highlight - highlight the king in check with red
  const checkSquareStyles = {};
  if (isInCheck) {
    // Find the king of the side that is in check (the side whose turn it is)
    const board = game.current.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === currentTurn) {
          const files = ['a','b','c','d','e','f','g','h'];
          const square = files[c] + (8 - r);
          checkSquareStyles[square] = { background: 'rgba(239, 68, 68, 0.7)' };
        }
      }
    }
  }

  // Reversed move history: newest on top
  const reversedHistory = [...moveHistory].reverse();

  // Determine Display Names
  const myName = profile?.username || session?.user?.email?.split('@')[0] || 'You';
  let oppName = 'Player 2';
  if (gameMode === 'computer') oppName = `Computer (${computerRating})`;
  else if (gameMode === 'online') oppName = opponentName;
  else if (gameMode === 'offline') oppName = 'Guest';

  let myColorLabel = '(White)';
  let oppColorLabel = '(Black)';
  if (isMultiplayer && playerColor === 'b') {
    myColorLabel = '(Black)';
    oppColorLabel = '(White)';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      
      {/* ── Game Area ── */}
      <div className="game-area" style={{ paddingTop: '1rem' }}>

        {/* Player 2 (Top Left) */}
        <div className="player-zone player-2-zone">
          <div className="player-name">{oppName}<br/><span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{oppColorLabel}</span></div>
          <div className="voice-circle" style={{ opacity: voiceEnabled ? 1 : 0.25 }}>
            <div className={`voice-dot ${voiceEnabled && isP2Turn && isListening ? 'active-red' : ''}`} />
          </div>
        </div>

        {/* Board – center (no banner above, just the board) */}
        <div className="board-center">
          <div className="board-wrapper" style={{ position: 'relative' }}>
            <Chessboard
              options={{
                id: 'VocalChessBoard',
                position: fen,
                onPieceDrop: onDrop,
                onPieceDrag: onPieceDragBegin,
                onPieceClick: onPieceClick,
                onSquareClick: onSquareClick,
                boardOrientation: isMultiplayer && playerColor === 'b' ? 'black' : 'white',
                squareStyles: {
                  ...lastMoveSquares,
                  ...checkSquareStyles,
                  ...optionSquares,
                },
                darkSquareStyle: { backgroundColor: '#779556' },
                lightSquareStyle: { backgroundColor: '#ebecd0' },
              }}
            />
            {game.current.isGameOver() && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(3px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 10,
                color: 'white',
                borderRadius: '4px'
              }}>
                <h2 style={{ 
                  fontSize: '2rem', 
                  marginBottom: '0.5rem', 
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  color: game.current.isDraw() ? '#f9e2af' : (status.includes('White wins') ? '#a6e3a1' : '#f38ba8')
                }}>
                  {game.current.isDraw() ? 'Draw!' : 'Game Over'}
                </h2>
                <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{status}</p>
                <button className="btn" onClick={resetGame} style={{ marginTop: '1.5rem', padding: '0.8rem 1.5rem' }}>
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Groq voice status bar */}
        {voiceEnabled && gameMode && (
          <div style={{
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            minHeight: 36,
          }}>
            {isListening ? (
              <>
                <span style={{
                  display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                  background: '#f38ba8', animation: 'pulse-red 1s infinite',
                }} />
                <span style={{ color: '#f38ba8', fontWeight: 600 }}>Recording... Release to send</span>
              </>
            ) : isProcessing ? (
              <>
                <span style={{
                  display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                  background: '#f9e2af',
                }} />
                <span style={{ color: '#f9e2af' }}>⏳ Recognising with Groq...</span>
              </>
            ) : lastTranscript ? (
              <>
                <span style={{ color: '#a6e3a1' }}>✓</span>
                <span>Heard: <strong style={{ color: 'white' }}>"{lastTranscript}"</strong></span>
              </>
            ) : (
              <span>Hold <strong style={{ color: 'white' }}>"Hold to Speak"</strong> or press <strong style={{ color: 'white' }}>Space</strong> — e.g. <em>"e2 to e4"</em></span>
            )}
            {voiceError && (
              <span style={{ color: '#f38ba8', marginLeft: 'auto' }}>⚠ {voiceError}</span>
            )}
          </div>
        )}

        {/* Player 1 (Bottom Right) */}
        <div className="player-zone player-1-zone">
          <div className="voice-circle" style={{ opacity: voiceEnabled ? 1 : 0.25 }}>
            <div className={`voice-dot ${voiceEnabled && isP1Turn && isListening ? 'active-blue' : ''}`} />
          </div>
          <div className="player-name">{myName}<br/><span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{myColorLabel}</span></div>
        </div>

        {/* Sidebar – controls + connection status + move history */}
        <div className="sidebar glass-panel">
          
          {/* ── Game Controls ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <button
              className={`btn ${voiceEnabled ? 'btn-voice-on' : 'btn-secondary'}`}
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title="Toggle Voice ON/OFF (keyboard: F)"
              style={{ padding: '0.6rem 0.5rem', fontSize: '0.75rem' }}
            >
              {voiceEnabled ? '🎙 Voice ON' : '🔇 Voice OFF'}
              <span style={{ fontSize: '0.65rem', opacity: 0.6, marginLeft: '0.2rem' }}>[F]</span>
            </button>

            {voiceEnabled && (
              <button
                className="btn"
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onTouchStart={startListening}
                onTouchEnd={stopListening}
                disabled={isProcessing}
                style={{
                  background: isListening ? 'rgba(239,68,68,0.85)' : isProcessing ? 'rgba(249,226,175,0.8)' : 'rgba(166,227,161,0.8)',
                  color: '#1e1e2e',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  padding: '0.6rem 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'background 0.2s',
                  boxShadow: isListening ? '0 0 12px rgba(239,68,68,0.6)' : 'none',
                }}
                title="Hold to speak your move, release to send (keyboard: hold Space)"
              >
                {isListening ? '⏺ Recording...' : isProcessing ? '⏳ Processing...' : (
                  <>
                    🎤 Hold Space
                  </>
                )}
              </button>
            )}

            <button className="btn btn-secondary" onClick={resetGame} style={{ padding: '0.5rem', fontSize: '0.75rem' }}><FaRedo /> Reset</button>
            <button className="btn btn-secondary" onClick={handleChangeMode} style={{ padding: '0.5rem', fontSize: '0.75rem' }}>Change Mode</button>
          </div>

          {/* Connection status dot (online mode only) */}
          {gameMode === 'online' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.4rem' }}>
              <span style={{
                display: 'inline-block',
                width: 10, height: 10,
                borderRadius: '50%',
                background: opponentConnected ? '#a6e3a1' : '#f38ba8',
                boxShadow: opponentConnected ? '0 0 6px #a6e3a1' : '0 0 6px #f38ba8',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: opponentConnected ? 'var(--success-color)' : 'var(--error-color)' }}>
                {opponentConnected ? 'Connected' : isMultiplayer ? 'Waiting...' : 'Disconnected'}
              </span>
            </div>
          )}

          {/* Room join / leave form — inside sidebar */}
          {gameMode === 'online' && (
            <div style={{ marginBottom: '0.6rem' }}>
              {!isMultiplayer ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && joinRoom('w')}
                    style={{ padding: '0.4rem', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '0.75rem', width: '100%' }}
                  />
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button className="btn" onClick={() => joinRoom('w')} style={{ flex: 1, fontSize: '0.7rem', padding: '0.35rem' }}>White</button>
                    <button className="btn btn-secondary" onClick={() => joinRoom('b')} style={{ flex: 1, fontSize: '0.7rem', padding: '0.35rem' }}>Black</button>
                  </div>
                </div>
              ) : !opponentConnected ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Room: <strong style={{ color: 'white' }}>{roomId}</strong></p>
                  <button className="btn btn-secondary" onClick={leaveRoom} style={{ fontSize: '0.7rem', padding: '0.35rem' }}>Leave Room</button>
                </div>
              ) : (
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Room: <strong style={{ color: 'white' }}>{roomId}</strong></p>
              )}
            </div>
          )}

          {/* Game status badge */}
          <span className={`status-badge ${isInCheck ? 'check' : (!game.current.isGameOver() ? 'active' : '')}`}>
            {status}
          </span>

          {/* Last heard */}
          {voiceEnabled && lastHeard && (
            <div style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.04)', borderRadius: '5px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              <strong>Heard:</strong> <em>{lastHeard}</em>
            </div>
          )}

          {/* Move history */}
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Move History</div>
          <div className="move-history-container">
            {moveHistory.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.78rem' }}>No moves yet.</p>
            ) : (
              <div ref={moveHistoryRef} className="move-history-list">
                {reversedHistory.map((m, i) => (
                  <div
                    key={i}
                    className={`move-item ${m.color === 'w' ? 'white' : 'black'} ${i === 0 ? 'latest' : ''}`}
                  >
                    <span style={{ opacity: 0.6, marginRight: '0.3rem' }}>#{moveHistory.length - i}</span>
                    <strong>{m.color === 'w' ? 'W' : 'B'}:</strong> {m.from}→{m.to}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}


