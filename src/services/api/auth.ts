import type { ApiClient } from './client';
import type { LoginDto, LoginResponse, RefreshDto, ChangePasswordDto } from './types';

export class AuthApi {
  constructor(private client: ApiClient) {}

  public async login(dto: LoginDto): Promise<LoginResponse> {
    const res = await this.client.post<any>('/auth/login', dto);
    // Support nested data structures: res.data or direct res
    const token = res?.accessToken || res?.data?.accessToken || res?.token;
    const refreshToken = res?.refreshToken || res?.data?.refreshToken;
    const user = res?.user || res?.data?.user;
    if (token) {
      this.client.setToken(token);
    }
    if (refreshToken) {
      this.client.setRefreshToken(refreshToken);
    }
    return {
      accessToken: token,
      refreshToken,
      user: user || {
        id: 'user-me',
        phone: dto.phone,
        role: 'SUPER_ADMIN',
      },
    };
  }

  public async refresh(dto?: RefreshDto): Promise<{ accessToken: string; refreshToken?: string }> {
    const tokenToSend = dto?.refreshToken || this.client.getRefreshToken() || '';
    const res = await this.client.post<any>('/auth/refresh', { refreshToken: tokenToSend });
    const token = res?.accessToken || res?.data?.accessToken;
    const newRefresh = res?.refreshToken || res?.data?.refreshToken;
    if (token) {
      this.client.setToken(token);
    }
    if (newRefresh) {
      this.client.setRefreshToken(newRefresh);
    }
    return res;
  }

  public async logout(refreshToken?: string): Promise<void> {
    try {
      const token = refreshToken || this.client.getRefreshToken();
      await this.client.post('/auth/logout', token ? { refreshToken: token } : {});
    } finally {
      this.client.setToken(null);
      this.client.setRefreshToken(null);
    }
  }

  public async logoutAll(): Promise<void> {
    try {
      await this.client.post('/auth/logout-all');
    } finally {
      this.client.setToken(null);
      this.client.setRefreshToken(null);
    }
  }

  public async changePassword(dto: ChangePasswordDto): Promise<void> {
    await this.client.post('/auth/change-password', dto);
  }
}
