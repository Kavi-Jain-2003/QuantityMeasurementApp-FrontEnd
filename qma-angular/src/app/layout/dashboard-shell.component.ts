import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { ThemeService } from '../shared/services/theme.service';
import { ToastService } from '../shared/services/toast.service';
import { filter } from 'rxjs/operators';

interface NavItem { path: string; label: string; icon: string; }

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="dashboard">

      <!-- ── SIDEBAR ── -->
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="sb-top">
          <div class="brand">
            <div class="brand-icon small">
              <svg viewBox="0 0 44 44" fill="none">
                <circle cx="22" cy="22" r="20" stroke="var(--accent)" stroke-width="2"/>
                <path d="M13 22h18M22 13v18" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="22" cy="22" r="5" fill="var(--accent)" opacity="0.25"/>
                <circle cx="22" cy="22" r="2.5" fill="var(--accent)"/>
              </svg>
            </div>
            <span class="brand-name">QMA</span>
          </div>
          <button class="sb-close" (click)="closeSidebar()">✕</button>
        </div>

        <div class="sb-lbl">Menu</div>

        <nav class="sb-nav">
          @for (item of navItems; track item.path) {
            <a class="sb-link"
               [routerLink]="['/dashboard', item.path]"
               routerLinkActive="active"
               (click)="closeSidebar()">
              <span class="sb-ico" [innerHTML]="item.icon"></span>
              {{ item.label }}
            </a>
          }
        </nav>

        <div class="sb-bottom">
          <div class="sb-user">
            <!-- Google profile photo or initials avatar -->
            <div class="avatar" [class.photo-avatar]="userPhoto()">
              @if (userPhoto()) {
                <img [src]="userPhoto()!" [alt]="userName()" referrerpolicy="no-referrer"/>
              } @else {
                {{ userAvatar() }}
              }
            </div>
            <div class="sb-user-info">
              <span>{{ userName() }}</span>
              <small class="provider-badge">{{ userBadge() }}</small>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()" title="Sign out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      <!-- ── MAIN ── -->
      <div class="main-area">

        <header class="topbar">
          <div class="topbar-left">
            <button class="hamburger" (click)="sidebarOpen.set(true)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <line x1="3" y1="7" x2="21" y2="7"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="17" x2="21" y2="17"/>
              </svg>
            </button>
            <div class="page-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   style="width:18px;height:18px;color:var(--accent)">
                <g [innerHTML]="currentPageIcon()"></g>
              </svg>
              <span>{{ currentPageTitle() }}</span>
            </div>
          </div>
          <div class="topbar-right">
            <button class="theme-btn" (click)="theme.toggle()"
                    [title]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
              @if (theme.isDark()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              }
            </button>

            <!-- Topbar avatar: Google photo or initials -->
            <div class="avatar topbar-av" [class.photo-avatar]="userPhoto()">
              @if (userPhoto()) {
                <img [src]="userPhoto()!" [alt]="userName()" referrerpolicy="no-referrer"/>
              } @else {
                {{ userAvatar() }}
              }
            </div>
          </div>
        </header>

        <div class="content-area">
          <router-outlet />
        </div>
      </div>

      <div class="sb-overlay" [class.active]="sidebarOpen()" (click)="closeSidebar()"></div>
    </div>
  `,
  styles: [`
    .photo-avatar { background: none !important; box-shadow: none !important; overflow: hidden; }
    .photo-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
    .topbar-av { width: 32px; height: 32px; font-size: .76rem; }
  `]
})
export class DashboardShellComponent {
  auth  = inject(AuthService);
  theme = inject(ThemeService);
  toast = inject(ToastService);

  private router  = inject(Router);
  private _user   = this.auth.currentUser;
  sidebarOpen     = signal(false);

  // Strict-template-safe computed getters
  userName   = computed(() => this._user()?.name?.split(' ')[0] ?? '');
  userAvatar = computed(() => this._user()?.avatar ?? '');
  userPhoto  = computed(() => this._user()?.photoUrl ?? null);
  userBadge  = computed(() =>
    this._user()?.provider === 'google' ? '🔵 Google' : '✉ Email'
  );

  navItems: NavItem[] = [
    { path: 'converter',  label: 'Converter',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>` },
    { path: 'compare',    label: 'Compare',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` },
    { path: 'arithmetic', label: 'Arithmetic',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>` },
    { path: 'history',    label: 'History',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
  ];

  private pageMeta: Record<string, { title: string; icon: string }> = {
    converter:  { title: 'Unit Converter',      icon: `<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>` },
    compare:    { title: 'Compare Quantities',  icon: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>` },
    arithmetic: { title: 'Quantity Arithmetic', icon: `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>` },
    history:    { title: 'History',             icon: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>` },
  };

  currentPageTitle = signal('Unit Converter');
  currentPageIcon  = signal(this.pageMeta['converter'].icon);

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: unknown) => {
        const nav = e as NavigationEnd;
        const seg = nav.urlAfterRedirects.split('/').pop() ?? 'converter';
        const m   = this.pageMeta[seg];
        if (m) {
          this.currentPageTitle.set(m.title);
          this.currentPageIcon.set(m.icon);
        }
      });
  }

  closeSidebar(): void { this.sidebarOpen.set(false); }

  logout(): void {
    this.auth.signOut();
    this.toast.show('Signed out successfully', 'success');
  }
}
