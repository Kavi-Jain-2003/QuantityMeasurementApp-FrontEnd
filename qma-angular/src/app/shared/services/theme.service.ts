import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(true);

  constructor() {
    const saved = localStorage.getItem('qma_theme');
    const dark = saved ? saved === 'dark' : true;
    this.isDark.set(dark);
    this.apply(dark);
  }

  toggle(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    this.apply(next);
    localStorage.setItem('qma_theme', next ? 'dark' : 'light');
  }

  private apply(dark: boolean): void {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
}
