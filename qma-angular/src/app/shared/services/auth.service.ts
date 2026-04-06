import { Injectable, signal, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

/**
 * AuthService — handles Google Sign-In via the official GSI SDK
 * (accounts.google.com/gsi/client loaded in index.html) plus
 * email/password stored in localStorage.
 *
 * NO third-party npm auth library — zero peer-dependency conflicts.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser    = signal<User | null>(null);
  googleLoading  = signal(false);

  private router = inject(Router);
  private zone   = inject(NgZone);

  constructor() {
    // Restore previous session
    const saved = localStorage.getItem('qma_session');
    if (saved) {
      try { this.currentUser.set(JSON.parse(saved)); } catch { /* ignore */ }
    }

    // Initialise Google GSI after the SDK script has loaded
    this.initGoogleGSI();
  }

  // ── Initialise Google Identity Services ─────────────────────────
  private initGoogleGSI(): void {
    // GSI loads asynchronously — wait for it to be available
    const tryInit = () => {
      if (typeof google !== 'undefined' && google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response) => {
            // Run inside Angular zone so change detection fires
            this.zone.run(() => this.handleGSICredential(response));
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });
      } else {
        // SDK not loaded yet — retry in 200ms
        setTimeout(tryInit, 200);
      }
    };
    tryInit();
  }

  // ── Parse the JWT id_token returned by GSI ──────────────────────
  private handleGSICredential(response: GoogleCredentialResponse): void {
    try {
      // Decode the JWT payload (middle part) — base64url encoded
      const payload = JSON.parse(
        atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      ) as {
        name?: string;
        email: string;
        picture?: string;
        given_name?: string;
      };

      const name = payload.name || payload.given_name || payload.email.split('@')[0];
      const u: User = {
        name,
        email:    payload.email,
        avatar:   name[0].toUpperCase(),
        photoUrl: payload.picture,
        provider: 'google'
      };

      this.googleLoading.set(false);
      this.setUser(u);
    } catch (err) {
      this.googleLoading.set(false);
      console.error('Failed to parse Google credential:', err);
      throw new Error('PARSE_ERROR');
    }
  }

  // ── Trigger Google Sign-In popup ─────────────────────────────────
  signInWithGoogle(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google?.accounts?.id) {
        reject(new Error('Google GSI SDK not loaded. Check your internet connection.'));
        return;
      }

      this.googleLoading.set(true);

      // Temporarily override the callback to capture resolve/reject
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response) => {
          this.zone.run(() => {
            try {
              this.handleGSICredential(response);
              resolve();
            } catch (err) {
              reject(err);
            }
          });
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Show the Google One-Tap / popup
      google.accounts.id.prompt();
    });
  }

  // ── Email sign-in (localStorage — no backend needed) ────────────
  signInWithEmail(email: string, password: string): { success: boolean; error?: string } {
    const saved = localStorage.getItem(`qma_u_${email}`);
    if (!saved) return { success: false, error: 'Account not found. Please sign up first.' };
    const stored = JSON.parse(saved);
    if (stored.pw !== btoa(password)) return { success: false, error: 'Incorrect password.' };
    this.setUser({ name: stored.name, email, avatar: stored.name[0].toUpperCase(), provider: 'email' });
    return { success: true };
  }

  // ── Email sign-up (localStorage) ────────────────────────────────
  signUpWithEmail(
    firstName: string, lastName: string,
    email: string, password: string
  ): { success: boolean; error?: string } {
    const key = `qma_u_${email}`;
    if (localStorage.getItem(key)) return { success: false, error: 'Email already registered.' };
    const name = `${firstName} ${lastName}`;
    localStorage.setItem(key, JSON.stringify({ name, pw: btoa(password) }));
    this.setUser({ name, email, avatar: firstName[0].toUpperCase(), provider: 'email' });
    return { success: true };
  }

  // ── Sign out ─────────────────────────────────────────────────────
  signOut(): void {
    // Disable Google auto-select so user must pick account next time
    if (typeof google !== 'undefined' && google?.accounts?.id) {
      google.accounts.id.disableAutoSelect();
      // Revoke Google token if we have the user's email
      const email = this.currentUser()?.email;
      if (email && this.currentUser()?.provider === 'google') {
        google.accounts.id.revoke(email, () => {});
      }
    }
    this.currentUser.set(null);
    localStorage.removeItem('qma_session');
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  private setUser(u: User): void {
    this.currentUser.set(u);
    localStorage.setItem('qma_session', JSON.stringify(u));
    this.router.navigate(['/dashboard/converter']);
  }
}
