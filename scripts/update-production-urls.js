#!/usr/bin/env node

/**
 * Production URL Update Script
 * Updates production URLs in configuration files
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔧 Production URL Update Script');
  console.log('================================\n');
  
  // Get current App Runner URL from apprunner.yaml
  const apprunnerPath = path.join(__dirname, '..', 'apprunner.yaml');
  let currentUrl = 'https://finorn.com';
  
  if (fs.existsSync(apprunnerPath)) {
    const content = fs.readFileSync(apprunnerPath, 'utf8');
    const match = content.match(/CLIENT_ORIGIN[\s\n]*value:\s*(.+)/);
    if (match) {
      currentUrl = match[1].trim();
    }
  }
  
  console.log(`Current production URL: ${currentUrl}`);
  console.log();
  
  const newUrl = await question('Enter your new App Runner URL (or press Enter to keep current): ');
  
  const finalUrl = newUrl.trim() || currentUrl;
  
  if (!finalUrl.startsWith('https://')) {
    console.log('❌ URL must start with https://');
    rl.close();
    return;
  }
  
  console.log(`\nUpdating to: ${finalUrl}\n`);
  
  // Update apprunner.yaml
  if (fs.existsSync(apprunnerPath)) {
    let content = fs.readFileSync(apprunnerPath, 'utf8');
    content = content.replace(
      /(CLIENT_ORIGIN[\s\n]*value:\s*)(.+)/g,
      `$1${finalUrl}`
    );
    content = content.replace(
      /(APP_URL[\s\n]*value:\s*)(.+)/g,
      `$1${finalUrl}`
    );
    content = content.replace(
      /(VITE_API_URL[\s\n]*value:\s*)(.+)/g,
      `$1${finalUrl}/api`
    );
    
    fs.writeFileSync(apprunnerPath, content);
    console.log('✅ Updated apprunner.yaml');
  }
  
  // Update production.env.template
  const templatePath = path.join(__dirname, '..', 'production.env.template');
  if (fs.existsSync(templatePath)) {
    let content = fs.readFileSync(templatePath, 'utf8');
    content = content.replace(
      /CLIENT_ORIGIN=.+/g,
      `CLIENT_ORIGIN=${finalUrl}`
    );
    content = content.replace(
      /APP_URL=.+/g,
      `APP_URL=${finalUrl}`
    );
    content = content.replace(
      /VITE_API_URL=.+/g,
      `VITE_API_URL=${finalUrl}/api`
    );
    
    fs.writeFileSync(templatePath, content);
    console.log('✅ Updated production.env.template');
  }
  
  // Update environmentConfig.js fallback (optional)
  const envConfigPath = path.join(__dirname, '..', 'utils', 'environmentConfig.js');
  if (fs.existsSync(envConfigPath)) {
    let content = fs.readFileSync(envConfigPath, 'utf8');
    const oldFallback = content.match(/return process\.env\.CLIENT_ORIGIN \|\| '(.+)'/);
    
    if (oldFallback && oldFallback[1] !== finalUrl) {
      const shouldUpdate = await question(`Update fallback URL in environmentConfig.js from ${oldFallback[1]} to ${finalUrl}? (y/N): `);
      
      if (shouldUpdate.toLowerCase() === 'y') {
        content = content.replace(
          /return process\.env\.CLIENT_ORIGIN \|\| '.+'/g,
          `return process.env.CLIENT_ORIGIN || '${finalUrl}'`
        );
        content = content.replace(
          /return process\.env\.APP_URL \|\| process\.env\.CLIENT_ORIGIN \|\| '.+'/g,
          `return process.env.APP_URL || process.env.CLIENT_ORIGIN || '${finalUrl}'`
        );
        
        fs.writeFileSync(envConfigPath, content);
        console.log('✅ Updated environmentConfig.js fallback URLs');
      }
    }
  }
  
  console.log('\n🎉 Production URLs updated successfully!');
  console.log('\nNext steps:');
  console.log('1. Commit these changes to your repository');
  console.log('2. Deploy to AWS App Runner');
  console.log('3. Run the validation script: node scripts/validate-production-config.js');
  console.log('4. Test all functionality in production');
  
  rl.close();
}

main().catch(console.error); 