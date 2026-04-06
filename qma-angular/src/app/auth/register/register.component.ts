import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="form-card">
      <h2>Create account</h2>
      <p>Start measuring smarter today</p>

      <!-- ── Google Sign-Up (GSI SDK) ── -->
      <button class="google-btn"
              (click)="googleSignIn()"
              [disabled]="auth.googleLoading()">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        @if (auth.googleLoading()) {
          <span class="g-spinner"></span>&nbsp;Connecting to Google…
        } @else {
          Sign up with Google
        }
      </button>

      <div class="or-row"><span>or sign up with email</span></div>

      <!-- Name row -->
      <div class="two-col">
        <div class="field">
          <label>First name</label>
          <div class="field-wrap no-ico">
            <input type="text" placeholder="Jane" [(ngModel)]="firstName" name="fn"/>
          </div>
        </div>
        <div class="field">
          <label>Last name</label>
          <div class="field-wrap no-ico">
            <input type="text" placeholder="Doe" [(ngModel)]="lastName" name="ln"/>
          </div>
        </div>
      </div>

      <!-- Email -->
      <div class="field">
        <label>Email address</label>
        <div class="field-wrap">
          <svg class="field-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <input type="email" placeholder="you@example.com"
                 [(ngModel)]="email" name="email"/>
        </div>
      </div>

      <!-- Password -->
      <div class="field">
        <label>Password</label>
        <div class="field-wrap">
          <svg class="field-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <input [type]="showPw() ? 'text' : 'password'"
                 placeholder="Min. 8 characters"
                 [(ngModel)]="password" name="password"/>
          <button type="button" class="eye-btn" (click)="showPw.set(!showPw())">
            @if (showPw()) {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            }
          </button>
        </div>
        <div class="str-bar">
          <div class="str-fill"
               [style.width]="strength().pct"
               [style.background]="strength().color"></div>
        </div>
        <span class="str-lbl" [style.color]="strength().color">{{ strength().label }}</span>
      </div>

      <!-- Terms -->
      <label class="check-lbl terms-lbl">
        <input type="checkbox" [(ngModel)]="terms" name="terms"/>
        I agree to the <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>
      </label>

      <button class="cta-btn" (click)="submit()" [disabled]="emailLoading()">
        @if (emailLoading()) { Creating… } @else { Create Account }
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </button>

      <p class="switch-txt">
        Already have an account? <a routerLink="/auth/login">Sign in</a>
      </p>
    </div>
  `
})
export class RegisterComponent {
  auth  = inject(AuthService);
  private toast = inject(ToastService);

  firstName    = '';
  lastName     = '';
  email        = '';
  password     = '';
  terms        = false;
  emailLoading = signal(false);
  showPw       = signal(false);

  strength = computed(() => {
    const pw = this.password;
    let s = 0;
    if (pw.length >= 8)          s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    const levels = [
      { pct: '0%',   color: 'transparent', label: '' },
      { pct: '25%',  color: '#e8857a',     label: 'Weak' },
      { pct: '50%',  color: '#f0b87a',     label: 'Fair' },
      { pct: '75%',  color: '#87d4b3',     label: 'Good' },
      { pct: '100%', color: '#5fb892',     label: 'Strong' },
    ];
    return levels[s];
  });

  submit(): void {
    if (!this.firstName || !this.lastName || !this.email || !this.password) {
      this.toast.show('Please fill in all fields', 'error'); return;
    }
    if (!this.email.includes('@')) {
      this.toast.show('Enter a valid email address', 'error'); return;
    }
    if (this.password.length < 8) {
      this.toast.show('Password must be at least 8 characters', 'error'); return;
    }
    if (!this.terms) {
      this.toast.show('Please accept the terms & privacy policy', 'error'); return;
    }
    this.emailLoading.set(true);
    const res = this.auth.signUpWithEmail(this.firstName, this.lastName, this.email, this.password);
    this.emailLoading.set(false);
    if (res.success) {
      this.toast.show('Account created — welcome! 🎉', 'success');
    } else {
      this.toast.show(res.error ?? 'Registration failed', 'error');
    }
  }

  async googleSignIn(): Promise<void> {
    try {
      await this.auth.signInWithGoogle();
      this.toast.show('Signed in with Google! 👋', 'success');
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? '';
      if (msg.includes('not loaded')) {
        this.toast.show(msg, 'error');
      } else {
        this.toast.show('Google sign-in was cancelled. Please try again.', 'error');
      }
    }
  }
}
