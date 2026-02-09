/**
 * Changelog Service
 *
 * Records and queries admin audit log entries.
 * Server-only — uses Supabase admin client.
 */

import { createSupabaseAdmin } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type {
  ChangelogEntry,
  ChangelogLogParams,
  ChangelogAction,
  ChangelogEntityType,
} from '@/types';

export interface ChangelogFilters {
  action?: ChangelogAction;
  entityType?: ChangelogEntityType;
  adminEmail?: string;
  dateFrom?: string; // ISO string
  dateTo?: string; // ISO string
}

export interface ChangelogListResponse {
  data: ChangelogEntry[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const changelogService = {
  /**
   * Insert a changelog entry. Fire-and-forget — errors are logged
   * but never block the calling route from responding.
   */
  async log(params: ChangelogLogParams): Promise<void> {
    try {
      const supabase = createSupabaseAdmin();

      const { error } = await supabase.from('admin_changelog').insert({
        admin_id: params.adminId,
        admin_email: params.adminEmail,
        admin_name: params.adminName || null,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        summary: params.summary,
        details: params.details || {},
      });

      if (error) {
        logger.error('[Changelog] Failed to insert entry:', error);
      }
    } catch (err) {
      logger.error('[Changelog] Unexpected error:', err);
    }
  },

  /**
   * Paginated list of changelog entries with optional filters.
   */
  async list(
    page = 1,
    pageSize = 25,
    filters: ChangelogFilters = {}
  ): Promise<ChangelogListResponse> {
    const supabase = createSupabaseAdmin();
    const offset = (page - 1) * pageSize;

    // Build count query
    let countQuery = supabase
      .from('admin_changelog')
      .select('*', { count: 'exact', head: true });

    // Build data query
    let dataQuery = supabase
      .from('admin_changelog')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Apply filters to both queries
    if (filters.action) {
      countQuery = countQuery.eq('action', filters.action);
      dataQuery = dataQuery.eq('action', filters.action);
    }
    if (filters.entityType) {
      countQuery = countQuery.eq('entity_type', filters.entityType);
      dataQuery = dataQuery.eq('entity_type', filters.entityType);
    }
    if (filters.adminEmail) {
      countQuery = countQuery.eq('admin_email', filters.adminEmail);
      dataQuery = dataQuery.eq('admin_email', filters.adminEmail);
    }
    if (filters.dateFrom) {
      countQuery = countQuery.gte('created_at', filters.dateFrom);
      dataQuery = dataQuery.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      countQuery = countQuery.lte('created_at', filters.dateTo);
      dataQuery = dataQuery.lte('created_at', filters.dateTo);
    }

    const { count } = await countQuery;
    const { data, error } = await dataQuery;

    if (error) {
      logger.error('[Changelog] Query error:', error);
      throw error;
    }

    return {
      data: (data || []) as ChangelogEntry[],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  },
};
