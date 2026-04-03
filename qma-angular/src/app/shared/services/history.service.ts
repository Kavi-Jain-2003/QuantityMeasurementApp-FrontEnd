import { Injectable, signal } from '@angular/core';
import { HistoryEntry } from '../models/history.model';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  entries = signal<HistoryEntry[]>([]);

  constructor() {
    const saved = localStorage.getItem('qma_hist');
    if (saved) this.entries.set(JSON.parse(saved));
  }

  push(entry: Omit<HistoryEntry, 'time' | 'date'>): void {
    const now = new Date();
    const full: HistoryEntry = {
      ...entry,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString()
    };
    this.entries.update(list => {
      if (list.length && list[0].expr === full.expr) return list;
      const updated = [full, ...list].slice(0, 60);
      localStorage.setItem('qma_hist', JSON.stringify(updated));
      return updated;
    });
  }

  clear(): void {
    this.entries.set([]);
    localStorage.removeItem('qma_hist');
  }
}
