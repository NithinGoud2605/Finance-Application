import React from 'react';
import { DarkModeProvider } from './contexts/DarkModeContext';
import NavBar from './components/Mainpage/Navbar';
import Hero from './components/Mainpage/Hero';
import AllInOne from './components/Mainpage/AllInOne';
import Invoices from './components/Mainpage/Invoices';
import IntelligentAnalytics from './components/Mainpage/IntelligentAnalytics';
import Contracts from './components/Mainpage/Contracts';
import Scale from './components/Mainpage/Scale';
import Pricing from './components/Mainpage/Pricing';
import FAQ from './components/Mainpage/FAQ';
import CallToAction from './components/Mainpage/CallToAction';
import Footer from './components/Mainpage/Footer';

function LandingApp() {
  return (
    <DarkModeProvider>
      <div className="min-h-screen bg-white text-gray-900 transition-colors duration-300">
        <NavBar />
        <main className="text-gray-900 relative">
          {/* Background flow overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Flowing gradient backgrounds */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-purple-50/30 to-pink-50/30"></div>
            <div className="absolute top-1/4 inset-x-0 h-96 bg-gradient-to-b from-transparent via-cyan-50/20 to-transparent"></div>
            <div className="absolute top-1/2 inset-x-0 h-96 bg-gradient-to-b from-transparent via-green-50/20 to-transparent"></div>
            <div className="absolute top-3/4 inset-x-0 h-96 bg-gradient-to-b from-transparent via-yellow-50/20 to-transparent"></div>
          </div>
          
          <div className="relative z-10">
            <Hero />
            <AllInOne />
            <Invoices />
            <IntelligentAnalytics />
            <Contracts />
            <Scale />
            <Pricing />
            <FAQ />
            <CallToAction />
          </div>
        </main>
        <Footer />
      </div>
    </DarkModeProvider>
  );
}

export default LandingApp; 