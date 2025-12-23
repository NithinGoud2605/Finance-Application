// utils/inviteToken.js
const { v4: uuidv4 } = require('uuid');

/**
 * Generates a brand‑new invitation token.
 * Extraction is centralised so we can change the strategy later.
 */
function generateInviteToken() {
  return uuidv4();
}

module.exports = { generateInviteToken };
