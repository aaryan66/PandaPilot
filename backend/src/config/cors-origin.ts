import { Logger } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const logger = new Logger('CORS');

function patternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replace(/\*/g, '.*')}$`);
}

/**
 * Builds a CORS origin check that supports exact origins and `*` wildcards
 * (e.g. "https://my-app-*.vercel.app" to cover Vercel preview deployments,
 * whose URL gets a new random hash on every deploy).
 *
 * Any rejected origin is logged so misconfigurations are easy to spot in
 * Render's logs instead of only showing up as a silent browser CORS error.
 */
export function createCorsOriginCheck(
  allowedPatterns: string[],
): CorsOptions['origin'] {
  const matchers = allowedPatterns.map((pattern) => ({
    pattern,
    regExp: patternToRegExp(pattern),
  }));

  return (origin, callback) => {
    // No Origin header (server-to-server calls, curl, health checks) — allow.
    if (!origin) return callback(null, true);

    const isAllowed = matchers.some(({ regExp }) => regExp.test(origin));
    if (isAllowed) return callback(null, true);

    logger.warn(
      `Rejected request from origin "${origin}" — not in FRONTEND_ORIGIN (${allowedPatterns.join(', ')}). ` +
        'Add it to FRONTEND_ORIGIN if this should be allowed.',
    );
    // NOTE: must NOT pass `false` here. The `cors` package treats a falsy
    // second callback argument as "skip CORS handling entirely" and calls
    // next() without ever responding to the preflight — which then falls
    // through to Nest's router, and since there's no OPTIONS handler on the
    // route, that becomes a confusing 404 ("Cannot OPTIONS /chat") instead
    // of a clean CORS rejection. Passing an empty array is truthy (so `cors`
    // still fully handles + terminates the OPTIONS request with 204) while
    // still failing origin-matching internally, so no Access-Control-Allow-
    // Origin header gets added — the browser blocks it as a normal, clearly
    // diagnosable CORS rejection instead.
    return callback(null, []);
  };
}
