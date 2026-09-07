import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * VoiceSettings — a tiny global on/off switch for auto-speak.
 *
 * Navbar renders the mute/unmute button (next to the "AI Online"
 * badge); Assistant checks `muted` before automatically speaking a
 * new reply. They're siblings under App, not parent/child, so this
 * needs to live somewhere both can reach — a small context is the
 * simplest way to do that without prop-drilling through App.tsx.
 *
 * Muting only affects AUTO-speak. The manual Listen button on each
 * individual message still works even while muted — muting just
 * means new replies won't interrupt you on their own; you can still
 * choose to hear any specific one.
 */

interface VoiceSettingsValue {
  muted: boolean;
  toggleMuted: () => void;
}

const VoiceSettingsContext = createContext<VoiceSettingsValue | undefined>(undefined);

export function VoiceSettingsProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);

  const toggleMuted = () => setMuted((m) => !m);

  return (
    <VoiceSettingsContext.Provider value={{ muted, toggleMuted }}>
      {children}
    </VoiceSettingsContext.Provider>
  );
}

export function useVoiceSettings(): VoiceSettingsValue {
  const ctx = useContext(VoiceSettingsContext);
  if (!ctx) {
    throw new Error('useVoiceSettings must be used inside <VoiceSettingsProvider>');
  }
  return ctx;
}