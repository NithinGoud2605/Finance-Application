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
  const [displayedMetrics, setDisplayedMetrics] = useState({
    clients: 0,
    invoices: 0,
    expenses: 0,
    contracts: 0,
    revenue: 0
  });

  // Animate numbers counting up
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    
    const animateValue = (start, end, setter) => {
      const range = end - start;
      const increment = range / steps;
      let current = start;
      let step = 0;
      
      const timer = setInterval(() => {
        step++;
        current = start + (increment * step);
        if (step >= steps) {
          current = end;
          clearInterval(timer);
        }
        setter(Math.floor(current));
      }, stepDuration);
      
      return timer;
    };

    const timers = [
      animateValue(0, businessMetrics.clients, (val) => setDisplayedMetrics(prev => ({ ...prev, clients: val }))),
      animateValue(0, businessMetrics.invoices, (val) => setDisplayedMetrics(prev => ({ ...prev, invoices: val }))),
      animateValue(0, businessMetrics.expenses, (val) => setDisplayedMetrics(prev => ({ ...prev, expenses: val }))),
      animateValue(0, businessMetrics.contracts, (val) => setDisplayedMetrics(prev => ({ ...prev, contracts: val }))),
      animateValue(0, businessMetrics.revenue, (val) => setDisplayedMetrics(prev => ({ ...prev, revenue: val })))
    ];

    return () => timers.forEach(timer => clearInterval(timer));
  }, [businessMetrics]);

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

  // Chart data with animation
  const chartData = [35, 55, 40, 70, 45, 85, 65];
  const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Floating background elements */}
      <motion.div
        className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 blur-2xl"
        animate={{ 
          x: [0, 20, 0],
          y: [0, 15, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-100 rounded-full opacity-20 blur-2xl"
        animate={{ 
          x: [0, -15, 0],
          y: [0, -20, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3">
          <motion.div 
            className="p-2 bg-slate-900 rounded-lg"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <BarChart2 className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-slate-900">Business Overview</h3>
            <p className="text-sm text-slate-500">Real-time dashboard</p>
          </div>
        </div>
        <motion.div 
          className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-medium border border-emerald-200"
          animate={{ 
            opacity: [1, 0.7, 1],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div 
            className="w-2 h-2 bg-emerald-500 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          Live
        </motion.div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
        {[
          { 
            label: 'Active Clients', 
            value: displayedMetrics.clients, 
            change: `+${Math.floor(displayedMetrics.clients * 0.1)} this month`,
            color: 'blue',
            icon: Users,
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            text: 'text-blue-600',
            textBold: 'text-blue-700',
            iconColor: 'text-blue-400'
          },
          { 
            label: 'Invoices', 
            value: displayedMetrics.invoices, 
            change: `$${(displayedMetrics.revenue / 1000).toFixed(1)}K revenue`,
            color: 'emerald',
            icon: FileText,
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            text: 'text-emerald-600',
            textBold: 'text-emerald-700',
            iconColor: 'text-emerald-400'
          },
          { 
            label: 'Expenses', 
            value: `$${(displayedMetrics.expenses / 1000).toFixed(1)}K`, 
            change: '3 pending approval',
            color: 'amber',
            icon: BarChart2,
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            text: 'text-amber-600',
            textBold: 'text-amber-700',
            iconColor: 'text-amber-400'
          },
          { 
            label: 'Contracts', 
            value: displayedMetrics.contracts, 
            change: `${Math.floor(displayedMetrics.contracts * 0.8)} signed`,
            color: 'violet',
            icon: ClipboardList,
            bg: 'bg-violet-50',
            border: 'border-violet-100',
            text: 'text-violet-600',
            textBold: 'text-violet-700',
            iconColor: 'text-violet-400'
          }
        ].map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <motion.div
              key={index}
              className={`${metric.bg} rounded-xl p-4 border ${metric.border} relative overflow-hidden`}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              {/* Animated background gradient */}
              <motion.div
                className="absolute inset-0 opacity-0"
                style={{
                  background: `linear-gradient(to bottom right, ${
                    metric.color === 'blue' ? 'rgba(219, 234, 254, 0.5)' :
                    metric.color === 'emerald' ? 'rgba(209, 250, 229, 0.5)' :
                    metric.color === 'amber' ? 'rgba(254, 243, 199, 0.5)' :
                    'rgba(237, 233, 254, 0.5)'
                  }, transparent)`
                }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className={`text-xs ${metric.text} font-medium mb-1`}>{metric.label}</p>
                  <motion.p 
                    className={`text-xl font-bold ${metric.textBold}`}
                    key={metric.value}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {metric.value}
                  </motion.p>
                  <p className={`text-xs ${metric.text}`}>{metric.change}</p>
                </div>
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3 + index * 0.5, 
                    repeat: Infinity,
                    delay: index * 0.3
                  }}
                >
                  <IconComponent className={`w-6 h-6 ${metric.iconColor}`} />
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <motion.div 
        className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 mb-6 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-slate-700">Revenue Overview</div>
          <motion.div 
            className="text-xs text-slate-500 bg-white px-2 py-1 rounded"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Last 7 days
          </motion.div>
        </div>
        <div className="flex items-end justify-between h-24 space-x-2">
          {chartData.map((height, index) => (
            <motion.div
              key={index}
              className="flex-1 rounded-t-md relative"
              style={{
                background: index === 5 
                  ? 'linear-gradient(to top, #10b981, #34d399)' 
                  : 'linear-gradient(to top, #cbd5e1, #e2e8f0)'
              }}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.6, ease: "easeOut" }}
              whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
            >
              <motion.div
                className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-slate-600 opacity-0"
                whileHover={{ opacity: 1, y: -2 }}
              >
                ${(height * 100).toLocaleString()}
              </motion.div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          {chartLabels.map((label, index) => (
            <motion.span
              key={index}
              className={index === 5 ? 'text-emerald-600 font-medium' : ''}
              animate={index === 5 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {label}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Active Feature */}
      <motion.div 
        className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="w-4 h-4 text-amber-500" />
          </motion.div>
          <span className="text-sm font-medium text-slate-700">Featured</span>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <motion.div 
              className={`p-2 ${features[activeFeature].iconColor} rounded-lg`}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {React.createElement(features[activeFeature].icon, { className: "w-4 h-4 text-white" })}
            </motion.div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 text-sm">{features[activeFeature].title}</h4>
              <p className="text-xs text-slate-500">{features[activeFeature].description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Progress dots */}
      <motion.div 
        className="flex justify-center mt-4 gap-1 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {features.map((_, index) => (
          <motion.div
            key={index}
            className={`h-1.5 rounded-full ${index === activeFeature ? 'bg-slate-900' : 'bg-slate-300'}`}
            animate={{ 
              width: index === activeFeature ? 24 : 6,
              scale: index === activeFeature ? 1.1 : 1
            }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </motion.div>

      {/* Floating action buttons */}
      <motion.div 
        className="grid grid-cols-2 gap-3 mt-4 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <motion.button
          className="bg-emerald-500 rounded-xl p-3 text-white font-semibold text-sm flex items-center justify-center gap-2"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            boxShadow: [
              '0 4px 6px rgba(16, 185, 129, 0.3)',
              '0 8px 12px rgba(16, 185, 129, 0.4)',
              '0 4px 6px rgba(16, 185, 129, 0.3)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.span
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 0.5 }}
          >
            +
          </motion.span>
          New Invoice
        </motion.button>
        <motion.button
          className="bg-blue-500 rounded-xl p-3 text-white font-semibold text-sm flex items-center justify-center gap-2"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            boxShadow: [
              '0 4px 6px rgba(59, 130, 246, 0.3)',
              '0 8px 12px rgba(59, 130, 246, 0.4)',
              '0 4px 6px rgba(59, 130, 246, 0.3)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <Users className="w-4 h-4" />
          Add Client
        </motion.button>
      </motion.div>
    </motion.div>
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
