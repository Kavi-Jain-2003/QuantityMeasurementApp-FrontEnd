export interface HistoryEntry {
  expr: string;
  cat: string;
  type: 'convert' | 'compare' | 'arithmetic';
  time: string;
  date: string;
}
