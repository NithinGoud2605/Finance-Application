import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Zap, CheckCircle, Star, Shield, DollarSign, FileText, ClipboardList } from 'lucide-react';

const benefits = [
  { icon: CheckCircle, text: "Secure payments" },
  { icon: Star, text: "Professional tools" },
  { icon: Shield, text: "Cancel anytime" }
];

const stats = [
  { number: "2min", label: "Setup time" },
  { number: "24/7", label: "Support" },
  { number: "99.9%", label: "Uptime" }
];

export default function CallToAction() {
  const [hoveredStat, setHoveredStat] = useState(null);

  return (
    <section className="py-20 bg-slate-900 relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Colored accent shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Header */}
          <motion.div
            className="inline-flex items-center rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 mb-6 border border-emerald-500/30"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Zap className="w-4 h-4 mr-2" />
            Ready to Get Started?
          </motion.div>

          <motion.h2 
            className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Transform your{' '}
            <span className="text-emerald-400">business operations</span>
            {' '}today
          </motion.h2>
          
          <motion.p 
            className="text-lg text-slate-400 mb-10 leading-relaxed max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Join thousands of businesses streamlining their operations with comprehensive client management, 
            expense tracking, smart invoicing, and contract management.
          </motion.p>

          {/* Features Preview Grid */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {[
              { Icon: Users, title: 'Client Management', desc: 'Organize relationships', color: 'bg-blue-500/20 border-blue-500/30', iconColor: 'text-blue-400' },
              { Icon: DollarSign, title: 'Expense Tracking', desc: 'Control your costs', color: 'bg-amber-500/20 border-amber-500/30', iconColor: 'text-amber-400' },
              { Icon: FileText, title: 'Smart Invoicing', desc: 'Get paid faster', color: 'bg-emerald-500/20 border-emerald-500/30', iconColor: 'text-emerald-400' },
              { Icon: ClipboardList, title: 'Contracts', desc: 'Digital signatures', color: 'bg-violet-500/20 border-violet-500/30', iconColor: 'text-violet-400' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className={`${feature.color} backdrop-blur-sm rounded-xl p-4 text-center border`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="flex justify-center mb-2">
                  <feature.Icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <div className="text-sm font-semibold text-white mb-1">{feature.title}</div>
                <div className="text-xs text-slate-400">{feature.desc}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="flex justify-center gap-12 mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                onHoverStart={() => setHoveredStat(index)}
                onHoverEnd={() => setHoveredStat(null)}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="text-3xl font-bold"
                  animate={{ 
                    color: hoveredStat === index ? "#10b981" : "#ffffff"
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <motion.button
              className="inline-flex items-center bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-emerald-600 transition-all duration-300 group shadow-lg shadow-emerald-500/25"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/sign-up'}
            >
              Start Free Trial
              <motion.div
                className="ml-2"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </motion.button>
            
            <motion.button
              className="inline-flex items-center bg-transparent border-2 border-slate-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-800 hover:border-slate-500 transition-all duration-300 group"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/pricing'}
            >
              View Pricing
            </motion.button>
          </motion.div>

          {/* Benefits */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.text}
                className="flex items-center text-slate-400 text-sm"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.05, color: '#ffffff' }}
              >
                <benefit.icon className="w-5 h-5 mr-2 text-emerald-500" />
                {benefit.text}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
