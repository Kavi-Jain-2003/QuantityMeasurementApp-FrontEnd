import { Injectable, signal, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HistoryEntry } from '../models/history.model';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  entries = signal<HistoryEntry[]>([]);

  private api = inject(ApiService);
  private auth = inject(AuthService);
  private activeCacheKey = '';

  constructor() {
    this.syncNamespace();
    this.loadFromBackend();
  }

  loadFromBackend(): void {
    this.syncNamespace();
    if (this.auth.isGuest()) {
      this.entries.set([]);
      return;
    }
    const token = localStorage.getItem('qma_jwt');
    if (!token) return;

    this.api.getHistory().subscribe({
      next: (records) => {
        const mapped = (records ?? []).map((record: any) => this.mapBackendRecord(record));
        this.replaceWithBackend(mapped);
      },
      error: () => {
        // Keep cached history if backend is unavailable.
        console.warn('History load failed for current user');
      }
    });
  }

  push(entry: Omit<HistoryEntry, 'time' | 'date'>): void {
    this.syncNamespace();
    if (this.auth.isGuest()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString();
    const fingerprint = this.buildFingerprint(entry);
    const full: HistoryEntry = {
      id: this.createId(),
      fingerprint,
      ...entry,
      time,
      date
    };

    this.entries.update(list => {
      const updated = [full, ...list].slice(0, 60);
      this.persist(this.activeCacheKey, updated);
      return updated;
    });
  }

  clear(): Observable<void> {
    this.syncNamespace();
    if (this.auth.isGuest()) {
      this.entries.set([]);
      return of(void 0);
    }
    this.entries.set([]);
    this.clearCache(this.activeCacheKey);
    return this.api.clearHistory().pipe(
      tap(() => {
        this.entries.set([]);
        this.clearCache(this.activeCacheKey);
      }),
      catchError((err) => {
        // Keep the UI responsive even if the remote delete is flaky.
        // The backend sync can be retried on the next clear action.
        console.warn('Remote history clear failed for current user');
        this.entries.set([]);
        this.clearCache(this.activeCacheKey);
        return of(void 0);
      })
    );
  }

  private readCache(key: string): HistoryEntry[] {
    return this.safeRead(localStorage.getItem(key))
      ?? this.safeRead(sessionStorage.getItem(key))
      ?? [];
  }

  private safeRead(raw: string | null): HistoryEntry[] | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
    } catch {
      return null;
    }
  }

  private persist(key: string, entries: HistoryEntry[]): void {
    const serialized = JSON.stringify(entries);
    localStorage.setItem(key, serialized);
    sessionStorage.setItem(key, serialized);
  }

  private replaceWithBackend(incoming: HistoryEntry[]): void {
    this.syncNamespace();
    const next = incoming.slice(0, 60);
    this.entries.set(next);
    this.persist(this.activeCacheKey, next);
  }

  private mapBackendRecord(record: any): HistoryEntry {
    const timestampValue = this.pick(record, [
      'timestamp',
      'createdAt',
      'created_at',
      'historyTimestamp',
      'history_timestamp'
    ]);
    const timestamp = timestampValue ? new Date(timestampValue) : new Date();
    const input = this.pick(record, ['inputData', 'input_data', 'expression', 'expr', 'input']);
    const output = this.pick(record, ['outputData', 'output_data', 'result', 'output']);
    const operationType = this.pick(record, ['operationType', 'operation_type', 'type']);
    const status = this.pick(record, ['status']);
    const expr = this.buildExpr(operationType, input, output);
    const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = timestamp.toLocaleDateString();

    return {
      id: this.pick(record, ['id', 'historyId', 'history_id']),
      fingerprint: this.buildFingerprint({
        expr,
        cat: this.inferCat(input ?? expr),
        type: this.inferType(operationType ?? ''),
        status
      }),
      expr,
      cat: this.inferCat(input ?? expr),
      type: this.inferType(operationType ?? ''),
      time,
      date,
      status
    };
  }

  private buildExpr(operationType: string | undefined, input: string | undefined, output: string | undefined): string {
    const op = (operationType ?? '').toUpperCase();
    if (op === 'CONVERT') {
      return input && output ? `${input} -> ${output}` : (input ?? output ?? 'History item');
    }
    if (op === 'COMPARE' || op === 'ADD' || op === 'SUBTRACT' || op === 'MULTIPLY' || op === 'DIVIDE') {
      return input && output ? `${input} = ${output}` : (input ?? output ?? 'History item');
    }
    return input && output ? `${input} -> ${output}` : (input ?? output ?? 'History item');
  }

  private buildFingerprint(entry: Pick<HistoryEntry, 'expr' | 'cat' | 'type'> & Partial<Pick<HistoryEntry, 'status'>>): string {
    return [entry.expr, entry.cat, entry.type, entry.status ?? ''].join('|');
  }

  private syncNamespace(): void {
    if (this.auth.isGuest()) {
      this.activeCacheKey = 'qma_hist:guest';
      this.entries.set([]);
      return;
    }
    const key = this.cacheKey();
    if (key === this.activeCacheKey) return;

    this.activeCacheKey = key;
    this.entries.set(this.readCache(key));
  }

  private cacheKey(): string {
    return `qma_hist:${this.currentUsername()}`;
  }

  private currentUsername(): string {
    const session = localStorage.getItem('qma_session');
    if (session) {
      try {
        const user = JSON.parse(session);
        return user?.email ?? user?.username ?? user?.name ?? 'anonymous';
      } catch {
        // fall through
      }
    }
    return 'anonymous';
  }

  private clearCache(key: string): void {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }

  private pick(record: any, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = record?.[key];
      if (value !== undefined && value !== null && `${value}`.trim() !== '') {
        return `${value}`;
      }
    }
    return undefined;
  }

  private inferType(opType: string): 'convert' | 'compare' | 'arithmetic' {
    const t = (opType ?? '').toUpperCase();
    if (t === 'CONVERT') return 'convert';
    if (t === 'COMPARE') return 'compare';
    return 'arithmetic';
  }

  private inferCat(input: string): string {
    if (!input) return 'length';
    const s = input.toUpperCase();
    if (s.includes('CELSIUS') || s.includes('FAHRENHEIT') || s.includes('KELVIN') || s.includes('RANKINE')) return 'temperature';
    if (s.includes('LITRE') || s.includes('GALLON') || s.includes('CUBIC') || s.includes('PINT') || s.includes('QUART')) return 'volume';
    if (s.includes('KILOGRAM') || s.includes('GRAM') || s.includes('POUND') || s.includes('OUNCE') || s.includes('TON')) return 'weight';
    return 'length';
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
