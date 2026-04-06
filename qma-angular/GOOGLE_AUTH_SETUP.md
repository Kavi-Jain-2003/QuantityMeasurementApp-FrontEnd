# 🔐 Google Sign-In Setup (Google Cloud Console)

This app uses **Google Identity Services (GSI)** — Google's official JavaScript SDK
loaded directly from accounts.google.com. No npm auth library needed.

---

## Step 1 — Create / Open a Google Cloud Project

1. Open https://console.cloud.google.com
2. Top bar → project dropdown → **New Project**
3. Give it a name (e.g. `qma-app`) → **Create**

---

## Step 2 — Configure the OAuth Consent Screen

1. Left sidebar → **APIs & Services** → **OAuth consent screen**
2. User Type: **External** → **Create**
3. Fill in:
   - App name: `QMA`
   - User support email: *(your Gmail)*
   - Developer contact email: *(your Gmail)*
4. Click **Save and Continue** through all remaining steps
5. On **Test users**: click **+ Add users** → add your own Gmail address
   *(Required while the app is in "Testing" publishing status)*

---

## Step 3 — Create OAuth 2.0 Credentials

1. **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `QMA Web`
5. **Authorised JavaScript origins** → **+ Add URI**:
   ```
   http://localhost:4200
   ```
6. **Authorised redirect URIs** → **+ Add URI**:
   ```
   http://localhost:4200
   ```
7. Click **Create**
8. A dialog shows your **Client ID** — copy it.
   It looks like: `123456789-abcdefg.apps.googleusercontent.com`

---

## Step 4 — Paste Client ID into the app

Open `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  googleClientId: 'PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com'
};
```

Same for `src/environments/environment.production.ts`.

---

## Step 5 — Run

```bash
npm install
ng serve --open
```

Click **Continue with Google** on the login or register page.
Google's One-Tap / popup appears — select your account.
After sign-in: your real Google name and profile photo appear in the sidebar.

---

## How it works (no backend)

| Step | Detail |
|------|--------|
| User clicks Google button | `google.accounts.id.prompt()` shows Google's UI |
| User selects account | Google returns a signed JWT `id_token` |
| App decodes JWT payload | Extracts `name`, `email`, `picture` |
| User stored in Signal + localStorage | Session persists across page refresh |
| Sign out | `google.accounts.id.disableAutoSelect()` + `revoke()` |

---

## Deploying to Production

Add your live domain in Google Cloud Console → Credentials → your OAuth client:

**Authorised JavaScript origins:**
```
https://yourdomain.com
```

Then rebuild:
```bash
ng build   # uses environment.production.ts automatically
```

Deploy `dist/qma-angular/browser/` to Netlify, Vercel, or any static host.
