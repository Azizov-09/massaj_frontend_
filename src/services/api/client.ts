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

// Ensure default points directly to Render backend URL
const BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'https://massaj-backend.onrender.com/api/v1';

export class ApiClient {
  private token: string | null = null;
  private baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
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
    options: RequestInit = {},
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
        let errData: any;
        try {
          errData = await response.json();
        } catch {
          errData = { message: response.statusText };
        }

        // If unauthorized and we have a token, clear it
        if (response.status === 401) {
          // Token expired or invalid
          console.warn('[ApiClient] 401 Unauthorized encountered from backend:', url);
        }

        const errorMessage =
          Array.isArray(errData?.message)
            ? errData.message.join(', ')
            : errData?.message || `HTTP xatosi: ${response.status}`;

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
      throw new ApiError(err?.message || 'Tarmoq xatosi yoki backend bilan aloqa uzildi', 0);
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
