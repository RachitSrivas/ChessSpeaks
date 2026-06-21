import { useState, useEffect, useRef, useCallback } from 'react';

export function useEngine() {
  const workerRef = useRef(null);
  const [engineReady, setEngineReady] = useState(false);
  const [bestMove, setBestMove] = useState('');

  useEffect(() => {
    // Initialize Web Worker
    workerRef.current = new Worker('/stockfish-18-lite-single.js');

    workerRef.current.onmessage = (e) => {
      const line = e.data;
      if (line === 'uciok') {
        setEngineReady(true);
      } else if (line.startsWith('bestmove')) {
        const move = line.split(' ')[1];
        setBestMove(move);
      }
    };

    workerRef.current.postMessage('uci');

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const sendCommand = useCallback((cmd) => {
    if (workerRef.current) {
      workerRef.current.postMessage(cmd);
    }
  }, []);

  const evaluatePosition = useCallback((fen, depth = 15) => {
    sendCommand(`position fen ${fen}`);
    sendCommand(`go depth ${depth}`);
  }, [sendCommand]);

  const setRating = useCallback((rating) => {
    // Stockfish uses Skill Level from 0 to 20 for limiting strength
    // Let's map user rating (approx 600 - 3600) to Skill Level (0 - 20)
    // Skill Level 0 is ~1000 ELO
    // Skill Level 20 is max (~3600)
    
    // So 600-1000 = Skill Level 0
    // > 1000 = map up to 20
    const boundedRating = Math.max(600, Math.min(3600, rating));
    let skillLevel = 0;
    if (boundedRating > 1000) {
      skillLevel = Math.round(((boundedRating - 1000) / (3600 - 1000)) * 20);
    }
    
    sendCommand('setoption name UCI_LimitStrength value true');
    sendCommand(`setoption name UCI_Elo value ${boundedRating}`); // Newer stockfish supports UCI_Elo
    sendCommand(`setoption name Skill Level value ${skillLevel}`); // Fallback/alternative
  }, [sendCommand]);

  return { engineReady, bestMove, evaluatePosition, sendCommand, setRating, setBestMove };
}
