// src/components/Mainpage/Pricing.jsx
import React, { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Typography, List, ListItem, 
  ListItemIcon, ListItemText, CircularProgress, useTheme, alpha, 
  Divider, Paper, Alert, Chip, Container, IconButton, Tooltip, Fab
} from '@mui/material';
import { LogOut, Check, Star, Zap } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { createCheckoutSession } from '../../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

// Custom SVG for check mark
const CheckSvg = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-500" fill="currentColor">
    <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.76L18.88,4.88L21.71,7.71L9,20.42Z"/>
  </svg>
);

const plans = [
  {
    name: 'Individual',
    price: '$2.99',
    period: 'month',
    description: 'Perfect for freelancers and small businesses',
    features: [
      'Up to 10 invoices per month',
      'Client management system',
      'Basic expense tracking',
      'Email support',
      'Basic analytics dashboard',
      'Single user account'
    ],
    cta: 'Get Started',
    popular: false,
    planType: 'individual',
    color: 'slate'
  },
  {
    name: 'Business',
    price: '$9.99',
    period: 'month',
    description: 'Ideal for growing businesses and teams',
    features: [
      'Unlimited invoices & clients',
      'Advanced client management',
      'Full expense management',
      'Contract management system',
      'Priority support',
      'Advanced analytics & reporting',
      'Up to 5 team members',
      'Custom branding & API access'
    ],
    cta: 'Get Started',
    popular: true,
    planType: 'business',
    color: 'emerald'
  }
];

export default function Pricing() {
  const theme = useTheme();
  const { user, refreshUser, logout } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Handle Stripe checkout session completion
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      const checkSubscriptionStatus = async () => {
        try {
          await refreshUser();
        } catch (err) {
          console.error('Error refreshing user data:', err);
        }
      };
      checkSubscriptionStatus();
    }
  }, [searchParams, refreshUser]);

  // Redirect subscribed users to dashboard
  useEffect(() => {
    if (user?.isSubscribed) {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.isSubscribed, navigate]);

  // Handle logout
  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout(false);
      navigate('/sign-in', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/sign-in', { replace: true });
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleUpgrade = async (planType) => {
    if (!user) {
      navigate('/sign-in');
      return;
    }

    if (user.accountType !== planType) {
      setError(`You cannot subscribe to a ${planType} plan with an ${user.accountType} account`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createCheckoutSession({ planType });
    } catch (err) {
      setError(err.error || 'Failed to start checkout process');
      setLoading(false);
    }
  };

  return (
    <section id="pricing" className="py-24 bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      {/* Logout button for logged-in users */}
      {user && (
        <Fab
          color="primary"
          size="small"
          onClick={handleLogout}
          disabled={logoutLoading}
          sx={{
            position: 'fixed',
            top: 80,
            right: 16,
            zIndex: 1000,
            bgcolor: 'white',
            color: 'text.primary',
            boxShadow: 2,
            '&:hover': {
              bgcolor: 'grey.100',
              boxShadow: 4
            }
          }}
        >
          {logoutLoading ? (
            <CircularProgress size={20} />
          ) : (
            <LogOut size={16} />
          )}
        </Fab>
      )}
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 mb-6 border border-emerald-200"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Zap className="w-4 h-4 mr-2" />
            Simple Pricing
          </motion.div>

          <motion.h2
            className="text-4xl font-bold text-slate-900 sm:text-5xl mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Choose the{' '}
            <span className="text-emerald-600">perfect plan</span>
          </motion.h2>

          <motion.p
            className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Start with our free trial. Upgrade anytime as your business grows.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative bg-white rounded-2xl p-8 border-2 transition-all duration-300 ${
                plan.popular 
                  ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + 0.3 }}
              whileHover={{ y: -5 }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-500 mb-6 text-sm">{plan.description}</p>
                <div className="mb-2">
                  <span className="text-5xl font-bold text-slate-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-lg text-slate-500 ml-1">/{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-0.5">
                      <CheckSvg />
                    </div>
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  plan.popular
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUpgrade(plan.planType)}
                disabled={loading}
              >
                {loading ? 'Loading...' : plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-slate-500 text-sm">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </motion.div>

        {error && (
          <Alert severity="error" sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
            {error}
          </Alert>
        )}
      </div>
    </section>
  );
}
