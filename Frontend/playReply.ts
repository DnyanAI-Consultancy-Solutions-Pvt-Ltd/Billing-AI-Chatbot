const API_BASE = 'http://localhost:5000';

/**
 * fetchSpeechAudio — fetches TTS audio for a piece of text and
 * returns a ready-to-play HTMLAudioElement, without playing it yet.
 * Separated from playback so callers can keep a reference to the
 * Audio element and stop it mid-playback (see stopAudio below).
 */
export async function fetchSpeechAudio(
  text: string,
  language: string = 'en-IN'
): Promise<HTMLAudioElement | null> {
  try {
    const res = await fetch(`${API_BASE}/api/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });

    if (!res.ok) {
      console.error('[speak] Backend returned', res.status);
      return null;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    // Clean up the blob URL once playback finishes, however it ends
    // (naturally, or via stopAudio()).
    audio.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true });

    return audio;
  } catch (err) {
    console.error('[speak] Fetch failed:', err);
    return null;
  }
}

/**
 * playReply — convenience wrapper: fetch + play in one call, resolves
 * once playback actually finishes (or fails). Returns the Audio
 * element so the caller can stop it early if needed.
 */
export async function playReply(
  text: string,
  language: string = 'en-IN'
): Promise<HTMLAudioElement | null> {
  const audio = await fetchSpeechAudio(text, language);
  if (!audio) return null;

  try {
    await audio.play();
  } catch (err) {
    console.error('[speak] Playback failed:', err);
  }

  return audio;
}

/**
 * stopAudio — interrupts playback immediately. Safe to call even if
 * nothing is playing (e.g. audio is null, or already finished).
 */
export function stopAudio(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}