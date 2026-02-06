/**
 * Bridge module exports
 *
 * Server-only authentication and authorization utilities
 */

export {
  resolveAuth,
  resolveAuthWithAccounts,
  requireAuth,
  requireAdmin,
  BRIDGE_LOGIN_URL,
  type AuthUser,
  type AuthResult,
  type AuthResultWithAccounts,
  type BridgeUserProfile,
  type BridgeEmailToken,
  type BridgeNetworkDomain,
  type ConnectedAccount,
  type NetworkDomain,
  type UserWithConnectedAccounts,
} from './auth';
