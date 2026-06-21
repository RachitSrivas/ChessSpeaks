import { useState, useEffect, useRef, useCallback } from 'react';
import { parseVoiceCommand } from '../utils/parser';

export function useSpeechRecognition(onCommandParsed) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const callbackRef = useRef(onCommandParsed);
  useEffect(() => {
    callbackRef.current = onCommandParsed;
  }, [onCommandParsed]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // Ask the browser for up to 5 alternative transcriptions.
    // We'll try each one until we find one that parses as a valid chess command.
    recognition.maxAlternatives = 5;

    // Grammar hints bias the recognizer toward chess vocabulary
    if ('SpeechGrammarList' in window || 'webkitSpeechGrammarList' in window) {
      const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
      const grammar = '#JSGF V1.0; grammar chess; public <file> = a | b | c | d | e | f | g | h; ' +
        'public <rank> = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; ' +
        'public <square> = <file> <rank>; ' +
        'public <move> = [pawn|knight|bishop|rook|queen|king] <square> [to|takes] <square>;';
      const grammarList = new SpeechGrammarList();
      grammarList.addFromString(grammar, 1);
      recognition.grammars = grammarList;
    }

    recognition.onresult = (event) => {
      // Try each alternative transcript in confidence order
      const alternatives = Array.from(event.results[0]);
      console.log('[Voice] Alternatives:', alternatives.map(a => `"${a.transcript}" (${(a.confidence * 100).toFixed(0)}%)`));

      let parsed = null;
      let usedTranscript = '';
      for (const alt of alternatives) {
        const result = parseVoiceCommand(alt.transcript);
        if (result) {
          parsed = result;
          usedTranscript = alt.transcript;
          break;
        }
      }

      if (parsed && callbackRef.current) {
        console.log('[Voice] Parsed from:', `"${usedTranscript}"`, '→', parsed);
        // Pass the raw transcript along too for the callback
        callbackRef.current(usedTranscript);
      } else {
        console.log('[Voice] No valid chess move found in any alternative.');
        // Still call with the best transcript so the app can show feedback
        if (callbackRef.current) callbackRef.current(alternatives[0]?.transcript || '');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('Speech recognition error:', event.error);
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.warn('Could not start recognition:', e);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (e) {}
  }, [isListening]);

  return { isListening, startListening, stopListening };
}
