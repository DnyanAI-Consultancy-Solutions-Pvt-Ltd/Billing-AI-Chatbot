import type { ResponseCard } from './types';

/**
 * sendMessage — the single integration point.
 *
 * Calls the real Python Agentic AI backend (Flask app.py, wrapping
 * orchestrator()).
 *
 * CHANGED: the backend now sends both `reply` (the same
 * pre-formatted text string as always) and `card` (a structured
 * object matching ResponseCard, or null). When `card` is present,
 * it's used directly — this is what lights up the real
 * patient/bill/inventory/dashboard/sale cards in
 * ResponseCardView.tsx instead of always falling back to the
 * plain monospace `kind: 'text'` box. When `card` is null (some
 * reply types haven't been upgraded on the backend yet, or an
 * error occurred), this falls back to the old text-only behavior
 * exactly as before — nothing breaks for reply types that aren't
 * converted.
 *
 * `language`: optional. Pass the language code detected during
 * voice transcription to get the reply back translated into that
 * language. Omit for typed messages — they come back exactly as
 * the backend generated them (English).
 */

export const API_BASE = 'http://localhost:5000';

export async function sendMessage(
  message: string,
  language?: string
): Promise<ResponseCard & { language?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language }),
    });

    if (!res.ok) {
      throw new Error(`Backend returned ${res.status}`);
    }

    const data: { reply: string; card?: ResponseCard | null; language?: string } = await res.json();

    if (data.card) {
      // CHANGED: previously overwrote card.message with the full
      // backend text — but several card components (InventoryCard,
      // PatientRegistered, etc.) already use .message for their own
      // short success/confirmation banner, so the raw formatted
      // text ended up rendering INSIDE the card as an ugly text
      // dump. fullText is a separate field, untouched by any card
      // component's own rendering, used only by Copy/Listen.
      return { ...data.card, fullText: data.reply, language: data.language };
    }

    return {
      kind: 'text',
      title: 'AI Assistant',
      message: data.reply,
      language: data.language,
    };
  } catch (err) {
    return {
      kind: 'error',
      title: 'Request Failed',
      message:
        'Could not reach the AI backend. Make sure app.py is running ' +
        '(python app.py) on http://localhost:5000.',
    };
  }
}

/**
 * cleanTextForSpeech — strips the box-drawing decoration
 * (====, ----, ║/╔ borders) and emoji out of the backend's
 * formatted reply text before it's sent to TTS. The raw text reads
 * fine visually in the chat and is fine for Copy as-is — but a
 * voice engine reading "equals equals equals patient details
 * equals equals equals" aloud is a bad listening experience. Only
 * used for the /api/speak path; the original text (Copy, on-screen
 * display) is never touched by this.
 */
function cleanTextForSpeech(text: string): string {
  return text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      // Drop empty lines and lines that are purely decorative
      // border characters (=, -, box-drawing glyphs) with nothing
      // else on them.
      return trimmed !== '' && !/^[=\-─━│┃╔╗╚╝║╠╣╦╩╬]+$/.test(trimmed);
    })
    // Join remaining lines with ". " so TTS gets natural pauses
    // between what were separate lines, instead of one run-on
    // sentence.
    .join('. ')
    // Strip common emoji used throughout the backend's formatting
    // (🆔 👤 🎂 ⚧ 👨‍⚕ 🧾 💰 📅 💊 📈 🏆 ⚠️ ✅ ❌ 🟢 🤖 📊 📄 🧪 💳 ❤️ 🎉 etc.)
    // — best-effort via Unicode emoji ranges, not an exhaustive list.
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * speak — sends text to POST /api/speak (Sarvam TTS, app.py),
 * starts playback, and returns the HTMLAudioElement so the caller
 * can stop it early (audio.pause()) or listen for 'ended' itself.
 *
 * `language` should be a BCP-47 code like "hi-IN"/"mr-IN"/"en-IN"
 * — the same shape useVoice.ts's VoiceResult.language returns.
 * Omit it (or pass an unsupported code) and the backend falls back
 * to English audio rather than erroring.
 *
 * Returns null if the request failed (network error, missing API
 * key server-side, etc.) — the caller already gets a console error
 * either way, so it just needs to check for null and give up.
 */
export async function speak(text: string, language?: string): Promise<HTMLAudioElement | null> {
  try {
    const res = await fetch(`${API_BASE}/api/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanTextForSpeech(text), language }),
    });

    if (!res.ok) {
      console.error('[speak] Backend returned', res.status);
      return null;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    // Release the object URL once playback actually finishes.
    // Doesn't fire if playback is stopped early (paused before the
    // end) — the caller stopping playback is responsible for
    // revoking it too in that case (see stopSpeaking() in
    // Assistant.tsx), since pausing never fires 'ended'.
    audio.addEventListener('ended', () => URL.revokeObjectURL(url));

    await audio.play();
    return audio;
  } catch (err) {
    console.error('[speak] Failed:', err);
    return null;
  }
}

/**
 * uploadDocument — sends a PDF file to POST /api/upload-document
 * for text extraction, so it can be asked about in chat afterward
 * (see the DOCUMENT_QA intent in orchestrator.py).
 *
 * Returns the parsed JSON response on success ({filename, pages,
 * truncated, preview}), or throws with the backend's error message
 * on failure (e.g. non-PDF file, scanned image with no text) — the
 * caller should catch this and show it as a chat error message.
 */
export interface UploadResult {
  filename: string;
  pages: number;
  truncated: boolean;
  preview: string;
}

export async function uploadDocument(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/upload-document`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }

  return data as UploadResult;
}