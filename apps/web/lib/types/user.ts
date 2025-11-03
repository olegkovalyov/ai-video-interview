export interface User {
  sub: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  [key: string]: unknown;
}
