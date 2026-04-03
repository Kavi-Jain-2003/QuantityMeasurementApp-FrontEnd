import { Injectable } from '@angular/core';

export type Category = 'length' | 'weight' | 'temperature' | 'volume';

export interface UnitDef { name: string; factor?: number; }
export interface CategoryDef { label: string; units: Record<string, UnitDef>; }

@Injectable({ providedIn: 'root' })
export class UnitsService {

  readonly UNITS: Record<Category, CategoryDef> = {
    length: {
      label: 'Length',
      units: {
        m:   { name: 'Metre',         factor: 1 },
        km:  { name: 'Kilometre',     factor: 1000 },
        cm:  { name: 'Centimetre',    factor: 0.01 },
        mm:  { name: 'Millimetre',    factor: 0.001 },
        mi:  { name: 'Mile',          factor: 1609.344 },
        yd:  { name: 'Yard',          factor: 0.9144 },
        ft:  { name: 'Foot',          factor: 0.3048 },
        in:  { name: 'Inch',          factor: 0.0254 },
        nmi: { name: 'Nautical Mile', factor: 1852 },
      }
    },
    weight: {
      label: 'Weight',
      units: {
        kg:  { name: 'Kilogram',   factor: 1 },
        g:   { name: 'Gram',       factor: 0.001 },
        mg:  { name: 'Milligram',  factor: 0.000001 },
        lb:  { name: 'Pound',      factor: 0.45359237 },
        oz:  { name: 'Ounce',      factor: 0.028349523 },
        t:   { name: 'Metric Ton', factor: 1000 },
        st:  { name: 'Stone',      factor: 6.35029 },
      }
    },
    temperature: {
      label: 'Temperature',
      units: {
        C: { name: 'Celsius' },
        F: { name: 'Fahrenheit' },
        K: { name: 'Kelvin' },
        R: { name: 'Rankine' },
      }
    },
    volume: {
      label: 'Volume',
      units: {
        L:     { name: 'Litre',       factor: 1 },
        mL:    { name: 'Millilitre',  factor: 0.001 },
        m3:    { name: 'Cubic Metre', factor: 1000 },
        cm3:   { name: 'Cubic Cm',    factor: 0.001 },
        gal:   { name: 'US Gallon',   factor: 3.78541 },
        qt:    { name: 'US Quart',    factor: 0.946353 },
        pt:    { name: 'US Pint',     factor: 0.473176 },
        fl_oz: { name: 'Fluid Oz',    factor: 0.0295735 },
        cup:   { name: 'Cup',         factor: 0.236588 },
      }
    }
  };

  getKeys(cat: Category): string[] {
    return Object.keys(this.UNITS[cat].units);
  }

  convert(value: number, from: string, to: string, cat: Category): number {
    if (cat === 'temperature') return this.convertTemp(value, from, to);
    const units = this.UNITS[cat].units;
    return (value * units[from].factor!) / units[to].factor!;
  }

  toBase(value: number, unit: string, cat: Category): number {
    if (cat === 'temperature') return this.toCelsius(value, unit);
    return value * this.UNITS[cat].units[unit].factor!;
  }

  formula(raw: number, from: string, to: string, result: number, cat: Category): string {
    if (cat === 'temperature') {
      const map: Record<string, string> = {
        'C→F': `(${raw} × 9/5) + 32 = ${this.fmt(result)} °F`,
        'F→C': `(${raw} − 32) × 5/9 = ${this.fmt(result)} °C`,
        'C→K': `${raw} + 273.15 = ${this.fmt(result)} K`,
        'K→C': `${raw} − 273.15 = ${this.fmt(result)} °C`,
        'C→R': `(${raw} + 273.15) × 9/5 = ${this.fmt(result)} R`,
        'F→K': `(${raw} − 32) × 5/9 + 273.15 = ${this.fmt(result)} K`,
      };
      return map[`${from}→${to}`] ?? `${raw} ${from} = ${this.fmt(result)} ${to}`;
    }
    const ff = this.UNITS[cat].units[from].factor!;
    const tf = this.UNITS[cat].units[to].factor!;
    return `${raw} ${from} × ${ff} ÷ ${tf} = ${this.fmt(result)} ${to}`;
  }

  fmt(n: number): string {
    if (isNaN(n)) return '—';
    if (Math.abs(n) >= 1e9)  return (n / 1e9).toFixed(3) + 'B';
    if (Math.abs(n) >= 1e6)  return (n / 1e6).toFixed(3) + 'M';
    if (Math.abs(n) >= 1000) return parseFloat(n.toFixed(4)).toLocaleString();
    if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(4);
    return parseFloat(n.toFixed(6)).toString();
  }

  private toCelsius(v: number, from: string): number {
    if (from === 'C') return v;
    if (from === 'F') return (v - 32) * 5 / 9;
    if (from === 'K') return v - 273.15;
    if (from === 'R') return (v - 491.67) * 5 / 9;
    return v;
  }

  private convertTemp(v: number, from: string, to: string): number {
    const c = this.toCelsius(v, from);
    if (to === 'C') return c;
    if (to === 'F') return c * 9 / 5 + 32;
    if (to === 'K') return c + 273.15;
    if (to === 'R') return (c + 273.15) * 9 / 5;
    return c;
  }
}
