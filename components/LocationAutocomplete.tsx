import React, { useState, useEffect, useRef } from 'react';

export default function LocationAutocomplete({ 
  value, 
  onChange, 
  onSelect,
  placeholder = "Location name...", 
  className = "",
  inputClassName = "wiz-input",
  lat,
  lng
}: { 
  value: string; 
  onChange: (val: string) => void; 
  onSelect?: (val: string, item?: any) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  lat?: number;
  lng?: number;
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
    if (!value || !value.trim() || !showDropdown) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        let coordsLat = lat;
        let coordsLng = lng;
        if (!coordsLat || !coordsLng) {
          try {
            const stored = localStorage.getItem("global_coords");
            if (stored) {
              const parsed = JSON.parse(stored);
              coordsLat = parsed.lat;
              coordsLng = parsed.lng;
            }
          } catch (e) {}
        }

        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        let url = `${API}/places/autocomplete?q=${encodeURIComponent(value.trim())}`;
        if (coordsLat && coordsLng) url += `&lat=${coordsLat}&lon=${coordsLng}`;
        
        let results: any[] = [];
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            results = Array.isArray(data) ? data : (data.suggestions || []);
          }
        } catch (apiErr) {
          console.warn("Backend autocomplete fetch failed, using fallback:", apiErr);
        }

        // Direct client fallback to Photon if backend failed or returned empty
        if (results.length === 0) {
          try {
            let photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(value.trim())}&limit=5`;
            if (coordsLat && coordsLng) photonUrl += `&lat=${coordsLat}&lon=${coordsLng}`;
            const pRes = await fetch(photonUrl);
            if (pRes.ok) {
              const pData = await pRes.json();
              if (pData.features && pData.features.length > 0) {
                results = pData.features.map((f: any) => {
                  const p = f.properties;
                  const coords = f.geometry.coordinates;
                  const nameParts = [p.name, p.district, p.city, p.state, p.country].filter(Boolean);
                  return {
                    name: p.name || p.city || nameParts[0] || value,
                    full_address: nameParts.filter((v, i, a) => a.indexOf(v) === i).join(", "),
                    lat: coords[1],
                    lng: coords[0]
                  };
                });
              }
            }
          } catch (e) {
            console.warn("Photon client fallback error:", e);
          }
        }

        setSuggestions(results);
      } catch (err) {
        console.error("Autocomplete error:", err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [value, showDropdown, lat, lng]);

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
          zIndex: 9999,
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "6px",
          background: "rgba(18, 18, 22, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "16px",
          boxShadow: "0 16px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
          overflow: "hidden",
          maxHeight: "280px",
          overflowY: "auto"
        }}>
          {loading && suggestions.length === 0 && (
            <div style={{ padding: "16px", fontSize: "13px", color: "rgba(255,255,255,0.5)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#f472b6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Searching locations...
            </div>
          )}
          {suggestions.map((s, i) => {
            const title = s.name || s.description || s.full_address || (typeof s === 'string' ? s : "");
            const subtitle = s.full_address && s.full_address !== title ? s.full_address : null;
            return (
              <div 
                key={i}
                onClick={() => {
                  onChange(title);
                  if (onSelect) onSelect(title, s);
                  setShowDropdown(false);
                }}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  borderBottom: i === suggestions.length - 1 ? "none" : "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "background 0.15s ease"
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ color: "#f472b6", display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {title}
                  </div>
                  {subtitle && (
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {subtitle}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
