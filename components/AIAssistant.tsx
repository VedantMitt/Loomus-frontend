"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/ai/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({ context: `Path: ${pathname}`, query })
      });
      if (res.ok) {
        const data = await res.json();
        setResponse(data.suggestion);
      } else {
        const err = await res.json();
        setResponse(`Error: ${err.error}`);
      }
    } catch (error) {
      setResponse("Failed to connect to AI server.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-24 right-4 z-[9999] font-['DM_Sans']">
      {!open ? (
        <button 
          onClick={() => setOpen(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30 flex items-center justify-center text-white text-xl hover:scale-110 transition-transform"
        >
          ✨
        </button>
      ) : (
        <div className="bg-[#141414]/90 backdrop-blur-xl border border-white/10 w-72 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-pink-500/20 to-purple-600/20 p-3 flex justify-between items-center border-b border-white/10">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">✨ Loomus AI</h4>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="p-4 min-h-[120px] max-h-[300px] overflow-y-auto text-sm text-gray-300">
            {response ? (
              <p className="whitespace-pre-wrap">{response}</p>
            ) : (
              <p className="text-gray-500 italic text-center mt-6">Ask me for ideas or suggestions for your plan!</p>
            )}
            {loading && <div className="mt-4 flex justify-center"><div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>}
          </div>
          <div className="p-3 border-t border-white/10 bg-black/50 flex gap-2">
            <input 
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="Suggest an activity..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-pink-500 text-white"
            />
            <button 
              onClick={handleAsk}
              disabled={loading || !query.trim()}
              className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 rounded-xl text-sm font-bold disabled:opacity-50"
            >
              Ask
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
