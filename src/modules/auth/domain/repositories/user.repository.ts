import { AuthUser } from '../entities/auth-user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findByUsername(username: string): Promise<AuthUser | null>;
}
