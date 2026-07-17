"use client";

import { useRouter } from "next/navigation";
import { Apple, Smartphone, Globe, Sparkles, Users, BookHeart, MapPin } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const handleOpenWebApp = () => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/activities");
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-pink-500/30 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(236,72,153,0.5)]">
              L
            </div>
            <span className="font-bold text-xl tracking-tight">Loomus</span>
          </div>
          <button 
            onClick={handleOpenWebApp}
            className="text-sm font-semibold bg-white/10 hover:bg-white/20 transition-colors px-5 py-2.5 rounded-full flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            Open Web App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-600/15 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-pink-400 mb-8 shadow-xl">
            <Sparkles className="w-4 h-4" />
            <span>The new way to experience life offline</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Plan the <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Vibe.</span><br />
            Live the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">Chapter.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Loomus helps you plan activities ("Looms") with friends, turn live memories into scrapbooks ("Chapters"), and meet random people who match your vibe. Stop scrolling, start living.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto group relative px-8 py-4 bg-white text-black font-semibold rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              <Apple className="w-7 h-7" />
              <div className="text-left">
                <div className="text-[10px] leading-none text-gray-600 uppercase font-bold tracking-wider mb-0.5">Download on the</div>
                <div className="text-lg leading-tight font-bold">App Store</div>
              </div>
            </button>
            
            <button className="w-full sm:w-auto group relative px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 hover:scale-105 transition-all duration-300">
              <Smartphone className="w-7 h-7" />
              <div className="text-left">
                <div className="text-[10px] leading-none text-gray-400 uppercase font-bold tracking-wider mb-0.5">GET IT ON</div>
                <div className="text-lg leading-tight font-bold">Google Play</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 relative z-10 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to touch grass</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">From intimate hangouts to massive hobby meetups, Loomus brings people together in the real world.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-pink-500/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="w-14 h-14 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Plan a Loom</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Easily organize activities with your friends. Fall short of people? Open your Loom to randoms and make new friends.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-purple-500/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <BookHeart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Shared Chapters</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Live through the moment and add live memories to a shared scrapbook. Post and share these Chapters with everyone.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-blue-500/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <MapPin className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Find Your Vibe</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Discover new activities happening right around you. Filter by the exact vibe you're looking for today.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-orange-500/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Hobby Meetups</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Go on hobby-based meetups with strangers who share your interests. The easiest way to expand your circle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 text-center text-gray-500 text-sm bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
              L
            </div>
            <span className="font-bold text-gray-300">Loomus</span>
          </div>
          <p>© {new Date().getFullYear()} Loomus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
