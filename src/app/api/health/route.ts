import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.GETPROVEN_API_URL || 'https://provendeals.getproven.com/api/ext/v1';
const API_TOKEN = process.env.GETPROVEN_API_TOKEN;

interface HealthCheckResult {
  endpoint: string;
  status: 'ok' | 'error';
  critical: boolean;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  checks: HealthCheckResult[];
  timestamp: string;
}

/**
 * Perform a single health check
 */
async function checkEndpoint(
  endpoint: string,
  critical: boolean
): Promise<HealthCheckResult> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Token ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      // Short timeout to avoid blocking
      signal: AbortSignal.timeout(5000),
    });

    return {
      endpoint,
      status: response.ok ? 'ok' : 'error',
      critical,
    };
  } catch {
    return {
      endpoint,
      status: 'error',
      critical,
    };
  }
}

/**
 * GET /api/health
 * Check health of GetProven API endpoints
 *
 * Query params:
 * - admin: Include admin-only checks (whitelist)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const includeAdmin = searchParams.get('admin') === 'true';

  // Critical checks (always performed)
  const criticalChecks = [
    checkEndpoint('/offers/?page_size=1', true),
    checkEndpoint('/vendors/?page_size=1', true),
  ];

  // Admin-only checks
  const adminChecks = includeAdmin
    ? [checkEndpoint('/whitelist/domains/?page_size=1', false)]
    : [];

  // Run all checks in parallel
  const results = await Promise.all([...criticalChecks, ...adminChecks]);

  // Determine overall status
  const criticalResults = results.filter((r) => r.critical);
  const adminResults = results.filter((r) => !r.critical);

  const criticalFailed = criticalResults.some((r) => r.status === 'error');
  const adminFailed = adminResults.some((r) => r.status === 'error');

  let status: 'healthy' | 'degraded' | 'down';
  if (criticalFailed) {
    status = 'down';
  } else if (adminFailed) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  const response: HealthResponse = {
    status,
    checks: results,
    timestamp: new Date().toISOString(),
  };

  // Set cache headers to avoid excessive calls (cache for 30 seconds)
  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'private, max-age=30',
    },
  });
}
