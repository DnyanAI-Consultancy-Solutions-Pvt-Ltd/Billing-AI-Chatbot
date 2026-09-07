import { useState, useRef, useCallback } from 'react';

/**
 * useVoice — records microphone audio and sends it to the backend
 * for transcription.
 *
 * Talks to POST /api/transcribe (app.py, Sarvam Saaras v3 — see
 * that route for details). That endpoint expects the audio as
 * multipart/form-data under the field name "audio", and returns
 * either { text, language } or { error }.
 *
 * Note: Sarvam's endpoint currently returns "language": "auto" —
 * not a real detected language code like Whisper's "hi"/"mr"/"en".
 * This hook still returns whatever `language` comes back, in case
 * you wire up reply-translation later, but treat it as informational
 * only, not a real BCP-47 code.
 */

const API_BASE = 'http://localhost:5000';

export interface VoiceResult {
  text: string;
  language?: string;
}

export function useVoice() {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      // Most common cause: the user denied microphone permission,
      // or the browser/site isn't running on https/localhost (the
      // Mic API is blocked on plain http origins other than
      // localhost). Fail quietly into "not recording" rather than
      // throwing — the mic button just won't do anything, which is
      // safer than a crash.
      console.error('[useVoice] Could not start recording:', err);
      setRecording(false);
    }
  }, []);

  const stopRecording = useCallback((): Promise<VoiceResult | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = async () => {
        setRecording(false);
        setTranscribing(true);

        // Release the mic indicator in the browser tab/OS as soon
        // as recording stops, not only when transcription finishes.
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const res = await fetch(`${API_BASE}/api/transcribe`, {
            method: 'POST',
            body: formData,
          });

          const data: { text?: string; language?: string; error?: string } = await res.json();

          if (!res.ok || data.error || !data.text) {
            console.error('[useVoice] Transcription failed:', data.error || res.statusText);
            resolve(null);
            return;
          }

          resolve({ text: data.text, language: data.language });
        } catch (err) {
          console.error('[useVoice] Transcription request failed:', err);
          resolve(null);
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.stop();
    });
  }, []);

  return { recording, transcribing, startRecording, stopRecording };
}