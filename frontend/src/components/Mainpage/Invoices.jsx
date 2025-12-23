// sections/Invoices.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, FileText, CreditCard, Clock, TrendingUp, Zap } from 'lucide-react';

const features = [
  { icon: FileText, text: 'Professional branded templates', description: 'Customize invoices with your brand colors and logo' },
  { icon: Clock, text: 'Automated recurring billing', description: 'Set up subscriptions that bill automatically' },
  { icon: TrendingUp, text: 'Client management integration', description: 'Seamlessly connected to client profiles' },
  { icon: CreditCard, text: 'Payment tracking & reminders', description: 'Never lose track of outstanding payments' },
  { icon: Zap, text: 'Professional formatting', description: 'Clean, professional invoice templates' },
  { icon: CheckCircle2, text: 'PDF generation & export', description: 'Download invoices as PDF files' }
];

const AnimatedInvoice = () => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className="bg-white rounded-xl shadow-xl p-6 max-w-md mx-auto border border-slate-200"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02, y: -5 }}
    >
      {/* Invoice Header */}
      <motion.div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">FN</span>
          </div>
          <div>
            <div className="font-semibold text-slate-900">Finorn Platform</div>
            <div className="text-xs text-slate-500">Invoice #INV-2024-0142</div>
          </div>
        </div>
        <motion.div
          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
          animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
        >
          PAID
        </motion.div>
      </motion.div>

      {/* Client Information */}
      <motion.div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
        <div className="text-xs text-slate-500 mb-1">Bill To:</div>
        <div className="font-medium text-slate-900">Digital Agency Pro</div>
        <div className="text-xs text-slate-600">Contact: Sarah Martinez</div>
      </motion.div>

      {/* Invoice Items */}
      <div className="space-y-3 mb-6">
        {[
          { service: 'Monthly Business Management', amount: '$9.99' },
          { service: 'Premium Client Support', amount: '$15.00' },
          { service: 'Custom Contract Templates', amount: '$75.00' }
        ].map((item, index) => (
          <motion.div
            key={index}
            className="flex justify-between items-center py-2 border-b border-slate-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <div className="text-sm text-slate-700">{item.service}</div>
            <span className="font-medium text-slate-900">{item.amount}</span>
          </motion.div>
        ))}
      </div>

      {/* Total */}
      <motion.div className="flex justify-between items-center pt-4 border-t-2 border-slate-200">
        <span className="text-lg font-bold text-slate-900">Total</span>
        <motion.span 
          className="text-xl font-bold text-emerald-600"
          animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
        >
          $108.24
        </motion.span>
      </motion.div>

      {/* Payment Status */}
      <motion.div className="mt-4 flex items-center space-x-2">
        <motion.div
          className="w-2 h-2 bg-emerald-500 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-xs text-slate-600">Paid via Stripe • Jan 15, 2024</span>
      </motion.div>
    </motion.div>
  );
};

export default function Invoices() {
  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          
          {/* Left: Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <motion.div 
              className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 mb-6 border border-blue-200"
            >
              <FileText className="mr-2 w-4 h-4" />
              Smart Invoicing
            </motion.div>
            
            <motion.h2 className="text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl mb-6">
              Get paid faster with{' '}
              <span className="text-emerald-600">intelligent invoicing</span>
            </motion.h2>
            
            <motion.p className="text-lg text-slate-600 leading-relaxed mb-8">
              Create stunning, professional invoices quickly with smart templates. 
              Integrated with client management and expense tracking.
            </motion.p>

            {/* Features */}
            <motion.div className="space-y-3 mb-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 4 }}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white transition-all"
                  >
                    <div className="flex-shrink-0 p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{feature.text}</div>
                      <div className="text-sm text-slate-500">{feature.description}</div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
            
            <motion.button
              onClick={() => window.location.href = '/pricing'}
              className="inline-flex items-center rounded-xl bg-slate-900 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-slate-800 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Start invoicing today
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.button>
          </motion.div>

          {/* Right: Invoice Preview */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <div className="relative">
              <AnimatedInvoice />
              
              {/* Floating indicators */}
              <motion.div 
                className="absolute -top-4 -right-4 bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Paid Instantly</span>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-4 -left-4 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Auto-Generated</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
