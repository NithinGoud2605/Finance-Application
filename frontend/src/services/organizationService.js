// src/services/organizationService.js
// -----------------------------------------------------------------------------
// Thin service layer that simply re‑exports the organization‑related helpers
// from src/api.jsx.  Keeps UI code decoupled from the raw API file so you can
// swap implementations (REST ↔ GraphQL, etc.) without changing the rest of the
// app.
// -----------------------------------------------------------------------------

import { apiRequest } from './api';

/**
 * Get all organizations the current user belongs to
 */
export const getUserOrganizations = async () => {
  return apiRequest('get', '/organizations/my-organizations');
};

/**
 * Create a new organization
 */
export const createOrganization = async (data) => {
  return apiRequest('post', '/organizations', data);
};

/**
 * Get an organization by ID
 */
export const getOrganization = async (id) => {
  return apiRequest('get', `/organizations/${id}`);
};

/**
 * Update an organization
 */
export const updateOrganization = async (id, data) => {
  return apiRequest('put', `/organizations/${id}`, data);
};

/**
 * Delete an organization
 */
export const deleteOrganization = async (id) => {
  return apiRequest('delete', `/organizations/${id}`);
};

/**
 * Set the current organization
 */
export const setCurrentOrganization = async (id) => {
  return apiRequest('post', `/organizations/${id}/select`);
};

/**
 * Get organization members
 */
export const getOrganizationMembers = async (orgId) => {
  return apiRequest('get', `/organizations/${orgId}/members`);
};

/**
 * Invite a member to an organization
 */
export const inviteMember = async (orgId, data) => {
  return apiRequest('post', `/organizations/${orgId}/members/invite`, data);
};

/**
 * Update a member's role in an organization
 */
export const updateMember = async (orgId, userId, data) => {
  return apiRequest('put', `/organizations/${orgId}/members/${userId}`, data);
};

/**
 * Remove a member from an organization
 */
export const removeMember = async (orgId, userId) => {
  return apiRequest('delete', `/organizations/${orgId}/members/${userId}`);
};

/**
 * Get pending invitations for an organization
 */
export const getPendingInvitations = async (orgId) => {
  return apiRequest('get', `/organizations/${orgId}/invitations/pending`);
};

/**
 * Cancel a pending invitation
 */
export const cancelInvitation = async (orgId, invitationId) => {
  return apiRequest('delete', `/organizations/${orgId}/invitations/${invitationId}`);
};

/**
 * Manually cleanup expired invitations for an organization
 */
export const cleanupExpiredInvitations = async (orgId) => {
  return apiRequest('post', `/organizations/${orgId}/invitations/cleanup`);
};

/**
 * Get organization settings
 */
export const getOrganizationSettings = async (orgId) => {
  return apiRequest('get', `/organizations/${orgId}/settings`);
};

/**
 * Update organization settings
 */
export const updateOrganizationSettings = async (orgId, data) => {
  return apiRequest('put', `/organizations/${orgId}/settings`, data);
};

/**
 * Get organization subscription information
 */
export const getOrganizationSubscription = async (orgId) => {
  return apiRequest('get', `/organizations/${orgId}/subscription`);
};

/**
 * Update organization subscription (change plan)
 */
export const updateOrganizationSubscription = async (orgId, data) => {
  return apiRequest('post', `/organizations/${orgId}/subscription`, data);
};

/**
 * Cancel organization subscription
 */
export const cancelOrganizationSubscription = async (orgId) => {
  return apiRequest('delete', `/organizations/${orgId}/subscription`);
};

/**
 * Resume a canceled organization subscription (before period end)
 */
export const resumeOrganizationSubscription = async (orgId) => {
  return apiRequest('post', `/organizations/${orgId}/subscription/resume`);
};

/**
 * Get organization payment history
 */
export const getOrganizationPaymentHistory = async (orgId) => {
  return apiRequest('get', `/organizations/${orgId}/payment-history`);
};

/**
 * Create organization activation checkout session
 */
export const createOrganizationActivationSession = async ({ organizationId }) => {
  return apiRequest('post', '/payments/activate-organization', { 
    organizationId,
    successUrl: `${window.location.origin}/organization/${organizationId}/dashboard?activation=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${window.location.origin}/organization/${organizationId}/settings?activation=cancelled`
  });
};

/**
 * Get organization available roles
 */
export const getOrganizationRoles = async (orgId) => {
  return apiRequest('get', `/organizations/${orgId}/roles`);
};

/* You can also export a default object if you prefer:
//
// export default {
//   getOrganization,
//   getUserOrganizations,
//   createOrganization,
//   ...
// };
*/
  