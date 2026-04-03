import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UnitsService, Category } from '../../shared/services/units.service';
import { HistoryService } from '../../shared/services/history.service';
import { ToastService } from '../../shared/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-arithmetic',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Quantity Arithmetic</h1>
      <p>Perform unit-aware arithmetic operations on measurements</p>
    </div>

    <div class="cat-bar">
      @for (cat of categories; track cat.key) {
        <button class="cat-btn" [class.active]="activeCat() === cat.key" (click)="selectCat(cat.key)">
          {{ cat.emoji }} {{ cat.label }}
        </button>
      }
    </div>

    <div class="card arith-card">
      <!-- Row: A  ops  B -->
      <div class="arith-row">
        <div class="arith-col">
          <input class="plain-input" type="number" placeholder="Value A" [(ngModel)]="valA"/>
          <select class="plain-select" [(ngModel)]="unitA">
            @for (k of unitKeys(); track k) {
              <option [value]="k">{{ units[activeCat()].units[k].name }} ({{ k }})</option>
            }
          </select>
        </div>

        <div class="ops-col">
          @for (op of ops; track op.sym) {
            <button class="op-btn" [class.active]="activeOp() === op.sym"
                    (click)="activeOp.set(op.sym)">{{ op.label }}</button>
          }
        </div>

        <div class="arith-col">
          <input class="plain-input" type="number" placeholder="Value B" [(ngModel)]="valB"/>
          <select class="plain-select" [(ngModel)]="unitB">
            @for (k of unitKeys(); track k) {
              <option [value]="k">{{ units[activeCat()].units[k].name }} ({{ k }})</option>
            }
          </select>
        </div>
      </div>

      <div class="equals-row">=</div>

      <div class="result-box">
        <span class="result-val">{{ calcResult().value }}</span>
        <span class="result-unit">{{ calcResult().unit }}</span>
      </div>

      <p class="arith-note">{{ calcResult().note }}</p>

      <button class="save-btn" (click)="save()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        Save to History
      </button>
    </div>
  `
})
export class ArithmeticComponent implements OnInit {
  private svc    = inject(UnitsService);
  private hist   = inject(HistoryService);
  private toast  = inject(ToastService);
  private router = inject(Router);

  units     = this.svc.UNITS;
  activeCat = signal<Category>('length');
  activeOp  = signal('+');
  unitA = 'm';
  unitB = 'km';
  valA: number | null = null;
  valB: number | null = null;

  categories = [
    { key: 'length'      as Category, emoji: '📏', label: 'Length' },
    { key: 'weight'      as Category, emoji: '⚖️', label: 'Weight' },
    { key: 'temperature' as Category, emoji: '🌡️', label: 'Temperature' },
    { key: 'volume'      as Category, emoji: '💧', label: 'Volume' },
  ];

  ops = [
    { sym: '+', label: '+' },
    { sym: '-', label: '−' },
    { sym: '*', label: '×' },
    { sym: '/', label: '÷' },
  ];

  unitKeys = computed(() => this.svc.getKeys(this.activeCat()));

  calcResult = computed(() => {
    const a = this.valA, b = this.valB;
    if (a === null || b === null || isNaN(+a) || isNaN(+b)) {
      return { value: '—', unit: '', note: '' };
    }
    const cat  = this.activeCat();
    const isTemp = cat === 'temperature';
    const bA   = this.svc.toBase(+a, this.unitA, cat);
    const bB   = this.svc.toBase(+b, this.unitB, cat);
    const base = isTemp ? '°C' : Object.keys(this.svc.UNITS[cat].units)[0];
    const note = isTemp ? 'Temperature arithmetic performed in Celsius' : '';

    let res: number;
    let unit = base;
    let extraNote = note;

    switch (this.activeOp()) {
      case '+': res = bA + bB; break;
      case '-': res = bA - bB; break;
      case '*': res = bA * bB; unit = base + '²'; extraNote = 'Result is in squared base units'; break;
      case '/':
        if (bB === 0) return { value: '∞', unit: '', note };
        res = bA / bB; unit = '(ratio)'; break;
      default: res = 0;
    }
    return { value: this.svc.fmt(res), unit, note: extraNote };
  });

  ngOnInit(): void { this.setDefaults(); }

  selectCat(cat: Category): void {
    this.activeCat.set(cat);
    this.valA = null; this.valB = null;
    this.setDefaults();
  }

  setDefaults(): void {
    const keys = this.svc.getKeys(this.activeCat());
    this.unitA = keys[0];
    this.unitB = keys[1] ?? keys[0];
  }

  save(): void {
    const r = this.calcResult();
    if (r.value === '—' || this.valA === null || this.valB === null) {
      this.toast.show('Nothing to save yet', 'error'); return;
    }
    const sym: Record<string, string> = { '+':'+', '-':'−', '*':'×', '/':'÷' };
    const expr = `${this.valA} ${this.unitA} ${sym[this.activeOp()]} ${this.valB} ${this.unitB} = ${r.value}`;
    this.hist.push({ expr, cat: this.activeCat(), type: 'arithmetic' });
    this.toast.show('Saved to history ✓', 'success');
    this.router.navigate(['/dashboard/history']);
  }
}
