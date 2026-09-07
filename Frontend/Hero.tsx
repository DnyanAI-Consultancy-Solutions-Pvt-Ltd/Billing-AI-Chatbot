import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export default function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-ink-200 bg-gradient-to-br from-primary-600 via-primary-600 to-accent-600 px-6 py-8 lg:px-10 lg:py-10"
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-accent-400/20 blur-2xl" />

      <div className="relative flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white lg:text-2xl">Medical Billing AI Assistant</h1>
            <p className="mt-1 text-sm text-primary-100 lg:text-base">
              Manage Patients, Billing, Inventory and Reports using Natural Language.
            </p>
          </div>
        </div>

        <span className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-300 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success-300" />
          </span>
          AI Online
        </span>
      </div>
    </motion.div>
  );
}
