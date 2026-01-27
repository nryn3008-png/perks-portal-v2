/**
 * Perks Service
 *
 * Fetches offers from GetProven API.
 * STRICT: Returns RAW API data only. NO normalization. NO mock data.
 */

import type {
  GetProvenDeal,
  GetProvenListResponse,
  ApiResponse,
} from '@/types';
import { getProvenClient, GetProvenApiError } from './getproven-client';

const API_BASE_URL = process.env.GETPROVEN_API_URL || 'https://provendeals.getproven.com/api/ext/v1';
const API_TOKEN = process.env.GETPROVEN_API_TOKEN;

/**
 * Log API errors (server-side only)
 */
function logApiError(operation: string, error: unknown): void {
  if (typeof window === 'undefined') {
    console.error(`[Perks Service] ${operation} failed:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof GetProvenApiError ? error.code : undefined,
    });
  }
}

/**
 * Fetch offers using API-provided next URL
 */
async function fetchWithNextUrl(nextUrl: string): Promise<GetProvenListResponse<GetProvenDeal>> {
  const res = await fetch(nextUrl, {
    headers: {
      Authorization: `Token ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch next page');
  return res.json();
}

export interface PerksFilters {
  offerCategories?: string;   // Comma-separated
  investmentLevels?: string;  // Comma-separated
  search?: string;
}

export interface PerksResponse {
  data: GetProvenDeal[];
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };
}

/**
 * Perks Service
 */
export const perksService = {
  /**
   * Get offers from API
   * Uses page/page_size for initial fetch, next URL for subsequent pages
   */
  async getOffers(
    page = 1,
    pageSize = 24,
    filters?: PerksFilters,
    nextUrl?: string
  ): Promise<ApiResponse<PerksResponse>> {
    try {
      let response: GetProvenListResponse<GetProvenDeal>;

      if (nextUrl) {
        // Use API-provided next URL directly
        response = await fetchWithNextUrl(nextUrl);
      } else {
        // Initial fetch with page and page_size
        response = await getProvenClient.getDeals({
          page,
          pageSize,
          search: filters?.search,
          offerCategories: filters?.offerCategories,
          investmentLevels: filters?.investmentLevels,
        });
      }

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
      logApiError('getOffers', error);
      return {
        success: true,
        data: {
          data: [],
          pagination: {
            count: 0,
            next: null,
            previous: null,
          },
        },
      };
    }
  },

  /**
   * Get single offer by ID
   * NOTE: GetProven API doesn't support single-offer endpoint,
   * so we fetch from the list and find by ID
   */
  async getOfferById(id: string): Promise<ApiResponse<GetProvenDeal>> {
    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        return {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid offer ID',
            status: 400,
          },
        };
      }

      // Fetch offers in batches to find the one with matching ID
      // API doesn't support single-offer endpoint
      const response = await getProvenClient.getDeals({ pageSize: 500 });
      let offer = response.results.find((deal) => deal.id === numericId);

      // If not found in first batch and there are more, fetch next batches
      let nextUrl = response.next;
      while (!offer && nextUrl) {
        const nextResponse = await fetchWithNextUrl(nextUrl);
        offer = nextResponse.results.find((deal) => deal.id === numericId);
        nextUrl = nextResponse.next;
      }

      if (!offer) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Offer not found',
            status: 404,
          },
        };
      }

      return { success: true, data: offer };
    } catch (error) {
      logApiError('getOfferById', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Unable to load offer details',
          status: 500,
        },
      };
    }
  },

  /**
   * Get all unique filter values from offers
   * Fetches all offers to extract unique offer_categories and investment_levels
   */
  async getFilterOptions(): Promise<{
    offerCategories: string[];
    investmentLevels: string[];
  }> {
    try {
      // Fetch a large batch to get filter values
      const response = await getProvenClient.getDeals({ pageSize: 500 });

      const categoriesSet = new Set<string>();
      const levelsSet = new Set<string>();

      for (const deal of response.results) {
        // Extract offer categories
        if (deal.offer_categories && Array.isArray(deal.offer_categories)) {
          for (const cat of deal.offer_categories) {
            if (cat.name) categoriesSet.add(cat.name);
          }
        }
        // Extract investment levels
        if (deal.investment_levels && Array.isArray(deal.investment_levels)) {
          for (const level of deal.investment_levels) {
            if (level.name) levelsSet.add(level.name);
          }
        }
      }

      return {
        offerCategories: Array.from(categoriesSet).sort(),
        investmentLevels: Array.from(levelsSet).sort(),
      };
    } catch (error) {
      logApiError('getFilterOptions', error);
      return {
        offerCategories: [],
        investmentLevels: [],
      };
    }
  },

  /**
   * Get dashboard stats from API
   */
  async getDashboardStats(): Promise<{
    totalPerks: number;
    totalValue: string;
  }> {
    try {
      const response = await getProvenClient.getDeals({ pageSize: 500 });
      const totalPerks = response.count;

      // Sum only explicit API values
      const totalAmount = response.results.reduce((sum, deal) => {
        return sum + (deal.estimated_value || 0);
      }, 0);

      // Format total value
      let totalValue: string;
      if (totalAmount >= 1000000) {
        totalValue = `$${(totalAmount / 1000000).toFixed(1)}M+`;
      } else if (totalAmount >= 1000) {
        totalValue = `$${(totalAmount / 1000).toFixed(0)}K+`;
      } else if (totalAmount > 0) {
        totalValue = `$${totalAmount}+`;
      } else {
        totalValue = 'No data';
      }

      return { totalPerks, totalValue };
    } catch (error) {
      logApiError('getDashboardStats', error);
      return { totalPerks: 0, totalValue: 'No data' };
    }
  },

  /**
   * Get featured offers (first N offers)
   */
  async getFeaturedOffers(limit = 4): Promise<ApiResponse<GetProvenDeal[]>> {
    const result = await this.getOffers(1, limit);
    if (!result.success) {
      return { success: true, data: [] };
    }
    return { success: true, data: result.data.data };
  },
};
