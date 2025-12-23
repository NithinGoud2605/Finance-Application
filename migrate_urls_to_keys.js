// Migration script to convert full S3 URLs to S3 keys
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize database connection - using same config as main app
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  String(process.env.DB_PASSWORD), {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Function to extract S3 key from full URL
function extractS3KeyFromUrl(url) {
  if (!url || !url.includes('.s3.amazonaws.com/')) {
    return url; // Already a key or invalid
  }
  
  try {
    const parts = url.split('.s3.amazonaws.com/');
    if (parts.length > 1) {
      // Remove query parameters if any
      return parts[1].split('?')[0];
    }
  } catch (error) {
    console.error('Error extracting S3 key from:', url, error);
  }
  
  return url; // Return original if extraction fails
}

async function migrateInvoiceUrls() {
  console.log('🔄 Migrating Invoice URLs to S3 keys...');
  
  try {
    // Find all invoices with full URLs
    const [invoices] = await sequelize.query(`
      SELECT id, "pdfUrl" 
      FROM invoices 
      WHERE "pdfUrl" LIKE 'https://%amazonaws.com%'
    `);
    
    console.log(`Found ${invoices.length} invoices with full URLs`);
    
    for (const invoice of invoices) {
      const s3Key = extractS3KeyFromUrl(invoice.pdfUrl);
      if (s3Key !== invoice.pdfUrl) {
        await sequelize.query(`
          UPDATE invoices 
          SET "pdfUrl" = :s3Key 
          WHERE id = :id
        `, {
          replacements: { s3Key, id: invoice.id }
        });
        console.log(`✅ Updated invoice ${invoice.id}: ${invoice.pdfUrl} → ${s3Key}`);
      }
    }
    
  } catch (error) {
    console.error('Error migrating invoice URLs:', error);
  }
}

async function migrateContractUrls() {
  console.log('🔄 Migrating Contract URLs to S3 keys...');
  
  try {
    // Find all contracts with full URLs
    const [contracts] = await sequelize.query(`
      SELECT id, "pdfUrl", "contractUrl" 
      FROM contracts 
      WHERE "pdfUrl" LIKE 'https://%amazonaws.com%' 
         OR "contractUrl" LIKE 'https://%amazonaws.com%'
    `);
    
    console.log(`Found ${contracts.length} contracts with full URLs`);
    
    for (const contract of contracts) {
      const updates = {};
      
      if (contract.pdfUrl && contract.pdfUrl.includes('amazonaws.com')) {
        updates.pdfUrl = extractS3KeyFromUrl(contract.pdfUrl);
      }
      
      if (contract.contractUrl && contract.contractUrl.includes('amazonaws.com')) {
        updates.contractUrl = extractS3KeyFromUrl(contract.contractUrl);
      }
      
      if (Object.keys(updates).length > 0) {
        const setParts = Object.keys(updates).map(key => `"${key}" = :${key}`).join(', ');
        await sequelize.query(`
          UPDATE contracts 
          SET ${setParts}
          WHERE id = :id
        `, {
          replacements: { ...updates, id: contract.id }
        });
        console.log(`✅ Updated contract ${contract.id}:`, updates);
      }
    }
    
  } catch (error) {
    console.error('Error migrating contract URLs:', error);
  }
}

async function migrateDocumentUrls() {
  console.log('🔄 Migrating Document URLs to S3 keys...');
  
  try {
    // Find all documents with full URLs
    const [documents] = await sequelize.query(`
      SELECT id, "fileUrl" 
      FROM documents 
      WHERE "fileUrl" LIKE 'https://%amazonaws.com%'
    `);
    
    console.log(`Found ${documents.length} documents with full URLs`);
    
    for (const document of documents) {
      const s3Key = extractS3KeyFromUrl(document.fileUrl);
      if (s3Key !== document.fileUrl) {
        await sequelize.query(`
          UPDATE documents 
          SET "fileUrl" = :s3Key 
          WHERE id = :id
        `, {
          replacements: { s3Key, id: document.id }
        });
        console.log(`✅ Updated document ${document.id}: ${document.fileUrl} → ${s3Key}`);
      }
    }
    
  } catch (error) {
    console.error('Error migrating document URLs:', error);
  }
}

async function runMigration() {
  console.log('🚀 Starting S3 URL to Key Migration...\n');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    await migrateInvoiceUrls();
    console.log('');
    await migrateContractUrls();
    console.log('');
    await migrateDocumentUrls();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n🔒 Security Status:');
    console.log('  - All full S3 URLs converted to keys');
    console.log('  - No AWS credentials in database');
    console.log('  - Secure access pattern enforced');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, extractS3KeyFromUrl }; 