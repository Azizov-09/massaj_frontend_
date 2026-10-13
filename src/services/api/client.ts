// ═══════════════════════════════════════════════════════
//  API Client Layer — Core HTTP Engine
// ═══════════════════════════════════════════════════════

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  statusCode?: number;
}

export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function resolveDefaultBaseUrl(): string {
  const isTest =
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
    (import.meta as any).env?.MODE === 'test' ||
    Boolean((import.meta as any).env?.VITEST);

  const envUrl = (import.meta as any).env?.VITE_API_URL;

  if (isTest) {
    if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) {
      return envUrl;
    }
    return 'http://localhost:3000/api/v1';
  }

  if (envUrl) {
    if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
      return envUrl;
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${envUrl.startsWith('/') ? '' : '/'}${envUrl}`;
    }
    return `http://localhost:3000${envUrl.startsWith('/') ? '' : '/'}${envUrl}`;
  }

  const isBrowser =
    typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    window.location &&
    window.location.origin &&
    window.location.protocol.startsWith('http');

  if (isBrowser) {
    return `${window.location.origin}/api/v1`;
  }

  return '/api/v1';
}

const BASE_URL = resolveDefaultBaseUrl();

export interface RequestOptions extends RequestInit {
  _retry?: boolean;
}

export class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private baseUrl: string;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    this.refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('access_token', token);
      } else {
        localStorage.removeItem('access_token');
      }
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
    return this.token;
  }

  public setRefreshToken(token: string | null) {
    this.refreshToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('refresh_token', token);
      } else {
        localStorage.removeItem('refresh_token');
      }
    }
  }

  public getRefreshToken(): string | null {
    if (!this.refreshToken && typeof window !== 'undefined') {
      this.refreshToken = localStorage.getItem('refresh_token');
    }
    return this.refreshToken;
  }

  public async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const storedRefreshToken = this.getRefreshToken();
        // If there is no valid refresh token stored (backend requires at least 20 chars), don't fire request
        if (!storedRefreshToken || storedRefreshToken.length < 20) {
          this.setToken(null);
          this.setRefreshToken(null);
          return null;
        }

        const refreshUrl = this.buildUrl('/auth/refresh');
        const res = await fetch(refreshUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            refreshToken: storedRefreshToken,
          }),
        });

        if (!res.ok) {
          throw new Error('Token refresh rejected');
        }

        const data = await res.json();
        const newAccess = data?.accessToken || data?.data?.accessToken || data?.token;
        const newRefresh = data?.refreshToken || data?.data?.refreshToken;

        if (newAccess) {
          this.setToken(newAccess);
          if (newRefresh) {
            this.setRefreshToken(newRefresh);
          }
          return newAccess;
        }
        return null;
      } catch {
        this.setToken(null);
        this.setRefreshToken(null);
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${this.baseUrl}${cleanEndpoint}`;

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }

    return url;
  }

  public async request<T>(
    endpoint: string,
    options: RequestOptions = {},
    params?: Record<string, any>
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // for HttpOnly refresh cookie from NestJS backend
      });

      if (!response.ok) {
        // Automatic 401 retry interceptor
        if (response.status === 401) {
          console.warn('[ApiClient] 401 Unauthorized encountered from backend:', url);
          const isAuthPath = endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh');
          if (!isAuthPath && !options._retry) {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              return this.request<T>(endpoint, { ...options, _retry: true }, params);
            }
          }
        }

        let errData: any;
        try {
          errData = await response.json();
        } catch {
          errData = { message: response.statusText };
        }

        const friendlyErrors: Record<number, string> = {
          400: "Kiritilgan ma'lumotlar noto'g'ri. Iltimos, tekshirib qaytadan kiriting.",
          401: "Telefon raqami yoki parol noto'g'ri.",
          403: "Kirish taqiqlangan. Sizda bu amalni bajarish uchun ruxsat yo'q.",
          404: "So'ralgan ma'lumot yoki sahifa topilmadi.",
          405: "Server so'rovni qabul qilmadi. Iltimos, sahifani yangilang.",
          409: "Bu ma'lumot tizimda allaqachon mavjud.",
          422: "Kiritilgan ma'lumotlar talabga javob bermaydi.",
          429: "Juda ko'p urinish qilindi. Iltimos, 1 daqiqa kutib qaytadan urinib ko'ring.",
          500: "Serverda ichki xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.",
          502: "Server vaqtincha javob bermayapti. Iltimos, birozdan so'ng qayta urinib ko'ring.",
          503: "Xizmat vaqtincha ishlamayapti. Iltimos, birozdan so'ng qayta urinib ko'ring.",
        };

        let rawMsg = Array.isArray(errData?.message)
          ? errData.message.join(', ')
          : errData?.message || '';

        const lower = rawMsg.toLowerCase();
        let errorMessage = '';

        if (lower.includes('invalid phone or password') || lower.includes('invalid credentials')) {
          errorMessage = "Telefon raqami yoki parol noto'g'ri.";
        } else if (lower.includes('inactive account') || lower.includes('account is inactive')) {
          errorMessage = "Ushbu hisob faol emas yoki bloklangan. Administratorga murojaat qiling.";
        } else if (lower.includes('user not found')) {
          errorMessage = "Foydalanuvchi topilmadi.";
        } else if (lower.includes('phone must be') || lower.includes('valid phone')) {
          errorMessage = "Telefon raqami noto'g'ri formatda kiritildi.";
        } else if (lower.includes('password must be')) {
          errorMessage = "Parol kamida 6 ta belgidan iborat bo'lishi kerak.";
        } else if (lower.includes('rate limit') || lower.includes('throttl') || lower.includes('too many requests')) {
          errorMessage = "Juda ko'p urinish qilindi. Iltimos, 1 daqiqa kuting.";
        } else if (friendlyErrors[response.status]) {
          errorMessage = friendlyErrors[response.status];
        } else if (rawMsg) {
          errorMessage = rawMsg;
        } else {
          errorMessage = `Xatolik yuz berdi (${response.status}). Iltimos, qayta urinib ko'ring.`;
        }

        throw new ApiError(errorMessage, response.status, errData);
      }

      if (response.status === 204) {
        return null as unknown as T;
      }

      const json = await response.json();
      return json as T;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err?.message || "Internet aloqasi yo'q yoki server javob bermayapti. Iltimos, internetni tekshiring.", 0);
    }
  }

  public get<T>(endpoint: string, params?: Record<string, any>, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' }, params);
  }

  public post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
