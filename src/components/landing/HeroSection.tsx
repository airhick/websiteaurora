import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, BadgeCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import BlurText from "@/components/landing/animations/BlurText";
import { motion } from "motion/react";
import ParticlesBackground from "@/components/landing/ParticlesBackground";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/context/theme-provider";

const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Use local MP4 video
    video.src = "/videos/Create_on_a_1080p_202601060027.mp4";
  }, []);

  return (
    <section className="w-full min-h-screen px-8 md:px-16 pt-32 flex items-start justify-center overflow-hidden relative bg-white dark:bg-[#050505] transition-colors duration-300">
      {/* Background Video Layer */}
      <div className="absolute inset-x-0 top-0 z-[1]" style={{ height: '110vh' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
        {/* Video bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white dark:from-[#050505] to-transparent transition-colors duration-300" />
      </div>

      {/* Color Overlay */}
      <div className="absolute inset-0 w-full h-full z-[2] transition-colors duration-300" style={{
        backgroundColor: resolvedTheme === 'dark' ? '#1a1a1a' : '#D9D9D9',
        mixBlendMode: 'multiply',
        opacity: resolvedTheme === 'dark' ? 0.8 : 0.7
      }} />

      {/* Floating Particles */}
      <div className="absolute inset-x-0 top-0 z-[3] pointer-events-none" style={{ height: '110vh' }}>
        <ParticlesBackground />
      </div>

      {/* Bottom Fade Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-48 z-[5] bg-gradient-to-t from-white dark:from-[#050505] to-transparent pointer-events-none transition-colors duration-300" />
      <div className="w-full max-w-[1280px] flex flex-col items-center gap-20 relative z-[4]">
        <div className="w-full max-w-3xl flex flex-col items-center gap-8">
          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 dark:bg-white/10 rounded-full backdrop-blur-md border border-gray-700/50 dark:border-white/20 transition-colors duration-300">
              <BadgeCheck className="w-4 h-4 text-gray-100 dark:text-white" />
              <span className="text-gray-100 dark:text-white/80 text-sm font-medium">
                Swiss Made Software
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 dark:bg-white/10 rounded-full backdrop-blur-md border border-gray-700/50 dark:border-white/20 transition-colors duration-300">
              <Shield className="w-4 h-4 text-gray-100 dark:text-white" />
              <span className="text-gray-100 dark:text-white/80 text-sm font-medium">
                RGPD Compliant
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 dark:bg-white/10 rounded-full backdrop-blur-md border border-gray-700/50 dark:border-white/20 transition-colors duration-300">
              <CheckCircle className="w-4 h-4 text-gray-100 dark:text-white" />
              <span className="text-gray-100 dark:text-white/80 text-sm font-medium">
                EU AI Act Compliant
              </span>
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-col items-center gap-6 text-center">
            <BlurText
              text="Enterprise AI Solutions Platform"
              delay={100}
              direction="bottom"
              className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-[92px] text-gray-900 dark:text-white font-normal leading-tight tracking-tight transition-colors duration-300"
            />
            <motion.p
              className="text-lg md:text-xl text-gray-800 dark:text-white/90 font-normal leading-relaxed max-w-4xl drop-shadow-lg transition-colors duration-300"
              style={{ textShadow: resolvedTheme === 'dark' ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.1)' }}
              initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
              animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              Implement powerful AI solutions in your enterprise with clear Text-to-Speech and Speech-to-Speech APIs. Build intelligent voice applications with enterprise-grade quality and reliability.
            </motion.p>
          </div>

          {/* Call to action buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center gap-4"
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <Button variant="hero" className="w-full sm:w-auto" onClick={() => window.location.href = "/contact"}>
              Email Us
            </Button>
            <div className="p-[1px] rounded-[10px] bg-gradient-to-r from-orange-500 to-blue-500 w-full sm:w-auto">
              <Button variant="hero-secondary" className="w-full" onClick={() => window.location.href = "/pricing"}>
                Book a Call
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Image */}
        <motion.div
          className="w-full max-w-5xl mt-8"
          initial={{ filter: 'blur(10px)', opacity: 0, y: 30 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <img
            src="/images/dashboardsnippet.png"
            alt="Dashboard preview"
            className="w-full h-auto rounded-2xl shadow-2xl"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

