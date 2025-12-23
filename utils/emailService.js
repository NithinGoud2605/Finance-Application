// emailService.js - Using Resend instead of AWS SES
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { Resend } = require('resend');
const logger = require('./logger');
const environmentConfig = require('./environmentConfig');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.RESEND_API_KEY) {
  logger.warn('RESEND_API_KEY not set - email sending will be disabled');
}

// Send invitation email
async function sendInvitationEmail(toEmail, organizationId, inviterId = null, organizationName = 'Our Organization', inviteToken, forceEmail = false) {
  if (!toEmail || !organizationId) {
    throw new Error('Email and organizationId are required');
  }

  const clientOrigin = process.env.CLIENT_ORIGIN;
  const source = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  // Clean, professional invite URL using environment config
  const inviteUrl = environmentConfig.getInvitationUrl(inviteToken, organizationId, toEmail);
  
  // Professional HTML template with Finorn branding
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to join ${organizationName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        
        <!-- Header with Finorn Branding -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <div style="background-color: rgba(255, 255, 255, 0.1); display: inline-block; padding: 12px 24px; border-radius: 25px; margin-bottom: 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">Finorn</h1>
            </div>
            <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 400; opacity: 0.9;">Professional Business Solutions</h2>
        </div>

        <!-- Main Content -->
        <div style="padding: 50px 40px;">
            
            <!-- Invitation Icon -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                    <span style="color: white; font-size: 24px; font-weight: bold;">📧</span>
                </div>
                <h1 style="color: #2d3748; margin: 0; font-size: 28px; font-weight: 700;">You're Invited!</h1>
                <p style="color: #718096; margin: 8px 0 0 0; font-size: 16px;">Join ${organizationName} on Finorn</p>
            </div>

            <!-- Invitation Message -->
            <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 25px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #2d3748; margin: 0; font-size: 16px; line-height: 1.6;">
                    <strong>${organizationName}</strong> has invited you to collaborate on their professional business platform. 
                    Join their team to access shared invoices, contracts, and business tools.
                </p>
            </div>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="${inviteUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: #ffffff; 
                          text-decoration: none; 
                          padding: 16px 40px; 
                          border-radius: 30px; 
                          font-size: 16px; 
                          font-weight: 600; 
                          display: inline-block; 
                          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                          transition: all 0.3s ease;">
                    Accept Invitation →
                </a>
            </div>

            <!-- Alternative Link -->
            <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #4a5568; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">
                    Can't click the button? Copy and paste this link:
                </p>
                <p style="color: #667eea; margin: 0; font-size: 14px; word-break: break-all; font-family: Monaco, Consolas, 'Courier New', monospace; background-color: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
                    ${inviteUrl}
                </p>
            </div>

            <!-- Benefits Section -->
            <div style="margin: 40px 0;">
                <h3 style="color: #2d3748; font-size: 18px; font-weight: 600; margin-bottom: 20px; text-align: center;">What you'll get access to:</h3>
                <div style="display: table; width: 100%;">
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 10px 15px; vertical-align: top; width: 33.33%;">
                            <div style="text-align: center;">
                                <div style="color: #667eea; font-size: 24px; margin-bottom: 8px;">📊</div>
                                <p style="color: #4a5568; font-size: 14px; margin: 0; font-weight: 500;">Professional Invoicing</p>
                            </div>
                        </div>
                        <div style="display: table-cell; padding: 10px 15px; vertical-align: top; width: 33.33%;">
                            <div style="text-align: center;">
                                <div style="color: #667eea; font-size: 24px; margin-bottom: 8px;">📄</div>
                                <p style="color: #4a5568; font-size: 14px; margin: 0; font-weight: 500;">Contract Management</p>
                            </div>
                        </div>
                        <div style="display: table-cell; padding: 10px 15px; vertical-align: top; width: 33.33%;">
                            <div style="text-align: center;">
                                <div style="color: #667eea; font-size: 24px; margin-bottom: 8px;">👥</div>
                                <p style="color: #4a5568; font-size: 14px; margin: 0; font-weight: 500;">Team Collaboration</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f7fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
            <div style="text-align: center;">
                <p style="color: #718096; margin: 0 0 15px 0; font-size: 14px;">
                    This invitation will expire in <strong>7 days</strong>
                </p>
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                    If you weren't expecting this invitation, you can safely ignore this email.
                </p>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                        © 2024 Finorn. Professional Business Solutions.
                    </p>
                    <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 12px;">
                        Sent from: ${source}
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

  // Clean text version for email clients that don't support HTML
  const textTemplate = `
🎉 You're invited to join ${organizationName} on Finorn!

${organizationName} has invited you to collaborate on their professional business platform.

What you'll get access to:
• Professional Invoicing Tools
• Contract Management System  
• Team Collaboration Features

ACCEPT INVITATION:
${inviteUrl}

This invitation expires in 7 days.

If you weren't expecting this invitation, you can safely ignore this email.

---
© 2024 Finorn - Professional Business Solutions
Sent from: ${source}
  `;

  try {
    // Check if we should send real emails
    const shouldSendEmail = forceEmail || 
                           process.env.NODE_ENV === 'production' || 
                           process.env.FORCE_EMAIL_SENDING === 'true';

    if (!shouldSendEmail) {
      logger.info('Development mode - Email would have been sent:', {
        to: toEmail,
        subject: `🎉 You're invited to join ${organizationName} on Finorn`,
        text: textTemplate,
        url: inviteUrl
      });
      return 'DEV_MODE_' + Date.now();
    }

    if (!process.env.RESEND_API_KEY) {
      logger.warn('Resend API key not configured - skipping email send');
      return 'SKIPPED_NO_API_KEY';
    }

    // Send the actual email using Resend
    const { data, error } = await resend.emails.send({
      from: source,
      to: toEmail,
      subject: `🎉 You're invited to join ${organizationName} on Finorn`,
      html: htmlTemplate,
      text: textTemplate
    });
    
    if (error) {
      logger.error('Error sending invitation email via Resend:', error);
      throw error;
    }
    
    logger.info('Professional invitation email sent', { 
      messageId: data?.id, 
      toEmail, 
      organizationId,
      organizationName,
      brandedTemplate: true
    });
    return data?.id || 'SENT';
  } catch (err) {
    logger.error('Error sending professional invitation email', { 
      error: err.message,
      toEmail,
      organizationId,
      isDev: process.env.NODE_ENV !== 'production'
    });
    throw err;
  }
}

// Send organization invitation email (alternative function signature)
exports.sendInvitationEmail = async (email, { organizationId, token, inviterId }) => {
  try {
    // Get the organization name from the database
    const { Organization, User } = require('../models');
    const [organization, inviter] = await Promise.all([
      Organization.findByPk(organizationId),
      User.findByPk(inviterId)
    ]);

    if (!organization || !inviter) {
      throw new Error('Organization or inviter not found');
    }

    return await sendInvitationEmail(email, organizationId, inviterId, organization.name, token, true);
  } catch (error) {
    logger.error('Failed to send organization invitation email:', error);
    throw error;
  }
};

exports.sendOrganizationInvitation = async (inviteData) => {
  const { email, organizationName, inviterName, role, inviteToken, orgId } = inviteData;
  
  return await sendInvitationEmail(email, orgId, null, organizationName, inviteToken, true);
};

// Send Invoice Email
async function sendInvoiceEmail(toEmail, invoiceData, publicViewUrl, senderMessage = '') {
  if (!toEmail || !invoiceData) {
    throw new Error('Email and invoice data are required');
  }

  const source = process.env.INVOICE_EMAIL_FROM || process.env.EMAIL_FROM || 'onboarding@resend.dev';

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceData.invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center;">
            <div style="background-color: rgba(255, 255, 255, 0.1); display: inline-block; padding: 12px 24px; border-radius: 25px; margin-bottom: 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">Finorn</h1>
            </div>
            <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 400; opacity: 0.9;">Invoice</h2>
        </div>

        <!-- Main Content -->
        <div style="padding: 50px 40px;">
            
            <!-- Invoice Icon -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                    <span style="color: white; font-size: 24px; font-weight: bold;">📄</span>
                </div>
                <h1 style="color: #2d3748; margin: 0; font-size: 28px; font-weight: 700;">New Invoice</h1>
                <p style="color: #718096; margin: 8px 0 0 0; font-size: 16px;">Invoice #${invoiceData.invoiceNumber}</p>
            </div>

            <!-- Invoice Details -->
            <div style="background-color: #f7fafc; border-left: 4px solid #28a745; padding: 25px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Invoice Number:</td>
                        <td style="padding: 8px 0; color: #2d3748;">${invoiceData.invoiceNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Amount:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 18px; font-weight: 700;">${invoiceData.currency || 'USD'} ${parseFloat(invoiceData.totalAmount || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Issue Date:</td>
                        <td style="padding: 8px 0; color: #2d3748;">${invoiceData.issueDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Due Date:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${invoiceData.dueDate}</td>
                    </tr>
                </table>
            </div>

            ${senderMessage ? `
            <!-- Custom Message -->
            <div style="background-color: #e6f3ff; border-left: 4px solid #0066cc; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #2d3748; margin: 0; font-size: 16px; line-height: 1.6;">
                    <strong>Message:</strong><br/>
                    ${senderMessage}
                </p>
            </div>
            ` : ''}

            <!-- View Invoice Button -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="${publicViewUrl}" 
                   style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                          color: #ffffff; 
                          text-decoration: none; 
                          padding: 16px 40px; 
                          border-radius: 30px; 
                          font-size: 16px; 
                          font-weight: 600; 
                          display: inline-block; 
                          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
                          transition: all 0.3s ease;">
                    View Invoice →
                </a>
            </div>

            <!-- Alternative Link -->
            <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #4a5568; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">
                    Can't click the button? Copy and paste this link:
                </p>
                <p style="color: #28a745; margin: 0; font-size: 14px; word-break: break-all; font-family: Monaco, Consolas, 'Courier New', monospace; background-color: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
                    ${publicViewUrl}
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f7fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
            <div style="text-align: center;">
                <p style="color: #718096; margin: 0 0 15px 0; font-size: 14px;">
                    Please pay by the due date to avoid any late fees.
                </p>
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                    If you have any questions, please reply to this email.
                </p>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                        © 2024 Finorn. Professional Business Solutions.
                    </p>
                    <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 12px;">
                        Sent from: ${source}
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

  const textTemplate = `
Invoice #${invoiceData.invoiceNumber}

Amount: ${invoiceData.currency || 'USD'} ${parseFloat(invoiceData.totalAmount || 0).toFixed(2)}
Issue Date: ${invoiceData.issueDate}
Due Date: ${invoiceData.dueDate}

${senderMessage ? `Message: ${senderMessage}\n\n` : ''}

View Invoice: ${publicViewUrl}

Please pay by the due date to avoid any late fees.

---
© 2024 Finorn - Professional Business Solutions
Sent from: ${source}
  `;

  try {
    const shouldSendEmail = process.env.NODE_ENV === 'production' || 
                           process.env.FORCE_EMAIL_SENDING === 'true';

    if (!shouldSendEmail) {
      logger.info('Development mode - Invoice email would have been sent:', {
        to: toEmail,
        subject: `Invoice #${invoiceData.invoiceNumber} - ${invoiceData.currency || 'USD'} ${parseFloat(invoiceData.totalAmount || 0).toFixed(2)}`,
        invoiceNumber: invoiceData.invoiceNumber,
        amount: invoiceData.totalAmount,
        url: publicViewUrl
      });
      return 'DEV_MODE_' + Date.now();
    }

    if (!process.env.RESEND_API_KEY) {
      logger.warn('Resend API key not configured - skipping email send');
      return 'SKIPPED_NO_API_KEY';
    }

    const { data, error } = await resend.emails.send({
      from: source,
      to: toEmail,
      subject: `Invoice #${invoiceData.invoiceNumber} - ${invoiceData.currency || 'USD'} ${parseFloat(invoiceData.totalAmount || 0).toFixed(2)}`,
      html: htmlTemplate,
      text: textTemplate
    });
    
    if (error) {
      logger.error('Error sending invoice email via Resend:', error);
      throw error;
    }
    
    logger.info('Invoice email sent successfully', { 
      messageId: data?.id, 
      toEmail, 
      invoiceNumber: invoiceData.invoiceNumber,
      amount: invoiceData.totalAmount
    });
    return data?.id || 'SENT';
  } catch (err) {
    logger.error('Error sending invoice email', { 
      error: err.message,
      toEmail,
      invoiceNumber: invoiceData.invoiceNumber
    });
    throw err;
  }
}

// Send Contract Email
async function sendContractEmail(toEmail, contractData, publicViewUrl, senderMessage = '') {
  if (!toEmail || !contractData) {
    throw new Error('Email and contract data are required');
  }

  const source = process.env.CONTRACT_EMAIL_FROM || process.env.EMAIL_FROM || 'onboarding@resend.dev';

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract: ${contractData.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); padding: 40px 30px; text-align: center;">
            <div style="background-color: rgba(255, 255, 255, 0.1); display: inline-block; padding: 12px 24px; border-radius: 25px; margin-bottom: 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">Finorn</h1>
            </div>
            <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 400; opacity: 0.9;">Contract</h2>
        </div>

        <!-- Main Content -->
        <div style="padding: 50px 40px;">
            
            <!-- Contract Icon -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                    <span style="color: white; font-size: 24px; font-weight: bold;">📋</span>
                </div>
                <h1 style="color: #2d3748; margin: 0; font-size: 28px; font-weight: 700;">New Contract</h1>
                <p style="color: #718096; margin: 8px 0 0 0; font-size: 16px;">${contractData.title}</p>
            </div>

            <!-- Contract Details -->
            <div style="background-color: #f7fafc; border-left: 4px solid #6f42c1; padding: 25px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Contract Title:</td>
                        <td style="padding: 8px 0; color: #2d3748;">${contractData.title}</td>
                    </tr>
                    ${contractData.value ? `
                    <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Value:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 18px; font-weight: 700;">${contractData.currency || 'USD'} ${parseFloat(contractData.value || 0).toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Start Date:</td>
                        <td style="padding: 8px 0; color: #2d3748;">${contractData.startDate}</td>
                    </tr>
                    ${contractData.endDate ? `
                    <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">End Date:</td>
                        <td style="padding: 8px 0; color: #2d3748;">${contractData.endDate}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-weight: 600;">Status:</td>
                        <td style="padding: 8px 0; color: #2d3748; text-transform: capitalize;">${contractData.status}</td>
                    </tr>
                </table>
            </div>

            ${senderMessage ? `
            <!-- Custom Message -->
            <div style="background-color: #e6f3ff; border-left: 4px solid #0066cc; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #2d3748; margin: 0; font-size: 16px; line-height: 1.6;">
                    <strong>Message:</strong><br/>
                    ${senderMessage}
                </p>
            </div>
            ` : ''}

            <!-- View Contract Button -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="${publicViewUrl}" 
                   style="background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); 
                          color: #ffffff; 
                          text-decoration: none; 
                          padding: 16px 40px; 
                          border-radius: 30px; 
                          font-size: 16px; 
                          font-weight: 600; 
                          display: inline-block; 
                          box-shadow: 0 4px 15px rgba(111, 66, 193, 0.4);
                          transition: all 0.3s ease;">
                    View Contract →
                </a>
            </div>

            <!-- Alternative Link -->
            <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #4a5568; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">
                    Can't click the button? Copy and paste this link:
                </p>
                <p style="color: #6f42c1; margin: 0; font-size: 14px; word-break: break-all; font-family: Monaco, Consolas, 'Courier New', monospace; background-color: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
                    ${publicViewUrl}
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f7fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
            <div style="text-align: center;">
                <p style="color: #718096; margin: 0 0 15px 0; font-size: 14px;">
                    Please review the contract and let us know if you have any questions.
                </p>
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                    If you have any questions, please reply to this email.
                </p>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                        © 2024 Finorn. Professional Business Solutions.
                    </p>
                    <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 12px;">
                        Sent from: ${source}
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

  const textTemplate = `
Contract: ${contractData.title}

${contractData.value ? `Value: ${contractData.currency || 'USD'} ${parseFloat(contractData.value || 0).toFixed(2)}\n` : ''}Start Date: ${contractData.startDate}
${contractData.endDate ? `End Date: ${contractData.endDate}\n` : ''}Status: ${contractData.status}

${senderMessage ? `Message: ${senderMessage}\n\n` : ''}

View Contract: ${publicViewUrl}

Please review the contract and let us know if you have any questions.

---
© 2024 Finorn - Professional Business Solutions
Sent from: ${source}
  `;

  try {
    const shouldSendEmail = process.env.NODE_ENV === 'production' || 
                           process.env.FORCE_EMAIL_SENDING === 'true';

    if (!shouldSendEmail) {
      logger.info('Development mode - Contract email would have been sent:', {
        to: toEmail,
        subject: `Contract: ${contractData.title}`,
        contractTitle: contractData.title,
        contractValue: contractData.value,
        url: publicViewUrl
      });
      return 'DEV_MODE_' + Date.now();
    }

    if (!process.env.RESEND_API_KEY) {
      logger.warn('Resend API key not configured - skipping email send');
      return 'SKIPPED_NO_API_KEY';
    }

    const { data, error } = await resend.emails.send({
      from: source,
      to: toEmail,
      subject: `Contract: ${contractData.title}`,
      html: htmlTemplate,
      text: textTemplate
    });
    
    if (error) {
      logger.error('Error sending contract email via Resend:', error);
      throw error;
    }
    
    logger.info('Contract email sent successfully', { 
      messageId: data?.id, 
      toEmail, 
      contractTitle: contractData.title,
      contractValue: contractData.value
    });
    return data?.id || 'SENT';
  } catch (err) {
    logger.error('Error sending contract email', { 
      error: err.message,
      toEmail,
      contractTitle: contractData.title
    });
    throw err;
  }
}

module.exports = { 
  sendInvitationEmail,
  sendInvoiceEmail,
  sendContractEmail
};
