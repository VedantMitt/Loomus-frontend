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
      `}</style>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#FDFCF8]/90 backdrop-blur-sm border-b border-[#1A1A1A]/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#1A1A1A] flex items-center justify-center p-2">
              <Image 
                src="/logo.png" 
                alt="Loomus Logo" 
                width={36} 
                height={36} 
                className="w-full h-full object-cover scale-110"
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
      <section className="relative pt-48 pb-32 px-6">
        {/* Playful background shapes */}
        <div className="absolute top-20 right-[10%] w-64 h-64 bg-[#FFD93D]/20 rounded-full mix-blend-multiply blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 left-[10%] w-72 h-72 bg-[#4D96FF]/15 rounded-full mix-blend-multiply blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border-2 border-[#1A1A1A] text-sm font-bold shadow-[4px_4px_0px_rgba(26,26,26,1)] mb-10 transform -rotate-2">
            <Sparkles className="w-4 h-4 text-[#FF6B6B]" />
            <span>Social, beyond the screen</span>
          </div>
          
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
            <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center p-1.5 opacity-40">
              <Image 
                src="/logo.png" 
                alt="Loomus Logo" 
                width={24} 
                height={24} 
                className="w-full h-full object-cover grayscale brightness-200"
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
