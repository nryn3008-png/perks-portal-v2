/**
 * Vendors Service
 *
 * Fetches vendors from GetProven API.
 * STRICT: Returns RAW API data only. NO normalization. NO mock data.
 */

import type {
  GetProvenVendor,
  VendorClient,
  VendorUser,
  GetProvenListResponse,
  ApiResponse,
} from '@/types';
import { getProvenClient, GetProvenApiError } from './getproven-client';

const API_TOKEN = process.env.GETPROVEN_API_TOKEN;

/**
 * Log API errors (server-side only)
 */
function logApiError(operation: string, error: unknown): void {
  if (typeof window === 'undefined') {
    console.error(`[Vendors Service] ${operation} failed:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof GetProvenApiError ? error.code : undefined,
    });
  }
}

/**
 * Fetch vendors using API-provided next URL
 */
async function fetchWithNextUrl(nextUrl: string): Promise<GetProvenListResponse<GetProvenVendor>> {
  const res = await fetch(nextUrl, {
    headers: {
      Authorization: `Token ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch next page');
  return res.json();
}

export interface VendorsFilters {
  search?: string;
  serviceName?: string;
  groupName?: string;
}

export interface VendorsResponse {
  data: GetProvenVendor[];
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };
}

/**
 * Vendors Service
 */
export const vendorsService = {
  /**
   * Get vendors from API
   * Uses page/page_size for initial fetch, next URL for subsequent pages
   */
  async getVendors(
    page = 1,
    pageSize = 24,
    filters?: VendorsFilters,
    nextUrl?: string
  ): Promise<ApiResponse<VendorsResponse>> {
    try {
      let response: GetProvenListResponse<GetProvenVendor>;

      if (nextUrl) {
        // Use API-provided next URL directly
        response = await fetchWithNextUrl(nextUrl);
      } else {
        // Initial fetch with page and page_size
        response = await getProvenClient.getVendors({
          page,
          pageSize,
          search: filters?.search,
          serviceName: filters?.serviceName,
          groupName: filters?.groupName,
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
      logApiError('getVendors', error);
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
   * Get single vendor by ID
   * NOTE: GetProven API doesn't support single-vendor endpoint,
   * so we fetch from the list and find by ID
   */
  async getVendorById(id: string): Promise<ApiResponse<GetProvenVendor>> {
    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        return {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid vendor ID',
            status: 400,
          },
        };
      }

      // Fetch vendors in batches to find the one with matching ID
      const response = await getProvenClient.getVendors({ pageSize: 500 });
      let vendor = response.results.find((v) => v.id === numericId);

      // If not found in first batch and there are more, fetch next batches
      let nextUrl = response.next;
      while (!vendor && nextUrl) {
        const nextResponse = await fetchWithNextUrl(nextUrl);
        vendor = nextResponse.results.find((v) => v.id === numericId);
        nextUrl = nextResponse.next;
      }

      if (!vendor) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Vendor not found',
            status: 404,
          },
        };
      }

      return { success: true, data: vendor };
    } catch (error) {
      logApiError('getVendorById', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Unable to load vendor details',
          status: 500,
        },
      };
    }
  },

  /**
   * Get all unique filter values from vendors
   * Fetches vendors to extract unique services and vendor_groups
   */
  async getFilterOptions(): Promise<{
    services: string[];
    vendorGroups: string[];
  }> {
    try {
      // Fetch a large batch to get filter values
      const response = await getProvenClient.getVendors({ pageSize: 500 });

      const servicesSet = new Set<string>();
      const groupsSet = new Set<string>();

      for (const vendor of response.results) {
        // Extract services
        if (vendor.services && Array.isArray(vendor.services)) {
          for (const service of vendor.services) {
            if (service.name) servicesSet.add(service.name);
          }
        }
        // Extract vendor groups
        if (vendor.vendor_groups && Array.isArray(vendor.vendor_groups)) {
          for (const group of vendor.vendor_groups) {
            if (group.name) groupsSet.add(group.name);
          }
        }
      }

      return {
        services: Array.from(servicesSet).sort(),
        vendorGroups: Array.from(groupsSet).sort(),
      };
    } catch (error) {
      logApiError('getFilterOptions', error);
      return {
        services: [],
        vendorGroups: [],
      };
    }
  },

  /**
   * Get vendor clients
   */
  async getVendorClients(vendorId: string): Promise<ApiResponse<VendorClient[]>> {
    try {
      const response = await getProvenClient.getVendorClients(vendorId, 50);
      return { success: true, data: response.results };
    } catch (error) {
      logApiError('getVendorClients', error);
      return { success: true, data: [] };
    }
  },

  /**
   * Get vendor users/contacts
   * Filters for relevant roles: vendor_owner, vendor_contact_person
   * Excludes contacts without names
   */
  async getVendorContacts(vendorId: string): Promise<ApiResponse<VendorUser[]>> {
    try {
      const response = await getProvenClient.getVendorUsers(vendorId);

      // Filter for relevant roles and exclude empty contacts
      const relevantRoles = ['vendor_owner', 'vendor_contact_person'];
      const contacts = response.results.filter((user) => {
        // Must have a name
        if (!user.first_name && !user.last_name) return false;
        // Must have at least one relevant role
        return user.roles.some((role) => relevantRoles.includes(role));
      });

      return { success: true, data: contacts };
    } catch (error) {
      logApiError('getVendorContacts', error);
      return { success: true, data: [] };
    }
  },

  /**
   * Get ALL vendor users/contacts without filtering
   * Admin-only: Returns raw API data including all roles, phone numbers
   */
  async getAllVendorUsers(vendorId: string): Promise<ApiResponse<VendorUser[]>> {
    try {
      const response = await getProvenClient.getVendorUsers(vendorId);
      return { success: true, data: response.results };
    } catch (error) {
      logApiError('getAllVendorUsers', error);
      return { success: true, data: [] };
    }
  },
};
