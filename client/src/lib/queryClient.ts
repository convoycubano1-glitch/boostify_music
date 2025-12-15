import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Variable global para almacenar la función getToken de Clerk
let clerkGetToken: (() => Promise<string | null>) | null = null;

/**
 * Set the Clerk getToken function from the ClerkProvider context
 * This should be called from a component that has access to useAuth()
 */
export function setClerkGetToken(getToken: () => Promise<string | null>) {
  clerkGetToken = getToken;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };

  // Try to get Clerk token if available
  if (clerkGetToken) {
    try {
      const token = await clerkGetToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get Clerk token:', error);
    }
  }

  return headers;
}

interface ApiRequestOptions {
  url: string;
  method: string;
  data?: unknown;
  body?: unknown;
  headers?: HeadersInit;
  params?: Record<string, string>; // Parámetros de consulta (query parameters)
}

export async function apiRequest(
  options: ApiRequestOptions | string,
  urlOrOptions?: string | Partial<ApiRequestOptions>,
  data?: unknown | undefined,
): Promise<any> {
  const headers = await getAuthHeaders();
  
  // Handle both the new object-based API and the old string-based API
  if (typeof options === 'object') {
    // New API: options is an object with configuration
    const { url: baseUrl, method, data: requestData, body: requestBody, headers: customHeaders, params } = options;
    const finalData = requestData || requestBody;
    const requestHeaders = { ...headers, ...customHeaders };
    
    // Procesar parámetros de consulta si existen
    let finalUrl = baseUrl;
    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key]);
        }
      }
      finalUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${queryParams.toString()}`;
    }
    
    const res = await fetch(finalUrl, {
      method: method || 'GET',
      headers: requestHeaders,
      body: finalData ? JSON.stringify(finalData) : undefined,
      credentials: "include",
    });
    
    await throwIfResNotOk(res);
    return await res.json();
  } else if (typeof options === 'string' && options.startsWith('/')) {
    // URL-first API: apiRequest('/api/...', { method: 'POST', data: {...} }) or apiRequest('/api/...', 'POST', data)
    const url = options;
    
    if (typeof urlOrOptions === 'object') {
      // apiRequest('/api/...', { method: 'POST', data: {...} })
      const { method = 'GET', data: requestData, body: requestBody, headers: customHeaders } = urlOrOptions as Partial<ApiRequestOptions>;
      const finalData = requestData || requestBody;
      const requestHeaders = { ...headers, ...customHeaders };
      
      // If body is already a string (pre-serialized), don't stringify again
      const bodyToSend = finalData 
        ? (typeof finalData === 'string' ? finalData : JSON.stringify(finalData))
        : undefined;
      
      const res = await fetch(url, {
        method,
        headers: requestHeaders,
        body: bodyToSend,
        credentials: "include",
      });
      
      await throwIfResNotOk(res);
      return await res.json();
    } else {
      // apiRequest('/api/...', 'POST', data) or apiRequest('/api/...')
      const method = urlOrOptions || 'GET';
      
      const res = await fetch(url, {
        method,
        headers: data ? { ...headers } : headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
      
      await throwIfResNotOk(res);
      return await res.json();
    }
  } else {
    // Old API: options is the method, url is the URL
    const method = options;
    const url = urlOrOptions as string;
    
    const res = await fetch(url, {
      method,
      headers: data ? { ...headers } : headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    await throwIfResNotOk(res);
    return await res.json();
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers = await getAuthHeaders();

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Refetch cuando vuelves a la pestaña
      staleTime: 30 * 1000, // 30 segundos - los datos se consideran frescos por 30 segundos
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});