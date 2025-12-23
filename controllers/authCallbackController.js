const { User } = require('../models');
const logger = require('../utils/logger');
const environmentConfig = require('../utils/environmentConfig');
const { supabaseAdmin } = require('../utils/supabaseAuth');

/**
 * Handle OAuth callback from Supabase
 * This handles the redirect after a user signs in with an OAuth provider (e.g., Google)
 */
const authCallback = async (req, res, next) => {
  try {
    const { code, error, error_description } = req.query;
    
    // Handle OAuth errors
    if (error) {
      logger.error('OAuth callback error:', { error, error_description });
      const errorRedirect = `${environmentConfig.getClientOrigin()}/login?error=${encodeURIComponent(error_description || error)}`;
      return res.redirect(errorRedirect);
    }
    
    if (!code) {
      logger.error('No authorization code provided in callback');
      return res.redirect(`${environmentConfig.getClientOrigin()}/login?error=no_code`);
    }
    
    // Exchange the code for a session with Supabase
    const { data, error: exchangeError } = await supabaseAdmin.auth.exchangeCodeForSession(code);
    
    if (exchangeError || !data?.session) {
      logger.error('Failed to exchange code for session:', exchangeError);
      return res.redirect(`${environmentConfig.getClientOrigin()}/login?error=exchange_failed`);
    }
    
    const { session, user: supabaseUser } = data;
    
    if (!supabaseUser) {
      logger.error('No user returned from Supabase session exchange');
      return res.redirect(`${environmentConfig.getClientOrigin()}/login?error=no_user`);
    }
    
    // Find or create the user in our database
    let user = await User.findOne({ 
      where: { 
        cognitoSub: supabaseUser.id // Using cognitoSub field for Supabase user ID
      } 
    });
    
    if (!user) {
      // Try to find by email
      user = await User.findOne({ where: { email: supabaseUser.email } });
      
      if (user) {
        // Update existing user with Supabase ID
        await user.update({ cognitoSub: supabaseUser.id });
      } else {
        // Create new user
        user = await User.create({ 
          id: supabaseUser.id,
          email: supabaseUser.email, 
          name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0], 
          cognitoSub: supabaseUser.id,
          accountType: supabaseUser.user_metadata?.accountType || 'individual',
          isEmailVerified: !!supabaseUser.email_confirmed_at
        });
        logger.info('Created new user from OAuth:', { userId: user.id, email: user.email });
      }
    }
    
    // Redirect to dashboard with the access token
    const accessToken = session.access_token;
    const redirectTo = `${environmentConfig.getClientOrigin()}/auth/callback?token=${encodeURIComponent(accessToken)}&refresh=${encodeURIComponent(session.refresh_token || '')}`;
    
    logger.info('OAuth callback successful, redirecting user:', { userId: user.id, email: user.email });
    return res.redirect(redirectTo);
    
  } catch (err) {
    logger.error("Error during auth callback:", err);
    return res.redirect(`${environmentConfig.getClientOrigin()}/login?error=callback_failed`);
  }
};

module.exports = {
  authCallback
};
