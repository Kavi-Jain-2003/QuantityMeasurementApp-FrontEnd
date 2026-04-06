export interface User {
  name: string;
  email: string;
  avatar: string;       // first letter fallback
  photoUrl?: string;    // Google profile picture URL
  provider: 'email' | 'google';
}
