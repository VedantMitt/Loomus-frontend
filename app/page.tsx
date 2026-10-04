// Force refresh Next.js cache
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Apple, Smartphone, Globe, Sparkles, Users, BookHeart, MapPin } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import Image from "next/image";

const checkIsNative = () => {
  if (typeof window === "undefined") return false;
  return (
    Capacitor.isNativePlatform() ||
    Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
    (window as any).Capacitor?.platform === "android" ||
    (window as any).Capacitor?.platform === "ios" ||
    navigator.userAgent.includes("LoomusApp")
  );
};

export default function LandingPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(() => checkIsNative());

  const handleOpenWebApp = () => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/activities");
    } else {
      router.push("/auth/login");
    }
  };

  useEffect(() => {
    if (checkIsNative()) {
      setIsRedirecting(true);
      const token = localStorage.getItem("token");
      if (token) {
        router.replace("/activities");
      } else {
        router.replace("/auth/login");
      }
    }
  }, [router]);

  if (isRedirecting) {
    return <div className="min-h-screen bg-[#0a0a0a]" />;
  }

  return (
    <div className="landing-page-container min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden selection:bg-[#60a5fa] selection:text-white relative">
      {/* Backgrounds */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-70"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(255, 107, 107, 0.15), transparent 45%),
                         radial-gradient(circle at 80% 20%, rgba(77, 150, 255, 0.15), transparent 45%),
                         radial-gradient(circle at 20% 80%, rgba(255, 217, 61, 0.15), transparent 45%),
                         radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.15), transparent 45%)`,
            filter: "blur(80px)",
            animation: "aurora 25s infinite alternate ease-in-out"
          }}
        ></div>
        <div className="absolute inset-0 mix-blend-screen opacity-5"
          style={{
            backgroundImage: "url('/abstract_doodles.jpg')",
            backgroundSize: "900px",
            filter: "invert(1)"
          }}
        ></div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var isCap = window.Capacitor && (typeof window.Capacitor.isNativePlatform === 'function' ? window.Capacitor.isNativePlatform() : window.Capacitor.platform !== 'web');
                var isNative = isCap || navigator.userAgent.indexOf('LoomusApp') !== -1;
                if (isNative) {
                  document.documentElement.classList.add('is-native-app');
                  var token = localStorage.getItem('token');
                  if (token) {
                    window.location.replace('/activities');
                  } else {
                    window.location.replace('/auth/login');
                  }
                }
              } catch(e) {}
            })();
          `,
        }}
      />
      <style>{`
        html.is-native-app body,
        html.is-native-app .landing-page-container {
          display: none !important;
        }
        @keyframes aurora {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(3deg); }
          50% { transform: translateY(-20px) rotate(-1deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) rotate(-4deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
        
        .polaroid-card {
          background: #e9dec5ff; 
          padding: 8px 8px 24px 8px;
          border: 1px solid #f0eee9;
          border-radius: 4px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .glass-panel {
          background: rgba(10, 10, 10, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);
        }
      `}</style>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm border border-white/10">
              <Image 
                src="/logo.png" 
                alt="Loomus Logo" 
                width={40} 
                height={40} 
                className="w-full h-full object-cover scale-[1.35]"
                priority
              />
            </div>
            <span className="font-extrabold text-2xl tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
              <span className="text-[#fcf9f2]">Loom</span><span className="text-[#60a5fa]">us</span>
            </span>
          </div>
          <button 
            onClick={handleOpenWebApp}
            className="text-sm font-bold bg-[#2563eb] text-white hover:bg-[#3b82f6] hover:-translate-y-0.5 transition-all duration-300 px-6 py-3 rounded-full flex items-center gap-2 shadow-[0_4px_12px_rgba(37,99,235,0.3)]"
          >
            <Globe className="w-4 h-4" />
            Open Web App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 md:pt-48 pb-20 md:pb-32 px-6 overflow-hidden z-10">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.05] text-white drop-shadow-2xl">
            Plan the <span className="font-serif italic font-normal text-[#f472b6]">vibe.</span><br />
            Live the <span className="font-serif italic font-normal text-[#60a5fa]">chapter.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-14 max-w-2xl mx-auto leading-relaxed font-medium">
            Plan unforgettable experiences with friends, meet people who match your vibe, and turn every experience into a story.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            {/* Android Download Button */}
            <a 
              href="https://github.com/VedantMitt/Loomus-frontend/releases/latest" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto group relative px-8 py-5 bg-white text-[#111] rounded-full flex items-center justify-center gap-4 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(255,255,255,0.2)] transition-all duration-300"
            >
              <Smartphone className="w-6 h-6 group-hover:text-[#2563eb] transition-colors" />
              <div className="text-left">
                <div className="text-[10px] leading-none text-gray-500 uppercase font-bold tracking-widest mb-1">Download for</div>
                <div className="text-xl leading-none font-extrabold tracking-tight">Android</div>
              </div>
            </a>

            {/* iOS Coming Soon Button */}
            <div 
              className="w-full sm:w-auto relative px-8 py-5 glass-panel text-white rounded-full flex items-center justify-center gap-4 cursor-not-allowed opacity-80 border border-white/10"
            >
              <Apple className="w-6 h-6 text-gray-400" />
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] leading-none text-gray-400 uppercase font-bold tracking-widest">Coming soon</span>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/10 text-white/60 rounded-full">Waitlist</span>
                </div>
                <div className="text-xl leading-none font-bold text-gray-400">App Store</div>
              </div>
            </div>
          </div>
        </div>

        {/* App UI Showcase */}
        <div className="mt-20 md:mt-32 max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 px-4 pb-12">
          <div className="relative w-64 md:w-72 aspect-[9/16] rounded-[2.5rem] overflow-hidden border-[6px] border-[#222] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform -rotate-6 md:-rotate-3 md:-translate-y-4 hover:rotate-0 hover:-translate-y-6 hover:shadow-[0_35px_60px_rgba(0,0,0,0.6)] hover:scale-[1.02] transition-all duration-700 ease-out will-change-transform">
             <Image src="/app_screen_1.jpg" alt="Discover Feed" fill className="object-cover" />
          </div>
          <div className="relative w-64 md:w-72 aspect-[9/16] rounded-[2.5rem] overflow-hidden border-[6px] border-[#222] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform rotate-6 md:rotate-3 md:translate-y-8 hover:rotate-0 hover:translate-y-2 hover:shadow-[0_35px_60px_rgba(0,0,0,0.6)] hover:scale-[1.02] transition-all duration-700 ease-out delay-75 will-change-transform">
             <Image src="/app_screen_2.jpg" alt="Shared Chapters" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* Chapters / Polaroids Section */}
      <section className="py-32 px-6 relative z-20 overflow-hidden glass-panel border-y border-white/5">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 relative z-10">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-white leading-[1.1]">
                Every hangout is a <br/>
                <span className="font-serif italic font-normal text-[#60a5fa]">Chapter.</span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-lg leading-relaxed font-medium">
                No more begging for photos in the group chat. Everyone adds their shots to one shared Chapter. Relive the memories exactly as they happened.
              </p>
              
              <div className="flex items-center gap-4">
                <div className="flex -space-x-4">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" className="w-12 h-12 rounded-full border-4 border-[#111] object-cover" alt="User" />
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" className="w-12 h-12 rounded-full border-4 border-[#111] object-cover" alt="User" />
                  <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" className="w-12 h-12 rounded-full border-4 border-[#111] object-cover" alt="User" />
                </div>
                <div className="text-sm font-bold text-gray-400">
                  Join 10,000+ others sharing memories
                </div>
              </div>
            </div>
            
            {/* Scattered Polaroids */}
            <div className="lg:w-1/2 relative h-[500px] md:h-[700px] w-full flex justify-center items-center mt-12 lg:mt-0">
              
              {/* Polaroid 1 */}
              <div className="absolute z-10 -translate-x-12 md:-translate-x-24 -translate-y-12 animate-float-medium">
                <div className="polaroid-card relative group w-48 md:w-64 transform transition-all duration-500 hover:rotate-0 hover:z-40 hover:scale-110 cursor-pointer">
                  <div className="absolute -right-4 -top-4 bg-[#FFD93D] text-[#1A1A1A] text-xs font-bold px-3 py-1.5 rounded-full transform rotate-12 shadow-md z-20">Epic! 🔥</div>
                  <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 w-20 md:w-24 h-8 bg-white/30 backdrop-blur-md border border-[#1A1A1A]/10 shadow-sm rotate-2"></div>
                  <div className="relative w-full aspect-square bg-[#ddd] mb-3 md:mb-4 overflow-hidden border border-[#eee]">
                    <img src="/polaroid1.jpg" alt="Friends" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="flex justify-between items-center text-[#999] text-[9px] font-bold tracking-widest uppercase mt-2">
                    <span>DELHI, IND</span><span>02:30 PM</span>
                  </div>
                </div>
              </div>

              {/* Polaroid 2 */}
              <div className="absolute z-20 translate-x-12 md:translate-x-24 animate-float-slow" style={{ animationDelay: '1s' }}>
                <div className="polaroid-card relative group w-56 md:w-72 transform transition-all duration-500 hover:rotate-0 hover:z-40 hover:scale-110 cursor-pointer">
                  <div className="absolute -left-6 bottom-16 bg-[#1A1A1A] text-white text-xs font-bold px-3 py-1.5 rounded-full transform -rotate-12 shadow-md z-20">The best day ✨</div>
                  <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-24 md:w-32 h-10 bg-white/20 backdrop-blur-md border border-[#1A1A1A]/10 shadow-sm -rotate-3"></div>
                  <div className="relative w-full aspect-square bg-[#ddd] mb-3 md:mb-4 overflow-hidden border border-[#eee]">
                    <img src="/polaroid2.jpg" alt="Picnic" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="flex justify-between items-center text-[#999] text-[9px] font-bold tracking-widest uppercase mt-2">
                    <span>UTTARAKHAND, IND</span><span>11:45 PM</span>
                  </div>
                </div>
              </div>

              {/* Polaroid 3 */}
              <div className="absolute z-30 translate-y-32 md:translate-y-48 -translate-x-4 md:-translate-x-12 animate-float-fast" style={{ animationDelay: '2s' }}>
                <div className="polaroid-card relative group w-40 md:w-56 transform transition-all duration-500 hover:rotate-0 hover:z-40 hover:scale-110 cursor-pointer">
                  <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-16 md:w-20 h-6 bg-white/40 backdrop-blur-md border border-[#1A1A1A]/10 shadow-sm rotate-1"></div>
                  <div className="relative w-full aspect-square bg-[#ddd] mb-3 md:mb-4 overflow-hidden border border-[#eee]">
                    <img src="/polaroid3.jpg" alt="Concert" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="flex justify-between items-center text-[#999] text-[9px] font-bold tracking-widest uppercase mt-2">
                    <span>PUNE, IND</span><span>08:15 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-white">
              Everything you need.<br/>
              <span className="font-serif italic font-normal text-[#a78bfa]">In one place.</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-xl font-medium">
              Whether it&apos;s dinner with friends, a pickup game, or a hobby meetup, Loomus makes it effortless to plan and connect.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-8 rounded-[2.5rem] glass-panel hover:bg-white/5 hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-8 shadow-sm group-hover:bg-[#FFD93D] transition-colors">
                <Users className="w-8 h-8 text-white group-hover:text-[#111] transition-colors" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight text-white">Plan a Loom</h3>
              <p className="text-base text-gray-400 leading-relaxed font-medium">
                Easily organize activities. Fall short of people? Open your Loom to randoms and make new friends naturally.
              </p>
            </div>

            <div className="p-8 rounded-[2.5rem] glass-panel hover:bg-white/5 hover:-translate-y-2 transition-all duration-300 group delay-75">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-8 shadow-sm group-hover:bg-[#FF6B6B] transition-colors">
                <BookHeart className="w-8 h-8 text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight text-white">Shared Chapters</h3>
              <p className="text-base text-gray-400 leading-relaxed font-medium">
                Turn every hangout into a shared memory. Everyone adds photos and moments to one collaborative Chapter.
              </p>
            </div>

            <div className="p-8 rounded-[2.5rem] glass-panel hover:bg-white/5 hover:-translate-y-2 transition-all duration-300 group delay-150">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-8 shadow-sm group-hover:bg-[#4D96FF] transition-colors">
                <MapPin className="w-8 h-8 text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight text-white">Find Your Vibe</h3>
              <p className="text-base text-gray-400 leading-relaxed font-medium">
                Discover new activities happening right around you. Filter by the exact vibe you&apos;re looking for today.
              </p>
            </div>

            <div className="p-8 rounded-[2.5rem] glass-panel hover:bg-white/5 hover:-translate-y-2 transition-all duration-300 group delay-200">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-8 shadow-sm group-hover:bg-[#a78bfa] transition-colors">
                <Sparkles className="w-8 h-8 text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight text-white">Hobby Meetups</h3>
              <p className="text-base text-gray-400 leading-relaxed font-medium">
                Meet people through shared hobbies. Join groups for climbing, gaming, photography, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 text-center text-white/40 text-sm font-medium z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden opacity-60">
              <Image 
                src="/logo.png" 
                alt="Loomus Logo" 
                width={32} 
                height={32} 
                className="w-full h-full object-cover scale-[1.35] grayscale brightness-150"
              />
            </div>
            <span className="font-extrabold tracking-tighter text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>Loomus.</span>
          </div>
          <p>© {new Date().getFullYear()} Loomus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
