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

      {/* Large Featured Metric Card */}
      <motion.div 
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 mb-4 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-slate-400 text-xs font-medium mb-1">Total Revenue</p>
              <motion.div 
                className="text-3xl font-bold text-white"
                key={displayedMetrics.revenue}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                ${(displayedMetrics.revenue / 1000).toFixed(1)}K
              </motion.div>
            </div>
            <motion.div
              className="bg-emerald-500/20 p-3 rounded-xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <BarChart2 className="w-8 h-8 text-emerald-400" />
            </motion.div>
          </div>
          
          {/* Mini line chart */}
          <div className="h-16 mt-4">
            <svg viewBox="0 0 200 60" className="w-full h-full">
              <motion.polyline
                points="0,50 30,45 60,40 90,35 120,30 150,25 180,20 200,15"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 1.5 }}
              />
              <motion.circle
                cx="200"
                cy="15"
                r="4"
                fill="#10b981"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                transition={{ delay: 2, duration: 0.5 }}
              />
            </svg>
          </div>
          
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1 text-emerald-400">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span>+24.5% vs last month</span>
            </div>
            <div className="text-slate-400">•</div>
            <div className="text-slate-400">All time high</div>
          </div>
        </div>
      </motion.div>

      {/* Compact Metrics Grid - Different Style */}
      <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
        {[
          { 
            label: 'Clients', 
            value: displayedMetrics.clients, 
            icon: Users,
            color: 'blue',
            hexColor: '#3b82f6',
            bgGradient: 'from-blue-500 to-blue-600'
          },
          { 
            label: 'Invoices', 
            value: displayedMetrics.invoices, 
            icon: FileText,
            color: 'emerald',
            hexColor: '#10b981',
            bgGradient: 'from-emerald-500 to-emerald-600'
          },
          { 
            label: 'Contracts', 
            value: displayedMetrics.contracts, 
            icon: ClipboardList,
            color: 'violet',
            hexColor: '#8b5cf6',
            bgGradient: 'from-violet-500 to-violet-600'
          }
        ].map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <motion.div
              key={index}
              className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm relative overflow-hidden group"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              {/* Colored accent bar */}
              <motion.div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${metric.bgGradient}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
              />
              
              <div className="flex items-center justify-between mt-1">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">{metric.label}</p>
                  <motion.p 
                    className="text-lg font-bold text-slate-900"
                    key={metric.value}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {metric.value}
                  </motion.p>
                </div>
                <motion.div
                  className={`p-2 bg-gradient-to-br ${metric.bgGradient} rounded-lg`}
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    delay: index * 0.3
                  }}
                >
                  <IconComponent className="w-4 h-4 text-white" />
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Line Chart - Different from Hero */}
      <motion.div 
        className="bg-white rounded-xl p-4 border border-slate-200 mb-4 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-slate-700">Growth Trend</div>
            <div className="text-xs text-slate-500">Last 30 days</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-slate-600">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-slate-600">Invoices</span>
            </div>
          </div>
        </div>
        
        <div className="h-32 relative">
          <svg viewBox="0 0 300 120" className="w-full h-full">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="0"
                y1={i * 30}
                x2="300"
                y2={i * 30}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            ))}
            
            {/* Revenue line */}
            <motion.polyline
              points="0,100 50,85 100,70 150,55 200,45 250,35 300,25"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.8, duration: 1.5 }}
            />
            
            {/* Invoices line */}
            <motion.polyline
              points="0,110 50,95 100,80 150,65 200,55 250,45 300,35"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="5,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1, duration: 1.5 }}
            />
            
            {/* Animated dots */}
            {[
              { x: 0, y: 100, color: '#10b981' },
              { x: 100, y: 70, color: '#10b981' },
              { x: 200, y: 45, color: '#10b981' },
              { x: 300, y: 25, color: '#10b981' }
            ].map((dot, idx) => (
              <motion.circle
                key={idx}
                cx={dot.x}
                cy={dot.y}
                r="4"
                fill={dot.color}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1], opacity: 1 }}
                transition={{ delay: 1.5 + idx * 0.2, duration: 0.5 }}
              />
            ))}
          </svg>
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>Week 1</span>
          <span>Week 2</span>
          <span>Week 3</span>
          <span>Week 4</span>
        </div>
      </motion.div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
        <motion.div 
          className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 font-medium mb-1">Expenses</p>
              <p className="text-lg font-bold text-amber-900">${(displayedMetrics.expenses / 1000).toFixed(1)}K</p>
              <p className="text-xs text-amber-600 mt-1">3 pending</p>
            </div>
            <BarChart2 className="w-8 h-8 text-amber-500" />
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-3 border border-violet-200"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-violet-700 font-medium mb-1">Contracts</p>
              <p className="text-lg font-bold text-violet-900">{displayedMetrics.contracts}</p>
              <p className="text-xs text-violet-600 mt-1">{Math.floor(displayedMetrics.contracts * 0.8)} signed</p>
            </div>
            <ClipboardList className="w-8 h-8 text-violet-500" />
          </div>
        </motion.div>
      </div>

      {/* Quick Actions - Single Row Style */}
      <motion.div 
        className="flex gap-2 mb-4 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <motion.button
          className="flex-1 bg-slate-900 hover:bg-slate-800 rounded-lg px-4 py-2.5 text-white font-medium text-xs relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-2">
            <motion.span
              className="text-base"
              animate={{ rotate: [0, 90, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              +
            </motion.span>
            <span>Invoice</span>
          </div>
        </motion.button>
        
        <motion.button
          className="flex-1 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 font-medium text-xs"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-2">
            <Users className="w-3.5 h-3.5" />
            <span>Client</span>
          </div>
        </motion.button>
        
        <motion.button
          className="flex-1 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 font-medium text-xs"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-2">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Contract</span>
          </div>
        </motion.button>
      </motion.div>

      {/* Feature Carousel - Compact Style */}
      <motion.div 
        className="bg-gradient-to-r from-slate-50 to-white rounded-lg p-3 border border-slate-200 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 flex-1"
            >
              <motion.div 
                className={`p-1.5 ${features[activeFeature].iconColor} rounded-md`}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {React.createElement(features[activeFeature].icon, { className: "w-3 h-3 text-white" })}
              </motion.div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 text-xs truncate">{features[activeFeature].title}</h4>
                <p className="text-xs text-slate-500 truncate">{features[activeFeature].description}</p>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Compact progress indicator */}
          <div className="flex gap-1 ml-2">
            {features.map((_, index) => (
              <motion.div
                key={index}
                className={`h-1 rounded-full ${index === activeFeature ? 'w-3 bg-slate-900' : 'w-1 bg-slate-300'}`}
                animate={{ 
                  width: index === activeFeature ? 12 : 4,
                  opacity: index === activeFeature ? 1 : 0.5
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>
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
