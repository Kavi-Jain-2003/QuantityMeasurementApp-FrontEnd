/**
 * Minimal TypeScript typings for Google Identity Services (GSI) SDK.
 * Loaded via <script src="https://accounts.google.com/gsi/client">.
 * Full typings: https://developers.google.com/identity/gsi/web/reference/js-reference
 */

interface GoogleCredentialResponse {
  credential: string;       // JWT id_token
  select_by: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  prompt(): void;
  disableAutoSelect(): void;
  revoke(hint: string, done: () => void): void;
}

interface GoogleOAuth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: { access_token?: string; error?: string }) => void;
  }): { requestAccessToken(): void };
}

interface Google {
  accounts: {
    id: GoogleAccountsId;
    oauth2: GoogleOAuth2;
  };
}

declare const google: Google;
