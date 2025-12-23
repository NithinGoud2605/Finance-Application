import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, BarChart2, ClipboardList, ShieldCheck, Zap, Target, Users, ArrowRight, Check } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Invoice Management',
    description: 'Create, send, and track professional invoices with automated reminders.',
    iconColor: 'bg-blue-500',
    metric: 'Pro',
    label: 'Quality',
    highlights: ['Smart Templates', 'Auto Reminders', 'Payment Tracking']
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Organize client information, track communications, and manage relationships.',
    iconColor: 'bg-emerald-500',
    metric: 'Full',
    label: 'Control',
    highlights: ['Client Profiles', 'History', 'Relationship Tracking']
  },
  {
    icon: BarChart2,
    title: 'Expense Tracking',
    description: 'Monitor business expenses, track receipts, and manage approvals.',
    iconColor: 'bg-amber-500',
    metric: 'Smart',
    label: 'Tracking',
    highlights: ['Receipt Management', 'Approval Workflow', 'Categories']
  },
  {
    icon: ClipboardList,
    title: 'Contract Management',
    description: 'Streamline contracts with digital signatures and document tracking.',
    iconColor: 'bg-violet-500',
    metric: 'Full',
    label: 'Lifecycle',
    highlights: ['Digital Signatures', 'Document Management', 'Status Tracking']
  },
  {
    icon: ShieldCheck,
    title: 'Secure Platform',
    description: 'Professional-grade security with data encryption and access controls.',
    iconColor: 'bg-slate-700',
    metric: '100%',
    label: 'Secure',
    highlights: ['Data Encryption', 'Authentication', 'Access Controls']
  },
  {
    icon: Target,
    title: 'Projects (Coming Soon)',
    description: 'Advanced project management with task tracking and milestones.',
    iconColor: 'bg-rose-500',
    metric: 'Soon',
    label: 'Coming',
    highlights: ['Task Management', 'Project Tracking', 'Collaboration']
  }
];

const InteractiveDashboard = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [businessMetrics, setBusinessMetrics] = useState({
    clients: 28,
    invoices: 47,
    expenses: 3240,
    contracts: 12,
    revenue: 45280
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
      setBusinessMetrics(prev => ({
        ...prev,
        clients: prev.clients + (Math.random() > 0.7 ? 1 : 0),
        invoices: prev.invoices + (Math.random() > 0.8 ? 1 : 0),
        revenue: prev.revenue + (Math.random() > 0.5 ? Math.floor(Math.random() * 1000) + 100 : 0)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Business Overview</h3>
            <p className="text-sm text-slate-500">Real-time dashboard</p>
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div
          className="bg-blue-50 rounded-xl p-4 border border-blue-100"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium mb-1">Active Clients</p>
              <p className="text-xl font-bold text-blue-700">{businessMetrics.clients}</p>
              <p className="text-xs text-emerald-600">+{Math.floor(businessMetrics.clients * 0.1)} this month</p>
            </div>
            <Users className="w-6 h-6 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          className="bg-emerald-50 rounded-xl p-4 border border-emerald-100"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 font-medium mb-1">Invoices</p>
              <p className="text-xl font-bold text-emerald-700">{businessMetrics.invoices}</p>
              <p className="text-xs text-emerald-600">${(businessMetrics.revenue / 1000).toFixed(1)}K revenue</p>
            </div>
            <FileText className="w-6 h-6 text-emerald-400" />
          </div>
        </motion.div>

        <motion.div
          className="bg-amber-50 rounded-xl p-4 border border-amber-100"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 font-medium mb-1">Expenses</p>
              <p className="text-xl font-bold text-amber-700">${(businessMetrics.expenses / 1000).toFixed(1)}K</p>
              <p className="text-xs text-amber-600">3 pending approval</p>
            </div>
            <BarChart2 className="w-6 h-6 text-amber-400" />
          </div>
        </motion.div>

        <motion.div
          className="bg-violet-50 rounded-xl p-4 border border-violet-100"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-violet-600 font-medium mb-1">Contracts</p>
              <p className="text-xl font-bold text-violet-700">{businessMetrics.contracts}</p>
              <p className="text-xs text-emerald-600">{Math.floor(businessMetrics.contracts * 0.8)} signed</p>
            </div>
            <ClipboardList className="w-6 h-6 text-violet-400" />
          </div>
        </motion.div>
      </div>

      {/* Active Feature */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-slate-700">Featured</span>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3"
          >
            <div className={`p-2 ${features[activeFeature].iconColor} rounded-lg`}>
              {React.createElement(features[activeFeature].icon, { className: "w-4 h-4 text-white" })}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 text-sm">{features[activeFeature].title}</h4>
              <p className="text-xs text-slate-500">{features[activeFeature].description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center mt-4 gap-1">
        {features.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all ${index === activeFeature ? 'bg-slate-900 w-6' : 'bg-slate-300 w-1.5'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default function AllInOne() {
  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 mb-6 border border-slate-200">
              <Zap className="w-4 h-4 mr-2 text-amber-500" />
              All-in-One Platform
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-6 sm:text-5xl">
              Complete Business Management
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed">
              From invoices and contracts to client relationships and expense tracking - 
              everything your business needs in one integrated platform.
            </p>
          </motion.div>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <InteractiveDashboard />
          </motion.div>

          {/* Features List */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                  className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 ${feature.iconColor} rounded-xl shadow-sm`}>
                      {React.createElement(feature.icon, { className: "h-5 w-5 text-white" })}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-slate-500">{feature.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">{feature.metric}</div>
                      <div className="text-xs text-slate-500">{feature.label}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div 
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <motion.button 
                className="inline-flex items-center bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/sign-up'}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
