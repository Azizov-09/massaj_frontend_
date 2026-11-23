import { ApiError } from "./client";
import type { ApiClient } from "./client";
import type { LoginDto, LoginResponse, ChangePasswordDto } from "./types";

export class AuthApi {
  constructor(private client: ApiClient) {}

  public async login(dto: LoginDto): Promise<LoginResponse> {
    const res = await this.client.post<any>("/auth/login", dto);
    // Support nested data structures: res.data or direct res
    const token = res?.accessToken || res?.data?.accessToken || res?.token;
    const refreshToken = res?.refreshToken || res?.data?.refreshToken;
    const user = res?.user || res?.data?.user;
    if (
      !token ||
      !user?.id ||
      !["SUPER_ADMIN", "ADMIN", "PARENT", "SPECIALIST"].includes(user.role)
    )
      throw new ApiError("Server foydalanuvchini tasdiqlamadi", 502);
    if (token) {
      this.client.setToken(token);
    }
    if (refreshToken) {
      this.client.setInMemoryRefreshToken(refreshToken);
    }
    return {
      accessToken: token,
      refreshToken,
      user,
    };
  }

  public async logout(refreshToken?: string): Promise<void> {
    try {
      const token = refreshToken || this.client.getInMemoryRefreshToken();
      await this.client.post(
        "/auth/logout",
        token ? { refreshToken: token } : {},
      );
    } catch {
      // Ignored
    } finally {
      this.client.setToken(null);
      this.client.setInMemoryRefreshToken(null);
    }
  }

  public async changePassword(dto: ChangePasswordDto): Promise<void> {
    await this.client.post("/auth/change-password", dto);
  }
}
