import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// GetProven API config
const GETPROVEN_API_BASE_URL =
  process.env.GETPROVEN_API_URL || 'https://provendeals.getproven.com/api/ext/v1';
const GETPROVEN_API_TOKEN = process.env.GETPROVEN_API_TOKEN;

// Bridge API config
const BRIDGE_API_BASE_URL = process.env.BRIDGE_API_BASE_URL || 'https://api.brdg.app';
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;

interface HealthCheckResult {
  endpoint: string;
  status: 'ok' | 'error';
  critical: boolean;
  api: 'getproven' | 'bridge';
}

interface ApiStatus {
  name: string;
  status: 'ok' | 'error' | 'unconfigured';
  latency?: number;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  checks: HealthCheckResult[];
  apis: {
    getproven: ApiStatus;
    bridge: ApiStatus;
  };
  timestamp: string;
}

/**
 * Perform a single GetProven API health check
 */
async function checkGetProvenEndpoint(
  endpoint: string,
  critical: boolean
): Promise<HealthCheckResult> {
  try {
    const response = await fetch(`${GETPROVEN_API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Token ${GETPROVEN_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      // Short timeout to avoid blocking
      signal: AbortSignal.timeout(5000),
    });

    return {
      endpoint,
      status: response.ok ? 'ok' : 'error',
      critical,
      api: 'getproven',
    };
  } catch (error) {
    logger.error('GetProven health check failed:', error);
    return {
      endpoint,
      status: 'error',
      critical,
      api: 'getproven',
    };
  }
}

/**
 * Check Bridge API health
 */
async function checkBridgeApi(): Promise<ApiStatus> {
  if (!BRIDGE_API_KEY) {
    return {
      name: 'Bridge API',
      status: 'unconfigured',
    };
  }

  try {
    const startTime = Date.now();
    // Use a simple domain lookup to verify API is responding
    const response = await fetch(
      `${BRIDGE_API_BASE_URL}/api/v4/search/intropath_counts?domain=example.com`,
      {
        headers: {
          Authorization: `Bearer ${BRIDGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    const latency = Date.now() - startTime;

    return {
      name: 'Bridge API',
      status: response.ok ? 'ok' : 'error',
      latency,
    };
  } catch (error) {
    logger.error('Bridge API health check failed:', error);
    return {
      name: 'Bridge API',
      status: 'error',
    };
  }
}

/**
 * Check GetProven API health with latency
 */
async function checkGetProvenApiStatus(): Promise<ApiStatus> {
  if (!GETPROVEN_API_TOKEN) {
    return {
      name: 'GetProven API',
      status: 'unconfigured',
    };
  }

  try {
    const startTime = Date.now();
    const response = await fetch(`${GETPROVEN_API_BASE_URL}/offers/?page_size=1`, {
      headers: {
        Authorization: `Token ${GETPROVEN_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - startTime;

    return {
      name: 'GetProven API',
      status: response.ok ? 'ok' : 'error',
      latency,
    };
  } catch (error) {
    logger.error('GetProven API health check failed:', error);
    return {
      name: 'GetProven API',
      status: 'error',
    };
  }
}

/**
 * GET /api/health
 * Check health of GetProven and Bridge API endpoints
 *
 * Query params:
 * - admin: Include admin-only checks (whitelist)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const includeAdmin = searchParams.get('admin') === 'true';

  // Critical GetProven checks (always performed)
  const criticalChecks = [
    checkGetProvenEndpoint('/offers/?page_size=1', true),
    checkGetProvenEndpoint('/vendors/?page_size=1', true),
  ];

  // Admin-only checks
  const adminChecks = includeAdmin
    ? [checkGetProvenEndpoint('/whitelist/domains/?page_size=1', false)]
    : [];

  // Run all checks in parallel (including API status checks)
  const [checkResults, getProvenStatus, bridgeStatus] = await Promise.all([
    Promise.all([...criticalChecks, ...adminChecks]),
    checkGetProvenApiStatus(),
    checkBridgeApi(),
  ]);

  // Determine overall status based on GetProven (primary API)
  const criticalResults = checkResults.filter((r) => r.critical);
  const adminResults = checkResults.filter((r) => !r.critical);

  const criticalFailed = criticalResults.some((r) => r.status === 'error');
  const adminFailed = adminResults.some((r) => r.status === 'error');

  let status: 'healthy' | 'degraded' | 'down';
  if (criticalFailed) {
    status = 'down';
  } else if (adminFailed || bridgeStatus.status === 'error') {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  const response: HealthResponse = {
    status,
    checks: checkResults,
    apis: {
      getproven: getProvenStatus,
      bridge: bridgeStatus,
    },
    timestamp: new Date().toISOString(),
  };

  // Set cache headers to avoid excessive calls (cache for 30 seconds)
  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'private, max-age=30',
    },
  });
}
