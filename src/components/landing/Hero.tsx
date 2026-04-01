import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, Code2, Cpu } from 'lucide-react';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef1 = useRef<HTMLSpanElement>(null);
  const titleRef2 = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef1 = useRef<HTMLButtonElement>(null);
  const ctaRef2 = useRef<HTMLButtonElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline for entrance animations
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      // Title 1 animation
      tl.fromTo(
        titleRef1.current,
        { clipPath: 'inset(0 100% 0 0)', x: 30, opacity: 0 },
        { clipPath: 'inset(0 0% 0 0)', x: 0, opacity: 1, duration: 0.8 },
        0.3
      );

      // Title 2 animation
      tl.fromTo(
        titleRef2.current,
        { clipPath: 'inset(0 100% 0 0)', x: 30, opacity: 0 },
        { clipPath: 'inset(0 0% 0 0)', x: 0, opacity: 1, duration: 0.8 },
        0.45
      );

      // Subtitle animation
      tl.fromTo(
        subtitleRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        0.6
      );

      // Description animation
      tl.fromTo(
        descRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        0.7
      );

      // CTA buttons animation
      tl.fromTo(
        ctaRef1.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' },
        0.9
      );

      tl.fromTo(
        ctaRef2.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' },
        1.0
      );

      // Decorative elements animation
      const decorElements = decorRef.current?.children;
      if (decorElements) {
        tl.fromTo(
          decorElements,
          { y: 100, opacity: 0, rotate: -15 },
          { y: 0, opacity: 1, rotate: 0, duration: 0.7, stagger: 0.1 },
          0.5
        );
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ perspective: '1200px' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="20" fill="none" stroke="#171717" strokeWidth="1"/>
              <circle cx="30" cy="30" r="10" fill="none" stroke="#171717" strokeWidth="1"/>
              <path d="M30 10 L30 20 M30 40 L30 50 M10 30 L20 30 M40 30 L50 30" stroke="#171717" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-pattern)"/>
        </svg>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-[#fff8f3]"/>

      {/* Decorative Floating Elements */}
      <div ref={decorRef} className="absolute inset-0 pointer-events-none">
        {/* Large Circle */}
        <div 
          className="absolute top-[15%] right-[10%] w-32 h-32 rounded-full border-2 border-[#ff6e00]/20 animate-float"
          style={{ animationDelay: '0s' }}
        />
        {/* Small Circle */}
        <div 
          className="absolute top-[25%] right-[20%] w-16 h-16 rounded-full bg-[#ff6e00]/10 animate-float"
          style={{ animationDelay: '1s' }}
        />
        {/* Ring */}
        <div 
          className="absolute bottom-[20%] left-[8%] w-24 h-24 rounded-full border-4 border-[#171717]/10 animate-float"
          style={{ animationDelay: '2s' }}
        />
        {/* Plus Shape */}
        <div 
          className="absolute top-[60%] right-[15%] animate-float"
          style={{ animationDelay: '1.5s' }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 5V35M5 20H35" stroke="#ff6e00" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
        {/* Small Dot */}
        <div 
          className="absolute top-[35%] left-[15%] w-4 h-4 rounded-full bg-[#ff6e00] animate-float"
          style={{ animationDelay: '0.5s' }}
        />
        {/* Cross */}
        <div 
          className="absolute bottom-[30%] right-[25%] animate-float"
          style={{ animationDelay: '2.5s' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2V22M2 12H22" stroke="#171717" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 section-container py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6e00]/10 rounded-full mb-8">
            <Cpu className="w-4 h-4 text-[#ff6e00]" />
            <span className="text-sm font-medium text-[#ff6e00]">AI-Driven System</span>
          </div>

          {/* Main Title */}
          <h1 className="heading-1 text-[#171717] mb-4">
            <span ref={titleRef1} className="block">本体模型</span>
            <span ref={titleRef2} className="block gradient-text">+ AI驱动系统</span>
          </h1>

          {/* Subtitle */}
          <p ref={subtitleRef} className="text-lg text-[#b7b7b7] mb-6 font-medium">
            Ontology-Driven Metamodeling &amp; Hybrid AI Execution Framework
          </p>

          {/* Description */}
          <p ref={descRef} className="body-text text-[#171717]/70 max-w-2xl mx-auto mb-10">
            涵盖从建模工具到运行时框架的完整演进路径。实施完成后，系统将具备
            <span className="text-[#ff6e00] font-medium">&quot;本体抽象→模型共识→AI生成底座+AI动态运行&quot;</span>
            的完整闭环能力。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              ref={ctaRef1}
              onClick={() => scrollToSection('architecture')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Code2 className="w-5 h-5" />
              查看架构详情
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              ref={ctaRef2}
              onClick={() => scrollToSection('roadmap')}
              className="btn-secondary"
            >
              了解实施路线
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"/>
    </section>
  );
};

export default Hero;
