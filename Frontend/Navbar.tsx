import { Stethoscope, Volume2, VolumeX } from 'lucide-react';
import { useVoiceSettings } from '@/context/VoiceSettings';

export default function Navbar() {
  const { muted, toggleMuted } = useVoiceSettings();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-ink-200 bg-white/80 px-4 backdrop-blur-md lg:px-8">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/30">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold text-ink-900">Medical Billing AI</span>
          <span className="text-[10px] text-ink-500">Agentic AI Assistant</span>
        </div>
      </div>

      {/* CHANGED: removed the Notification bell and Profile/"Dr.
          Reddy" dropdown buttons — neither had an onClick handler
          wired up, so they looked interactive but did nothing.
          Only the two buttons that actually DO something (AI
          status badge, voice mute toggle) remain, with a slightly
          larger gap between them now that there's more breathing
          room. */}
      <div className="ml-auto flex items-center gap-3">
        {/* AI Status badge */}
        <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-600">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
          </span>
          AI Online
        </span>

        {/* Voice mute/unmute toggle — muting only stops NEW replies
            from auto-speaking. The Listen button on any individual
            message still works either way, so you can always
            manually hear a specific answer even while muted. */}
        <button
          onClick={toggleMuted}
          title={muted ? 'Unmute voice replies' : 'Mute voice replies'}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
            muted
              ? 'border-ink-200 bg-white text-ink-400 hover:bg-ink-50'
              : 'border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100'
          }`}
        >
          {muted ? <VolumeX className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </header>
  );
}