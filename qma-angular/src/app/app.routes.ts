import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/auth-shell.component').then(m => m.AuthShellComponent),
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/dashboard-shell.component').then(m => m.DashboardShellComponent),
    children: [
      { path: '', redirectTo: 'converter', pathMatch: 'full' },
      {
        path: 'converter',
        loadComponent: () => import('./dashboard/converter/converter.component').then(m => m.ConverterComponent)
      },
      {
        path: 'compare',
        loadComponent: () => import('./dashboard/compare/compare.component').then(m => m.CompareComponent)
      },
      {
        path: 'arithmetic',
        loadComponent: () => import('./dashboard/arithmetic/arithmetic.component').then(m => m.ArithmeticComponent)
      },
      {
        path: 'history',
        loadComponent: () => import('./dashboard/history/history.component').then(m => m.HistoryComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];
