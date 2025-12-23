import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Globe, ShieldCheck, Zap, ArrowUpRight, Building, Rocket, Award, Clock } from 'lucide-react';

const scaleFeatures = [
  {
    icon: TrendingUp,
    title: 'Grows With You',
    description: 'From individual freelancers to growing businesses, our platform adapts to your needs.',
    color: 'bg-blue-500',
    metric: 'Unlimited',
    label: 'Invoices'
  },
  {
    icon: Users,
    title: 'Team Ready',
    description: 'Add team members, manage client relationships collectively, and control expense approvals.',
    color: 'bg-emerald-500',
    metric: '5+',
    label: 'Team Members'
  },
  {
    icon: Globe,
    title: 'Client & Expense Management',
    description: 'Comprehensive client relationship management and intelligent expense tracking.',
    color: 'bg-violet-500',
    metric: 'Full',
    label: 'Management'
  },
  {
    icon: ShieldCheck,
    title: 'Reliable Platform',
    description: 'Secure, stable platform built for professional business use with all data protected.',
    color: 'bg-slate-700',
    metric: '99%+',
    label: 'Uptime'
  }
];

const growthStages = [
  { stage: 'Individual', users: '1', revenue: '$10K', icon: Rocket, color: 'bg-emerald-500' },
  { stage: 'Small Business', users: '2-5', revenue: '$50K', icon: Building, color: 'bg-blue-500' },
  { stage: 'Growing Business', users: '5+', revenue: '$250K', icon: TrendingUp, color: 'bg-violet-500' },
  { stage: 'Established', users: '5+', revenue: '$1M+', icon: Award, color: 'bg-amber-500' }
];

const InteractiveGrowthDemo = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [teamSize, setTeamSize] = useState(1);
  const [revenue, setRevenue] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage(prev => (prev + 1) % growthStages.length);
      setTeamSize(prev => {
        const target = currentStage === 0 ? 3 : currentStage === 1 ? 15 : currentStage === 2 ? 65 : 120;
        return Math.min(target, prev + Math.floor(Math.random() * 5) + 1);
      });
      setRevenue(prev => {
        const target = currentStage === 0 ? 25 : currentStage === 1 ? 150 : currentStage === 2 ? 1200 : 12000;
        return Math.min(target, prev + Math.floor(Math.random() * 50) + 10);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [currentStage]);

  const currentGrowthStage = growthStages[currentStage];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Growth Simulator</h3>
            <p className="text-sm text-slate-500">Watch your business scale</p>
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

      {/* Current Stage */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className={`p-4 rounded-xl ${currentGrowthStage.color} text-white mb-6`}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <currentGrowthStage.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-1">{currentGrowthStage.stage}</h4>
              <p className="text-white/90 text-sm">
                {currentGrowthStage.users} users • {currentGrowthStage.revenue} revenue
              </p>
            </div>
            <div className="text-2xl font-bold">{currentStage + 1}/4</div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div className="bg-blue-50 rounded-xl p-4 border border-blue-100" whileHover={{ scale: 1.02 }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium mb-1">Team Size</p>
              <p className="text-xl font-bold text-blue-700">{teamSize}</p>
              <p className="text-xs text-emerald-600">+{Math.floor(teamSize * 0.1)} this month</p>
            </div>
            <Users className="w-6 h-6 text-blue-400" />
          </div>
        </motion.div>

        <motion.div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100" whileHover={{ scale: 1.02 }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 font-medium mb-1">Revenue (K)</p>
              <p className="text-xl font-bold text-emerald-700">${revenue}K</p>
              <p className="text-xs text-emerald-600">+{Math.floor(revenue * 0.05)}K MRR</p>
            </div>
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
        </motion.div>

        <motion.div className="bg-slate-50 rounded-xl p-4 border border-slate-200" whileHover={{ scale: 1.02 }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium mb-1">Load Time</p>
              <p className="text-xl font-bold text-slate-700">{(1.2 - currentStage * 0.1).toFixed(1)}s</p>
              <p className="text-xs text-emerald-600">Optimized</p>
            </div>
            <Clock className="w-6 h-6 text-slate-400" />
          </div>
        </motion.div>

        <motion.div className="bg-amber-50 rounded-xl p-4 border border-amber-100" whileHover={{ scale: 1.02 }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 font-medium mb-1">Features Used</p>
              <p className="text-xl font-bold text-amber-700">{Math.min(12, 3 + currentStage * 2)}/12</p>
              <p className="text-xs text-slate-500">All included</p>
            </div>
            <Zap className="w-6 h-6 text-amber-400" />
          </div>
        </motion.div>
      </div>

      {/* Progress */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Growth Journey</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <motion.div 
            className="bg-slate-900 h-2 rounded-full"
            animate={{ width: `${((currentStage + 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Stage indicators */}
      <div className="flex justify-center mt-4 gap-2">
        {growthStages.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all ${
              index === currentStage ? 'bg-slate-900 w-6' : index < currentStage ? 'bg-slate-400 w-1.5' : 'bg-slate-300 w-1.5'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default function Scale() {
  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 mb-6 border border-blue-200"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <TrendingUp className="mr-2 w-4 h-4" />
            Built to Scale
          </motion.div>
          
          <motion.h2 
            className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ready to grow with your{' '}
            <span className="text-emerald-600">business</span>
          </motion.h2>
          
          <motion.p 
            className="text-lg text-slate-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Start as a solo entrepreneur and seamlessly scale to a full team with enterprise-grade features.
          </motion.p>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Demo */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <InteractiveGrowthDemo />
          </motion.div>

          {/* Features */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              {scaleFeatures.map((feature, index) => (
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
                    <div className={`p-3 ${feature.color} rounded-xl text-white`}>
                      <feature.icon className="h-5 w-5" />
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
            <motion.div className="mt-8">
              <motion.button 
                className="inline-flex items-center bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/sign-up'}
              >
                Start Scaling Today
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
