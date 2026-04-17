import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UnitsService, Category } from '../../shared/services/units.service';
import { HistoryService } from '../../shared/services/history.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../shared/services/auth.service';
import { ApiService } from '../../shared/services/api.service';

const UNIT_MAP: Record<string, string> = {
  m: 'METRE', km: 'KILOMETRE', cm: 'CENTIMETRE', mm: 'MILLIMETRE',
  mi: 'MILE', yd: 'YARD', ft: 'FEET', in: 'INCH', nmi: 'NAUTICAL_MILE',
  kg: 'KILOGRAM', g: 'GRAM', mg: 'MILLIGRAM', lb: 'POUND', oz: 'OUNCE', t: 'TON', st: 'STONE',
  C: 'CELSIUS', F: 'FAHRENHEIT', K: 'KELVIN', R: 'RANKINE',
  L: 'LITRE', mL: 'MILLILITRE', m3: 'CUBIC_METRE', cm3: 'CUBIC_CENTIMETRE',
  gal: 'GALLON', qt: 'QUART', pt: 'PINT', fl_oz: 'FLUID_OUNCE', cup: 'CUP',
};

const OP_ENDPOINT: Record<string, string> = {
  '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide'
};

@Component({
  selector: 'app-arithmetic',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Quantity Arithmetic</h1>
      <p>Perform unit-aware arithmetic operations on measurements — history saves automatically</p>
    </div>

    <div class="cat-bar">
      @for (cat of categoryButtons; track cat.key) {
        <button class="cat-btn" [class.active]="activeCat() === cat.key" (click)="selectCat(cat.key)">
          {{ cat.emoji }} {{ cat.label }}
        </button>
      }
    </div>

    <div class="card arith-card">
      <div class="arith-row">
        <div class="arith-col">
          <input class="plain-input" type="number" placeholder="Value A" [(ngModel)]="valA" (input)="onInputChange()"/>
          <select class="plain-select" [(ngModel)]="unitA" (change)="onInputChange()">
            @for (k of unitKeys(); track k) {
              <option [value]="k">{{ units[activeCat()].units[k].name }} ({{ k }})</option>
            }
          </select>
        </div>

        <div class="ops-col">
          @for (op of ops; track op.sym) {
            <button class="op-btn" [class.active]="activeOp() === op.sym"
                    (click)="selectOp(op.sym)">{{ op.label }}</button>
          }
        </div>

        <div class="arith-col">
          <input class="plain-input" type="number" placeholder="Value B" [(ngModel)]="valB" (input)="onInputChange()"/>
          <select class="plain-select" [(ngModel)]="unitB" (change)="onInputChange()">
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

      <!-- FIX 5: Removed the "Save to History" button — history now saves automatically -->
      @if (autoSaved()) {
        <div class="auto-save-indicator">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Saved to history automatically
        </div>
      }
    </div>
  `,
  styles: [`
    .auto-save-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      color: var(--accent);
      margin-top: 0.75rem;
      justify-content: center;
      opacity: 0.85;
    }
  `]
})
export class ArithmeticComponent implements OnInit {
  private svc    = inject(UnitsService);
  private hist   = inject(HistoryService);
  private toast  = inject(ToastService);
  private auth   = inject(AuthService);
  private api    = inject(ApiService);

  units     = this.svc.UNITS;
  activeCat = signal<Category>('length');
  activeOp  = signal('+');
  unitA = 'm';
  unitB = 'km';
  valA: number | null = null;
  valB: number | null = null;
  autoSaved = signal(false);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private autoSavedTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSubmittedExpr = '';

  categories = [
    { key: 'length'      as Category, emoji: '📏', label: 'Length' },
    { key: 'weight'      as Category, emoji: '⚖️', label: 'Weight' },
    { key: 'temperature' as Category, emoji: '🌡️', label: 'Temperature' },
    { key: 'volume'      as Category, emoji: '💧', label: 'Volume' },
  ];

  categoryButtons = [
    { key: 'length' as Category, emoji: '📏', label: 'Length' },
    { key: 'weight' as Category, emoji: '⚖️', label: 'Weight' },
    { key: 'temperature' as Category, emoji: '🌡️', label: 'Temperature' },
    { key: 'volume' as Category, emoji: '💧', label: 'Volume' },
  ];

  ops = [
    { sym: '+', label: '+' },
    { sym: '-', label: '−' },
    { sym: '*', label: '×' },
    { sym: '/', label: '÷' },
  ];

  unitKeys = computed(() => this.svc.getKeys(this.activeCat()));

  calcResult() {
    const a = this.valA, b = this.valB;
    if (a === null || b === null || isNaN(+a) || isNaN(+b)) {
      return { value: '—', unit: '', note: '' };
    }
    const cat    = this.activeCat();
    const isTemp = cat === 'temperature';
    const bA     = this.svc.toBase(+a, this.unitA, cat);
    const bB     = this.svc.toBase(+b, this.unitB, cat);
    const base   = isTemp ? '°C' : Object.keys(this.svc.UNITS[cat].units)[0];
    const note   = isTemp ? 'Temperature arithmetic performed in Celsius' : '';

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
  }

  ngOnInit(): void { this.setDefaults(); }

  selectCat(cat: Category): void {
    this.activeCat.set(cat);
    this.valA = null; this.valB = null;
    this.lastSubmittedExpr = '';
    this.autoSaved.set(false);
    this.setDefaults();
  }

  setDefaults(): void {
    const keys = this.svc.getKeys(this.activeCat());
    this.unitA = keys[0];
    this.unitB = keys[1] ?? keys[0];
  }

  selectOp(sym: string): void {
    this.activeOp.set(sym);
    this.onInputChange();
  }

  onInputChange(): void {
    const r = this.calcResult();
    if (r.value === '—' || this.valA === null || this.valB === null) return;

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.callBackendArithmetic(), 600);
  }

  private callBackendArithmetic(): void {
    if (this.valA === null || this.valB === null || isNaN(+this.valA) || isNaN(+this.valB)) return;
    if (this.auth.isGuest()) return;

    const r = this.calcResult();
    if (r.value === '—') return;

    const symMap: Record<string, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    const expr = `${this.valA} ${this.unitA} ${symMap[this.activeOp()]} ${this.valB} ${this.unitB} = ${r.value} ${r.unit}`;
    if (expr === this.lastSubmittedExpr) return;
    this.lastSubmittedExpr = expr;

    const endpoint = OP_ENDPOINT[this.activeOp()] ?? 'add';
    const backendUnitA = UNIT_MAP[this.unitA] ?? this.unitA.toUpperCase();
    const backendUnitB = UNIT_MAP[this.unitB] ?? this.unitB.toUpperCase();

    const payload = {
      thisQuantityDTO: { value: +this.valA, unit: backendUnitA },
      thatQuantityDTO: { value: +this.valB, unit: backendUnitB }
    };

    const request = endpoint === 'multiply'
      ? this.api.multiply(payload)
      : endpoint === 'divide'
        ? this.api.divide(payload)
        : endpoint === 'subtract'
          ? this.api.subtract(payload)
          : this.api.add(payload);

    request.subscribe({
      next: () => {
        this.autoSaved.set(true);
        if (this.autoSavedTimer) clearTimeout(this.autoSavedTimer);
        this.autoSavedTimer = setTimeout(() => this.autoSaved.set(false), 2500);
        this.hist.push({
          expr,
          cat: this.activeCat(),
          type: 'arithmetic'
        });
        this.hist.loadFromBackend();
      },
      error: (err) => {
        this.hist.push({
          expr,
          cat: this.activeCat(),
          type: 'arithmetic'
        });
        this.lastSubmittedExpr = '';
        console.warn('Backend history save failed:', err?.status, err?.message);
      }
    });
  }
}
