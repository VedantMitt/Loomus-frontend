import React, { useState, useEffect, useRef } from 'react';

export default function LocationAutocomplete({ 
  value, 
  onChange, 
  onSelect,
  placeholder = "Location name...", 
  className = "",
  inputClassName = "w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-500 text-white"
}: { 
  value: string; 
  onChange: (val: string) => void; 
  onSelect?: (val: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value || !showDropdown) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API}/places/autocomplete?q=${encodeURIComponent(value)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          // Backend returns { suggestions: [...] } or an array depending on implementation
          const results = Array.isArray(data) ? data : (data.suggestions || []);
          setSuggestions(results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400); // debounce
    return () => clearTimeout(timer);
  }, [value, showDropdown]);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <input 
        type="text" 
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        className={inputClassName}
      />
      
      {showDropdown && (suggestions.length > 0 || loading) && (
        <div className="absolute z-[999] top-full left-0 right-0 mt-1 bg-[#141414] border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {loading && suggestions.length === 0 && (
            <div className="p-3 text-xs text-gray-500 italic text-center">Loading...</div>
          )}
          {suggestions.map((s, i) => {
            const displayText = s.description || s.name || s.full_address || JSON.stringify(s);
            return (
              <div 
                key={i}
                onClick={() => {
                  onChange(displayText);
                  if (onSelect) onSelect(displayText);
                  setShowDropdown(false);
                }}
                className="px-3 py-2 text-xs text-gray-300 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0 truncate"
              >
                {displayText}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
