export interface User {
  name: string;
  email: string;
  avatar: string;
  provider: 'email' | 'google';
}
