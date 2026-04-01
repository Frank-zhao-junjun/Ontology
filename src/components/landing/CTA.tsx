import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Rocket, MessageCircle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const CTA = () => {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const cta1Ref = useRef<HTMLButtonElement>(null);
  const cta2Ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.7,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Description animation
      gsap.fromTo(
        descRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'smooth',
          scrollTrigger: {
            trigger: descRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // CTA buttons animation
      gsap.fromTo(
        cta1Ref.current,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)',
          scrollTrigger: {
            trigger: cta1Ref.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        cta2Ref.current,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)',
          scrollTrigger: {
            trigger: cta2Ref.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 bg-[#f6f6f6] overflow-hidden"
    >
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full border-2 border-[#ff6e00]/10 animate-float"/>
        <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full border-2 border-[#171717]/10 animate-float" style={{ animationDelay: '1s' }}/>
        <div className="absolute top-1/2 left-20 w-4 h-4 rounded-full bg-[#ff6e00]/20 animate-float" style={{ animationDelay: '0.5s' }}/>
        <div className="absolute top-20 right-32 w-6 h-6 rounded-full bg-[#171717]/10 animate-float" style={{ animationDelay: '1.5s' }}/>
      </div>

      <div className="section-container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Title */}
          <h2
            ref={titleRef}
            className="heading-2 text-[#171717] mb-6"
          >
            准备好开始了吗？
          </h2>

          {/* Description */}
          <p
            ref={descRef}
            className="body-text text-[#171717]/70 mb-10"
          >
            从建模工具到运行时框架，体验
            <span className="text-[#ff6e00] font-medium">&quot;本体抽象→模型共识→AI生成底座+AI动态运行&quot;</span>
            的完整闭环。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              ref={cta1Ref}
              onClick={() => router.push('/tool')}
              className="btn-primary inline-flex items-center gap-2 animate-cta-pulse"
            >
              <Rocket className="w-5 h-5" />
              开始探索
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              ref={cta2Ref}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              联系技术团队
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
