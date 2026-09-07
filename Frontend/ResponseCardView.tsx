import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  UserPlus,
  Receipt,
  LayoutDashboard,
  Pill,
  BarChart3,
  AlertTriangle,
  Trash2,
  UserCog,
  Database,
  Users,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingCart,
  Search,
  Download,
  Copy,
  Check,
  Crown,
  FileText,
  GitCompare,
} from 'lucide-react';
import type { ResponseCard } from '@/lib/types';
import { API_BASE } from '@/lib/api';

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  'In Stock': { bg: 'bg-success-50', text: 'text-success-600', label: 'In Stock' },
  'Low Stock': { bg: 'bg-warning-50', text: 'text-warning-600', label: 'Low Stock' },
  'Out of Stock': { bg: 'bg-error-50', text: 'text-error-600', label: 'Out of Stock' },
  'Unknown': { bg: 'bg-ink-100', text: 'text-ink-500', label: 'Unknown' },
};

const patientStatusStyles: Record<string, string> = {
  Active: 'bg-success-100 text-success-600',
  Discharged: 'bg-ink-100 text-ink-600',
  Waiting: 'bg-warning-100 text-warning-600',
  Consulting: 'bg-primary-100 text-primary-700',
};

const paymentStyles: Record<string, string> = {
  Paid: 'bg-success-100 text-success-600',
  Pending: 'bg-warning-100 text-warning-600',
  Overdue: 'bg-error-100 text-error-600',
};

export default function ResponseCardView(props: { card: ResponseCard }) {
  const card = props.card;
  return (
    <div className="space-y-2">
      <CardBody card={card} />
      {card.downloadUrl ? (
        <a
          href={API_BASE + card.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-100"
        >
          <Download className="h-4 w-4" />
          {card.downloadLabel || 'Download as PDF'}
        </a>
      ) : null}
    </div>
  );
}

function CardBody(props: { card: ResponseCard }) {
  const card = props.card;
  switch (card.kind) {
    case 'patient_registered':
      return <PatientRegistered card={card} />;
    case 'patient_deleted':
      return <AlertCard card={card} variant="warning" icon={Trash2} />;
    case 'patient_updated':
      return <PatientUpdated card={card} />;
    case 'bill_generated':
      return <BillCard card={card} />;
    case 'dashboard':
      return <DashboardCard card={card} />;
    case 'inventory':
      return <InventoryCard card={card} />;
    case 'sale':
      return <SaleCard card={card} />;
    case 'report':
      return <ReportCard card={card} />;
    case 'sql_result':
      return <TableCard card={card} />;
    case 'patient_list':
      return <PatientListCard card={card} />;
    case 'patient_history':
      return <PatientHistoryCard card={card} />;
    case 'document':
      return <DocumentCard card={card} />;
    case 'comparison':
      return <ComparisonCard card={card} />;
    case 'documents_uploaded':
      return <DocumentsUploadedCard card={card} />;
    case 'error':
      return <AlertCard card={card} variant="error" icon={AlertTriangle} />;
    default:
      return (
        <div className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-ink-50 px-4 py-3 font-mono text-xs leading-relaxed text-ink-700">
          {card.message}
        </div>
      );
  }
}

function CardShell(props: { icon: typeof CheckCircle2; accent: string; title: string; children: React.ReactNode }) {
  const Icon = props.icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm"
    >
      <div className={props.accent + ' flex items-center gap-2.5 px-5 py-3'}>
        <Icon className="h-[18px] w-[18px]" />
        <span className="text-sm font-semibold">{props.title}</span>
      </div>
      <div className="p-5">{props.children}</div>
    </motion.div>
  );
}

function PatientRegistered(props: { card: ResponseCard }) {
  const card = props.card;
  const p = card.patient!;
  return (
    <CardShell icon={UserPlus} accent="bg-success-50 text-success-700" title={card.title}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-base font-bold text-primary-700">
          {p.name.split(' ').map(function (n) { return n[0]; }).join('')}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink-900">{p.name}</p>
            <span className="rounded-full bg-success-100 px-2 py-0.5 text-[10px] font-semibold text-success-600">Registered</span>
            <span className={patientStatusStyles[p.status] + ' rounded-full px-2 py-0.5 text-[10px] font-semibold'}>{p.status}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <Info label="Patient ID" value={'#' + p.id} />
            <Info label="Age" value={p.age + ' years'} />
            <Info label="Gender" value={p.gender} />
            <Info label="Phone" value={p.phone} />
            <Info label="Doctor" value={p.doctor} />
          </div>
          {card.message ? <p className="mt-3 text-xs text-ink-500">{card.message}</p> : null}
        </div>
      </div>
    </CardShell>
  );
}

function PatientUpdated(props: { card: ResponseCard }) {
  const card = props.card;
  const p = card.patient!;
  return (
    <CardShell icon={UserCog} accent="bg-primary-50 text-primary-700" title={card.title}>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
        <Info label="Name" value={p.name} />
        <Info label="Patient ID" value={'#' + p.id} />
        <Info label="Age" value={p.age + ' years'} />
        <Info label="Gender" value={p.gender} />
        <Info label="Phone" value={p.phone} />
        <Info label="Doctor" value={p.doctor} />
        <Info label="Status" value={p.status} />
        <Info label="Last Visit" value={p.lastVisit} />
      </div>
      {card.message ? <p className="mt-3 text-xs text-ink-500">{card.message}</p> : null}
    </CardShell>
  );
}

function BillCard(props: { card: ResponseCard }) {
  const card = props.card;
  const b = card.bill!;
  const rupee = String.fromCharCode(8377);
  return (
    <CardShell icon={Receipt} accent="bg-primary-50 text-primary-700" title={card.title}>
      <div className="flex items-center justify-between border-b border-dashed border-ink-200 pb-3">
        <div>
          <p className="text-xs text-ink-400">Invoice No.</p>
          <p className="font-bold text-primary-700">{b.billNo}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-400">Date</p>
          <p className="text-sm font-semibold text-ink-700">{b.date}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
          {b.patient.split(' ').map(function (n) { return n[0]; }).join('')}
        </div>
        <div>
          <p className="text-xs text-ink-400">Billed To</p>
          <p className="text-sm font-semibold text-ink-900">{b.patient}</p>
        </div>
        <span className={paymentStyles[b.paymentStatus] + ' ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold'}>
          {b.paymentStatus}
        </span>
      </div>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-left text-[11px] text-ink-400">
            <th className="pb-2 font-semibold">Item</th>
            <th className="pb-2 text-center font-semibold">Qty</th>
            <th className="pb-2 text-right font-semibold">Price</th>
            <th className="pb-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {b.items.map(function (it) {
            return (
              <tr key={it.name} className="border-b border-ink-50">
                <td className="py-2 text-ink-700">{it.name}</td>
                <td className="py-2 text-center text-ink-500">{it.qty}</td>
                <td className="py-2 text-right text-ink-500">{rupee + it.price}</td>
                <td className="py-2 text-right font-semibold text-ink-800">{rupee + (it.qty * it.price).toLocaleString('en-IN')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-3 space-y-1.5 text-sm">
        <Row label="Subtotal" value={rupee + b.subtotal.toLocaleString('en-IN')} />
        <Row label="GST (5%)" value={rupee + b.gst.toLocaleString('en-IN')} />
        <div className="flex items-center justify-between border-t border-ink-200 pt-2">
          <span className="font-bold text-ink-900">Total</span>
          <span className="text-lg font-bold text-primary-700">{rupee + b.total.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </CardShell>
  );
}

function DashboardCard(props: { card: ResponseCard }) {
  const card = props.card;
  const d = card.dashboard!;
  const iconMap: Record<string, typeof Users> = { patients: Users, revenue: IndianRupee, bills: Receipt, inventory: Pill };
  const colorMap: Record<string, string> = {
    patients: 'bg-primary-50 text-primary-600',
    revenue: 'bg-accent-50 text-accent-600',
    bills: 'bg-success-50 text-success-600',
    inventory: 'bg-warning-50 text-warning-600',
  };
  const dot = String.fromCharCode(183);
  return (
    <CardShell icon={LayoutDashboard} accent="bg-primary-50 text-primary-700" title={card.title}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {d.metrics.map(function (m) {
          const Icon = iconMap[m.icon];
          return (
            <div key={m.label} className="rounded-xl border border-ink-100 bg-ink-50 p-3.5">
              <div className={colorMap[m.icon] + ' flex h-9 w-9 items-center justify-center rounded-lg'}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-2.5 text-xl font-bold text-ink-900">{m.value}</p>
              <p className="text-[11px] text-ink-500">{m.label}</p>
              <span className={(m.trend === 'up' ? 'text-success-600' : 'text-error-600') + ' mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold'}>
                {m.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {m.delta}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl border border-accent-100 bg-gradient-to-r from-accent-50 to-primary-50 p-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
          <Crown className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] text-ink-500">Top Selling Medicine</p>
          <p className="text-sm font-bold text-ink-900">{d.topSellingMedicine.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-ink-900">{d.topSellingMedicine.units} <span className="text-xs font-normal text-ink-400">units</span></p>
          <p className="text-[11px] text-ink-500">{d.topSellingMedicine.revenue}</p>
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-2 text-[11px] font-semibold text-ink-500">Medicine Sales</p>
        <div className="space-y-2">
          {d.medicineSales.map(function (m) {
            return (
              <div key={m.name}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-ink-700">{m.name}</span>
                  <span className="text-ink-500">{m.units + ' units ' + dot + ' ' + m.revenue}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: m.share + '%' }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CardShell>
  );
}

function InventoryCard(props: { card: ResponseCard }) {
  const card = props.card;
  const dot = String.fromCharCode(183);
  const rupee = String.fromCharCode(8377);
  return (
    <CardShell icon={Pill} accent="bg-accent-50 text-accent-700" title={card.title}>
      {card.message ? (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-xs font-semibold text-success-700">
          <CheckCircle2 className="h-4 w-4" /> {card.message}
        </div>
      ) : null}
      <div className="space-y-2">
        {card.inventory!.map(function (it) {
          const s = statusStyles[it.status];
          return (
            <div key={it.name} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Pill className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">{it.name}</p>
                <p className="text-[11px] text-ink-500">{it.category + ' ' + dot + ' ' + rupee + it.price + '/unit'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-ink-900">{it.stock}</p>
                <span className={s.bg + ' ' + s.text + ' inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold'}>{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

function SaleCard(props: { card: ResponseCard }) {
  const card = props.card;
  const s = card.sale!;
  const cross = String.fromCharCode(215);
  return (
    <CardShell icon={ShoppingCart} accent="bg-success-50 text-success-700" title={card.title}>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-100 text-success-600">
          <ShoppingCart className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-ink-900">{s.qty + ' ' + cross + ' ' + s.medicine}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <Info label="Total" value={s.total} />
            <Info label="Remaining Stock" value={s.remainingStock + ' units'} />
          </div>
        </div>
      </div>
      {card.message ? <p className="mt-3 text-xs text-ink-500">{card.message}</p> : null}
    </CardShell>
  );
}

function ReportCard(props: { card: ResponseCard }) {
  const card = props.card;
  const r = card.report!;
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const filtered = r.rows.filter(function (row) { return row.metric.toLowerCase().includes(query.toLowerCase()); });

  function exportCsv() {
    const csv = ['Metric,Value,Change']
      .concat(r.rows.map(function (row) { return row.metric + ',' + row.value + ',' + row.change; }))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyTable() {
    navigator.clipboard.writeText(r.rows.map(function (row) { return row.metric + '\t' + row.value + '\t' + row.change; }).join('\n'));
    setCopied(true);
    setTimeout(function () { setCopied(false); }, 2000);
  }

  return (
    <CardShell icon={BarChart3} accent="bg-primary-50 text-primary-700" title={card.title}>
      <p className="mb-3 rounded-lg bg-ink-900 px-3 py-2 font-mono text-[11px] text-ink-100">{r.title}</p>

      <div className="mb-3 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-ink-400" />
          <input
            value={query}
            onChange={function (e) { setQuery(e.target.value); }}
            placeholder="Search..."
            className="w-full bg-transparent text-xs text-ink-700 placeholder:text-ink-400 focus:outline-none"
          />
        </div>
        <button onClick={copyTable} className="flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50">
          {copied ? <Check className="h-3.5 w-3.5 text-success-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={exportCsv} className="flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-left text-[11px] text-ink-400">
            <th className="pb-2 font-semibold">Metric</th>
            <th className="pb-2 font-semibold">Value</th>
            <th className="pb-2 text-right font-semibold">Change</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(function (row, i) {
            return (
              <tr key={i} className="border-b border-ink-50">
                <td className="py-2 text-ink-700">{row.metric}</td>
                <td className="py-2 font-semibold text-ink-900">{row.value}</td>
                <td className="py-2 text-right text-ink-500">{row.change}</td>
              </tr>
            );
          })}
          {filtered.length === 0 ? (
            <tr><td colSpan={3} className="py-4 text-center text-xs text-ink-400">No matching rows</td></tr>
          ) : null}
        </tbody>
      </table>
    </CardShell>
  );
}

function TableCard(props: { card: ResponseCard }) {
  const card = props.card;
  const t = card.table!;
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const dash = String.fromCharCode(8212);

  const lowerQuery = query.toLowerCase();
  const filtered = t.rows.filter(function (row) {
    return query === '' || row.some(function (cell) { return String(cell === null || cell === undefined ? '' : cell).toLowerCase().includes(lowerQuery); });
  });

  function formatCell(cell: string | number | null) {
    return (cell === null || cell === '') ? dash : String(cell);
  }

  function exportCsv() {
    function escapeCsv(v: string) {
      return (v.includes(',') || v.includes('"')) ? ('"' + v.replace(/"/g, '""') + '"') : v;
    }
    const csv = [t.columns.map(escapeCsv).join(',')]
      .concat(t.rows.map(function (row) { return row.map(function (cell) { return escapeCsv(formatCell(cell)); }).join(','); }))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'result.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyTable() {
    const text = [t.columns.join('\t')]
      .concat(t.rows.map(function (row) { return row.map(formatCell).join('\t'); }))
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(function () { setCopied(false); }, 2000);
  }

  function isNumericColumn(colIndex: number) {
    return t.rows.length > 0 && t.rows.every(function (row) { return row[colIndex] === null || typeof row[colIndex] === 'number'; });
  }

  return (
    <CardShell icon={Database} accent="bg-accent-50 text-accent-700" title={card.title}>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-ink-400" />
          <input
            value={query}
            onChange={function (e) { setQuery(e.target.value); }}
            placeholder="Search..."
            className="w-full bg-transparent text-xs text-ink-700 placeholder:text-ink-400 focus:outline-none"
          />
        </div>
        <button onClick={copyTable} className="flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50">
          {copied ? <Check className="h-3.5 w-3.5 text-success-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={exportCsv} className="flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-[11px] text-ink-400">
              {t.columns.map(function (col, i) {
                return (
                  <th key={col + i} className={'whitespace-nowrap pb-2 pr-4 font-semibold' + (isNumericColumn(i) ? ' text-right' : '')}>
                    {col}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map(function (row, i) {
              return (
                <tr key={i} className="border-b border-ink-50">
                  {row.map(function (cell, j) {
                    return (
                      <td
                        key={j}
                        className={
                          'whitespace-nowrap py-2 pr-4 ' +
                          (j === 0 ? 'font-semibold text-ink-900' : 'text-ink-700') +
                          (isNumericColumn(j) ? ' text-right' : '')
                        }
                      >
                        {formatCell(cell)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr><td colSpan={t.columns.length} className="py-4 text-center text-xs text-ink-400">No matching rows</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-ink-400">{t.rows.length + ' record' + (t.rows.length === 1 ? '' : 's')}</p>
    </CardShell>
  );
}

function PatientListCard(props: { card: ResponseCard }) {
  const card = props.card;
  const dot = String.fromCharCode(183);
  return (
    <CardShell icon={Users} accent="bg-primary-50 text-primary-700" title={card.title}>
      <div className="space-y-2">
        {card.patients!.map(function (p) {
          return (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                {p.name.split(' ').map(function (n) { return n[0]; }).join('')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">{p.name}</p>
                <p className="text-[11px] text-ink-500">{p.age + 'y ' + dot + ' ' + p.gender + ' ' + dot + ' ' + p.phone}</p>
                <p className="text-[11px] text-ink-400">{p.doctor + ' ' + dot + ' ' + p.lastVisit}</p>
              </div>
              <span className={patientStatusStyles[p.status] + ' rounded-full px-2 py-0.5 text-[10px] font-semibold'}>{p.status}</span>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

function DocumentCard(props: { card: ResponseCard }) {
  const card = props.card;
  const d = card.document!;
  const fullUrl = API_BASE + d.url;

  return (
    <CardShell icon={FileText} accent="bg-purple-50 text-purple-700" title={card.title}>
      <p className="mb-3 text-sm text-ink-600">Your document is ready to download.</p>
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
      >
        <Download className="h-4 w-4" />
        {d.label}
      </a>
    </CardShell>
  );
}

function ComparisonCard(props: { card: ResponseCard }) {
  const card = props.card;
  const c = card.comparison!;
  const dash = String.fromCharCode(8212);
  return (
    <CardShell icon={GitCompare} accent="bg-purple-50 text-purple-700" title={card.title}>
      {c.subtitle ? <p className="mb-3 text-xs text-ink-500">{c.subtitle}</p> : null}
      {c.narrative ? (
        <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-ink-700">{c.narrative}</p>
      ) : null}
      {c.rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[11px] text-ink-400">
                {c.columns.map(function (col, i) {
                  return (
                    <th key={col + i} className="whitespace-nowrap pb-2 pr-4 font-semibold">{col}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {c.rows.map(function (row, i) {
                return (
                  <tr key={i} className="border-b border-ink-50">
                    {row.map(function (cell, j) {
                      return (
                        <td
                          key={j}
                          className={'py-2 pr-4 align-top ' + (j === 0 ? 'font-semibold text-ink-900' : 'text-ink-700')}
                        >
                          {(cell === null || cell === '') ? dash : String(cell)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </CardShell>
  );
}

function DocumentsUploadedCard(props: { card: ResponseCard }) {
  const card = props.card;
  const d = card.documentsUploaded!;

  return (
    <CardShell icon={FileText} accent="bg-primary-50 text-primary-700" title={card.title}>
      {d.successes.length > 0 ? (
        <div className="space-y-2">
          {d.successes.map(function (s, i) {
            return (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{s.filename}</p>
                  <p className="text-[11px] text-ink-500">
                    {s.pages + (s.pages === 1 ? ' page' : ' pages') +
                      (s.truncated ? ' - long document, only the first part was read' : '')}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success-500" />
              </div>
            );
          })}
        </div>
      ) : null}

      {d.failures.length > 0 ? (
        <div className={d.successes.length > 0 ? 'mt-2 space-y-2' : 'space-y-2'}>
          {d.failures.map(function (f, i) {
            return (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-error-100 bg-error-50 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-error-700">{f.filename}</p>
                  <p className="text-[11px] text-error-600">{f.error}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {d.note ? (
        <p className="mt-3 text-xs text-ink-500">{d.note}</p>
      ) : d.successes.length >= 2 ? (
        <p className="mt-3 text-xs text-ink-500">
          Try asking: &quot;Compare these documents&quot; to see how they differ.
        </p>
      ) : d.successes.length === 1 ? (
        <p className="mt-3 text-xs text-ink-500">
          Ask me anything about it, or attach another PDF to compare them.
        </p>
      ) : null}
    </CardShell>
  );
}

function PatientHistoryCard(props: { card: ResponseCard }) {
  const card = props.card;
  const h = card.patientHistory!;
  const dot = String.fromCharCode(183);
  const cross = String.fromCharCode(215);
  const rupee = String.fromCharCode(8377);
  return (
    <CardShell icon={Users} accent="bg-primary-50 text-primary-700" title={card.title}>
      <div className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
          {h.patient.name.split(' ').map(function (n) { return n[0]; }).join('')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-900">{h.patient.name}</p>
          <p className="text-[11px] text-ink-500">{h.patient.age + 'y ' + dot + ' ' + h.patient.gender + ' ' + dot + ' ' + h.patient.doctor}</p>
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Medicine History</p>
        {h.medicines.length === 0 ? (
          <p className="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">No medicine purchases on record.</p>
        ) : (
          <div className="space-y-2">
            {h.medicines.map(function (m, i) {
              const s = statusStyles[m.stockStatus] || statusStyles['Unknown'];
              return (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                    <Pill className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900">
                      {m.name + (m.quantity !== null ? (' ' + cross + ' ' + m.quantity) : '')}
                    </p>
                    {m.saleDate ? <p className="text-[11px] text-ink-500">{m.saleDate}</p> : null}
                  </div>
                  {m.currentStock !== null ? (
                    <div className="text-right">
                      <p className="text-xs font-semibold text-ink-900">{m.currentStock + ' in stock'}</p>
                      <span className={s.bg + ' ' + s.text + ' inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold'}>{s.label}</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {h.latestBill ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-ink-100 bg-ink-50 p-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Latest Bill</p>
            {h.latestBill.date ? <p className="text-[11px] text-ink-500">{h.latestBill.date}</p> : null}
          </div>
          <p className="text-sm font-bold text-ink-900">{rupee + h.latestBill.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      ) : null}
    </CardShell>
  );
}

function AlertCard(props: { card: ResponseCard; variant: 'error' | 'warning'; icon: typeof AlertTriangle }) {
  const card = props.card;
  const Icon = props.icon;
  const styles = props.variant === 'error'
    ? 'border-error-100 bg-error-50 text-error-700'
    : 'border-warning-100 bg-warning-50 text-warning-700';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={styles + ' flex items-start gap-3 rounded-2xl border px-5 py-4'}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{card.title}</p>
        <p className="mt-0.5 text-xs opacity-90">{card.message}</p>
      </div>
    </motion.div>
  );
}

function Info(props: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-400">{props.label}</span>
      <span className="font-semibold text-ink-800">{props.value}</span>
    </div>
  );
}

function Row(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-ink-600">
      <span>{props.label}</span>
      <span className="font-semibold text-ink-800">{props.value}</span>
    </div>
  );
}