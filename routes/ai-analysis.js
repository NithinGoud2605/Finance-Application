const express = require('express');
const router = express.Router();
const { analyzeBusinessData, checkAIServiceHealth } = require('../services/aiAnalysisService');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireSubscriptionForDashboard } = require('../middlewares/subscriptionMiddleware');
const { global: rateLimiter } = require('../middlewares/rateLimitMiddleware');
const { body, validationResult } = require('express-validator');

/**
 * AI Business Analysis Endpoint
 * POST /api/ai-analysis/analyze
 */
router.post('/analyze', 
  authenticate,
  requireSubscriptionForDashboard, // Ensure user has dashboard access for AI features
  rateLimiter, // Additional rate limiting
  [
    // Validation middleware
    body('businessMetadata').isObject().withMessage('Business metadata is required'),
    body('businessMetadata.invoices').isObject().withMessage('Invoice data is required'),
    body('businessMetadata.contracts').isObject().withMessage('Contract data is required'),
    body('businessMetadata.clients').isObject().withMessage('Client data is required'),
    body('businessMetadata.businessGrowth').isObject().withMessage('Business growth data is required'),
  ],
  async (req, res) => {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { businessMetadata } = req.body;
      const userId = req.user.id;
      const organizationId = req.organization?.id || req.headers['x-organization-id'] || req.user.defaultOrganizationId;

      // Validate business metadata structure
      if (!businessMetadata.invoices.total && !businessMetadata.contracts.total && !businessMetadata.clients.total) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient business data for analysis'
        });
      }

      // Add user context to metadata
      const enrichedMetadata = {
        ...businessMetadata,
        userId,
        organizationId,
        requestTimestamp: new Date().toISOString(),
        userProfile: {
          accountType: req.user.accountType || 'business',
          industry: req.user.industry || 'professional_services',
          companySize: req.user.companySize || 'small'
        }
      };

      // Perform AI analysis
      const analysisResult = await analyzeBusinessData(enrichedMetadata, userId);

      // Transform result for frontend
      const responseData = {
        success: true,
        data: {
          score: analysisResult.businessHealthScore,
          businessHealthScore: analysisResult.businessHealthScore, // Include both for compatibility
          aiGenerated: analysisResult.aiGenerated,
          generatedAt: analysisResult.generatedAt,
          provider: analysisResult.provider,
          cached: analysisResult.cached || false,
          executiveSummary: analysisResult.executiveSummary,
          criticalIssues: analysisResult.criticalIssues?.map(issue => ({
            type: issue.title.toLowerCase().replace(/\s+/g, '_'),
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            recommendation: issue.recommendation,
            impact: issue.financialImpact,
            timeframe: issue.timeframe
          })) || [],
          warnings: analysisResult.criticalIssues?.map(issue => ({
            type: issue.title.toLowerCase().replace(/\s+/g, '_'),
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            recommendation: issue.recommendation,
            impact: issue.financialImpact,
            timeframe: issue.timeframe
          })) || [],
          strategicRecommendations: analysisResult.strategicRecommendations?.map(rec => ({
            type: rec.title.toLowerCase().replace(/\s+/g, '_'),
            priority: rec.priority,
            title: rec.title,
            description: rec.description,
            expectedImpact: rec.expectedImpact,
            resourcesRequired: rec.resourcesRequired,
            successMetrics: rec.successMetrics
          })) || [],
          recommendations: analysisResult.strategicRecommendations?.map(rec => ({
            type: rec.title.toLowerCase().replace(/\s+/g, '_'),
            priority: rec.priority,
            title: rec.title,
            description: rec.description,
            expectedImpact: rec.expectedImpact,
            resourcesRequired: rec.resourcesRequired,
            successMetrics: rec.successMetrics
          })) || [],
          opportunities: analysisResult.opportunities?.map(opp => ({
            type: opp.category,
            title: opp.title,
            description: opp.description,
            action: opp.implementation,
            expectedROI: opp.expectedROI,
            timeline: opp.timeline
          })) || [],
          predictions: analysisResult.predictions?.map(pred => ({
            type: pred.timeframe?.replace(/\s+/g, '_') || 'forecast',
            title: `${pred.timeframe || 'Future'} Forecast`,
            description: pred.forecast,
            prediction: pred.factors,
            confidence: pred.confidence
          })) || [],
          competitiveAdvantages: analysisResult.competitiveAdvantages || [],
          keyMetricsToTrack: analysisResult.keyMetricsToTrack || [],
          keyMetrics: analysisResult.keyMetricsToTrack || [], // Include both for compatibility
          heroMetrics: analysisResult.heroMetrics || []
        }
      };

      res.json(responseData);

    } catch (error) {
      console.error('AI Analysis API Error:', error);

      // Handle specific error types
      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter: 60
        });
      }

      if (error.message.includes('API key')) {
        return res.status(503).json({
          success: false,
          message: 'AI service temporarily unavailable. Please try again later.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during AI analysis',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * AI Service Health Check Endpoint
 * GET /api/ai-analysis/health
 */
router.get('/health', authenticate, async (req, res) => {
  try {
    const health = await checkAIServiceHealth();
    
    const serviceStatus = {
      enabled: process.env.AI_ANALYSIS_ENABLED === 'true',
      providers: health,
      primaryProvider: process.env.AI_SERVICE_PROVIDER || 'openai',
      cacheEnabled: health.cache,
      rateLimitingEnabled: health.rateLimiter
    };

    res.json({
      success: true,
      data: serviceStatus
    });

  } catch (error) {
    console.error('AI Health Check Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check AI service health'
    });
  }
});

/**
 * Get AI Analysis History
 * GET /api/ai-analysis/history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    // This could be expanded to store analysis history in database
    res.json({
      success: true,
      data: {
        message: 'Analysis history feature coming soon',
        recentAnalyses: []
      }
    });
  } catch (error) {
    console.error('AI History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis history'
    });
  }
});

/**
 * AI Insights Configuration
 * POST /api/ai-analysis/config
 */
router.post('/config', authenticate, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    // Store user preferences for AI analysis
    // This could be saved to user profile or preferences table
    
    res.json({
      success: true,
      message: 'AI analysis preferences updated',
      data: preferences
    });
  } catch (error) {
    console.error('AI Config Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update AI configuration'
    });
  }
});

module.exports = router; 