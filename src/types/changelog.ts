/**
 * Admin Changelog Types
 *
 * Types for the admin audit log system that tracks
 * all mutating admin actions.
 */

/** All possible admin actions */
export type ChangelogAction =
  | 'access_request.approve'
  | 'access_request.reject'
  | 'whitelist.upload_csv'
  | 'offers.sync'
  | 'vendors.sync'
  | 'provider.create'
  | 'provider.update'
  | 'provider.delete';

/** Entity types that can be affected by admin actions */
export type ChangelogEntityType =
  | 'access_request'
  | 'whitelist'
  | 'offers'
  | 'vendors'
  | 'provider';

/** A single changelog entry (matches `admin_changelog` Supabase table) */
export interface ChangelogEntry {
  id: string;
  admin_id: string;
  admin_email: string;
  admin_name: string | null;
  action: ChangelogAction;
  entity_type: ChangelogEntityType;
  entity_id: string | null;
  summary: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

/** Parameters for logging a changelog entry */
export interface ChangelogLogParams {
  adminId: string;
  adminEmail: string;
  adminName?: string;
  action: ChangelogAction;
  entityType: ChangelogEntityType;
  entityId?: string;
  summary: string;
  details?: Record<string, unknown>;
}
