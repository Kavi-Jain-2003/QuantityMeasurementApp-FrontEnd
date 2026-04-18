# QMA — Quantity Measurement App (Angular 17)

A fully standalone Angular 17 app with:
- **Auth**: Login, Register, Mock Google Sign-In
- **Dashboard**: Converter, Compare, Arithmetic, History
- **Theme**: Blush & Eucalyptus (dark + light toggle)
- **Route Guards**: Auth guard protects dashboard; Guest guard redirects logged-in users away from auth pages
- **Signals**: Angular 17 signals used throughout for reactive state
- **Lazy Loading**: Every route is lazy-loaded for fast startup

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start dev server
```bash
ng serve --open
# or
npm start
```

Opens at **http://localhost:4200**

---

## 📁 Project Structure

```
src/app/
├── app.component.ts          # Root (RouterOutlet + Toast)
├── app.config.ts             # provideRouter, provideAnimations
├── app.routes.ts             # All lazy routes + guards
│
├── auth/
│   ├── auth-shell.component.ts   # Wraps login/register with hero panel
│   ├── login/login.component.ts
│   └── register/register.component.ts
│
├── layout/
│   └── dashboard-shell.component.ts  # Sidebar + topbar wrapper
│
├── dashboard/
│   ├── converter/converter.component.ts
│   ├── compare/compare.component.ts
│   ├── arithmetic/arithmetic.component.ts
│   └── history/history.component.ts
│
└── shared/
    ├── models/
    │   ├── user.model.ts
    │   └── history.model.ts
    ├── services/
    │   ├── auth.service.ts      # Login/signup/Google mock + session
    │   ├── units.service.ts     # All unit data + conversion logic
    │   ├── history.service.ts   # Signal-based history with localStorage
    │   ├── theme.service.ts     # Dark/light toggle
    │   └── toast.service.ts     # Toast notification system
    ├── guards/
    │   └── auth.guard.ts        # authGuard + guestGuard
    └── toast/
        └── toast.component.ts
```

---

## 🔐 Auth Flow

- **Email Sign Up** → stores hashed credentials in `localStorage`
- **Email Sign In** → validates against stored credentials
- **Mock Google** → randomly picks one of 4 mock Google users (900ms delay to simulate OAuth)
- **Session** → persists in `localStorage`; auto-restored on page reload via `AuthService` constructor
- **Guards** → `authGuard` redirects unauthenticated users to `/auth/login`; `guestGuard` redirects logged-in users away from auth pages

---

## 📐 Units Supported

| Category    | Units |
|-------------|-------|
| Length      | m, km, cm, mm, mi, yd, ft, in, nmi |
| Weight      | kg, g, mg, lb, oz, t, st |
| Temperature | °C, °F, K, R |
| Volume      | L, mL, m³, cm³, gal, qt, pt, fl oz, cup |

---

## 🛠 Tech

- Angular **17.3** — standalone components throughout
- Angular **Signals** for reactive state (no NgRx needed)
- Angular Router with **lazy loading** + **view transitions**
- **No Firebase**, no external auth library
- Pure CSS (global `styles.css`) — no component-level style encapsulation issues
