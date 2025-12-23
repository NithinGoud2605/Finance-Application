// src/components/Footer.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TwitterIcon, 
  LinkedinIcon, 
  GithubIcon, 
  MailIcon,
  ArrowUp
} from 'lucide-react';

const footerLinks = {
  Product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Client Management', href: '#features' },
    { name: 'Expense Tracking', href: '#features' }
  ],
  Company: [
    { name: 'About', href: '#about' },
    { name: 'Blog', href: '#blog' },
    { name: 'Careers', href: '#careers' },
    { name: 'Contact', href: '#contact' }
  ],
  Support: [
    { name: 'Help Center', href: '#help' },
    { name: 'Documentation', href: '#docs' },
    { name: 'API Reference', href: '#api' },
    { name: 'Status', href: '#status' }
  ],
  Legal: [
    { name: 'Privacy', href: '#privacy' },
    { name: 'Terms', href: '#terms' },
    { name: 'Cookie Policy', href: '#cookies' },
    { name: 'Licenses', href: '#licenses' }
  ]
};

const socialLinks = [
  { name: 'Twitter', icon: TwitterIcon, href: '#', color: 'hover:text-blue-500' },
  { name: 'LinkedIn', icon: LinkedinIcon, href: '#', color: 'hover:text-blue-600' },
  { name: 'GitHub', icon: GithubIcon, href: '#', color: 'hover:text-slate-900' },
  { name: 'Email', icon: MailIcon, href: '#', color: 'hover:text-emerald-600' },
];

export default function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (href) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        const offsetTop = element.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <footer id="contact" className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand section */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold mb-4 text-slate-900">
                  Finorn
                </h3>
                <p className="text-slate-600 mb-6 max-w-md leading-relaxed">
                  The complete financial management platform for modern businesses. 
                  From invoicing and client management to expense tracking and contracts - 
                  everything in one place.
                </p>
                
                {/* Social links */}
                <div className="flex space-x-3">
                  {socialLinks.map((social) => {
                    const SocialIcon = social.icon;
                    return (
                      <motion.a
                        key={social.name}
                        href={social.href}
                        className={`w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 ${social.color} transition-all duration-300 hover:shadow-md`}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <SocialIcon size={18} />
                      </motion.a>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Links sections */}
            {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <h4 className="font-semibold text-slate-900 mb-4">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <button
                        onClick={() => handleLinkClick(link.href)}
                        className="text-slate-500 hover:text-slate-900 transition-colors duration-200 text-left text-sm"
                      >
                        {link.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Newsletter signup */}
          <motion.div
            className="mt-12 pt-8 border-t border-slate-200"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h4 className="text-xl font-semibold text-slate-900 mb-2">Stay updated</h4>
                <p className="text-slate-600">
                  Get the latest updates, tips, and insights delivered to your inbox.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <motion.button
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Bottom section */}
          <motion.div
            className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-slate-500 text-sm mb-4 md:mb-0">
              © {currentYear} Finorn. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <button 
                onClick={() => handleLinkClick('#privacy')}
                className="text-slate-500 hover:text-slate-900 transition-colors duration-200"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => handleLinkClick('#terms')}
                className="text-slate-500 hover:text-slate-900 transition-colors duration-200"
              >
                Terms of Service
              </button>
              <button 
                onClick={() => handleLinkClick('#cookies')}
                className="text-slate-500 hover:text-slate-900 transition-colors duration-200"
              >
                Cookie Policy
              </button>
            </div>
          </motion.div>
        </div>
      </footer>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-3 rounded-xl shadow-lg hover:bg-slate-800 transition-all duration-300"
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0, rotate: 180 }}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
