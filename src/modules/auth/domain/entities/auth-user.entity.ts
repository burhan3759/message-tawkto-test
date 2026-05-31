export type UserRole = 'user' | 'admin';

export type AuthUser = {
  id: string;
  username: string;
  password: string;
  role: UserRole;
};
