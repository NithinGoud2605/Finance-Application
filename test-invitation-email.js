require('dotenv').config();
const { sendInvitationEmail } = require('./utils/emailService');
const { v4: uuidv4 } = require('uuid');

// Test data
const TEST_ORG_ID = '1f8720be-2402-4bc4-a904-da7c51134e1d'; 
const TEST_EMAIL = 'sainithingoud007@gmail.com';
const TEST_ORG_NAME = 'Test Organization';
const TEST_INVITE_TOKEN = uuidv4();

async function testInvitationEmail() {
  console.log('Testing invitation email with env:', {
    NODE_ENV: process.env.NODE_ENV,
    AWS_REGION: process.env.AWS_REGION,
    AWS_PROFILE: process.env.AWS_PROFILE,
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
    EMAIL_FROM: process.env.EMAIL_FROM
  });

  try {
    const messageId = await sendInvitationEmail(
      TEST_EMAIL, 
      TEST_ORG_ID, 
      null, // inviterId
      TEST_ORG_NAME,
      TEST_INVITE_TOKEN
    );
    console.log('✅ Email sent successfully!', { 
      messageId,
      // Show the generated invite URL for verification
      inviteUrl: `${process.env.CLIENT_ORIGIN}/accept-invite?orgId=${TEST_ORG_ID}&email=${encodeURIComponent(TEST_EMAIL)}&token=${TEST_INVITE_TOKEN}`
    });
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    process.exit(1);
  }
}

testInvitationEmail();