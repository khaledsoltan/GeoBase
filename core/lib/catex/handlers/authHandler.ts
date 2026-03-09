import keycloakConfig from "@/core/lib/config/keycloak.json";

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
}

class AuthHandler {
  private static instance: AuthHandler;
  private tokenKey = "apollo_access_token";
  private tokenExpiryKey = "apollo_token_expiry";
  private refreshTokenKey = "apollo_refresh_token";

  private constructor() {}

  static getInstance(): AuthHandler {
    if (!AuthHandler.instance) {
      AuthHandler.instance = new AuthHandler();
    }
    return AuthHandler.instance;
  }

  /**
   * Get access token from session storage
   */
  getToken(): string | null {
    const token = sessionStorage.getItem(this.tokenKey);
    const expiry = sessionStorage.getItem(this.tokenExpiryKey);

    if (!token || !expiry) {
      return null;
    }

    // Check if token is expired
    if (Date.now() >= parseInt(expiry)) {
      this.clearToken();
      return null;
    }

    return token;
  }

  /**
   * Request new access token from Keycloak
   */
  async requestToken(): Promise<string> {
    try {
      console.log("🔑 Requesting token from:", keycloakConfig.url);

      const response = await fetch(keycloakConfig.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: keycloakConfig.grantType,
          client_id: keycloakConfig.clientId,
          client_secret: keycloakConfig.clientSecret,
          scope: keycloakConfig.scope,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Token request failed:", response.status, errorText);
        throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
      }

      const data: TokenResponse = await response.json();
      this.saveToken(data);

      console.log("✅ Token obtained successfully");
      return data.access_token;
    } catch (error) {
      console.error("❌ Error requesting token:", error);
      console.warn("💡 Make sure the proxy server is running on http://localhost:3001");
      console.warn("💡 Run: cd apollo-proxy && npm start");
      throw error;
    }
  }

  /**
   * Get token from host application's session/cookie
   */
  private getHostAppToken(): string | null {
    // Try to get token from host application's session storage
    try {
      const hostToken = sessionStorage.getItem("access_token") ||
                       sessionStorage.getItem("token") ||
                       sessionStorage.getItem("authToken");

      if (hostToken) {
        console.log("✅ Found token from host application");
        return hostToken;
      }
    } catch (e) {
      console.warn("Could not access host app token:", e);
    }

    // Try to get from cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'access_token' || name === 'token' || name === 'authToken') {
        console.log("✅ Found token from cookies");
        return value;
      }
    }

    return null;
  }

  /**
   * Get valid token (from cache or request new one)
   */
  async getValidToken(): Promise<string> {
    // First, try to get token from host application
    const hostToken = this.getHostAppToken();
    if (hostToken) {
      return hostToken;
    }

    // Try our cached token
    const cachedToken = this.getToken();
    if (cachedToken) {
      return cachedToken;
    }

    // Last resort: try to request new token
    // This will fail with CORS, but we try anyway
    return await this.requestToken();
  }

  /**
   * Save token to session storage
   */
  private saveToken(tokenData: TokenResponse): void {
    const expiryTime = Date.now() + tokenData.expires_in * 1000;

    sessionStorage.setItem(this.tokenKey, tokenData.access_token);
    sessionStorage.setItem(this.tokenExpiryKey, expiryTime.toString());
    sessionStorage.setItem(this.refreshTokenKey, tokenData.refresh_token);

    console.log("✅ Token saved to session storage");
    console.log(`   Expires in: ${tokenData.expires_in} seconds`);
  }

  /**
   * Clear token from session storage
   */
  clearToken(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.tokenExpiryKey);
    sessionStorage.removeItem(this.refreshTokenKey);
  }

  /**
   * Make authenticated API request
   */
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getValidToken();

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

export const authHandler = AuthHandler.getInstance();
export default authHandler;
