"use client";

import { useState, useEffect } from "react";

interface SearchableSelectorProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  icon?: string;
  typeIcon?: string;
  className?: string;
}

export default function SearchableSelector({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select Option", 
  icon = "📍", 
  typeIcon = "📍",
  className = "" 
}: SearchableSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState("");

  const filteredOptions = options.filter(o => 
    o.toLowerCase().includes(filter.toLowerCase())
  );

  // Click outside to close
  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = () => setShowDropdown(false);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [showDropdown]);

  return (
    <div className={`ss-wrap ${className}`} onClick={(e) => e.stopPropagation()}>
      <button 
        type="button"
        className={`ss-trigger ${showDropdown ? "active" : ""}`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', opacity: 0.7 }}>{icon}</span>
          <span style={{ fontWeight: value ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
            {value || placeholder}
          </span>
          {value && (
            <div className="ss-clear" onClick={(e) => { e.stopPropagation(); onChange(""); }}>✕</div>
          )}
        </div>
        <svg className="ss-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {showDropdown && (
        <div className="ss-panel" onClick={e => e.stopPropagation()}>
          <div className="ss-search-box">
            <input 
              className="ss-search-input"
              placeholder="Search..."
              autoFocus
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <div className="ss-list">
            <button 
              type="button"
              className={`ss-option ${!value ? "selected" : ""}`}
              onClick={() => { onChange(""); setShowDropdown(false); }}
            >
              <span className="ss-opt-icon">🌍</span> {placeholder}
            </button>
            {filteredOptions.map(opt => (
              <button 
                key={opt}
                type="button"
                className={`ss-option ${value === opt ? "selected" : ""}`}
                onClick={() => { onChange(opt); setShowDropdown(false); setFilter(""); }}
              >
                <span className="ss-opt-icon">{typeIcon}</span> {opt}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div style={{ padding: "30px 20px", textAlign: "center", color: "#444", fontSize: "13px" }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                No matches found
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .ss-wrap {
          position: relative;
          width: 100%;
          font-family: 'DM Sans', sans-serif;
        }
        .ss-trigger {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 12px 16px;
          color: #eee;
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }
        .ss-trigger:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }
        .ss-trigger.active {
          border-color: #f472b6;
          box-shadow: 0 0 20px rgba(244, 114, 182, 0.15);
          background: rgba(255,255,255,0.07);
        }

        .ss-panel {
          position: absolute;
          top: calc(100% + 8px);
          left: 0; right: 0;
          background: #121216;
          backdrop-filter: blur(40px);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 20px;
          box-shadow: 0 40px 80px -12px rgba(0,0,0,0.8);
          z-index: 9999;
          overflow: hidden;
          animation: ssReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes ssReveal {
          from { opacity: 0; transform: translateY(-12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .ss-search-box {
          padding: 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.01);
          position: relative;
        }
        .ss-search-box::before {
          content: '🔍';
          position: absolute;
          left: 24px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          opacity: 0.4;
        }
        .ss-search-input {
          width: 100%;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 10px 12px 10px 34px;
          color: #fff;
          font-size: 13px;
          outline: none;
          transition: all 0.2s;
        }
        .ss-search-input:focus { border-color: rgba(244, 114, 182, 0.5); }

        .ss-list {
          max-height: 260px;
          overflow-y: auto;
          padding: 6px;
        }
        .ss-list::-webkit-scrollbar { width: 5px; }
        .ss-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        .ss-option {
          width: 100%;
          padding: 11px 14px;
          text-align: left;
          background: transparent;
          border: none;
          color: #999;
          font-size: 13px;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ss-option:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
          transform: translateX(4px);
        }
        .ss-option.selected {
          color: #f472b6;
          background: rgba(244, 114, 182, 0.1);
          font-weight: 600;
        }
        .ss-opt-icon { opacity: 0.4; font-size: 14px; }

        .ss-chevron {
          width: 14px; height: 14px;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          opacity: 0.5;
        }
        .active .ss-chevron { transform: rotate(180deg); }

        .ss-clear {
          background: rgba(255,255,255,0.1);
          border: none;
          color: #fff;
          width: 18px; height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s;
          margin-left: 8px;
        }
        .ss-clear:hover { background: #f472b6; }
      `}</style>
    </div>
  );
}
