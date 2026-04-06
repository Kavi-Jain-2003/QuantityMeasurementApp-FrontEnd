import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UnitsService, Category } from '../../shared/services/units.service';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Compare Quantities</h1>
      <p>Side-by-side measurement comparison with visual output</p>
    </div>

    <div class="cat-bar">
      @for (cat of categories; track cat.key) {
        <button class="cat-btn" [class.active]="activeCat() === cat.key" (click)="selectCat(cat.key)">
          {{ cat.emoji }} {{ cat.label }}
        </button>
      }
    </div>

    <div class="card cmp-card">
      <div class="cmp-grid">
        <!-- Value A -->
        <div class="cmp-col">
          <label class="field-lbl">Value A</label>
          <input class="plain-input" type="number" placeholder="0" [(ngModel)]="valA"/>
          <select class="plain-select" [(ngModel)]="unitA">
            @for (k of unitKeys(); track k) {
              <option [value]="k">{{ units[activeCat()].units[k].name }} ({{ k }})</option>
            }
          </select>
        </div>

        <!-- Badge -->
        <div class="cmp-badge" [style.color]="comparison().badgeColor">{{ comparison().badge }}</div>

        <!-- Value B -->
        <div class="cmp-col">
          <label class="field-lbl">Value B</label>
          <input class="plain-input" type="number" placeholder="0" [(ngModel)]="valB"/>
          <select class="plain-select" [(ngModel)]="unitB">
            @for (k of unitKeys(); track k) {
              <option [value]="k">{{ units[activeCat()].units[k].name }} ({{ k }})</option>
            }
          </select>
        </div>
      </div>

      <div class="cmp-result" [style.color]="comparison().resultColor">
        {{ comparison().text }}
      </div>

      <div class="bar-group">
        <div class="bar-lbl">A</div>
        <div class="bar-track">
          <div class="bar-fill fill-a" [style.width]="comparison().barA"></div>
        </div>
        <div class="bar-track">
          <div class="bar-fill fill-b" [style.width]="comparison().barB"></div>
        </div>
        <div class="bar-lbl">B</div>
      </div>
    </div>
  `
})
export class CompareComponent implements OnInit {
  private svc = inject(UnitsService);

  units     = this.svc.UNITS;
  activeCat = signal<Category>('length');
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

  unitKeys = computed(() => this.svc.getKeys(this.activeCat()));

  comparison() {
    const a = this.valA, b = this.valB;
    if (a === null || b === null || isNaN(+a) || isNaN(+b)) {
      return { badge: 'VS', badgeColor: '', text: 'Enter values above to compare', resultColor: '', barA: '50%', barB: '50%' };
    }
    const bA = this.svc.toBase(+a, this.unitA, this.activeCat());
    const bB = this.svc.toBase(+b, this.unitB, this.activeCat());
    const max = Math.max(Math.abs(bA), Math.abs(bB)) || 1;
    const wA  = (Math.abs(bA) / max * 100).toFixed(1) + '%';
    const wB  = (Math.abs(bB) / max * 100).toFixed(1) + '%';

    if (Math.abs(bA - bB) < 1e-9) {
      return { badge: '=', badgeColor: 'var(--green)', text: '✓ A and B are exactly equal',
               resultColor: 'var(--green-l)', barA: wA, barB: wB };
    } else if (bA > bB) {
      const pct = bB !== 0 ? ((bA - bB) / Math.abs(bB) * 100).toFixed(2) : '∞';
      return { badge: '>', badgeColor: 'var(--accent)', text: `A is ${pct}% greater than B`,
               resultColor: 'var(--accent-l)', barA: wA, barB: wB };
    } else {
      const pct = bA !== 0 ? ((bB - bA) / Math.abs(bA) * 100).toFixed(2) : '∞';
      return { badge: '<', badgeColor: 'var(--green)', text: `B is ${pct}% greater than A`,
               resultColor: 'var(--green-l)', barA: wA, barB: wB };
    }
  }

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
}
