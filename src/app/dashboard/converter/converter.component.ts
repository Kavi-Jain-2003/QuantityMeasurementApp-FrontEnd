import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { UnitsService, Category } from '../../shared/services/units.service';
import { HistoryService } from '../../shared/services/history.service';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';

interface QuantityDTO { value: number; unit: string; }
interface QuantityMeasurementDTO {
  thisQuantityDTO: QuantityDTO;
  thatQuantityDTO: QuantityDTO;
}
interface QuantityMeasurementEntity {
  operation: string;
  operand1: string;
  operand2: string;
  result: string;
  error?: string;
}

const UNIT_MAP: Record<string, string> = {
  m: 'METRE', km: 'KILOMETRE', cm: 'CENTIMETRE', mm: 'MILLIMETRE',
  mi: 'MILE', yd: 'YARD', ft: 'FEET', in: 'INCH', nmi: 'NAUTICAL_MILE',
  kg: 'KILOGRAM', g: 'GRAM', mg: 'MILLIGRAM', lb: 'POUND', oz: 'OUNCE', t: 'TON', st: 'STONE',
  C: 'CELSIUS', F: 'FAHRENHEIT', K: 'KELVIN', R: 'RANKINE',
  L: 'LITRE', mL: 'MILLILITRE', m3: 'CUBIC_METRE', cm3: 'CUBIC_CENTIMETRE',
  gal: 'GALLON', qt: 'QUART', pt: 'PINT', fl_oz: 'FLUID_OUNCE', cup: 'CUP',
};

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Unit Converter</h1>
      <p>Convert between units instantly with live formula display</p>
    </div>

    <div class="cat-bar">
      @for (cat of categories; track cat.key) {
        <button class="cat-btn" [class.active]="activeCat() === cat.key" (click)="selectCat(cat.key)">
          {{ cat.emoji }} {{ cat.label }}
        </button>
      }
    </div>

    <div class="card conv-card">
      <div class="conv-grid">
        <div class="conv-col">
          <label class="field-lbl">From unit</label>
          <select class="plain-select" [(ngModel)]="fromUnit" (change)="recalc()">
            @for (k of unitKeys(); track k) {
              <option [value]="k">{{ units[activeCat()].units[k].name }} ({{ k }})</option>
            }
          </select>
          <input class="plain-input" type="number" placeholder="Enter value"
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
          <input class="plain-input" type="text" [value]="displayResult()" placeholder="Result" readonly/>
        </div>
      </div>

      <div class="formula-box">
        <span class="formula-lbl">Formula</span>
        @if (loading()) {
          <span class="formula-loading">Calculating...</span>
        } @else if (backendResult()) {
          <span>{{ backendResult()!.operand1 }} -> {{ backendResult()!.result }}</span>
        } @else if (backendError()) {
          <span class="formula-error">{{ backendError() }}</span>
        } @else {
          <span>{{ localFormulaText() }}</span>
        }
      </div>
    </div>

    <div class="card">
      <div class="section-head">All Conversions (local preview)</div>
      <div class="chips-grid">
        @for (k of unitKeys(); track k) {
          <div class="chip">
            <span class="chip-name">{{ units[activeCat()].units[k].name }}</span>
            <span class="chip-val">{{ allLocalResults()[k] }} <span class="chip-unit">{{ k }}</span></span>
          </div>
        }
      </div>
    </div>
  `
})
export class ConverterComponent implements OnInit {
  private svc = inject(UnitsService);
  private hist = inject(HistoryService);
  private api = inject(ApiService);
  private auth = inject(AuthService);

  units = this.svc.UNITS;
  activeCat = signal<Category>('length');
  fromUnit = 'm';
  toUnit = 'km';
  fromVal: number | null = null;

  loading = signal(false);
  backendResult = signal<QuantityMeasurementEntity | null>(null);
  backendError = signal<string>('');

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  categories = [
    { key: 'length' as Category, emoji: '📏', label: 'Length' },
    { key: 'weight' as Category, emoji: '⚖️', label: 'Weight' },
    { key: 'temperature' as Category, emoji: '🌡️', label: 'Temperature' },
    { key: 'volume' as Category, emoji: '💧', label: 'Volume' },
  ];

  unitKeys = computed(() => this.svc.getKeys(this.activeCat()));

  displayResult(): string {
    if (this.backendResult()?.result) {
      return this.backendResult()!.result;
    }
    if (this.fromVal === null || isNaN(this.fromVal)) return '';
    return this.svc.fmt(this.svc.convert(this.fromVal, this.fromUnit, this.toUnit, this.activeCat()));
  }

  localFormulaText(): string {
    if (this.fromVal === null || isNaN(this.fromVal)) {
      return 'Enter a value above to see the formula';
    }
    const r = this.svc.convert(this.fromVal, this.fromUnit, this.toUnit, this.activeCat());
    return this.svc.formula(this.fromVal, this.fromUnit, this.toUnit, r, this.activeCat());
  }

  allLocalResults = computed((): Record<string, string> => {
    const out: Record<string, string> = {};
    if (this.fromVal === null || isNaN(this.fromVal)) return out;
    this.unitKeys().forEach(k => {
      out[k] = this.svc.fmt(this.svc.convert(this.fromVal!, this.fromUnit, k, this.activeCat()));
    });
    return out;
  });

  ngOnInit(): void {
    this.setDefaults();
    if (!this.auth.isGuest()) {
      this.hist.loadFromBackend();
    }
  }

  selectCat(cat: Category): void {
    this.activeCat.set(cat);
    this.fromVal = null;
    this.backendResult.set(null);
    this.backendError.set('');
    this.setDefaults();
  }

  setDefaults(): void {
    const keys = this.svc.getKeys(this.activeCat());
    this.fromUnit = keys[0];
    this.toUnit = keys[1] ?? keys[0];
  }

  swap(): void {
    [this.fromUnit, this.toUnit] = [this.toUnit, this.fromUnit];
    this.recalc();
  }

  recalc(): void {
    this.backendResult.set(null);
    this.backendError.set('');

    if (this.fromVal === null || isNaN(this.fromVal)) return;

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => void this.callBackend(), 400);
  }

  private async callBackend(): Promise<void> {
    if (this.fromVal === null || isNaN(this.fromVal)) return;
    if (this.auth.isGuest()) return;

    const cleanValue = Number(this.fromVal.toString().replace(/,/g, ''));
    if (isNaN(cleanValue)) {
      this.backendError.set('Invalid input value');
      return;
    }

    const backendFromUnit = UNIT_MAP[this.fromUnit] ?? this.fromUnit.toUpperCase();
    const backendToUnit = UNIT_MAP[this.toUnit] ?? this.toUnit.toUpperCase();

    const payload: QuantityMeasurementDTO = {
      thisQuantityDTO: { value: cleanValue, unit: backendFromUnit },
      thatQuantityDTO: { value: 0, unit: backendToUnit }
    };

    this.loading.set(true);

    try {
      const entity = await firstValueFrom(this.api.convert(payload));

      if (entity?.error && entity.error.trim() !== '') {
        this.backendError.set(entity.error);
        this.backendResult.set(null);
        return;
      }

      this.backendError.set('');
      this.backendResult.set(entity);
      this.hist.push({
        expr: `${cleanValue} ${this.fromUnit} -> ${entity?.result ?? this.svc.fmt(this.svc.convert(this.fromVal, this.fromUnit, this.toUnit, this.activeCat()))}`,
        cat: this.activeCat(),
        type: 'convert'
      });
      this.hist.loadFromBackend();
    } catch (err: any) {
      if (err?.status === 0) {
        console.warn('Backend not reachable, using local conversion preview.');
      } else {
        console.warn('Backend conversion failed, using local conversion preview.', err);
      }
      this.hist.push({
        expr: `${cleanValue} ${this.fromUnit} -> ${this.svc.fmt(this.svc.convert(this.fromVal, this.fromUnit, this.toUnit, this.activeCat()))}`,
        cat: this.activeCat(),
        type: 'convert'
      });
      this.backendError.set('');
      this.backendResult.set(null);
    } finally {
      this.loading.set(false);
    }
  }
}
