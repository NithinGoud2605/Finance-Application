import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, User, ThumbsUp, Heart, MessageCircle, ArrowLeft, ArrowRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Alex Chen",
    role: "Freelance Consultant",
    company: "Independent",
    rating: 5,
    testimonial: "As a freelancer, Finorn makes client management and invoicing so much easier. The client profiles help me track all my relationships in one place.",
    avatar: "AC",
    color: "bg-blue-500",
    highlight: "Perfect for freelancers",
    timeUsing: "3 months"
  },
  {
    id: 2,
    name: "Maria Rodriguez",
    role: "Small Business Owner",
    company: "Local Studio",
    rating: 5,
    testimonial: "The expense tracking feature has transformed how we manage our business finances. Combined with client management, it's everything we need.",
    avatar: "MR",
    color: "bg-emerald-500",
    highlight: "Great for small businesses",
    timeUsing: "6 months"
  },
  {
    id: 3,
    name: "David Thompson",
    role: "Startup Founder",
    company: "Tech Startup",
    rating: 5,
    testimonial: "Finorn has everything we need - client management, expense tracking, contracts, and invoicing. Great for startups that want to look professional.",
    avatar: "DT",
    color: "bg-violet-500",
    highlight: "Startup favorite",
    timeUsing: "8 months"
  },
  {
    id: 4,
    name: "Sarah Kim",
    role: "Creative Director",
    company: "Design Agency",
    rating: 5,
    testimonial: "The comprehensive client management and expense tracking, plus AI insights, has been game-changing for our agency operations.",
    avatar: "SK",
    color: "bg-amber-500",
    highlight: "AI-powered insights",
    timeUsing: "4 months"
  }
];

const satisfactionMetrics = [
  { label: 'Customer Satisfaction', value: 98, icon: Heart, color: 'text-rose-500' },
  { label: 'Would Recommend', value: 96, icon: ThumbsUp, color: 'text-emerald-500' },
  { label: 'Feature Adoption', value: 92, icon: Star, color: 'text-amber-500' },
  { label: 'Support Rating', value: 99, icon: MessageCircle, color: 'text-blue-500' }
];

const InteractiveTestimonialCarousel = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const currentTest = testimonials[currentTestimonial];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-lg">
            <Quote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Customer Feedback</h3>
            <p className="text-sm text-slate-500">Real testimonials</p>
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

      {/* Testimonial Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTestimonial}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`p-4 rounded-xl ${currentTest.color} text-white mb-6`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
              {currentTest.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-bold">{currentTest.name}</h4>
                <div className="flex">
                  {[...Array(currentTest.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-amber-200 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-white/90 text-sm mb-2">"{currentTest.testimonial}"</p>
              <div className="flex justify-between items-center text-xs text-white/80">
                <span>{currentTest.role} • {currentTest.company}</span>
                <span>Using for {currentTest.timeUsing}</span>
              </div>
            </div>
          </div>
          <motion.div 
            className="absolute top-2 right-2 bg-white/20 px-2 py-1 rounded-full text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {currentTest.highlight}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <motion.button
            onClick={() => setCurrentTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length)}
            className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </motion.button>
          <motion.button
            onClick={() => setCurrentTestimonial(prev => (prev + 1) % testimonials.length)}
            className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowRight className="w-4 h-4 text-slate-600" />
          </motion.button>
        </div>
        <motion.button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            isAutoPlaying ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isAutoPlaying ? 'Auto' : 'Manual'}
        </motion.button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {satisfactionMetrics.map((metric) => (
          <motion.div
            key={metric.label}
            className="bg-slate-50 rounded-xl p-3 border border-slate-200"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">{metric.label}</p>
                <p className="text-lg font-bold text-slate-900">{metric.value}%</p>
              </div>
              <metric.icon className={`w-4 h-4 ${metric.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress dots */}
      <div className="flex justify-center mt-4 gap-1">
        {testimonials.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => setCurrentTestimonial(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentTestimonial ? 'bg-slate-900 w-6' : 'bg-slate-300 w-1.5'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default function Testimonials() {
  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            className="inline-flex items-center rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 mb-4 border border-amber-200"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Star className="w-4 h-4 mr-2" />
            Customer Success
          </motion.div>
          
          <motion.h2 
            className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Trusted by{' '}
            <span className="text-amber-600">business leaders</span>
          </motion.h2>
          
          <motion.p 
            className="text-lg text-slate-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            See how our platform helps businesses streamline their financial operations.
          </motion.p>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Carousel */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <InteractiveTestimonialCarousel />
          </motion.div>

          {/* Static testimonials */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              {testimonials.slice(0, 3).map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
                >
                  {/* Rating */}
                  <div className="flex items-center mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                    ))}
                    <span className="ml-2 text-sm text-slate-500">({testimonial.rating}.0)</span>
                  </div>
                  
                  {/* Quote */}
                  <blockquote className="text-slate-700 mb-4 text-sm">
                    "{testimonial.testimonial}"
                  </blockquote>
                  
                  {/* Author */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold text-xs`}>
                      {testimonial.avatar}
                    </div>
                    <div className="ml-3">
                      <div className="font-semibold text-slate-900 text-sm">{testimonial.name}</div>
                      <div className="text-xs text-slate-500">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div className="mt-8">
              <motion.button 
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/sign-up'}
              >
                Start Your Journey
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
