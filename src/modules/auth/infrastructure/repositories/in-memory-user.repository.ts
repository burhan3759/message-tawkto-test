import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly users: AuthUser[] = [
    {
      id: 'user-1',
      username: 'demo',
      password: 'demo123',
      role: 'user',
      tenantId: 'tenant-1',
    },
    {
      id: 'user-2',
      username: 'demo2',
      password: 'demo123',
      role: 'user',
      tenantId: 'tenant-2',
    },
  ];

  async findByUsername(username: string): Promise<AuthUser | null> {
    const user = this.users.find((item) => item.username === username);
    return user ?? null;
  }
}
