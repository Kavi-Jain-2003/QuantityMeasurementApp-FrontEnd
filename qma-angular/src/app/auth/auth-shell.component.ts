import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <div class="auth-section">
      <!-- Animated BG -->
      <div class="auth-bg">
        <div class="orb orb1"></div>
        <div class="orb orb2"></div>
        <div class="orb orb3"></div>
        <div class="grid-lines"></div>
      </div>

      <!-- Left: Form panel -->
      <div class="auth-panel">
        <div class="auth-inner">

          <!-- Brand -->
          <div class="brand">
            <div class="brand-icon">
              <svg viewBox="0 0 44 44" fill="none">
                <circle cx="22" cy="22" r="20" stroke="var(--accent)" stroke-width="2"/>
                <path d="M13 22h18M22 13v18" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="22" cy="22" r="5" fill="var(--accent)" opacity="0.3"/>
                <circle cx="22" cy="22" r="2.5" fill="var(--accent)"/>
              </svg>
            </div>
            <span class="brand-name">Qu&#64;nt!tyMe&#64;surementAPP</span>
          </div>

          <!-- Tab toggle -->
          <div class="tab-toggle">
            <button class="tab-btn" [class.active]="isLogin" (click)="go('login')">Sign In</button>
            <button class="tab-btn" [class.active]="!isLogin" (click)="go('register')">Sign Up</button>
            <span class="tab-track" [class.signup]="!isLogin"></span>
          </div>

          <!-- Routed form -->
          <router-outlet />

        </div>
      </div>

      <!-- Right: Hero panel -->
      <div class="auth-hero">
        <div class="hero-inner">
          <div class="hero-badge">✦ Professional Tools</div>
          <h1>Measure.<br/>Convert.<br/>Compare.</h1>
          <p>A complete workspace for length, weight, temperature and volume — with real-time precision and a beautiful interface.</p>
          <div class="hero-pills">
            <span>📏 Length</span><span>⚖️ Weight</span>
            <span>🌡️ Temperature</span><span>💧 Volume</span>
            <span>➕ Arithmetic</span><span>⚡ Instant</span>
          </div>
          <div class="hero-stats">
            <div class="stat"><span>30+</span><small>Units</small></div>
            <div class="stat-div"></div>
            <div class="stat"><span>4</span><small>Categories</small></div>
            <div class="stat-div"></div>
            <div class="stat"><span>∞</span><small>History</small></div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuthShellComponent {
  isLogin = true;

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.isLogin = this.router.url.includes('login');
    });
  }

  go(path: string): void {
    this.router.navigate(['/auth', path]);
  }
}
