import type { ApiClient } from './client';
import type { LoginDto, LoginResponse, RefreshDto, ChangePasswordDto } from './types';

export class AuthApi {
  constructor(private client: ApiClient) {}

  public async login(dto: LoginDto): Promise<LoginResponse> {
    const res = await this.client.post<any>('/auth/login', dto);
    // Support nested data structures: res.data or direct res
    const token = res?.accessToken || res?.data?.accessToken || res?.token;
    const user = res?.user || res?.data?.user;
    if (token) {
      this.client.setToken(token);
    }
    return {
      accessToken: token,
      user: user || {
        id: 'user-me',
        phone: dto.phone,
        role: 'SUPER_ADMIN',
      },
    };
  }

  public async refresh(dto: RefreshDto): Promise<{ accessToken: string; refreshToken?: string }> {
    const res = await this.client.post<any>('/auth/refresh', dto);
    const token = res?.accessToken || res?.data?.accessToken;
    if (token) {
      this.client.setToken(token);
    }
    return res;
  }

  public async logout(refreshToken?: string): Promise<void> {
    try {
      await this.client.post('/auth/logout', refreshToken ? { refreshToken } : {});
    } finally {
      this.client.setToken(null);
    }
  }

  public async logoutAll(): Promise<void> {
    try {
      await this.client.post('/auth/logout-all');
    } finally {
      this.client.setToken(null);
    }
  }

  public async changePassword(dto: ChangePasswordDto): Promise<void> {
    await this.client.post('/auth/change-password', dto);
  }
}
