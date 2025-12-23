import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

// Animation variants for page transitions
const pageVariants = {
  initial: {
    opacity: 0,
    y: 15,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -15,
  },
};

// Transition settings for smooth animations
const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

const PageTransition = ({ children }) => {
  const { pathname } = useLocation();
  
  return (
    <motion.div
      key={pathname}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
};

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageTransition; 