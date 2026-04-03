import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UnitsService, Category } from '../../shared/services/units.service';
import { HistoryService } from '../../shared/services/history.service';

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Unit Converter</h1>
      <p>Convert between units instantly with live formula display</p>
    </div>

    <!-- Category bar -->
    <div class="cat-bar">
      @for (cat of categories; track cat.key) {
        <button class="cat-btn" [class.active]="activeCat() === cat.key" (click)="selectCat(cat.key)">
          {{ cat.emoji }} {{ cat.label }}
        </button>
      }
    </div>

    <!-- Converter card -->
    <div class="card conv-card">
      <div class="conv-grid">
        <div class="conv-col">
          <label class="field-lbl">From unit</label>
          <select class="plain-select" [(ngModel)]="fromUnit" (change)="recalc()">
            @for (k of unitKeys(); track k) {
              <option [value]="k">{{ units[activeCat()].units[k].name }} ({{ k }})</option>
            }
          </select>
          <input class="plain-input" type="number" placeholder="Enter value…"
                 [(ngModel)]="fromVal" (input)="recalc()"/>
        </div>

        <div class="conv-mid">
          <button class="swap-btn" (click)="swap()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          </button>
        </div>

        <div class="conv-col">
          <label class="field-lbl">To unit</label>
          <select class="plain-select" [(ngModel)]="toUnit" (change)="recalc()">
            @for (k of unitKeys(); track k) {
              <option [value]="k">{{ units[activeCat()].units[k].name }} ({{ k }})</option>
            }
          </select>
          <input class="plain-input" type="number" [value]="result()" placeholder="Result" readonly/>
        </div>
      </div>

      <div class="formula-box">
        <span class="formula-lbl">Formula</span>
        <span>{{ formulaText() }}</span>
      </div>
    </div>

    <!-- All conversions -->
    <div class="card">
      <div class="section-head">All Conversions</div>
      <div class="chips-grid">
        @for (k of unitKeys(); track k) {
          <div class="chip">
            <span class="chip-name">{{ units[activeCat()].units[k].name }}</span>
            <span class="chip-val">{{ allResults()[k] }} <span class="chip-unit">{{ k }}</span></span>
          </div>
        }
      </div>
    </div>
  `
})
export class ConverterComponent implements OnInit {
  private svc  = inject(UnitsService);
  private hist = inject(HistoryService);

  units      = this.svc.UNITS;
  activeCat  = signal<Category>('length');
  fromUnit   = 'm';
  toUnit     = 'km';
  fromVal: number | null = null;

  categories = [
    { key: 'length'      as Category, emoji: '📏', label: 'Length' },
    { key: 'weight'      as Category, emoji: '⚖️', label: 'Weight' },
    { key: 'temperature' as Category, emoji: '🌡️', label: 'Temperature' },
    { key: 'volume'      as Category, emoji: '💧', label: 'Volume' },
  ];

  unitKeys = computed(() => this.svc.getKeys(this.activeCat()));

  result = computed(() => {
    if (this.fromVal === null || isNaN(this.fromVal)) return '';
    return this.svc.fmt(this.svc.convert(this.fromVal, this.fromUnit, this.toUnit, this.activeCat()));
  });

  formulaText = computed(() => {
    if (this.fromVal === null || isNaN(this.fromVal)) return 'Enter a value above to see the formula';
    const r = this.svc.convert(this.fromVal, this.fromUnit, this.toUnit, this.activeCat());
    return this.svc.formula(this.fromVal, this.fromUnit, this.toUnit, r, this.activeCat());
  });

  allResults = computed((): Record<string, string> => {
    const out: Record<string, string> = {};
    if (this.fromVal === null || isNaN(this.fromVal)) return out;
    this.unitKeys().forEach(k => {
      out[k] = this.svc.fmt(this.svc.convert(this.fromVal!, this.fromUnit, k, this.activeCat()));
    });
    return out;
  });

  ngOnInit(): void { this.setDefaults(); }

  selectCat(cat: Category): void {
    this.activeCat.set(cat);
    this.fromVal = null;
    this.setDefaults();
  }

  setDefaults(): void {
    const keys = this.svc.getKeys(this.activeCat());
    this.fromUnit = keys[0];
    this.toUnit   = keys[1] ?? keys[0];
  }

  swap(): void {
    [this.fromUnit, this.toUnit] = [this.toUnit, this.fromUnit];
    this.recalc();
  }

  recalc(): void {
    if (this.fromVal !== null && !isNaN(this.fromVal)) {
      const r = this.svc.convert(this.fromVal, this.fromUnit, this.toUnit, this.activeCat());
      this.hist.push({
        expr: `${this.fromVal} ${this.fromUnit} → ${this.svc.fmt(r)} ${this.toUnit}`,
        cat:  this.activeCat(),
        type: 'convert'
      });
    }
  }
}
