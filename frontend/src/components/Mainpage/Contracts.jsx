// sections/Contracts.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle, Clock, Users, AlertCircle, Shield, FileCheck, Calendar, Play, Pause } from 'lucide-react';

const steps = [
  { id: 1, number: '01', title: 'Create Contract', description: 'Professional templates integrated with client data', icon: FileText, color: 'bg-blue-500' },
  { id: 2, number: '02', title: 'Client Integration', description: 'Auto-populate client details', icon: Users, color: 'bg-emerald-500' },
  { id: 3, number: '03', title: 'Digital Signatures', description: 'Secure e-signatures', icon: Shield, color: 'bg-amber-500' },
  { id: 4, number: '04', title: 'Track & Manage', description: 'Monitor status and renewals', icon: CheckCircle, color: 'bg-violet-500' }
];

const contractStats = [
  { label: 'Active Contracts', value: 28, icon: FileText, color: 'text-blue-600' },
  { label: 'Awaiting Signatures', value: 5, icon: Clock, color: 'text-amber-600' },
  { label: 'Signed This Month', value: 12, icon: CheckCircle, color: 'text-emerald-600' },
  { label: 'Renewal Alerts', value: 3, icon: AlertCircle, color: 'text-violet-600' }
];

const InteractiveContractFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [stats, setStats] = useState(contractStats);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % steps.length);
        setStats(prev => prev.map(stat => ({
          ...stat,
          value: stat.value + Math.floor(Math.random() * 2)
        })));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentStepData = steps[currentStep];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
      {/* Play/Pause control */}
      <motion.button
        className="absolute top-4 right-4 bg-slate-900 rounded-full p-2 text-white"
        onClick={() => setIsPlaying(!isPlaying)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </motion.button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Contract Management</h3>
            <p className="text-sm text-slate-500">Live workflow</p>
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

      {/* Current Step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`p-4 rounded-xl ${currentStepData.color} text-white mb-6`}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <currentStepData.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Step {currentStepData.number}: {currentStepData.title}</h4>
              <p className="text-white/90 text-sm">{currentStepData.description}</p>
            </div>
            <div className="text-2xl font-bold">{Math.round((currentStep + 1) / steps.length * 100)}%</div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600">Progress</span>
          <span className="text-slate-500">{currentStep + 1} of {steps.length}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <motion.div 
            className="bg-slate-900 h-2 rounded-full"
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            className="bg-slate-50 rounded-xl p-3 border border-slate-200"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Status */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-slate-700">Recent Activity</span>
        </div>
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span>Contract created by Sarah K.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span>Signed by Tech Startup Co</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Awaiting final approval</span>
          </div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex justify-center mt-4 gap-2">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all ${
              index === currentStep ? 'bg-slate-900 w-6' : index < currentStep ? 'bg-slate-400 w-1.5' : 'bg-slate-300 w-1.5'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const contractFeatures = [
  { icon: Shield, title: 'Digital Signatures', description: 'Secure digital signatures with audit trails', metric: 'Secure', label: 'Legal' },
  { icon: FileCheck, title: 'Contract Management', description: 'Organize all contracts in one place', metric: 'Organized', label: 'Contracts' },
  { icon: Calendar, title: 'Status Tracking', description: 'Track contract status and renewals', metric: 'Track', label: 'Progress' },
  { icon: Users, title: 'Team Access', description: 'Share contracts and control permissions', metric: 'Team', label: 'Collaboration' }
];

export default function Contracts() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          
          {/* Demo */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1 relative"
          >
            <InteractiveContractFlow />
          </motion.div>

          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <motion.div className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 mb-6 border border-emerald-200">
              <FileText className="w-4 h-4 mr-2" />
              Smart Contracts
            </motion.div>
            
            <motion.h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-6">
              Streamline your{' '}
              <span className="text-emerald-600">contract workflow</span>
            </motion.h2>
            
            <motion.p className="text-lg text-slate-600 leading-relaxed mb-8">
              From creation to signature to management, handle your contracts efficiently 
              with digital workflows and secure document storage.
            </motion.p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {contractFeatures.map((feature, index) => (
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
                    <div className="p-2 bg-emerald-500 rounded-lg">
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-1">{feature.title}</h4>
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
            
            <motion.button
              onClick={() => window.location.href = '/pricing'}
              className="inline-flex items-center rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Start with Contracts
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
