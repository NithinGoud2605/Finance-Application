import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const FadeInView = ({ 
  children, 
  delay = 0, 
  duration = 0.3,
  staggerChildren = 0.05,
  staggerDirection = 1,
  distance = 20,
  direction = 'up',
  ...props 
}) => {
  const getDirectionOffset = () => {
    switch (direction) {
      case 'up':
        return { y: distance };
      case 'down':
        return { y: -distance };
      case 'left':
        return { x: distance };
      case 'right':
        return { x: -distance };
      default:
        return { y: distance };
    }
  };

  // Define animation variants for the container
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        staggerDirection,
        delayChildren: delay,
      }
    }
  };

  // Define animation variants for individual items
  const itemVariants = {
    hidden: {
      opacity: 0,
      ...getDirectionOffset()
    },
    visible: {
      opacity: 1,
      ...(direction === 'up' || direction === 'down' ? { y: 0 } : { x: 0 }),
      transition: {
        duration,
        ease: 'easeOut'
      }
    }
  };

  // If a single child is passed (not an array), wrap it in a motion.div
  if (React.Children.count(children) === 1 && !Array.isArray(children)) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={itemVariants}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  // For multiple children, create a staggered animation container
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={containerVariants}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

FadeInView.propTypes = {
  children: PropTypes.node.isRequired,
  delay: PropTypes.number,
  duration: PropTypes.number,
  staggerChildren: PropTypes.number,
  staggerDirection: PropTypes.number,
  distance: PropTypes.number,
  direction: PropTypes.oneOf(['up', 'down', 'left', 'right']),
};

export default FadeInView; 