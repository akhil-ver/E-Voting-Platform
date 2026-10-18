/**
 * Role-Based Access Control (RBAC) System
 * Enforces server-side and client-side privilege boundaries
 */
import { UserRole } from '../types';

export const PERMISSIONS = {
  // Voter permissions
  VOTE_CAST: ['VOTER', 'ADMIN'],
  VIEW_RECEIPT: ['VOTER', 'ADMIN', 'AUDITOR', 'OBSERVER'],
  CHECK_ELIGIBILITY: ['VOTER', 'ADMIN'],

  // Public permissions
  VERIFY_BALLOT: ['VOTER', 'ADMIN', 'AUDITOR', 'OBSERVER'],
  VIEW_TRANSPARENCY: ['VOTER', 'ADMIN', 'AUDITOR', 'OBSERVER'],

  // Auditor & Admin permissions
  VIEW_AUDIT_LOG: ['ADMIN', 'AUDITOR'],
  VERIFY_CHAIN_INTEGRITY: ['ADMIN', 'AUDITOR'],
  VIEW_FRAUD_DASHBOARD: ['ADMIN', 'AUDITOR'],
  AI_SECURITY_COPILOT: ['ADMIN', 'AUDITOR'],

  // Admin exclusive permissions
  MANAGE_ELECTION: ['ADMIN'],
  EMERGENCY_LOCKDOWN: ['ADMIN'],
  DISASTER_RECOVERY: ['ADMIN'],
  SIMULATE_ATTACKS: ['ADMIN', 'AUDITOR'],
  CONFIGURE_VALIDATORS: ['ADMIN'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly string[];
  return allowedRoles.includes(role);
}

export function validateRoleHeader(roleHeader?: string | string[]): UserRole {
  if (Array.isArray(roleHeader)) {
    return (roleHeader[0] as UserRole) || 'OBSERVER';
  }
  if (roleHeader && ['VOTER', 'ADMIN', 'AUDITOR', 'OBSERVER'].includes(roleHeader)) {
    return roleHeader as UserRole;
  }
  return 'OBSERVER';
}
