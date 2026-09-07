import { motion } from 'framer-motion';
import { Users, Receipt, Pill, BarChart3, Database, Zap } from 'lucide-react';

const features = [
  { icon: Users, title: 'Patient Management', desc: 'Register, update, and manage patient records', color: 'bg-primary-50 text-primary-600' },
  { icon: Receipt, title: 'Billing', desc: 'Generate invoices with GST and payment status', color: 'bg-accent-50 text-accent-600' },
  { icon: Pill, title: 'Inventory', desc: 'Track medicine stock and low-stock alerts', color: 'bg-success-50 text-success-600' },
  { icon: BarChart3, title: 'Reports', desc: 'View analytics and performance summaries', color: 'bg-warning-50 text-warning-600' },
  { icon: Database, title: 'SQL Analytics', desc: 'Run natural-language SQL queries', color: 'bg-primary-50 text-primary-600' },
  { icon: Zap, title: 'Agentic AI Powered', desc: 'Multi-agent orchestration for every task', color: 'bg-accent-50 text-accent-600' },
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {features.map((f, i) => {
        const Icon = f.icon;
        return (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="group rounded-2xl border border-ink-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${f.color} transition-transform group-hover:scale-110`}>
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-ink-900">{f.title}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-500">{f.desc}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
