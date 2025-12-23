import { useInView } from 'react-intersection-observer';
import { useAnimation } from 'framer-motion';
import { useEffect } from 'react';

export const useScrollAnimation = (threshold = 0.1, delay = 0) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => {
        controls.start('visible');
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [controls, inView, delay]);

  return [ref, controls];
};

export const fadeInUp = {
  hidden: { 
    opacity: 0, 
    y: 50,
    transition: { duration: 0.6, ease: 'easeOut' }
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export const fadeIn = {
  hidden: { 
    opacity: 0,
    transition: { duration: 0.4 }
  },
  visible: { 
    opacity: 1,
    transition: { duration: 0.4 }
  }
};

export const slideInLeft = {
  hidden: { 
    opacity: 0, 
    x: -100,
    transition: { duration: 0.6 }
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export const slideInRight = {
  hidden: { 
    opacity: 0, 
    x: 100,
    transition: { duration: 0.6 }
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const scaleIn = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.4 }
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
}; 