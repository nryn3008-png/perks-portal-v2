/**
 * Whitelist Service
 *
 * Manages whitelisted domains via GetProven API.
 * STRICT: Returns RAW API data only. NO normalization.
 * ADMIN ONLY: This service should only be used by admin pages.
 */

import type {
  WhitelistDomain,
  IndividualAccess,
  GetProvenListResponse,
  ApiResponse,
} from '@/types';
import { getProvenClient, GetProvenApiError } from './getproven-client';

/**
 * Log API errors (server-side only)
 */
function logApiError(operation: string, error: unknown): void {
  if (typeof window === 'undefined') {
    console.error(`[Whitelist Service] ${operation} failed:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof GetProvenApiError ? error.code : undefined,
    });
  }
}

export interface WhitelistResponse {
  data: WhitelistDomain[];
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };
}

export interface IndividualAccessResponse {
  data: IndividualAccess[];
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };
}

/**
 * Whitelist Service
 */
export const whitelistService = {
  /**
   * Get whitelisted domains from API
   */
  async getDomains(
    page = 1,
    pageSize = 50
  ): Promise<ApiResponse<WhitelistResponse>> {
    try {
      const response = await getProvenClient.getWhitelistDomains(page, pageSize);

      return {
        success: true,
        data: {
          data: response.results,
          pagination: {
            count: response.count,
            next: response.next,
            previous: response.previous,
          },
        },
      };
    } catch (error) {
      logApiError('getDomains', error);

      if (error instanceof GetProvenApiError) {
        return {
          success: false,
          error: error.toApiError(),
        };
      }

      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Unable to load whitelisted domains',
          status: 500,
        },
      };
    }
  },

  /**
   * Get individual access list from API
   */
  async getIndividualAccess(
    page = 1,
    pageSize = 50
  ): Promise<ApiResponse<IndividualAccessResponse>> {
    try {
      const response = await getProvenClient.getIndividualAccess(page, pageSize);

      return {
        success: true,
        data: {
          data: response.results,
          pagination: {
            count: response.count,
            next: response.next,
            previous: response.previous,
          },
        },
      };
    } catch (error) {
      logApiError('getIndividualAccess', error);

      if (error instanceof GetProvenApiError) {
        return {
          success: false,
          error: error.toApiError(),
        };
      }

      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Unable to load individual access list',
          status: 500,
        },
      };
    }
  },

  /**
   * Upload CSV file to add whitelisted domains
   * Returns raw API response for verbatim display
   */
  async uploadCsv(formData: FormData): Promise<ApiResponse<unknown>> {
    try {
      const response = await getProvenClient.uploadWhitelistCsv(formData);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      logApiError('uploadCsv', error);

      if (error instanceof GetProvenApiError) {
        return {
          success: false,
          error: error.toApiError(),
        };
      }

      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Unable to upload CSV file',
          status: 500,
        },
      };
    }
  },
};
