import React, { useState, useEffect, useRef } from 'react';

export default function LocationAutocomplete({ 
  value, 
  onChange, 
  onSelect,
  placeholder = "Location name...", 
  className = "",
  inputClassName = "wiz-input"
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
    <div style={{ position: "relative" }} className={className} ref={wrapperRef}>
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
        <div style={{
          position: "absolute",
          zIndex: 999,
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "4px",
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          overflow: "hidden",
          maxHeight: "240px",
          overflowY: "auto"
        }}>
          {loading && suggestions.length === 0 && (
            <div style={{ padding: "12px", fontSize: "12px", color: "#888", fontStyle: "italic", textAlign: "center" }}>Loading...</div>
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
                style={{
                  padding: "12px",
                  fontSize: "13px",
                  color: "#ddd",
                  cursor: "pointer",
                  borderBottom: i === suggestions.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
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
