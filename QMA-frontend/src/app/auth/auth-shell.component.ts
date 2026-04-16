import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../shared/services/auth.service';
import { ThemeService } from '../shared/services/theme.service';

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

      <!-- FIX 3: Dark mode toggle on login page -->
      <div class="auth-actions">
      <button class="guest-btn" (click)="auth.continueAsGuest()"
              title="Enter the dashboard without signing in">
        Continue as Guest
      </button>

      <button class="auth-theme-btn" (click)="theme.toggle()"
              [title]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
        @if (theme.isDark()) {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        } @else {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
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
  `,
  styles: [`
    .auth-actions {
      position: fixed;
      top: 1.2rem;
      right: 1.2rem;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .auth-theme-btn {
      background: var(--card-bg, rgba(255,255,255,0.1));
      border: 1px solid var(--border, rgba(255,255,255,0.15));
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text, #fff);
      transition: background 0.2s, box-shadow 0.2s;
      backdrop-filter: blur(8px);
    }
    .guest-btn {
      border: 1px solid var(--border, rgba(255,255,255,0.15));
      background: var(--card-bg, rgba(255,255,255,0.12));
      color: var(--text, #fff);
      border-radius: 999px;
      padding: 0.6rem 1rem;
      font-size: 0.86rem;
      font-weight: 700;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    }
    .guest-btn:hover {
      background: var(--accent, #6c63ff);
      color: #fff;
      transform: translateY(-1px);
      box-shadow: 0 0 0 3px rgba(108,99,255,0.18);
    }
    .auth-theme-btn:hover {
      background: var(--accent, #6c63ff);
      color: #fff;
      box-shadow: 0 0 0 3px rgba(108,99,255,0.25);
    }
  `]
})
export class AuthShellComponent {
  auth  = inject(AuthService);
  theme = inject(ThemeService);
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
