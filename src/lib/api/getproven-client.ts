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

export interface ProviderConfig {
  apiUrl: string;
  apiToken: string;
}

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
 * Create a makeRequest function bound to specific config
 */
function createMakeRequest(config: ProviderConfig) {
  return async function makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!config.apiToken) {
      throw new GetProvenApiError(
        'MISSING_API_TOKEN',
        'API token is not configured',
        500
      );
    }

    const url = `${config.apiUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Token ${config.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Cache responses for 5 minutes with tags for invalidation
      next: { revalidate: 300, tags: ['provider-data'] },
    } as RequestInit);

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
  };
}

/**
 * GetProven API Client interface
 */
export interface GetProvenClient {
  getDeals(options?: ApiRequestOptions): Promise<GetProvenListResponse<GetProvenDeal>>;
  getDeal(id: string): Promise<GetProvenDeal>;
  getCategories(): Promise<GetProvenListResponse<GetProvenCategory>>;
  getDealsByCategory(categoryName: string, options?: ApiRequestOptions): Promise<GetProvenListResponse<GetProvenDeal>>;
  getVendors(options?: VendorRequestOptions): Promise<GetProvenListResponse<GetProvenVendor>>;
  getVendorClients(vendorId: string, pageSize?: number): Promise<GetProvenListResponse<VendorClient>>;
  getVendorUsers(vendorId: string): Promise<GetProvenListResponse<VendorUser>>;
  getWhitelistDomains(page?: number, pageSize?: number): Promise<GetProvenListResponse<WhitelistDomain>>;
  getIndividualAccess(page?: number, pageSize?: number): Promise<GetProvenListResponse<IndividualAccess>>;
  uploadWhitelistCsv(formData: FormData): Promise<unknown>;
}

/**
 * Create a GetProven API client with the given configuration
 */
export function createClient(config: ProviderConfig): GetProvenClient {
  const makeRequest = createMakeRequest(config);

  return {
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
      if (!config.apiToken) {
        throw new GetProvenApiError(
          'MISSING_API_TOKEN',
          'API token is not configured',
          500
        );
      }

      const url = `${config.apiUrl}/whitelist/domain/upload/`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Token ${config.apiToken}`,
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
}

/**
 * Create a client from a provider record
 */
export function createClientFromProvider(provider: {
  api_url: string;
  api_token: string;
}): GetProvenClient {
  return createClient({
    apiUrl: provider.api_url,
    apiToken: provider.api_token,
  });
}
