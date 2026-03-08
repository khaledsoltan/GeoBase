/**
 * API handlers for making requests through the host application
 * This avoids CORS issues by using the host app's API client
 */

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Make an API request through Next.js proxy
 * This ensures proper authentication and avoids CORS issues
 */
export async function fetchFromHostApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    console.log(`[API] Fetching from proxy: ${endpoint}`);

    // Get cookies from the current page context to forward to proxy
    let hostCookies = '';
    if (typeof document !== 'undefined') {
      hostCookies = document.cookie;
      console.log('[API] Forwarding host cookies to proxy');
    }

    // Fetch through Next.js proxy (no CORS issues)
    const response = await fetch(endpoint, {
      ...options,
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-Cookies': hostCookies, // Forward host page cookies
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] Proxy fetch succeeded');
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[API] Fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Alternative: Use XMLHttpRequest which might bypass some CORS restrictions
 * when running within the host application's context
 */
export function fetchWithXHR<T>(
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
  }
): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true; // Include credentials

    xhr.open(options?.method || 'GET', url, true);

    // Set headers
    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            success: true,
            data,
          });
        } catch (error) {
          resolve({
            success: false,
            error: 'Failed to parse response',
          });
        }
      } else {
        resolve({
          success: false,
          error: `HTTP error! status: ${xhr.status}`,
        });
      }
    };

    xhr.onerror = () => {
      resolve({
        success: false,
        error: 'Network error',
      });
    };

    xhr.send();
  });
}

/**
 * Try multiple methods to fetch data, falling back if one fails
 */
export async function fetchWithFallback<T>(
  url: string
): Promise<ApiResponse<T>> {
  console.log(`[API] Attempting to fetch: ${url}`);

  // Method 1: Try fetch with credentials
  console.log('[API] Method 1: fetch with credentials');
  const fetchResult = await fetchFromHostApi<T>(url);
  if (fetchResult.success) {
    console.log('[API] Method 1 succeeded');
    return fetchResult;
  }
  console.log('[API] Method 1 failed:', fetchResult.error);

  // Method 2: Try XMLHttpRequest
  console.log('[API] Method 2: XMLHttpRequest');
  const xhrResult = await fetchWithXHR<T>(url);
  if (xhrResult.success) {
    console.log('[API] Method 2 succeeded');
    return xhrResult;
  }
  console.log('[API] Method 2 failed:', xhrResult.error);

  // All methods failed
  console.error('[API] All methods failed');
  return {
    success: false,
    error: 'All fetch methods failed. CORS issue not resolved.',
  };
}
