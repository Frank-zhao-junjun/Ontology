import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Box, 
  Github, 
  Mail, 
  MessageSquare,
  ChevronRight
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
  const footerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const elements = contentRef.current?.querySelectorAll('.footer-animate');
      if (elements) {
        gsap.fromTo(
          elements,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'expo.out',
            stagger: 0.1,
            scrollTrigger: {
              trigger: footerRef.current,
              start: 'top 90%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const quickLinks = [
    { label: '首页', href: '#' },
    { label: '架构设计', href: '#architecture' },
    { label: '实施路线', href: '#roadmap' },
    { label: '技术文档', href: '#' },
  ];

  const contactLinks = [
    { icon: Github, label: '项目仓库', href: '#' },
    { icon: Mail, label: '技术团队', href: '#' },
    { icon: MessageSquare, label: '问题反馈', href: '#' },
  ];

  return (
    <footer
      ref={footerRef}
      className="relative w-full bg-[#171717] text-white py-16"
    >
      <div ref={contentRef} className="section-container">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="footer-animate">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#ff6e00] flex items-center justify-center">
                <Box className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Ontology</span>
            </div>
            <p className="text-white/60 mb-2">本体模型+AI驱动系统</p>
            <p className="text-sm text-white/40">
              Ontology-Driven Metamodeling & Hybrid AI Execution Framework
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-animate">
            <h4 className="text-lg font-semibold mb-4">快速链接</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="flex items-center gap-2 text-white/60 hover:text-[#ff6e00] transition-colors duration-300 group"
                  >
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-animate">
            <h4 className="text-lg font-semibold mb-4">联系我们</h4>
            <ul className="space-y-2">
              {contactLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="flex items-center gap-2 text-white/60 hover:text-[#ff6e00] transition-colors duration-300"
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8 footer-animate">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © 2026 Ontology Project. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-white/40 hover:text-white/60 transition-colors">
                隐私政策
              </a>
              <a href="#" className="text-sm text-white/40 hover:text-white/60 transition-colors">
                使用条款
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
