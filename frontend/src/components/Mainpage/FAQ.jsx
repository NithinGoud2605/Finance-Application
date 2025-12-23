import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqData = [
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, bank transfers, and cryptocurrency payments through our secure payment gateway."
  },
  {
    question: "Is my financial data secure?",
    answer: "Yes, we use bank-grade encryption and security measures. Your data is protected with end-to-end encryption and stored on secure servers."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Absolutely! You can cancel your subscription at any time from your account settings. No long-term contracts or cancellation fees."
  },
  {
    question: "Do you offer customer support?",
    answer: "Yes, we provide 24/7 customer support through chat, email, and phone. Our dedicated support team is always ready to help."
  },
  {
    question: "Can I export data for use with other software?",
    answer: "Yes, you can export your invoice and financial data as PDF files and CSV formats for use with other accounting software."
  },
  {
    question: "What pricing plans do you offer?",
    answer: "We offer two main plans: Individual at $2.99/month for freelancers and small businesses, and Business at $9.99/month for growing teams. Both plans include all core features with no hidden fees."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-white relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 mb-6 border border-slate-200"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Support
          </motion.div>

          <motion.h2 
            className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Frequently Asked Questions
          </motion.h2>
          
          <motion.p 
            className="text-lg text-slate-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Everything you need to know about Finorn. Can't find what you're looking for? Contact us.
          </motion.p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqData.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none"
              >
                <h3 className="text-base font-semibold text-slate-900 pr-4">
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4">
                      <p className="text-slate-600">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-slate-600 mb-4">
            Still have questions?
          </p>
          <motion.button 
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/pricing'}
          >
            Contact Support
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
