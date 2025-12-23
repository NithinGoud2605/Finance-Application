const requiredVars = [
  // Session & Security
  'SESSION_KEY', 'CLIENT_ORIGIN',
  
  // Supabase Configuration
  'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  
  // Stripe
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
  'STRIPE_INDIVIDUAL_PRICE_ID', 'STRIPE_BUSINESS_PRICE_ID'
];

// Variables that are recommended but not strictly required
const recommendedVars = ['APP_URL', 'RESEND_API_KEY'];

// Variables with defaults
const varsWithDefaults = {
  'NODE_ENV': 'development',
  'PORT': '3000',
  'DB_NAME': 'postgres'
};

const validateEnvironment = () => {
  // Apply defaults for variables that have them
  Object.entries(varsWithDefaults).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      console.log(`Using default value for ${key}: ${defaultValue}`);
    }
  });

  // Check if SUPABASE_DB_URL is provided OR individual DB params
  const hasDbUrl = !!process.env.SUPABASE_DB_URL;
  const hasIndividualDbParams = !!(process.env.DB_HOST || process.env.SUPABASE_DB_HOST);
  
  if (!hasDbUrl && !hasIndividualDbParams) {
    console.error('Database configuration required: Either SUPABASE_DB_URL or DB_HOST must be set');
    process.exit(1);
  }
  
  const missing = requiredVars.filter(variable => !process.env[variable]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }

  // Check recommended variables
  const missingRecommended = recommendedVars.filter(variable => !process.env[variable]);
  if (missingRecommended.length > 0) {
    console.warn('Missing recommended environment variables:', missingRecommended.join(', '));
    console.warn('These variables will use fallback values but should be set for production');
  }

  // Validate Supabase URL format
  if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('supabase.co')) {
    console.warn('SUPABASE_URL does not appear to be a valid Supabase URL');
  }

  // Validate Stripe keys format
  if (!/^sk_test_|^sk_live_/.test(process.env.STRIPE_SECRET_KEY)) {
    console.error('Invalid STRIPE_SECRET_KEY format');
    process.exit(1);
  }

  // Validate Stripe price IDs format
  if (!/^price_/.test(process.env.STRIPE_INDIVIDUAL_PRICE_ID)) {
    console.error('Invalid STRIPE_INDIVIDUAL_PRICE_ID format. Must start with "price_"');
    process.exit(1);
  }

  if (!/^price_/.test(process.env.STRIPE_BUSINESS_PRICE_ID)) {
    console.error('Invalid STRIPE_BUSINESS_PRICE_ID format. Must start with "price_"');
    process.exit(1);
  }

  // Validate Resend API key format if provided
  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_')) {
    console.warn('RESEND_API_KEY does not appear to be in the correct format (should start with re_)');
  }
  
  console.log('✅ Environment validation passed');
};


module.exports = validateEnvironment;
