/**
 * GetProven API Client
 *
 * Low-level client for making authenticated requests to the GetProven API.
 * This client handles authentication, error handling, and response parsing.
 *
 * IMPORTANT: This client should only be used server-side to protect the API token.
 */

import {
  ApiError,
  GetProvenDeal,
  GetProvenCategory,
  GetProvenVendor,
  VendorClient,
  VendorUser,
  WhitelistDomain,
  IndividualAccess,
  GetProvenListResponse,
  ApiRequestOptions,
  VendorRequestOptions,
} from '@/types';

const API_BASE_URL =
  process.env.GETPROVEN_API_URL || 'https://provendeals.getproven.com/api/ext/v1';
const API_TOKEN = process.env.GETPROVEN_API_TOKEN;

/**
 * Custom error class for API errors
 */
export class GetProvenApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GetProvenApiError';
  }

  toApiError(): ApiError {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
    };
  }
}

/**
 * Build query string from offer options
 */
function buildQueryString(options: ApiRequestOptions): string {
  const params = new URLSearchParams();

  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('page_size', String(Math.min(options.pageSize, 1000)));
  if (options.search) params.set('search', options.search);
  if (options.offerCategories) params.set('offer_categories', options.offerCategories);
  if (options.investmentLevels) params.set('investment_levels', options.investmentLevels);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Build query string from vendor options
 */
function buildVendorQueryString(options: VendorRequestOptions): string {
  const params = new URLSearchParams();

  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('page_size', String(Math.min(options.pageSize, 1000)));
  if (options.search) params.set('search', options.search);
  if (options.serviceName) params.set('service_name', options.serviceName);
  if (options.groupName) params.set('group_name', options.groupName);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Make authenticated request to GetProven API
 */
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_TOKEN) {
    throw new GetProvenApiError(
      'MISSING_API_TOKEN',
      'GetProven API token is not configured',
      500
    );
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Token ${API_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData: Record<string, unknown> = {};
    try {
      errorData = await response.json();
    } catch {
      // Response body might not be JSON
    }

    throw new GetProvenApiError(
      'API_ERROR',
      (errorData.detail as string) || `API request failed: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

/**
 * GetProven API Client
 */
export const getProvenClient = {
  /**
   * Fetch list of deals/perks
   */
  async getDeals(
    options: ApiRequestOptions = {}
  ): Promise<GetProvenListResponse<GetProvenDeal>> {
    const query = buildQueryString(options);
    return makeRequest<GetProvenListResponse<GetProvenDeal>>(`/offers/${query}`);
  },

  /**
   * Fetch single deal by ID
   */
  async getDeal(id: string): Promise<GetProvenDeal> {
    return makeRequest<GetProvenDeal>(`/offers/${id}/`);
  },

  /**
   * Fetch list of categories
   */
  async getCategories(): Promise<GetProvenListResponse<GetProvenCategory>> {
    return makeRequest<GetProvenListResponse<GetProvenCategory>>('/categories/');
  },

  /**
   * Fetch deals by category
   * Uses offer_categories filter parameter
   */
  async getDealsByCategory(
    categoryName: string,
    options: ApiRequestOptions = {}
  ): Promise<GetProvenListResponse<GetProvenDeal>> {
    const query = buildQueryString({ ...options, offerCategories: categoryName });
    return makeRequest<GetProvenListResponse<GetProvenDeal>>(`/offers/${query}`);
  },

  /**
   * Fetch list of vendors
   */
  async getVendors(
    options: VendorRequestOptions = {}
  ): Promise<GetProvenListResponse<GetProvenVendor>> {
    const query = buildVendorQueryString(options);
    return makeRequest<GetProvenListResponse<GetProvenVendor>>(`/vendors/${query}`);
  },

  /**
   * Fetch vendor clients
   */
  async getVendorClients(
    vendorId: string,
    pageSize = 50
  ): Promise<GetProvenListResponse<VendorClient>> {
    return makeRequest<GetProvenListResponse<VendorClient>>(
      `/vendors/${vendorId}/clients/?page_size=${pageSize}`
    );
  },

  /**
   * Fetch vendor users/contacts
   */
  async getVendorUsers(
    vendorId: string
  ): Promise<GetProvenListResponse<VendorUser>> {
    return makeRequest<GetProvenListResponse<VendorUser>>(
      `/vendors/${vendorId}/users/`
    );
  },

  /**
   * Fetch whitelisted domains
   */
  async getWhitelistDomains(
    page = 1,
    pageSize = 50
  ): Promise<GetProvenListResponse<WhitelistDomain>> {
    return makeRequest<GetProvenListResponse<WhitelistDomain>>(
      `/whitelist/domains/?page=${page}&page_size=${pageSize}`
    );
  },

  /**
   * Fetch individual access list
   */
  async getIndividualAccess(
    page = 1,
    pageSize = 50
  ): Promise<GetProvenListResponse<IndividualAccess>> {
    return makeRequest<GetProvenListResponse<IndividualAccess>>(
      `/whitelist/individual_access/?page=${page}&page_size=${pageSize}`
    );
  },

  /**
   * Upload whitelist domains CSV
   * Returns raw API response
   */
  async uploadWhitelistCsv(formData: FormData): Promise<unknown> {
    if (!API_TOKEN) {
      throw new GetProvenApiError(
        'MISSING_API_TOKEN',
        'GetProven API token is not configured',
        500
      );
    }

    const url = `${API_BASE_URL}/whitelist/domain/upload/`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token ${API_TOKEN}`,
        // Don't set Content-Type - browser will set it with boundary for FormData
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new GetProvenApiError(
        'UPLOAD_ERROR',
        data.detail || data.error || 'Upload failed',
        response.status,
        data
      );
    }

    return data;
  },
};
