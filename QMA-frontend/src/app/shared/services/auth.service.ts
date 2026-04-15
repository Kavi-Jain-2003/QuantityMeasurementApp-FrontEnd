import { Injectable, signal, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser   = signal<User | null>(null);
  googleLoading = signal(false);

  private router = inject(Router);
  private zone   = inject(NgZone);
  private http   = inject(HttpClient);

  constructor() {
    const saved = localStorage.getItem('qma_session');
    const jwt   = localStorage.getItem('qma_jwt');
    // FIX 1: Only restore session if JWT is also present (prevents dashboard on first load)
    if (saved && jwt) {
      try { this.currentUser.set(JSON.parse(saved)); } catch { /* ignore */ }
    } else {
      // Clear stale session that has no JWT
      localStorage.removeItem('qma_session');
    }
    this.initGoogleGSI();
  }

  setUserFromBackend(username: string, displayName?: string): void {
    const name = displayName ?? username;
    const u: User = {
      name,
      email:    username,
      avatar:   name[0].toUpperCase(),
      provider: 'email'
    };
    this.setUser(u);
  }

  private initGoogleGSI(): void {
    const tryInit = () => {
      if (typeof google !== 'undefined' && google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response) => {
            this.zone.run(() => this.handleGSICredential(response));
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });
      } else {
        setTimeout(tryInit, 200);
      }
    };
    tryInit();
  }

  // FIX 2: After parsing Google token, call backend /auth/google to store user in DB and get JWT
  private handleGSICredential(response: GoogleCredentialResponse): void {
    try {
      const payload = JSON.parse(
        atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      ) as { name?: string; email: string; picture?: string; given_name?: string };

      const name = payload.name || payload.given_name || payload.email.split('@')[0];
      const u: User = {
        name,
        email:    payload.email,
        avatar:   name[0].toUpperCase(),
        photoUrl: payload.picture,
        provider: 'google'
      };

      // Call backend to persist Google user in DB and receive a JWT
      this.http.post<{ token: string }>(
        `${environment.apiUrl}/auth/google`,
        { email: payload.email, name, provider: 'google' }
      ).subscribe({
        next: (res) => {
          localStorage.setItem('qma_jwt', res.token);
          this.googleLoading.set(false);
          this.setUser(u);
        },
        error: () => {
          // Fallback: log in locally even if backend is unreachable
          this.googleLoading.set(false);
          this.setUser(u);
        }
      });
    } catch (err) {
      this.googleLoading.set(false);
      console.error('Failed to parse Google credential:', err);
      throw new Error('PARSE_ERROR');
    }
  }

  signInWithGoogle(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google?.accounts?.id) {
        reject(new Error('Google GSI SDK not loaded. Check your internet connection.'));
        return;
      }
      this.googleLoading.set(true);
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response) => {
          this.zone.run(() => {
            try { this.handleGSICredential(response); resolve(); }
            catch (err) { reject(err); }
          });
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });
      google.accounts.id.prompt();
    });
  }

  signOut(): void {
    localStorage.removeItem('qma_jwt');
    if (typeof google !== 'undefined' && google?.accounts?.id) {
      google.accounts.id.disableAutoSelect();
      const email = this.currentUser()?.email;
      if (email && this.currentUser()?.provider === 'google') {
        google.accounts.id.revoke(email, () => {});
      }
    }
    this.currentUser.set(null);
    localStorage.removeItem('qma_session');
    this.router.navigate(['/auth/login']);
  }

  // FIX 1: Requires both session signal AND a JWT in storage
  isAuthenticated(): boolean {
    return this.currentUser() !== null && !!localStorage.getItem('qma_jwt');
  }

  setUser(u: User): void {
    this.currentUser.set(u);
    localStorage.setItem('qma_session', JSON.stringify(u));
    this.router.navigate(['/dashboard/converter']);
  }
}