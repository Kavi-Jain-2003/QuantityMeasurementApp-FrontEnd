export interface HistoryEntry {
  id?: string;
  fingerprint?: string;
  expr: string;
  cat: string;
  type: 'convert' | 'compare' | 'arithmetic';
  time: string;
  date: string;
  status?: string;  // SUCCESS / FAILED (from backend)
}
