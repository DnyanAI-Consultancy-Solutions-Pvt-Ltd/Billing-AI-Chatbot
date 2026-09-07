import Navbar from '@/components/Navbar';
import Assistant from '@/pages/Assistant';
import { VoiceSettingsProvider } from '@/context/VoiceSettings';

export default function App() {
  return (
    <VoiceSettingsProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-ink-100">
        <Navbar />
        <main className="flex-1 overflow-hidden">
          <Assistant />
        </main>
      </div>
    </VoiceSettingsProvider>
  );
}