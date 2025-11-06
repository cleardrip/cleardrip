'use client';

import React from 'react';
import Footer from '@/components/layout/Footer';
import HowCleardripWorks from '@/components/homepage/how-cleardrip-works';
import FeaturedProducts from '@/components/homepage/featured-products';
import OurServices from '@/components/homepage/our-services';
import HeroSection from '@/components/homepage/hero-section';
import AboutSection from '@/components/homepage/about-section';
import FAQSection from '@/components/homepage/faq-section';
import ContactSection from '@/components/homepage/contact-section';
import SubscriptionsSection from '@/components/core/Subscriptions';

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <HeroSection />
      <FeaturedProducts />
      <HowCleardripWorks />
      <OurServices />
      {/* <PricingSection /> */}
      <SubscriptionsSection />
      <FAQSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
