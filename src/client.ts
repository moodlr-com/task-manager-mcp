/**
 * Thin HTTP client over the Moodlr Task Manager REST API.
 *
 * Reads config once at construction time from the process environment:
 * - MOODLR_API_URL (required)   — e.g. https://tasks.moodlr.com
 * - MOODLR_API_KEY (required)   — personal access token starting with moodlr_
 *
 * All methods throw on non-2xx responses so tools can surface the error
 * back to the caller via MCP's isError channel.
 */

export interface ApiClientOptions {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: ApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.apiKey = opts.apiKey;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    options: {
      query?: Record<string, string | number | boolean | string[] | undefined>;
      body?: unknown;
    } = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const init: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    };

    const res = await this.fetchImpl(url.toString(), init);

    if (res.status === 204) {
      return undefined as T;
    }

    let parsed: unknown;
    const text = await res.text();
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (!res.ok) {
      const errorMsg =
        (parsed && typeof parsed === "object" && "error" in parsed
          ? String((parsed as { error: unknown }).error)
          : null) ?? `HTTP ${res.status} ${res.statusText}`;
      throw new ApiError(res.status, parsed, errorMsg);
    }

    return parsed as T;
  }

  get<T>(
    path: string,
    query?: Record<string, string | number | boolean | string[] | undefined>,
  ) {
    return this.request<T>("GET", path, { query });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, { body });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>("PUT", path, { body });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>("PATCH", path, { body });
  }

  delete<T>(path: string, body?: unknown) {
    return this.request<T>("DELETE", path, { body });
  }
}

export function apiClientFromEnv(): ApiClient {
  const baseUrl = process.env.MOODLR_API_URL;
  const apiKey = process.env.MOODLR_API_KEY;

  if (!baseUrl) {
    throw new Error(
      "MOODLR_API_URL is required (e.g. https://tasks.moodlr.com)",
    );
  }
  if (!apiKey) {
    throw new Error(
      "MOODLR_API_KEY is required — create one at /dashboard (settings → API keys)",
    );
  }
  if (!apiKey.startsWith("moodlr_")) {
    throw new Error(
      "MOODLR_API_KEY must start with 'moodlr_'. Did you paste the wrong token?",
    );
  }

  return new ApiClient({ baseUrl, apiKey });
}
