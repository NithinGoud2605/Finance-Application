const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const NodeCache = require('node-cache');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Initialize cache with 30-minute TTL
const analysisCache = new NodeCache({ 
  stdTTL: parseInt(process.env.AI_ANALYSIS_CACHE_TTL) || 1800,
  checkperiod: 600 
});

// Rate limiter: 10 requests per minute per user
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'ai_analysis',
  points: 10,
  duration: 60,
});

// Initialize AI clients
let openaiClient, anthropicClient, geminiClient, deepseekClient;

try {
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  if (process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  if (process.env.GOOGLE_AI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  }

  // DeepSeek R1 via OpenRouter - FREE with better API
  deepseekClient = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY || 'dummy-key', // OpenRouter API key
  });
} catch (error) {
  console.error('Error initializing AI clients:', error);
}

/**
 * Advanced Business Intelligence Prompt Engineering
 * This creates sophisticated prompts that extract maximum value from AI models
 */
function createBusinessAnalysisPrompt(businessMetadata) {
  const promptSections = {
    context: `You are an elite business intelligence consultant with 20+ years of experience analyzing companies across all industries. You have helped businesses increase revenue by 40-200% through data-driven insights.`,
    
    task: `Analyze the following business data and provide actionable insights that could significantly impact business performance. Focus on ROI-driven recommendations.`,
    
    data: `COMPREHENSIVE BUSINESS INTELLIGENCE ANALYSIS:

📊 FINANCIAL PERFORMANCE METRICS:
💰 Revenue Analysis:
- Total Revenue: $${businessMetadata.invoices.totalValue.toLocaleString()}
- Average Invoice Value: $${businessMetadata.invoices.avgValue.toLocaleString()}
- Median Invoice Value: $${(businessMetadata.invoices.medianValue || 0).toLocaleString()}
- Largest Invoice: $${(businessMetadata.invoices.largestInvoice || 0).toLocaleString()}
- Smallest Invoice: $${(businessMetadata.invoices.smallestInvoice || 0).toLocaleString()}

💳 Cash Flow & Collections:
- Collection Rate: ${businessMetadata.invoices.collectionRate.toFixed(1)}%
- Average Payment Time: ${businessMetadata.invoices.avgPaymentTime.toFixed(0)} days
- Outstanding Amount: $${(businessMetadata.invoices.pendingAmount || 0).toLocaleString()}
- Overdue Amount: $${(businessMetadata.invoices.overdueAmount || 0).toLocaleString()}
- Overdue Risk Ratio: ${businessMetadata.healthIndicators?.riskFactors?.overdueRisk?.toFixed(1) || 0}%

📈 GROWTH & TREND ANALYSIS:
🚀 Period-over-Period Growth:
- Revenue Growth: ${businessMetadata.businessGrowth.invoices.toFixed(1)}%
- Contract Growth: ${businessMetadata.businessGrowth.contracts.toFixed(1)}%
- Client Acquisition Growth: ${businessMetadata.businessGrowth.clients.toFixed(1)}%
- Revenue Consistency Score: ${businessMetadata.healthIndicators?.growthStability?.consistencyScore?.toFixed(1) || 0}%

📊 Monthly Revenue Distribution:
${Object.entries(businessMetadata.invoices.monthlyTrends || {}).map(([month, data]) => 
  `- ${month}: $${(data.value || data).toLocaleString()} (${data.count || 'N/A'} invoices)`
).join('\n')}

🎯 CLIENT PORTFOLIO INTELLIGENCE:
👥 Client Metrics:
- Total Clients: ${businessMetadata.clients.total}
- Active Clients: ${businessMetadata.clients.active}
- Dormant Clients: ${businessMetadata.clients.segmentation?.dormant || 0}
- Client Retention Rate: ${businessMetadata.clients.retention.toFixed(1)}%

⚡ Client Concentration Risk:
- Top 1 Client Revenue Share: ${businessMetadata.invoices?.clientDistribution?.top1ClientShare?.toFixed(1) || 0}%
- Top 3 Clients Revenue Share: ${businessMetadata.invoices?.clientDistribution?.top3ClientShare?.toFixed(1) || 0}%
- Top 5 Clients Revenue Share: ${businessMetadata.invoices?.clientDistribution?.top5ClientShare?.toFixed(1) || 0}%

🏆 VIP Client Analysis:
${(businessMetadata.clients.segmentation?.vip || []).map(client => 
  `- ${client.name}: $${client.totalValue?.toLocaleString() || '0'} (${client.invoiceCount || 0} invoices, avg: $${(client.avgInvoiceValue || 0).toLocaleString()})`
).join('\n')}

📋 CONTRACT PORTFOLIO ANALYSIS:
📝 Contract Overview:
- Total Contracts: ${businessMetadata.contracts.total}
- Active Contracts: ${businessMetadata.contracts.active}
- Contract Portfolio Value: $${businessMetadata.contracts.totalValue.toLocaleString()}
- Average Contract Value: $${businessMetadata.contracts.avgValue.toLocaleString()}

📊 Contract Distribution:
- High Value (>$10K): ${businessMetadata.contracts.valueDistribution?.highValue || 0}
- Mid Value ($1K-$10K): ${businessMetadata.contracts.valueDistribution?.midValue || 0}
- Low Value (<$1K): ${businessMetadata.contracts.valueDistribution?.lowValue || 0}

⏰ Contract Status Breakdown:
${Object.entries(businessMetadata.contracts.statusBreakdown || {}).map(([status, count]) => 
  `- ${status.toUpperCase()}: ${count}`
).join('\n')}

🔄 Renewal & Retention:
- Auto-Renew Contracts: ${businessMetadata.contracts.renewalMetrics?.autoRenew || 0}
- Expiring in 30 Days: ${businessMetadata.contracts.renewalMetrics?.expiringNext30Days || 0}

💼 Business Type Analysis:
${Object.entries(businessMetadata.contracts.typeAnalysis || {}).map(([type, count]) => 
  `- ${type}: ${count} contracts`
).join('\n')}

💳 PAYMENT BEHAVIOR INTELLIGENCE:
⏱️ Payment Timing Analysis:
- Early Payments: ${businessMetadata.invoices.paymentPatterns?.earlyPayments || 0}
- On-Time Payments: ${businessMetadata.invoices.paymentPatterns?.onTimePayments || 0}
- Late Payments: ${businessMetadata.invoices.paymentPatterns?.latePayments || 0}

📈 Invoice Status Distribution:
- Paid: ${businessMetadata.invoices.paid}
- Pending: ${businessMetadata.invoices.pending}
- Overdue: ${businessMetadata.invoices.overdue}
- Draft: ${businessMetadata.invoices.draft || 0}
- Cancelled: ${businessMetadata.invoices.cancelled || 0}

🌍 MARKET POSITIONING:
🏢 Industry Distribution:
${Object.entries(businessMetadata.clients.industrySpread || {}).map(([industry, count]) => 
  `- ${industry}: ${count} clients`
).join('\n')}

📍 Geographic Spread:
${Object.entries(businessMetadata.clients.geographicSpread || {}).map(([location, count]) => 
  `- ${location}: ${count} clients`
).join('\n')}

⚙️ BUSINESS INTELLIGENCE CONTEXT:
🎯 Business Profile:
- Industry Classification: ${businessMetadata.industry}
- Business Model: ${businessMetadata.businessType}
- Analysis Timeframe: ${businessMetadata.timeframe}
- Data Quality Score: ${businessMetadata.dataQuality?.completenessScore || 0}%
- Total Data Points Analyzed: ${businessMetadata.dataQuality?.dataPoints || 0}

🔍 Risk Assessment Indicators:
- Cash Flow Health Ratio: ${businessMetadata.healthIndicators?.cashFlowHealth?.currentRatio?.toFixed(2) || 0}
- Client Concentration Risk: ${businessMetadata.healthIndicators?.riskFactors?.clientConcentration?.toFixed(1) || 0}%
- Contract Portfolio Risk: ${businessMetadata.healthIndicators?.riskFactors?.contractConcentration?.toFixed(1) || 0}%`,

    requirements: `EXPERT ANALYSIS REQUIREMENTS:

🎯 **PRIMARY OBJECTIVES**:
As an elite business intelligence consultant, provide analysis that could genuinely transform this business. Focus on DATA-DRIVEN, ACTIONABLE insights with measurable ROI potential.

📊 **1. COMPREHENSIVE BUSINESS HEALTH ASSESSMENT** (0-100 scale):
- Calculate multi-factor health score considering:
  * Cash flow stability & collection efficiency
  * Revenue growth trajectory & consistency  
  * Client portfolio diversification & retention
  * Operational efficiency & payment cycles
  * Risk exposure & market positioning
- Provide clear reasoning for the score with specific metrics

🚨 **2. CRITICAL BUSINESS RISKS & URGENT ISSUES**:
- Identify ANY threats to business survival or major growth impediments
- Quantify potential financial impact of each issue
- Prioritize by urgency and severity (Critical/High/Medium)
- Provide specific timelines for addressing each issue
- Consider: cash flow gaps, client concentration, payment delays, operational bottlenecks

💡 **3. HIGH-ROI OPPORTUNITIES** (Focus on 15%+ revenue impact):
- Revenue optimization opportunities (pricing, upselling, new services)
- Operational efficiency improvements (faster collections, automation)
- Market expansion potential (new client segments, geographic expansion)
- Client lifetime value enhancement strategies
- Cost reduction opportunities without service impact

📋 **4. PRECISION STRATEGIC RECOMMENDATIONS**:
- Provide 3-5 SPECIFIC, MEASURABLE action items
- Include expected financial impact for each recommendation
- Specify implementation timeline and resource requirements
- Define success metrics and KPIs to track progress
- Prioritize by expected ROI and ease of implementation

🔮 **5. PREDICTIVE BUSINESS INTELLIGENCE**:
- Forecast revenue, cash flow, and growth trends for next 3-12 months
- Predict potential challenges and seasonal patterns
- Identify early warning indicators to monitor
- Assess sustainability of current growth trajectory
- Consider market conditions and industry trends

🏆 **6. COMPETITIVE ADVANTAGE IDENTIFICATION**:
- Analyze unique business strengths and market positioning
- Identify differentiation opportunities from data patterns
- Highlight client retention and satisfaction indicators
- Assess pricing power and market leverage
- Suggest ways to capitalize on competitive advantages

⚠️ **7. COMPREHENSIVE RISK ANALYSIS & MITIGATION**:
- Client concentration risk assessment
- Cash flow vulnerability analysis
- Payment delay and collection risk evaluation
- Operational efficiency bottlenecks
- Market and competitive threats
- Provide specific mitigation strategies for each risk

💰 **8. FINANCIAL OPTIMIZATION INSIGHTS**:
- Working capital optimization recommendations
- Payment terms and collection strategy improvements
- Pricing strategy analysis and optimization
- Contract structure and renewal optimization
- Cost structure analysis and reduction opportunities

📈 **9. GROWTH STRATEGY RECOMMENDATIONS**:
- Scalable growth opportunities based on current data
- Client acquisition and retention strategies
- Service expansion recommendations
- Geographic or market segment expansion potential
- Strategic partnership opportunities`,

    format: `ENHANCED JSON RESPONSE FORMAT:
{
  "businessHealthScore": number (0-100),
  "healthScoreReasoning": "Detailed explanation of how the score was calculated with specific metrics",
  "executiveSummary": "Comprehensive 3-4 sentence overview of business performance, key strengths, and primary concerns",
  
  "criticalIssues": [
    {
      "title": "Issue Title",
      "severity": "critical|high|medium",
      "description": "Detailed explanation with specific data points",
      "financialImpact": "Quantified current and potential future impact ($X loss/risk)",
      "urgency": "immediate|30days|90days",
      "recommendation": "Specific actionable steps to address this issue",
      "successMetrics": "How to measure resolution",
      "riskIfIgnored": "Consequences of not addressing this issue"
    }
  ],
  
  "opportunities": [
    {
      "title": "Opportunity Title",
      "category": "revenue_optimization|operational_efficiency|market_expansion|client_retention|cost_reduction",
      "description": "Detailed opportunity analysis with supporting data",
      "expectedROI": "Specific ROI percentage and dollar impact ($X increase)",
      "implementation": "Step-by-step execution plan",
      "timeline": "Implementation timeline and expected results timeframe",
      "effortLevel": "low|medium|high",
      "riskLevel": "low|medium|high",
      "prerequisite": "What needs to be in place before pursuing this"
    }
  ],
  
  "strategicRecommendations": [
    {
      "priority": "immediate|high|medium",
      "title": "Recommendation Title",
      "description": "Detailed action plan with specific steps",
      "expectedImpact": "Quantified expected outcome ($X revenue increase, Y% efficiency gain)",
      "resourcesRequired": "Specific resources needed (budget, time, personnel)",
      "timeline": "Implementation phases and milestones",
      "successMetrics": "Specific KPIs to track progress",
      "quickWins": "Immediate actions that can be taken within 30 days",
      "dependencies": "What needs to happen first"
    }
  ],
  
  "predictions": [
    {
      "timeframe": "3months|6months|12months",
      "forecast": "Specific quantified prediction with numbers",
      "confidence": "high|medium|low",
      "factors": "Key data points and trends supporting this prediction",
      "earlyWarningSignals": "Metrics to watch that would indicate deviation from forecast",
      "scenarioAnalysis": {
        "bestCase": "Optimistic scenario outcome",
        "mostLikely": "Expected scenario outcome", 
        "worstCase": "Pessimistic scenario outcome"
      }
    }
  ],
  
  "competitiveAdvantages": [
    {
      "advantage": "Specific competitive strength",
      "evidenceFromData": "Data points that support this advantage",
      "howToLeverage": "Specific ways to capitalize on this strength",
      "sustainabilityRisk": "How defensible this advantage is"
    }
  ],
  
  "riskAnalysis": [
    {
      "riskType": "client_concentration|cash_flow|operational|market|competitive",
      "description": "Detailed risk explanation",
      "probability": "high|medium|low",
      "impact": "high|medium|low",
      "currentMitigation": "Existing safeguards if any",
      "recommendedActions": "Specific steps to mitigate this risk",
      "monitoringKPIs": "Metrics to track this risk"
    }
  ],
  
  "financialOptimization": [
    {
      "area": "collections|pricing|costs|working_capital|contract_terms",
      "currentState": "Current performance metrics",
      "improvementPotential": "Specific improvement opportunity",
      "expectedImpact": "Quantified financial benefit",
      "implementationSteps": "How to achieve the improvement"
    }
  ],
  
  "keyMetricsToTrack": [
    {
      "name": "Metric Name",
      "currentValue": "Current performance with units",
      "targetValue": "Recommended target",
      "status": "good|warning|critical",
      "trend": "up|down|stable",
      "frequency": "daily|weekly|monthly|quarterly",
      "importance": "Why this metric is critical to track",
      "value": "Numerical value for display"
    }
  ],
  
  "heroMetrics": [
    {
      "name": "Primary metric name",
      "value": "Display value (number or text)",
      "description": "Brief description",
      "status": "good|warning|critical",
      "icon": "Icon suggestion",
      "color": "Color theme (primary|success|warning|error)"
    }
  ],
  
  "actionPlan": {
    "next30Days": ["Immediate actions to take in the next 30 days"],
    "next90Days": ["Strategic initiatives for the next 90 days"],
    "next12Months": ["Long-term strategic goals for the next 12 months"]
  }
}`
  };

  return `${promptSections.context}\n\n${promptSections.task}\n\n${promptSections.data}\n\n${promptSections.requirements}\n\n${promptSections.format}

Please provide a comprehensive analysis that could genuinely help this business owner make better decisions and increase profitability. Focus on actionable, ROI-driven insights.`;
}

/**
 * OpenAI Analysis Implementation
 */
async function analyzeWithOpenAI(businessMetadata) {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Check OPENAI_API_KEY.');
  }

  const prompt = createBusinessAnalysisPrompt(businessMetadata);

  const completion = await openaiClient.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are an elite business consultant providing data-driven insights. Always respond with valid JSON and actionable recommendations.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
    temperature: 0.3, // Lower temperature for more consistent business analysis
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content);
}

/**
 * Anthropic Claude Analysis Implementation
 */
async function analyzeWithClaude(businessMetadata) {
  if (!anthropicClient) {
    throw new Error('Anthropic client not initialized. Check ANTHROPIC_API_KEY.');
  }

  const prompt = createBusinessAnalysisPrompt(businessMetadata);

  const message = await anthropicClient.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    max_tokens: 4000,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: `${prompt}\n\nIMPORTANT: Respond with valid JSON only, following the exact format specified above.`
      }
    ]
  });

  return JSON.parse(message.content[0].text);
}

/**
 * Google Gemini Analysis Implementation
 */
async function analyzeWithGemini(businessMetadata) {
  if (!geminiClient) {
    throw new Error('Gemini client not initialized. Check GOOGLE_AI_API_KEY.');
  }

  const model = geminiClient.getGenerativeModel({ 
    model: process.env.GEMINI_MODEL || 'gemini-pro',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4000,
    }
  });

  const prompt = createBusinessAnalysisPrompt(businessMetadata);
  const result = await model.generateContent(prompt + '\n\nIMPORTANT: Respond with valid JSON only.');

  return JSON.parse(result.response.text());
}

/**
 * DeepSeek R1 Analysis Implementation via OpenRouter (FREE)
 */
async function analyzeWithDeepSeek(businessMetadata) {
  if (!deepseekClient) {
    throw new Error('DeepSeek client not initialized.');
  }

  const prompt = createBusinessAnalysisPrompt(businessMetadata);

  try {
    const completion = await deepseekClient.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || 'deepseek/deepseek-r1:free',
      messages: [
        {
          role: 'system',
          content: 'You are an elite business consultant providing data-driven insights. Always respond with valid JSON and actionable recommendations. Use your advanced reasoning capabilities to provide deep business analysis with step-by-step logic.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS) || 4000,
      temperature: 0.3,
      // OpenRouter-specific headers for tracking and rankings
      extra_headers: {
        "HTTP-Referer": process.env.SITE_URL || "https://your-business-app.com",
        "X-Title": process.env.SITE_NAME || "Business Intelligence Dashboard",
      },
      // Try JSON format first
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('DeepSeek R1 via OpenRouter Error:', error);
    
    // If response_format not supported, try without it
    if (error.message.includes('response_format') || error.message.includes('json_object')) {
      console.log('Retrying without response_format...');
      
      const completion = await deepseekClient.chat.completions.create({
        model: process.env.DEEPSEEK_MODEL || 'deepseek/deepseek-r1:free',
        messages: [
          {
            role: 'system',
            content: 'You are an elite business consultant providing data-driven insights. Always respond with valid JSON and actionable recommendations. Use your reasoning capabilities to provide deep business analysis.'
          },
          {
            role: 'user',
            content: prompt + '\n\nCRITICAL: Respond with ONLY valid JSON, no other text. Follow the exact format specified above.'
          }
        ],
        max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS) || 4000,
        temperature: 0.3,
        extra_headers: {
          "HTTP-Referer": process.env.SITE_URL || "https://your-business-app.com",
          "X-Title": process.env.SITE_NAME || "Business Intelligence Dashboard",
        }
      });

      // Extract JSON from response if it contains other text
      const responseText = completion.choices[0].message.content;
      
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If still no valid JSON, try parsing the whole response
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON from DeepSeek response:', responseText);
        throw new Error('DeepSeek returned invalid JSON format');
      }
    }
    
    throw error;
  }
}

/**
 * Enhanced fallback analysis with sophisticated business logic
 */
function generateEnhancedFallbackAnalysis(businessMetadata) {
  const analysis = {
    businessHealthScore: 0,
    executiveSummary: "",
    criticalIssues: [],
    opportunities: [],
    strategicRecommendations: [],
    predictions: [],
    competitiveAdvantages: [],
    keyMetricsToTrack: [],
    heroMetrics: []
  };

  // Calculate sophisticated business health score
  const collectionRate = businessMetadata.invoices.collectionRate;
  const growthRate = businessMetadata.businessGrowth.invoices;
  const clientRetention = businessMetadata.clients.retention;
  const paymentEfficiency = businessMetadata.invoices.avgPaymentTime > 0 ? 
    Math.min(100, (30 / businessMetadata.invoices.avgPaymentTime) * 100) : 100;
  
  analysis.businessHealthScore = Math.round(
    (collectionRate * 0.25) +
    (Math.min(100, Math.max(0, growthRate + 50)) * 0.25) +
    (clientRetention * 0.20) +
    (paymentEfficiency * 0.20) +
    (businessMetadata.invoices.paid / Math.max(1, businessMetadata.invoices.total) * 100 * 0.10)
  );

  // Generate Hero Metrics for dashboard display
  analysis.heroMetrics = [
    {
      name: "Collection Efficiency",
      value: `${collectionRate.toFixed(1)}%`,
      description: "Cash flow collection rate",
      status: collectionRate >= 75 ? 'good' : collectionRate >= 50 ? 'warning' : 'critical',
      icon: "💰",
      color: collectionRate >= 75 ? 'success' : collectionRate >= 50 ? 'warning' : 'error'
    },
    {
      name: "Revenue Growth",
      value: `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
      description: "Period-over-period revenue trend",
      status: growthRate >= 10 ? 'good' : growthRate >= 0 ? 'warning' : 'critical',
      icon: "📈",
      color: growthRate >= 10 ? 'success' : growthRate >= 0 ? 'warning' : 'error'
    },
    {
      name: "Client Retention",
      value: `${clientRetention.toFixed(1)}%`,
      description: "Client relationship stability",
      status: clientRetention >= 80 ? 'good' : clientRetention >= 60 ? 'warning' : 'critical',
      icon: "👥",
      color: clientRetention >= 80 ? 'success' : clientRetention >= 60 ? 'warning' : 'error'
    },
    {
      name: "Payment Speed",
      value: `${businessMetadata.invoices.avgPaymentTime.toFixed(0)} days`,
      description: "Average payment collection time",
      status: businessMetadata.invoices.avgPaymentTime <= 30 ? 'good' : businessMetadata.invoices.avgPaymentTime <= 45 ? 'warning' : 'critical',
      icon: "⚡",
      color: businessMetadata.invoices.avgPaymentTime <= 30 ? 'success' : businessMetadata.invoices.avgPaymentTime <= 45 ? 'warning' : 'error'
    }
  ];

  // Executive Summary
  analysis.executiveSummary = `Business health score of ${analysis.businessHealthScore}/100 indicates ${
    analysis.businessHealthScore >= 80 ? 'excellent' : 
    analysis.businessHealthScore >= 60 ? 'good' : 'challenging'
  } performance. ${
    growthRate > 10 ? 'Strong growth momentum' : 
    growthRate < -5 ? 'Experiencing contraction' : 'Stable operations'
  } with ${collectionRate.toFixed(0)}% collection efficiency.`;

  // Critical Issues Analysis
  if (collectionRate < 60) {
    analysis.criticalIssues.push({
      title: "Poor Cash Flow Management",
      severity: "critical",
      description: `Collection rate of ${collectionRate.toFixed(1)}% is significantly below industry standards`,
      financialImpact: `Potential revenue loss of $${(businessMetadata.invoices.totalValue * 0.2).toLocaleString()}`,
      recommendation: "Implement automated payment reminders and early payment incentives",
      timeframe: "Immediate action required"
    });
  }

  if (businessMetadata.invoices.avgPaymentTime > 50) {
    analysis.criticalIssues.push({
      title: "Extended Payment Cycles",
      severity: "high",
      description: `Average payment time of ${businessMetadata.invoices.avgPaymentTime.toFixed(0)} days is hampering cash flow`,
      financialImpact: "Reduced working capital efficiency",
      recommendation: "Offer early payment discounts and implement stricter payment terms",
      timeframe: "30-60 days"
    });
  }

  // Client concentration risk
  const clientConcentration = businessMetadata.clients.vipClients && businessMetadata.clients.total > 0 ? 
    (businessMetadata.clients.vipClients / businessMetadata.clients.total) * 100 : 0;
  
  if (clientConcentration > 30) {
    analysis.criticalIssues.push({
      title: "High Client Concentration Risk",
      severity: "medium",
      description: `${clientConcentration.toFixed(1)}% of revenue comes from VIP clients, creating dependency risk`,
      financialImpact: "High vulnerability to client loss",
      recommendation: "Diversify client base and reduce dependency on key accounts",
      timeframe: "90 days"
    });
  }

  // Opportunities Analysis
  if (collectionRate > 85) {
    analysis.opportunities.push({
      title: "Excellent Collection Efficiency",
      category: "efficiency",
      description: "Outstanding collection performance provides competitive advantage",
      expectedROI: "15-25% improvement in cash flow optimization",
      implementation: "Offer consulting services or license collection processes",
      timeline: "3-6 months"
    });
  }

  if (growthRate > 20) {
    analysis.opportunities.push({
      title: "High Growth Scaling Opportunity",
      category: "growth",
      description: "Strong growth trajectory indicates market validation",
      expectedROI: "30-50% revenue increase through proper scaling",
      implementation: "Invest in infrastructure, team, and operational systems",
      timeline: "6-12 months"
    });
  }

  if (businessMetadata.contracts.total > 0 && businessMetadata.contracts.renewalMetrics?.autoRenew > 0) {
    analysis.opportunities.push({
      title: "Contract Upselling Potential",
      category: "revenue_optimization",
      description: `${businessMetadata.contracts.renewalMetrics.autoRenew} auto-renewing contracts ready for value expansion`,
      expectedROI: "20-40% increase in contract values through strategic upselling",
      implementation: "Develop premium service tiers and value-added offerings",
      timeline: "3-6 months"
    });
  }

  // Strategic Recommendations
  analysis.strategicRecommendations.push({
    priority: "high",
    title: "Implement Advanced Analytics Dashboard",
    description: "Deploy real-time business intelligence for data-driven decision making",
    expectedImpact: "10-15% improvement in operational efficiency",
    resourcesRequired: "Analytics tools and training",
    successMetrics: "Reduced decision-making time and improved KPI performance"
  });

  if (collectionRate < 75) {
    analysis.strategicRecommendations.push({
      priority: "immediate",
      title: "Cash Flow Optimization Program",
      description: "Implement comprehensive collection improvement strategies",
      expectedImpact: `Potential to increase collection rate to 80%+, recovering $${(businessMetadata.invoices.totalValue * 0.15).toLocaleString()}`,
      resourcesRequired: "Collection software, staff training, incentive programs",
      successMetrics: "Collection rate improvement, reduced payment times"
    });
  }

  if (clientRetention < 80) {
    analysis.strategicRecommendations.push({
      priority: "high",
      title: "Client Retention Enhancement Initiative",
      description: "Develop proactive client success and retention programs",
      expectedImpact: "Increase client lifetime value by 25-40%",
      resourcesRequired: "Customer success team, feedback systems, retention incentives",
      successMetrics: "Client retention rate, satisfaction scores, repeat business"
    });
  }

  // Predictions
  analysis.predictions.push({
    timeframe: "6 months",
    forecast: `Revenue trending ${growthRate > 0 ? 'upward' : 'downward'} based on current growth patterns`,
    confidence: "high",
    factors: "Collection rate stability, client retention, and market conditions"
  });

  if (collectionRate < 70) {
    analysis.predictions.push({
      timeframe: "3 months",
      forecast: "Cash flow challenges likely to intensify without immediate intervention",
      confidence: "high",
      factors: "Current collection inefficiencies and payment delays"
    });
  }

  if (growthRate > 15) {
    analysis.predictions.push({
      timeframe: "12 months",
      forecast: "Strong growth momentum could lead to 50%+ revenue increase if properly managed",
      confidence: "medium",
      factors: "Current growth trajectory and market conditions"
    });
  }

  // Competitive Advantages
  if (collectionRate > 80) {
    analysis.competitiveAdvantages.push({
      advantage: "Superior cash flow management capabilities",
      evidenceFromData: `${collectionRate.toFixed(1)}% collection rate exceeds industry standards`,
      howToLeverage: "Use cash flow strength to negotiate better supplier terms and invest in growth",
      sustainabilityRisk: "Low - fundamental operational capability"
    });
  }
  
  if (clientRetention > 85) {
    analysis.competitiveAdvantages.push({
      advantage: "Exceptional client relationship management",
      evidenceFromData: `${clientRetention.toFixed(1)}% client retention demonstrates strong value delivery`,
      howToLeverage: "Use client satisfaction as competitive differentiator and referral source",
      sustainabilityRisk: "Medium - requires continued focus on client success"
    });
  }

  if (businessMetadata.invoices.avgValue > 5000) {
    analysis.competitiveAdvantages.push({
      advantage: "High-value service positioning",
      evidenceFromData: `$${businessMetadata.invoices.avgValue.toLocaleString()} average invoice value indicates premium market position`,
      howToLeverage: "Focus on enterprise clients and premium service offerings",
      sustainabilityRisk: "Medium - market position needs continuous reinforcement"
    });
  }

  // Enhanced Key Metrics to Track
  analysis.keyMetricsToTrack = [
    {
      name: "Monthly Recurring Revenue",
      currentValue: `$${(businessMetadata.invoices.totalValue / 12).toLocaleString()}`,
      targetValue: `$${((businessMetadata.invoices.totalValue / 12) * 1.2).toLocaleString()}`,
      status: growthRate >= 10 ? 'good' : growthRate >= 0 ? 'warning' : 'critical',
      trend: growthRate >= 0 ? 'up' : 'down',
      frequency: "monthly",
      importance: "Core business health indicator",
      value: (businessMetadata.invoices.totalValue / 12).toFixed(0)
    },
    {
      name: "Collection Efficiency Rate",
      currentValue: `${collectionRate.toFixed(1)}%`,
      targetValue: "85%",
      status: collectionRate >= 75 ? 'good' : collectionRate >= 50 ? 'warning' : 'critical',
      trend: 'stable',
      frequency: "weekly",
      importance: "Cash flow management critical metric",
      value: collectionRate.toFixed(1)
    },
    {
      name: "Client Retention Rate",
      currentValue: `${clientRetention.toFixed(1)}%`,
      targetValue: "90%",
      status: clientRetention >= 80 ? 'good' : clientRetention >= 60 ? 'warning' : 'critical',
      trend: 'stable',
      frequency: "quarterly",
      importance: "Long-term business sustainability",
      value: clientRetention.toFixed(1)
    },
    {
      name: "Average Payment Time",
      currentValue: `${businessMetadata.invoices.avgPaymentTime.toFixed(0)} days`,
      targetValue: "30 days",
      status: businessMetadata.invoices.avgPaymentTime <= 30 ? 'good' : businessMetadata.invoices.avgPaymentTime <= 45 ? 'warning' : 'critical',
      trend: 'stable',
      frequency: "weekly",
      importance: "Working capital optimization",
      value: businessMetadata.invoices.avgPaymentTime.toFixed(0)
    },
    {
      name: "Client Concentration Risk",
      currentValue: `${clientConcentration.toFixed(1)}%`,
      targetValue: "< 25%",
      status: clientConcentration <= 25 ? 'good' : clientConcentration <= 40 ? 'warning' : 'critical',
      trend: 'stable',
      frequency: "monthly",
      importance: "Business risk management",
      value: clientConcentration.toFixed(1)
    }
  ];

  return analysis;
}

/**
 * Main AI Analysis Function with Multiple Provider Support
 */
async function analyzeBusinessData(businessMetadata, userId) {
  try {
    // Check rate limiting
    await rateLimiter.consume(userId);

    // Generate cache key
    const cacheKey = `ai_analysis_${userId}_${JSON.stringify(businessMetadata).length}_${Date.now()}`.slice(0, 50);
    
    // Check cache first
    const cachedResult = analysisCache.get(cacheKey);
    if (cachedResult) {
      return { ...cachedResult, cached: true };
    }

    // Check if AI analysis is enabled
    if (process.env.AI_ANALYSIS_ENABLED !== 'true') {
      return generateEnhancedFallbackAnalysis(businessMetadata);
    }

    let analysisResult;
    const provider = process.env.AI_SERVICE_PROVIDER || 'openai';

    // Try primary provider
    try {
      switch (provider) {
        case 'openai':
          analysisResult = await analyzeWithOpenAI(businessMetadata);
          break;
        case 'claude':
          analysisResult = await analyzeWithClaude(businessMetadata);
          break;
        case 'gemini':
          analysisResult = await analyzeWithGemini(businessMetadata);
          break;
        case 'deepseek':
          analysisResult = await analyzeWithDeepSeek(businessMetadata);
          break;
        default:
          throw new Error(`Unknown AI provider: ${provider}`);
      }
    } catch (primaryError) {
      // Try fallback providers (prioritizing free models first)
      const fallbackProviders = ['deepseek', 'openai', 'claude', 'gemini'].filter(p => p !== provider);
      
      for (const fallbackProvider of fallbackProviders) {
        try {
          switch (fallbackProvider) {
            case 'openai':
              if (openaiClient) analysisResult = await analyzeWithOpenAI(businessMetadata);
              break;
            case 'claude':
              if (anthropicClient) analysisResult = await analyzeWithClaude(businessMetadata);
              break;
            case 'gemini':
              if (geminiClient) analysisResult = await analyzeWithGemini(businessMetadata);
              break;
            case 'deepseek':
              if (deepseekClient) analysisResult = await analyzeWithDeepSeek(businessMetadata);
              break;
          }
          
          if (analysisResult) {
            break;
          }
        } catch (fallbackError) {
          // Continue to next fallback
        }
      }
    }

    // If all AI providers fail, use enhanced fallback
    if (!analysisResult) {
      analysisResult = generateEnhancedFallbackAnalysis(businessMetadata);
      analysisResult.aiGenerated = false;
    } else {
      analysisResult.aiGenerated = true;
    }

    // Add metadata
    analysisResult.generatedAt = new Date().toISOString();
    analysisResult.provider = provider;
    
    // Cache the result
    analysisCache.set(cacheKey, analysisResult);
    
    return analysisResult;

  } catch (error) {
    console.error('AI Analysis Service Error:', error);
    
    // Return enhanced fallback analysis
    const fallbackResult = generateEnhancedFallbackAnalysis(businessMetadata);
    fallbackResult.error = 'AI service temporarily unavailable';
    fallbackResult.aiGenerated = false;
    
    return fallbackResult;
  }
}

/**
 * Health check for AI services
 */
async function checkAIServiceHealth() {
  const health = {
    openai: false,
    claude: false,
    gemini: false,
    deepseek: false,
    cache: false,
    rateLimiter: false
  };

  try {
    // Check OpenAI
    if (openaiClient && process.env.OPENAI_API_KEY) {
      health.openai = true;
    }

    // Check Claude
    if (anthropicClient && process.env.ANTHROPIC_API_KEY) {
      health.claude = true;
    }

    // Check Gemini
    if (geminiClient && process.env.GOOGLE_AI_API_KEY) {
      health.gemini = true;
    }

    // Check DeepSeek via OpenRouter (check for API key)
    if (deepseekClient && (process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY)) {
      health.deepseek = true;
    }

    // Check cache
    health.cache = analysisCache.keys().length >= 0;

    // Check rate limiter
    health.rateLimiter = true;

  } catch (error) {
    console.error('AI Service Health Check Error:', error);
  }

  return health;
}

module.exports = {
  analyzeBusinessData,
  checkAIServiceHealth,
  analysisCache,
  rateLimiter
}; 