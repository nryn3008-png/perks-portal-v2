/**
 * Bridge module exports
 *
 * Server-only authentication and authorization utilities
 */

export {
  resolveAuth,
  requireAuth,
  requireAdmin,
  BRIDGE_LOGIN_URL,
  type AuthUser,
  type AuthResult,
  type BridgeUserProfile,
} from './auth';
