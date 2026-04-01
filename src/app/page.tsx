'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';
import Architecture from '@/components/landing/Architecture';
import DataFlow from '@/components/landing/DataFlow';
import Metamodels from '@/components/landing/Metamodels';
import TechStack from '@/components/landing/TechStack';
import Roadmap from '@/components/landing/Roadmap';
import DDDEvents from '@/components/landing/DDDEvents';
import AIOrchestrator from '@/components/landing/AIOrchestrator';
import AcceptanceCriteria from '@/components/landing/AcceptanceCriteria';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  useEffect(() => {
    // Configure ScrollTrigger defaults
    ScrollTrigger.defaults({
      toggleActions: 'play none none reverse',
    });

    // Refresh ScrollTrigger on load
    ScrollTrigger.refresh();

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-white">
      <Navigation />
      
      <main className="relative">
        <Hero />
        <div id="architecture">
          <Architecture />
        </div>
        <DataFlow />
        <div id="metamodels">
          <Metamodels />
        </div>
        <div id="techstack">
          <TechStack />
        </div>
        <div id="roadmap">
          <Roadmap />
        </div>
        <div id="dddevents">
          <DDDEvents />
        </div>
        <AIOrchestrator />
        <AcceptanceCriteria />
        <CTA />
      </main>
      
      <Footer />
    </div>
  );
}
