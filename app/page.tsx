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
    return <div className="min-h-screen bg-[#FDFCF8]" />;
  }

  return (
    <div className="landing-page-container min-h-screen bg-[#FDFCF8] text-[#1A1A1A] font-sans overflow-x-hidden selection:bg-[#FF6B6B] selection:text-white">
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
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
          display: flex;
          width: max-content;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 25s linear infinite;
          display: flex;
          width: max-content;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
      `}</style>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#FDFCF8]/90 backdrop-blur-sm border-b border-[#1A1A1A]/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm border border-black/5">
              <Image 
                src="/logo.png" 
                alt="Loomus Logo" 
                width={40} 
                height={40} 
                className="w-full h-full object-cover scale-[1.35]"
                priority
              />
            </div>
            <span className="font-bold text-2xl tracking-tighter">Loom<span className="text-[#FF6B6B]">us</span>.</span>
          </div>
          <button 
            onClick={handleOpenWebApp}
            className="text-sm font-bold bg-[#1A1A1A] text-white hover:bg-[#FF6B6B] hover:text-white hover:-translate-y-0.5 transition-all duration-300 px-6 py-3 rounded-full flex items-center gap-2 shadow-sm"
          >
            <Globe className="w-4 h-4" />
            Open Web App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 md:pb-32 px-6 overflow-hidden">
        {/* Playful background shapes */}
        <div className="absolute top-20 right-[10%] w-64 h-64 bg-[#FFD93D]/20 rounded-full mix-blend-multiply blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 left-[10%] w-72 h-72 bg-[#4D96FF]/15 rounded-full mix-blend-multiply blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.05] text-[#1A1A1A]">
            Plan the <span className="font-serif italic font-normal text-[#FF6B6B]">vibe.</span><br />
            Live the <span className="font-serif italic font-normal text-[#4D96FF]">chapter.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-14 max-w-2xl mx-auto leading-relaxed font-medium">
            Plan unforgettable experiences with friends, meet people who match your vibe, and turn every experience into a story.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            {/* Android Download Button */}
            <a 
              href="https://github.com/VedantMitt/Loomus-frontend/releases/latest" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto group relative px-8 py-5 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center gap-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            >
              <Smartphone className="w-6 h-6 group-hover:text-[#FFD93D] transition-colors" />
              <div className="text-left">
                <div className="text-[10px] leading-none text-gray-400 uppercase font-bold tracking-widest mb-1">Download for</div>
                <div className="text-xl leading-none font-bold">Android</div>
              </div>
            </a>

            {/* iOS Coming Soon Button */}
            <div 
              className="w-full sm:w-auto relative px-8 py-5 bg-white border-2 border-[#1A1A1A]/10 text-[#1A1A1A] rounded-full flex items-center justify-center gap-4 cursor-not-allowed opacity-80"
            >
              <Apple className="w-6 h-6 text-gray-400" />
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] leading-none text-gray-400 uppercase font-bold tracking-widest">Coming soon</span>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#1A1A1A]/5 text-[#1A1A1A]/60 rounded-full">Waitlist</span>
                </div>
                <div className="text-xl leading-none font-bold text-gray-400">App Store</div>
              </div>
            </div>
          </div>
        </div>

        {/* App UI Showcase */}
        <div className="mt-20 md:mt-32 max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 px-4 pb-12">
          {/* Decorative background element for mockups */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-tr from-[#FF6B6B]/15 via-[#FFD93D]/15 to-[#4D96FF]/15 blur-3xl rounded-full -z-10 pointer-events-none"></div>
          
          <div className="relative w-64 md:w-72 aspect-[9/16] rounded-[2.5rem] overflow-hidden border-[6px] border-white shadow-2xl transform -rotate-6 md:-rotate-3 md:-translate-y-4 hover:rotate-0 hover:-translate-y-6 hover:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-700 ease-out will-change-transform">
             <Image src="/app_screen_1.jpg" alt="Discover Feed" fill className="object-cover" />
          </div>
          
          <div className="relative w-64 md:w-72 aspect-[9/16] rounded-[2.5rem] overflow-hidden border-[6px] border-white shadow-2xl transform rotate-6 md:rotate-3 md:translate-y-8 hover:rotate-0 hover:translate-y-2 hover:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-700 ease-out delay-75 will-change-transform">
             <Image src="/app_screen_2.jpg" alt="Shared Chapters" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* Chapters / Polaroids Section */}
      <section className="py-32 px-6 relative z-20 bg-white overflow-hidden">
        {/* Floating background decorative blobs */}
        <div className="absolute top-20 left-10 w-48 h-48 bg-[#FFD93D]/20 rounded-full blur-3xl animate-float-medium pointer-events-none"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-[#FF6B6B]/15 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-[#4D96FF]/10 rounded-full blur-3xl animate-float-fast pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 relative z-10">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-[#1A1A1A] leading-[1.1]">
                Every hangout is a <br/>
                <span className="font-serif italic font-normal text-[#4D96FF]">Chapter.</span>
              </h2>
              <p className="text-xl text-gray-600 mb-10 max-w-lg leading-relaxed font-medium">
                No more begging for photos in the group chat. Everyone adds their shots to one shared Chapter. Relive the memories exactly as they happened.
              </p>
              
              <div className="flex items-center gap-4">
                <div className="flex -space-x-4">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" className="w-12 h-12 rounded-full border-4 border-white object-cover" alt="User" />
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" className="w-12 h-12 rounded-full border-4 border-white object-cover" alt="User" />
                  <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" className="w-12 h-12 rounded-full border-4 border-white object-cover" alt="User" />
                </div>
                <div className="text-sm font-bold text-gray-500">
                  Join 10,000+ others sharing memories
                </div>
              </div>
            </div>
            
            {/* Scattered Polaroids */}
            <div className="lg:w-1/2 relative h-[500px] md:h-[700px] w-full flex justify-center items-center mt-12 lg:mt-0">
              {/* Decorative grid background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.03)_2px,transparent_2px)] bg-[size:24px_24px]"></div>

              {/* Polaroid 1 */}
              <div className="absolute z-10 -translate-x-12 md:-translate-x-24 -translate-y-12 animate-float-medium">
                <div className="relative group w-48 md:w-64 p-4 pb-12 md:pb-16 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] transform -rotate-12 hover:rotate-0 hover:z-40 hover:scale-110 hover:shadow-[0_40px_80px_rgba(0,0,0,0.25)] transition-all duration-500 ease-out cursor-pointer">
                  {/* Decorative Sticker */}
                  <div className="absolute -right-4 -top-4 bg-[#FFD93D] text-[#1A1A1A] text-xs font-bold px-3 py-1.5 rounded-full transform rotate-12 shadow-md z-20">Epic! 🔥</div>
                  {/* Tape */}
                  <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 w-20 md:w-24 h-8 bg-white/50 backdrop-blur-md border border-[#1A1A1A]/10 shadow-sm rotate-2"></div>
                  <div className="relative w-full aspect-square bg-gray-100 mb-3 md:mb-4 overflow-hidden border border-gray-100">
                    <img src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80" alt="Friends" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <p className="font-serif italic text-lg md:text-xl text-center text-[#1A1A1A] opacity-90">Rooftop Party 🥂</p>
                </div>
              </div>

              {/* Polaroid 2 */}
              <div className="absolute z-20 translate-x-12 md:translate-x-24 animate-float-slow">
                <div className="relative group w-56 md:w-72 p-5 pb-16 md:pb-20 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] transform rotate-6 hover:-rotate-2 hover:z-40 hover:scale-110 hover:shadow-[0_40px_80px_rgba(0,0,0,0.25)] transition-all duration-500 ease-out cursor-pointer">
                  {/* Decorative Sticker */}
                  <div className="absolute -left-6 bottom-16 bg-[#1A1A1A] text-white text-xs font-bold px-3 py-1.5 rounded-full transform -rotate-12 shadow-md z-20">The best day ✨</div>
                  {/* Tape */}
                  <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-24 md:w-32 h-10 bg-white/40 backdrop-blur-md border border-[#1A1A1A]/10 shadow-sm -rotate-3"></div>
                  <div className="relative w-full aspect-square bg-gray-100 mb-3 md:mb-4 overflow-hidden border border-gray-100">
                    <img src="https://images.unsplash.com/photo-1529156069898-49953eb1b5ae?auto=format&fit=crop&w=600&q=80" alt="Picnic" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <p className="font-serif italic text-xl md:text-2xl text-center text-[#1A1A1A] opacity-90">Sunday Picnic 🧺</p>
                </div>
              </div>

              {/* Polaroid 3 */}
              <div className="absolute z-30 translate-y-32 md:translate-y-48 -translate-x-4 md:-translate-x-12 animate-float-fast">
                <div className="relative group w-40 md:w-56 p-3 pb-10 md:pb-12 bg-white shadow-[0_15px_40px_rgba(0,0,0,0.15)] transform -rotate-6 hover:rotate-3 hover:z-40 hover:scale-110 hover:shadow-[0_40px_80px_rgba(0,0,0,0.25)] transition-all duration-500 ease-out cursor-pointer">
                  {/* Tape */}
                  <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-16 md:w-20 h-6 bg-white/60 backdrop-blur-md border border-[#1A1A1A]/10 shadow-sm rotate-1"></div>
                  <div className="relative w-full aspect-square bg-gray-100 mb-3 md:mb-4 overflow-hidden border border-gray-100">
                    <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80" alt="Concert" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <p className="font-serif italic text-base md:text-lg text-center text-[#1A1A1A] opacity-90">Neon Nights 🎸</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 relative z-10 bg-[#F4F3ED]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-[#1A1A1A]">
              Everything you need.<br/>
              <span className="font-serif italic font-normal text-[#6B4E71]">In one place.</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-xl font-medium">
              Whether it&apos;s dinner with friends, a pickup game, or a hobby meetup, Loomus makes it effortless to plan and connect.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-[2.5rem] bg-white border-2 border-[#1A1A1A]/5 hover:border-[#1A1A1A]/20 hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-16 h-16 rounded-full bg-[#FFD93D] flex items-center justify-center mb-8 shadow-sm">
                <Users className="w-8 h-8 text-[#1A1A1A]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Plan a Loom</h3>
              <p className="text-base text-gray-600 leading-relaxed font-medium">
                Easily organize activities. Fall short of people? Open your Loom to randoms and make new friends naturally.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-[2.5rem] bg-white border-2 border-[#1A1A1A]/5 hover:border-[#1A1A1A]/20 hover:-translate-y-2 transition-all duration-300 group delay-75">
              <div className="w-16 h-16 rounded-full bg-[#FF6B6B] flex items-center justify-center mb-8 shadow-sm">
                <BookHeart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Shared Chapters</h3>
              <p className="text-base text-gray-600 leading-relaxed font-medium">
                Turn every hangout into a shared memory. Everyone adds photos and moments to one collaborative Chapter.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-[2.5rem] bg-white border-2 border-[#1A1A1A]/5 hover:border-[#1A1A1A]/20 hover:-translate-y-2 transition-all duration-300 group delay-150">
              <div className="w-16 h-16 rounded-full bg-[#4D96FF] flex items-center justify-center mb-8 shadow-sm">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Find Your Vibe</h3>
              <p className="text-base text-gray-600 leading-relaxed font-medium">
                Discover new activities happening right around you. Filter by the exact vibe you&apos;re looking for today.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-[2.5rem] bg-white border-2 border-[#1A1A1A]/5 hover:border-[#1A1A1A]/20 hover:-translate-y-2 transition-all duration-300 group delay-200">
              <div className="w-16 h-16 rounded-full bg-[#6B4E71] flex items-center justify-center mb-8 shadow-sm">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Hobby Meetups</h3>
              <p className="text-base text-gray-600 leading-relaxed font-medium">
                Meet people through shared hobbies. Join groups for climbing, gaming, photography, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 text-center text-[#1A1A1A]/40 text-sm font-medium">
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
            <span className="font-bold tracking-tighter text-lg">Loomus.</span>
          </div>
          <p>© {new Date().getFullYear()} Loomus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
