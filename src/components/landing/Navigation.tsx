import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Box, Menu, X } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Navigation = () => {
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: '架构', id: 'architecture' },
    { label: '元模型', id: 'metamodels' },
    { label: '技术栈', id: 'techstack' },
    { label: '路线图', id: 'roadmap' },
    { label: 'DDD事件', id: 'dddevents' },
  ];

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a 
            href="#" 
            className="flex items-center gap-2 group"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-[#ff6e00] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className={`font-bold text-lg transition-colors ${
              isScrolled ? 'text-[#171717]' : 'text-[#171717]'
            }`}>
              Ontology
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`relative text-sm font-medium transition-colors hover:text-[#ff6e00] ${
                  isScrolled ? 'text-[#171717]' : 'text-[#171717]'
                }`}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ff6e00] transition-all duration-300 hover:w-full"/>
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <button 
              onClick={() => router.push('/tool')}
              className="px-5 py-2 bg-[#ff6e00] text-white text-sm font-medium rounded-lg hover:bg-[#e56200] transition-colors"
            >
              开始探索
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={`w-6 h-6 ${isScrolled ? 'text-[#171717]' : 'text-[#171717]'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${isScrolled ? 'text-[#171717]' : 'text-[#171717]'}`} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white rounded-xl shadow-lg mt-2 p-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="px-4 py-3 text-left text-[#171717] hover:bg-[#f6f6f6] rounded-lg transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <button 
                onClick={() => router.push('/tool')}
                className="mt-2 px-4 py-3 bg-[#ff6e00] text-white rounded-lg font-medium"
              >
                开始探索
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
