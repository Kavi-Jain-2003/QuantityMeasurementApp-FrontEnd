import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);

  private readonly MOCK_GOOGLE_USERS: User[] = [
    { name: 'Alex Johnson',  email: 'alex.johnson@gmail.com',  avatar: 'A', provider: 'google' },
    { name: 'Sam Rivera',    email: 'sam.rivera@gmail.com',    avatar: 'S', provider: 'google' },
    { name: 'Morgan Lee',    email: 'morgan.lee@gmail.com',    avatar: 'M', provider: 'google' },
    { name: 'Jamie Chen',    email: 'jamie.chen@gmail.com',    avatar: 'J', provider: 'google' },
  ];

  constructor(private router: Router) {
    // Restore session from localStorage
    const saved = localStorage.getItem('qma_session');
    if (saved) {
      try { this.currentUser.set(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }

  signInWithEmail(email: string, password: string): { success: boolean; error?: string } {
    const key = `qma_u_${email}`;
    const saved = localStorage.getItem(key);
    if (!saved) return { success: false, error: 'Account not found. Please sign up first.' };
    const user = JSON.parse(saved);
    if (user.pw !== btoa(password)) return { success: false, error: 'Incorrect password.' };
    const u: User = { name: user.name, email, avatar: user.name[0].toUpperCase(), provider: 'email' };
    this.setUser(u);
    return { success: true };
  }

  signUpWithEmail(
    firstName: string, lastName: string,
    email: string, password: string
  ): { success: boolean; error?: string } {
    const key = `qma_u_${email}`;
    if (localStorage.getItem(key)) return { success: false, error: 'Email already registered.' };
    const name = `${firstName} ${lastName}`;
    localStorage.setItem(key, JSON.stringify({ name, pw: btoa(password) }));
    const u: User = { name, email, avatar: firstName[0].toUpperCase(), provider: 'email' };
    this.setUser(u);
    return { success: true };
  }

  signInWithGoogle(): User {
    const u = this.MOCK_GOOGLE_USERS[Math.floor(Math.random() * this.MOCK_GOOGLE_USERS.length)];
    this.setUser(u);
    return u;
  }

  signOut(): void {
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
