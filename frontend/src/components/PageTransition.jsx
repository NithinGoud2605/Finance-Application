import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeInOut",
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  out: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
      when: "afterChildren",
    }
  }
};

/**
 * PageTransition - A wrapper component that adds transition animations to pages
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child elements to animate
 * @param {Object} props.customVariants - Optional custom animation variants
 * @param {string} props.transitionKey - Unique key for the animation (usually the route path)
 * 
 * @returns {JSX.Element} Animated page wrapper
 */
const PageTransition = ({ 
  children, 
  customVariants = pageVariants,
  transitionKey = "page"
}) => {
  return (
    <motion.div
      key={transitionKey}
      initial="initial"
      animate="in"
      exit="out"
      variants={customVariants}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition; 