// src/components/Mainpage/Hero.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

// Custom SVG icons for trust indicators
const StarSvg = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.46,13.97L5.82,21L12,17.27Z"/>
  </svg>
);

const UsersSvg = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M16 4C18.2 4 20 5.8 20 8S18.2 12 16 12 12 10.2 12 8 13.8 4 16 4M16 14C20.4 14 24 15.8 24 18V20H8V18C8 15.8 11.6 14 16 14M8.5 4C10.7 4 12.5 5.8 12.5 8S10.7 12 8.5 12 4.5 10.2 4.5 8 6.3 4 8.5 4M8.5 14C12.9 14 16.5 15.8 16.5 18V20H0V18C0 15.8 4.1 14 8.5 14Z"/>
  </svg>
);

const SecuritySvg = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16V18H8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z"/>
  </svg>
);

const ChartSvg = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z"/>
  </svg>
);

export default function Hero() {
  const [titleRef, titleControls] = useScrollAnimation(0.1, 0);
  const [imageRef, imageControls] = useScrollAnimation(0.1, 400);
  
  // Animated metrics state
  const [metrics, setMetrics] = useState({
    revenue: 24500,
    invoices: 156,
    clients: 48
  });
  
  const [displayedMetrics, setDisplayedMetrics] = useState({
    revenue: 0,
    invoices: 0,
    clients: 0
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
      animateValue(0, metrics.revenue, (val) => setDisplayedMetrics(prev => ({ ...prev, revenue: val }))),
      animateValue(0, metrics.invoices, (val) => setDisplayedMetrics(prev => ({ ...prev, invoices: val }))),
      animateValue(0, metrics.clients, (val) => setDisplayedMetrics(prev => ({ ...prev, clients: val })))
    ];

    return () => timers.forEach(timer => clearInterval(timer));
  }, [metrics]);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        revenue: prev.revenue + (Math.random() > 0.7 ? Math.floor(Math.random() * 500) + 100 : 0),
        invoices: prev.invoices + (Math.random() > 0.8 ? 1 : 0),
        clients: prev.clients + (Math.random() > 0.9 ? 1 : 0)
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="home" className="relative min-h-screen bg-slate-50 flex items-center justify-center overflow-hidden">
      {/* Subtle geometric background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            className="text-left lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center rounded-full bg-emerald-50 px-6 py-3 text-sm font-medium text-emerald-700 mb-8 border border-emerald-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="p-1 bg-emerald-100 rounded-full mr-2">
                <ChartSvg />
              </div>
              Trusted Business Platform
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-8 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-slate-900">Smart </span>
              <span className="text-emerald-600">Financial</span>
              <br />
              <span className="text-slate-900">Management</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Streamline your business operations with our all-in-one platform. From smart invoicing to powerful analytics, manage everything in one place.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                className="inline-flex items-center bg-slate-900 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-800 transition-all duration-300 group shadow-lg"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/pricing'}
              >
                Get Started Free
                <motion.div
                  className="ml-2"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </motion.div>
              </motion.button>
              
              <motion.button
                className="inline-flex items-center bg-white text-slate-700 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/sign-in'}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Sign In
              </motion.button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="flex flex-wrap items-center gap-6 mt-12 text-slate-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                  <StarSvg />
                </div>
                <span className="text-sm font-medium">Enterprise Grade</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <UsersSvg />
                </div>
                <span className="text-sm font-medium">Team Collaboration</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <SecuritySvg />
                </div>
                <span className="text-sm font-medium">Bank-Level Security</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Dashboard Preview */}
          <motion.div
            className="relative lg:ml-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Floating background elements */}
            <motion.div
              className="absolute -top-20 -right-20 w-40 h-40 bg-blue-200 rounded-full opacity-30 blur-3xl"
              animate={{ 
                x: [0, 30, 0],
                y: [0, 20, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-200 rounded-full opacity-30 blur-3xl"
              animate={{ 
                x: [0, -20, 0],
                y: [0, -30, 0],
                scale: [1, 1.3, 1]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* Dashboard Container */}
            <motion.div
              className="relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              {/* Dashboard Header */}
              <motion.div 
                className="bg-slate-900 p-5 text-white relative overflow-hidden"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {/* Animated background gradient */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-transparent to-blue-500/20"
                  animate={{ 
                    x: ['-100%', '100%'],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <motion.h3 
                      className="text-lg font-bold"
                      animate={{ opacity: [1, 0.8, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      Business Dashboard
                    </motion.h3>
                    <p className="text-slate-400 text-sm">Real-time Overview</p>
                  </div>
                  <motion.div 
                    className="flex items-center space-x-2 bg-emerald-500/20 px-3 py-1 rounded-full"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(16, 185, 129, 0.4)',
                        '0 0 0 8px rgba(16, 185, 129, 0)',
                        '0 0 0 0 rgba(16, 185, 129, 0)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.div 
                      className="w-2 h-2 bg-emerald-400 rounded-full"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-sm font-medium text-emerald-400">Live</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Dashboard Content */}
              <div className="p-5 space-y-4 bg-slate-50">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { 
                      label: 'Revenue', 
                      value: displayedMetrics.revenue, 
                      format: (v) => `$${(v / 1000).toFixed(1)}K`,
                      change: '+12.5%',
                      color: 'emerald',
                      icon: '↑'
                    },
                    { 
                      label: 'Invoices', 
                      value: displayedMetrics.invoices, 
                      format: (v) => v.toString(),
                      change: '+8.2%',
                      color: 'blue',
                      icon: '↑'
                    },
                    { 
                      label: 'Clients', 
                      value: displayedMetrics.clients, 
                      format: (v) => v.toString(),
                      change: '+5.1%',
                      color: 'amber',
                      icon: '↑'
                    }
                  ].map((stat, index) => (
                    <motion.div 
                      key={index}
                      className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden"
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                    >
                      {/* Hover gradient effect */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${
                          stat.color === 'emerald' ? 'from-emerald-50' :
                          stat.color === 'blue' ? 'from-blue-50' :
                          'from-amber-50'
                        } to-transparent opacity-0`}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <div className="relative z-10">
                        <div className="text-xs text-slate-500 font-medium mb-1">{stat.label}</div>
                        <motion.div 
                          className="text-xl font-bold text-slate-900"
                          key={stat.value}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {stat.format(stat.value)}
                        </motion.div>
                        <motion.div 
                          className={`flex items-center text-xs ${
                            stat.color === 'emerald' ? 'text-emerald-600' :
                            stat.color === 'blue' ? 'text-blue-600' :
                            'text-amber-600'
                          } mt-1`}
                          animate={{ opacity: [1, 0.7, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <motion.svg 
                            className="w-3 h-3 mr-1" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </motion.svg>
                          {stat.change}
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Chart Area */}
                <motion.div 
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <motion.div 
                      className="text-sm font-semibold text-slate-700"
                      animate={{ opacity: [1, 0.8, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      Revenue Overview
                    </motion.div>
                    <motion.div 
                      className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Last 7 days
                    </motion.div>
                  </div>
                  <div className="flex items-end justify-between h-24 space-x-2">
                    {[35, 55, 40, 70, 45, 85, 65].map((height, index) => (
                      <motion.div
                        key={index}
                        className="flex-1 rounded-t-md relative group"
                        style={{
                          background: index === 5 
                            ? 'linear-gradient(to top, #10b981, #34d399)' 
                            : 'linear-gradient(to top, #cbd5e1, #e2e8f0)'
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 1.2 + index * 0.1, duration: 0.6, ease: "easeOut" }}
                        whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                      >
                        <motion.div
                          className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-slate-700 bg-white px-2 py-1 rounded shadow-md opacity-0 whitespace-nowrap"
                          whileHover={{ opacity: 1, y: -2 }}
                        >
                          ${(height * 100).toLocaleString()}
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-400">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, index) => (
                      <motion.span
                        key={index}
                        className={index === 5 ? 'text-emerald-600 font-medium' : ''}
                        animate={index === 5 ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {label}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.div 
                    className="bg-emerald-500 rounded-xl p-4 text-white cursor-pointer relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      boxShadow: [
                        '0 4px 6px rgba(16, 185, 129, 0.3)',
                        '0 8px 16px rgba(16, 185, 129, 0.4)',
                        '0 4px 6px rgba(16, 185, 129, 0.3)'
                      ]
                    }}
                    transition={{ 
                      opacity: { delay: 1.1 },
                      y: { delay: 1.1 },
                      boxShadow: { duration: 2, repeat: Infinity }
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="flex items-center space-x-2 relative z-10">
                      <motion.svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        animate={{ rotate: [0, 90, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </motion.svg>
                      <span className="text-sm font-semibold">New Invoice</span>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="bg-blue-500 rounded-xl p-4 text-white cursor-pointer relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      boxShadow: [
                        '0 4px 6px rgba(59, 130, 246, 0.3)',
                        '0 8px 16px rgba(59, 130, 246, 0.4)',
                        '0 4px 6px rgba(59, 130, 246, 0.3)'
                      ]
                    }}
                    transition={{ 
                      opacity: { delay: 1.2 },
                      y: { delay: 1.2 },
                      boxShadow: { duration: 2, repeat: Infinity, delay: 0.5 }
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
                    />
                    <div className="flex items-center space-x-2 relative z-10">
                      <motion.svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </motion.svg>
                      <span className="text-sm font-semibold">Add Client</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Floating elements */}
            <motion.div
              className="absolute -top-4 -right-4 bg-amber-500 text-white p-3 rounded-xl shadow-lg z-20"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: [0, -15, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                opacity: { delay: 1.3 },
                scale: { delay: 1.3 },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 4, repeat: Infinity }
              }}
            >
              <motion.svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </motion.svg>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -left-4 bg-emerald-500 text-white p-3 rounded-xl shadow-lg z-20"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: [0, 15, 0],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                opacity: { delay: 1.5 },
                scale: { delay: 1.5 },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
                rotate: { duration: 4, repeat: Infinity, delay: 0.5 }
              }}
            >
              <motion.svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </motion.svg>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-slate-400 rounded-full mt-2 animate-pulse" />
        </div>
      </motion.div>
    </section>
  );
}
