/**
 * Proxy-aware fetch for external requests. Uses Node's native http/https
 * modules with https-proxy-agent — avoids undici compatibility issues.
 *
 * Localhost requests bypass the proxy.
 */
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as http from 'node:http';
import * as https from 'node:https';

const PROXY_URL =
  process.env.GLOBAL_AGENT_HTTP_PROXY ||
  process.env.HTTPS_PROXY ||
  process.env.HTTP_PROXY ||
  ''; // empty = no proxy — fall through to direct connection

const proxyAgent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : null;

function isLocalhost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  );
}

/**
 * Fetch a URL with proxy support. For external requests, routes through the
 * configured proxy. Localhost requests use the native fetch.
 */
export async function proxyFetch(
  url: string | URL,
  init?: RequestInit,
): Promise<Response> {
  const urlStr = typeof url === 'string' ? url : url.href;
  const parsed = typeof url === 'string' ? new URL(url) : url;

  // Bypass proxy for localhost or when no proxy is configured
  if (isLocalhost(parsed.hostname) || !proxyAgent) {
    return globalThis.fetch(url, init);
  }

  // Proxy for external requests
  const isHttps = parsed.protocol === 'https:';
  const mod = isHttps ? https : http;

  const agent = isLocalhost(parsed.hostname)
    ? undefined
    : proxyAgent;

  const headers: Record<string, string> = {};
  if (init?.headers) {
    for (const [k, v] of Object.entries(init.headers)) {
      headers[k] = String(v);
    }
  }

  return new Promise<Response>((resolve, reject) => {
    const req = mod.request(
      parsed,
      {
        method: init?.method ?? 'GET',
        headers,
        agent,
        rejectUnauthorized: isHttps,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          resolve(
            new Response(body, {
              status: res.statusCode ?? 200,
              statusText: res.statusMessage ?? 'OK',
              headers: new Headers(
                Object.entries(res.headers).reduce(
                  (acc, [k, v]) => {
                    if (v != null) acc[k] = Array.isArray(v) ? v.join(', ') : String(v);
                    return acc;
                  },
                  {} as Record<string, string>,
                ),
              ),
            }),
          );
        });
      },
    );

    req.on('error', (err) => {
      // The proxy might reject with ECONNREFUSED while connecting
      reject(err);
    });

    // Set timeout from signal or default
    const signal = init?.signal;
    if (signal) {
      signal.addEventListener('abort', () => req.destroy(new Error('Aborted')));
    }

    req.setTimeout(30000, () => {
      req.destroy(new Error('Request timeout'));
    });

    if (init?.body) {
      req.write(init.body);
    }
    req.end();
  });
}
