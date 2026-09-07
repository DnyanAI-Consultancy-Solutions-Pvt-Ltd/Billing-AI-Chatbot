export type Role = 'user' | 'assistant';

export type ResponseKind =
  | 'text'
  | 'patient_registered'
  | 'patient_list'
  | 'patient_deleted'
  | 'patient_updated'
  | 'bill_generated'
  | 'dashboard'
  | 'inventory'
  | 'report'
  | 'sql_result'
  | 'sale'
  | 'patient_history'
  | 'document'
  | 'comparison'
  | 'documents_uploaded'
  | 'error';

export interface BillItem {
  name: string;
  qty: number;
  price: number;
}

export interface InventoryRow {
  name: string;
  category: string;
  stock: number;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface PatientRow {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  doctor: string;
  status: 'Active' | 'Discharged' | 'Waiting' | 'Consulting';
  lastVisit: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
  icon: 'patients' | 'revenue' | 'bills' | 'inventory';
}

export interface DashboardData {
  metrics: DashboardMetric[];
  topSellingMedicine: { name: string; units: number; revenue: string };
  medicineSales: { name: string; units: number; revenue: string; share: number }[];
}

export interface ReportRow {
  metric: string;
  value: string;
  change: string;
}

export interface ResponseCard {
  kind: ResponseKind;
  title: string;
  message?: string;
  // Set when this card came from a voice message - the BCP-47
  // language code Sarvam detected (e.g. "hi-IN", "mr-IN"). Used to
  // reply back in the same language via /api/speak. Absent for
  // typed messages.
  language?: string;
  // The full pre-formatted reply text from the backend (same
  // content as the old plain-text box), kept ALONGSIDE the
  // structured card data - used only by the Copy and Listen
  // buttons, which need the complete content regardless of card
  // kind. Deliberately separate from `message`, which several card
  // components (InventoryCard, PatientRegistered, etc.) already use
  // for their own short success/confirmation banners - reusing
  // `message` for this caused the raw formatted text to render
  // inside those banners instead of the card's actual UI.
  fullText?: string;
  patient?: PatientRow;
  patients?: PatientRow[];
  bill?: {
    patient: string;
    billNo: string;
    date: string;
    items: BillItem[];
    subtotal: number;
    gst: number;
    total: number;
    paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  };
  dashboard?: DashboardData;
  inventory?: InventoryRow[];
  report?: {
    title: string;
    rows: ReportRow[];
  };
  // Generic result table for kind 'sql_result' - used for any
  // SELECT whose shape doesn't match a specific card (patient,
  // bill, inventory, dashboard, single-value report). Unlike
  // `report` above (locked to metric/value/change triples), this
  // holds real column headers and real row data of any width, so
  // an arbitrary query like "medicine_name, total_sales" or a
  // 6-column bills list renders accurately instead of being forced
  // into a 3-column shape that would drop or misrepresent data.
  table?: {
    columns: string[];
    rows: (string | number | null)[][];
  };
  // For kind 'patient_history' - the compound "patient + their
  // purchases + latest bill" view (e.g. "what medicine did X buy").
  // Deliberately its own shape, not reusing PatientRow - that query
  // never selects a patient ID, so faking one would be worse than
  // just not having it.
  patientHistory?: {
    patient: {
      name: string;
      age: number;
      gender: string;
      doctor: string;
    };
    medicines: {
      name: string;
      quantity: number | null;
      saleDate: string | null;
      currentStock: number | null;
      stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Unknown';
    }[];
    latestBill: {
      total: number;
      date: string | null;
    } | null;
  };
  // For kind 'document' - a downloadable PDF the chat generated
  // (prescription, patient report, comparison, etc.). `url` is a
  // relative backend path (e.g. "/api/report/pdf?type=...") - the
  // frontend needs to prefix it with the backend origin before
  // linking to it, same as api.ts's API_BASE.
  document?: {
    url: string;
    label: string;
  };
  // For kind 'comparison' - a real rendered table (not raw markdown
  // pipes) comparing N things: uploaded documents, doctors, months,
  // anything. `columns` is ["Aspect", <name of thing A>, <name of
  // thing B>, ...] and each row in `rows` is one aspect being
  // compared, with one value per compared thing.
  comparison?: {
    subtitle?: string;
    narrative?: string;
    columns: string[];
    rows: (string | number | null)[][];
  };
  // For kind 'documents_uploaded' - the confirmation shown right
  // after one or more files finish uploading. Built entirely on the
  // frontend (Assistant.tsx), not returned by the backend, since
  // uploads happen via a separate /api/upload-document call per
  // file rather than through the normal /api/chat response.
  documentsUploaded?: {
    successes: { filename: string; pages: number; truncated: boolean }[];
    failures: { filename: string; error: string }[];
    // Optional override for the hint line shown at the bottom of
    // the card (e.g. "Comparing them now..." when a one-click
    // compare flow is about to auto-fire). When absent, the card
    // falls back to a default hint based on how many files
    // succeeded.
    note?: string;
  };
  // Optional on ANY card kind, not just 'document' or 'comparison'.
  // When set, ResponseCardView renders a "Download PDF" button
  // below the card's normal content, pointed at this backend path
  // (prefixed with API_BASE, same as `document.url` above). This is
  // what makes "download this as a report" a property any card can
  // opt into - a future agent just needs to set these two fields to
  // get a working download button, without a new component.
  downloadUrl?: string;
  downloadLabel?: string;
  sale?: {
    medicine: string;
    qty: number;
    total: string;
    remainingStock: number;
  };
}

export interface ChatMessage {
  id: string;
  role: Role;
  content?: string;
  // Filenames attached to a USER message when they sent one or
  // more files alongside (or instead of) typed text - rendered as
  // small chips above the message bubble. Purely a display list;
  // the actual upload already happened before this message was
  // added (see Assistant.tsx's handleSend).
  attachments?: string[];
  card?: ResponseCard;
  timestamp: number;
}