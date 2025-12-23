#!/usr/bin/env node

/**
 * Production Configuration Validation Script
 * Validates environment configuration for production deployment
 */

const path = require('path');
const fs = require('fs');

// Load environment config
require('dotenv').config();
const environmentConfig = require('../utils/environmentConfig');

console.log('🔍 Production Configuration Validation');
console.log('=====================================\n');

// 1. Check Node environment
console.log('1. Environment Check:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   Production mode: ${environmentConfig.isProduction ? '✅' : '❌'}`);
console.log();

// 2. URL Configuration
console.log('2. URL Configuration:');
console.log(`   CLIENT_ORIGIN: ${process.env.CLIENT_ORIGIN || 'not set'}`);
console.log(`   APP_URL: ${process.env.APP_URL || 'not set'}`);
console.log(`   Computed Client Origin: ${environmentConfig.getClientOrigin()}`);
console.log(`   Computed Server URL: ${environmentConfig.getServerUrl()}`);
console.log(`   API URL: ${environmentConfig.getApiUrl()}`);
console.log();

// 3. Critical URLs validation
console.log('3. Critical URLs:');
console.log(`   OAuth Callback: ${environmentConfig.getOAuthCallbackUrl()}`);
console.log(`   Dashboard: ${environmentConfig.getDashboardUrl()}`);

// Test invitation URL
const testInviteUrl = environmentConfig.getInvitationUrl(
  'test-token-123', 
  'test-org-456', 
  'test@example.com'
);
console.log(`   Sample Invitation: ${testInviteUrl}`);

// Test public view URLs
console.log(`   Invoice View: ${environmentConfig.getPublicViewUrl('invoice', 'test-token')}`);
console.log(`   Contract View: ${environmentConfig.getPublicViewUrl('contract', 'test-token')}`);
console.log();

// 4. Environment validation
console.log('4. Environment Validation:');
const validation = environmentConfig.validateConfig();

if (validation.isValid) {
  console.log('   ✅ Environment validation passed');
} else {
  console.log('   ❌ Environment validation failed');
  validation.missing.forEach(missing => {
    console.log(`   - Missing: ${missing}`);
  });
}

if (validation.warnings.length > 0) {
  console.log('   ⚠️  Warnings:');
  validation.warnings.forEach(warning => {
    console.log(`   - ${warning}`);
  });
}
console.log();

// 5. File checks
console.log('5. Configuration Files:');

const filesToCheck = [
  'production.env.template',
  'apprunner.yaml',
  'utils/environmentConfig.js'
];

filesToCheck.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`   ${file}: ${exists ? '✅' : '❌'}`);
});
console.log();

// 6. Localhost references check
console.log('6. Hardcoded Localhost Check:');
const filesToScan = [
  'controllers/authCallbackController.js',
  'controllers/contractController.js', 
  'controllers/invoiceController.js',
  'utils/emailService.js',
  'frontend/src/services/apiConfig.js'
];

let localhostFound = false;
filesToScan.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasLocalhost = content.includes('localhost:') && 
                        !content.includes('// localhost') && 
                        !content.includes('* localhost') &&
                        !content.includes('localhost:3000/api') === false; // Allow in comments
    
    if (hasLocalhost) {
      console.log(`   ${file}: ❌ Contains hardcoded localhost`);
      localhostFound = true;
    } else {
      console.log(`   ${file}: ✅ No hardcoded localhost`);
    }
  } else {
    console.log(`   ${file}: ❓ File not found`);
  }
});

if (!localhostFound) {
  console.log('   ✅ No problematic localhost references found');
}
console.log();

// 7. Production readiness summary
console.log('7. Production Readiness Summary:');
console.log('================================');

const isProductionReady = validation.isValid && !localhostFound;

if (isProductionReady) {
  console.log('🎉 Your application appears to be production-ready!');
  console.log();
  console.log('Next steps:');
  console.log('1. Update CLIENT_ORIGIN and APP_URL in your production environment');
  console.log('2. Deploy and test all functionality');
  console.log('3. Verify email invitations work correctly');
  console.log('4. Test OAuth callback flows');
} else {
  console.log('⚠️  Issues found that need attention:');
  if (!validation.isValid) {
    console.log('- Fix missing environment variables');
  }
  if (localhostFound) {
    console.log('- Remove hardcoded localhost references');
  }
}

console.log();
console.log('Environment Configuration loaded successfully! 🚀');

// Log the configuration for debugging
environmentConfig.logConfig(); 