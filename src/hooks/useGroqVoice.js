import { useState, useRef, useCallback, useEffect } from 'react';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_TRANSCRIPTION_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

/**
 * useGroqVoice — Push-to-talk: call startListening() to begin recording,
 * stopListening() to stop and send to Groq Whisper for transcription.
 */
export function useGroqVoice(onCommandParsed) {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const callbackRef = useRef(onCommandParsed);

  useEffect(() => { callbackRef.current = onCommandParsed; }, [onCommandParsed]);

  const transcribeAudio = useCallback(async (audioBlob) => {
    if (!GROQ_API_KEY) {
      setError('Groq API key not set.');
      return;
    }
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'en');
      formData.append(
        'prompt',
        'Chess move. Files: a b c d e f g h. Ranks: 1 2 3 4 5 6 7 8. Examples: e2 to e4, knight g1 to f3, bishop f1 takes c4, castle kingside.'
      );
      formData.append('response_format', 'json');

      const response = await fetch(GROQ_TRANSCRIPTION_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: formData,
      });

      if (!response.ok) throw new Error(`Groq API error ${response.status}: ${await response.text()}`);

      const data = await response.json();
      const transcript = data.text?.trim() || '';
      console.log('[Groq] Transcript:', transcript);
      setLastTranscript(transcript);
      if (callbackRef.current) callbackRef.current(transcript);
    } catch (err) {
      console.error('[Groq] Transcription failed:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isListening || isProcessing) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (blob.size > 3000) await transcribeAudio(blob);
      };

      recorder.start();
      setIsListening(true);
    } catch (err) {
      setError('Microphone access denied.');
      setIsListening(false);
    }
  }, [isListening, isProcessing, transcribeAudio]);

  const stopListening = useCallback(() => {
    if (!isListening || !mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, [isListening]);

  useEffect(() => () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return { isListening, isProcessing, startListening, stopListening, lastTranscript, error };
}
