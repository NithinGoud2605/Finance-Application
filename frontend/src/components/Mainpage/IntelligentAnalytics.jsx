import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, TrendingUp, BarChart3, Zap, Target, Lightbulb, Shield, Bot, Sparkles, AlertCircle,
  ArrowUpRight, LineChart, Users, FileText
} from 'lucide-react';

const useScrollAnimation = (delay = 0) => ({
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
  viewport: { once: true, margin: "-100px" }
});

const IntelligentDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [metrics, setMetrics] = useState({
    revenue: 87500,
    clientRetention: 94.2,
    invoicesPaid: 156,
    expensesSaved: 12400,
  });

  const [insights] = useState([
    { type: 'client-opportunity', message: 'Your top 3 clients generate 65% of revenue. Consider offering them expanded services', confidence: 96, action: 'Create client expansion proposals', priority: 'high' },
    { type: 'invoice-optimization', message: 'Invoice payment time decreased by 12% - your payment terms are working well', confidence: 89, action: 'Continue current payment terms', priority: 'medium' },
    { type: 'expense-insight', message: 'Office supply expenses increased 30% this quarter - review vendor contracts', confidence: 93, action: 'Audit expense categories', priority: 'medium' },
    { type: 'contract-alert', message: '3 contracts expiring in next 30 days - schedule renewal discussions', confidence: 100, action: 'Schedule client meetings', priority: 'high' },
  ]);

  const [activeInsight, setActiveInsight] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveInsight(prev => (prev + 1) % insights.length);
      setMetrics(prev => ({
        revenue: prev.revenue + Math.floor(Math.random() * 200 - 100),
        clientRetention: Math.max(80, Math.min(100, prev.clientRetention + (Math.random() - 0.5) * 2)),
        invoicesPaid: prev.invoicesPaid + Math.floor(Math.random() * 5),
        expensesSaved: prev.expensesSaved + Math.floor(Math.random() * 100),
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, [insights.length]);

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'predictions', label: 'AI Predictions', icon: Brain },
    { id: 'insights', label: 'Smart Insights', icon: Lightbulb }
  ];

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200"
      {...useScrollAnimation(0.2)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.div className="p-3 bg-slate-900 rounded-xl" whileHover={{ scale: 1.1 }}>
            <Brain className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Intelligent Analytics Dashboard</h3>
            <p className="text-slate-500">Real-time insights powered by AI</p>
          </div>
        </div>
        <motion.div 
          className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-medium border border-emerald-200"
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          Live
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          >
            <motion.div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100" whileHover={{ scale: 1.02 }}>
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Growing</span>
              </div>
              <div className="text-sm text-slate-600 mb-1">Monthly Revenue</div>
              <div className="text-xl font-bold text-slate-900">${metrics.revenue.toLocaleString()}</div>
            </motion.div>

            <motion.div className="bg-blue-50 rounded-xl p-4 border border-blue-100" whileHover={{ scale: 1.02 }}>
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">{metrics.clientRetention.toFixed(1)}%</span>
              </div>
              <div className="text-sm text-slate-600 mb-1">Client Retention</div>
              <div className="text-xl font-bold text-slate-900">Excellent</div>
            </motion.div>

            <motion.div className="bg-violet-50 rounded-xl p-4 border border-violet-100" whileHover={{ scale: 1.02 }}>
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-5 h-5 text-violet-600" />
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full font-medium">Active</span>
              </div>
              <div className="text-sm text-slate-600 mb-1">Invoices Processed</div>
              <div className="text-xl font-bold text-slate-900">{metrics.invoicesPaid}</div>
            </motion.div>

            <motion.div className="bg-amber-50 rounded-xl p-4 border border-amber-100" whileHover={{ scale: 1.02 }}>
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Smart</span>
              </div>
              <div className="text-sm text-slate-600 mb-1">Cost Savings</div>
              <div className="text-xl font-bold text-slate-900">${metrics.expensesSaved.toLocaleString()}</div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'predictions' && (
          <motion.div
            key="predictions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-900 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">AI Predictions Engine</h4>
                <p className="text-sm text-slate-500">Advanced forecasting algorithms</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <LineChart className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Revenue Tracking</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">Active</div>
                <div className="text-xs text-blue-600">Real-time monitoring</div>
              </div>

              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Smart Insights</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600 mb-1">Ready</div>
                <div className="text-xs text-emerald-600">Business analysis</div>
              </div>

              <div className="bg-slate-100 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Risk Analysis</span>
                </div>
                <div className="text-2xl font-bold text-slate-700 mb-1">Low</div>
                <div className="text-xs text-slate-500">Financial risk score</div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-slate-900">Smart Insights</span>
              </div>
              <motion.div 
                className="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Live Updates
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeInsight}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-lg border-l-4 ${
                  insights[activeInsight].priority === 'high' ? 'bg-rose-50 border-rose-400' : 'bg-amber-50 border-amber-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className={`w-4 h-4 ${insights[activeInsight].priority === 'high' ? 'text-rose-500' : 'text-amber-500'}`} />
                      <span className="text-sm font-medium capitalize">{insights[activeInsight].type.replace('-', ' ')}</span>
                      <div className="ml-auto text-xs text-slate-500">{insights[activeInsight].confidence}% confidence</div>
                    </div>
                    <p className="text-slate-700 mb-2">{insights[activeInsight].message}</p>
                    <motion.button 
                      className="text-sm bg-slate-900 text-white px-3 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {insights[activeInsight].action} →
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Insight indicators */}
            <div className="flex justify-center mt-4 gap-2">
              {insights.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${index === activeInsight ? 'bg-slate-900 w-6' : 'bg-slate-300 w-1.5'}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AnalyticsFeature = ({ icon: Icon, title, description, metric, delay = 0 }) => (
  <motion.div
    className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all"
    {...useScrollAnimation(delay)}
    whileHover={{ y: -4 }}
  >
    <motion.div className="p-3 bg-slate-900 rounded-xl w-fit mb-4" whileHover={{ scale: 1.1 }}>
      <Icon className="w-6 h-6 text-white" />
    </motion.div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 mb-4 text-sm">{description}</p>
    <div className="flex items-center justify-between">
      <div className="text-xl font-bold text-emerald-600">{metric}</div>
      <ArrowUpRight className="w-5 h-5 text-slate-400" />
    </div>
  </motion.div>
);

export default function IntelligentAnalytics() {
  const features = [
    { icon: Brain, title: 'AI Business Analysis', description: 'AI-powered analysis providing insights and growth opportunities.', metric: 'Smart' },
    { icon: BarChart3, title: 'Real-time Reporting', description: 'Dynamic dashboards showing revenue trends and performance metrics.', metric: 'Live' },
    { icon: Lightbulb, title: 'Strategic Insights', description: 'Automated recommendations for improving cash flow and growth.', metric: 'Growth' },
    { icon: Shield, title: 'Performance Tracking', description: 'Monitor key business metrics and operational efficiency.', metric: 'KPIs' },
    { icon: Target, title: 'Financial Overview', description: 'Comprehensive view of financial health with invoice tracking.', metric: 'Clear' },
    { icon: Zap, title: 'Export & Reports', description: 'Generate detailed reports and export analytics data.', metric: 'Export' }
  ];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden" id="analytics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div className="text-center mb-16" {...useScrollAnimation()}>
          <motion.div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-6">
            <Brain className="w-5 h-5 text-amber-600" />
            <span className="text-amber-700 font-semibold">Intelligent Analytics</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            <span className="text-amber-600">Data-Driven Decisions</span>
            <br />Powered by AI
          </h2>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Transform your business data into actionable insights with AI-powered analysis. 
            Make smarter decisions with comprehensive reporting, business health scoring, and strategic recommendations.
          </p>
        </motion.div>

        {/* Interactive Dashboard */}
        <div className="mb-20">
          <IntelligentDashboard />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <AnalyticsFeature key={index} {...feature} delay={index * 0.1} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div className="text-center mt-16" {...useScrollAnimation(0.6)}>
          <motion.button 
            className="bg-slate-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-800 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/pricing'}
          >
            <span className="flex items-center gap-2">
              Start Your Analytics Journey
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </motion.button>
          <p className="text-slate-500 mt-4">Make data-driven decisions for your business growth</p>
        </motion.div>
      </div>
    </section>
  );
}
