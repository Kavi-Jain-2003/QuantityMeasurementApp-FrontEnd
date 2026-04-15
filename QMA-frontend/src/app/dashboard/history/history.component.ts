import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryService } from '../../shared/services/history.service';
import { UnitsService } from '../../shared/services/units.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h1>History</h1>
      <p>Your recent calculations and conversions</p>
    </div>

    <div class="hist-actions">
      <button class="clear-btn" (click)="clear()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
        Clear All
      </button>
    </div>

    <div class="hist-list">
      @if (hist.entries().length === 0) {
        <div class="hist-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <p>No history yet — start converting!</p>
        </div>
      } @else {
        @for (entry of hist.entries(); track entry.fingerprint ?? entry.id ?? (entry.expr + entry.time)) {
          <div class="hist-item">
            <div class="hist-left">
              <span class="hist-expr">{{ entry.expr }}</span>
              <span class="hist-meta">{{ entry.date }} at {{ entry.time }} · {{ entry.type }}</span>
            </div>
            <span class="hist-tag">{{ unitLabel(entry.cat) }}</span>
          </div>
        }
      }
    </div>
  `
})
export class HistoryComponent implements OnInit {
  hist  = inject(HistoryService);
  units = inject(UnitsService);
  toast = inject(ToastService);

  ngOnInit(): void {
    // Refresh from backend every time this page is opened
    this.hist.loadFromBackend();
  }

  unitLabel(cat: string): string {
    return (this.units.UNITS as any)[cat]?.label ?? cat;
  }

  clear(): void {
    this.hist.clear();
    this.toast.show('History cleared', 'success');
  }
}
