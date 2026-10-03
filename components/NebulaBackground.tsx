"use client";

import { useEffect, useState } from "react";

type NebulaBackgroundProps = {
  variant?: 'discover' | 'play' | 'rooms' | 'default';
  orb1?: string;
  orb2?: string;
  orb3?: string;
  orb4?: string;
  opacity?: number;
};

const variants = {
  discover: {
    orb1: "#6366f1", // Indigo
    orb2: "#a855f7", // Purple
    orb3: "#ec4899", // Pink
    orb4: "#14b8a6", // Teal
  },
  play: {
    orb1: "#10b981", // Emerald
    orb2: "#3b82f6", // Blue
    orb3: "#facc15", // Yellow
    orb4: "#ef4444", // Red
  },
  rooms: {
    orb1: "#0ea5e9", // Sky
    orb2: "#c084fc", // Purple
    orb3: "#14b8a6", // Teal
    orb4: "#6366f1", // Indigo
  },
  default: {
    orb1: "#6366f1",
    orb2: "#a855f7",
    orb3: "transparent",
    orb4: "transparent",
  }
};

export default function NebulaBackground({ variant = 'default', orb1, orb2, orb3, orb4, opacity = 0.18 }: NebulaBackgroundProps) {
  const config = variant ? variants[variant] : { orb1, orb2, orb3, orb4 };
  
  return (
    <>
      <div className="nebula-bg">
        <div className="aura aura-1" style={{ background: `radial-gradient(circle, ${orb1 || config.orb1} 0%, transparent 75%)` }} />
        <div className="aura aura-2" style={{ background: `radial-gradient(circle, ${orb2 || config.orb2} 0%, transparent 75%)` }} />
        <div className="aura aura-3" style={{ background: `radial-gradient(circle, ${orb3 || config.orb3} 0%, transparent 75%)` }} />
        <div className="aura aura-4" style={{ background: `radial-gradient(circle, ${orb4 || config.orb4} 0%, transparent 75%)` }} />
      </div>

      <style jsx global>{`
        .nebula-bg {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: #000;
          z-index: -1;
          overflow: hidden;
          pointer-events: none;
        }
        .aura {
          position: absolute;
          width: 55vw;
          height: 55vw;
          border-radius: 50%;
          filter: blur(140px);
          opacity: ${opacity};
          pointer-events: none;
          transition: background 1s ease;
        }
        .aura-1 {
          top: -15%; right: -10%;
          animation: drift1 28s infinite alternate ease-in-out;
        }
        .aura-2 {
          bottom: 5%; left: -10%;
          animation: drift2 35s infinite alternate-reverse ease-in-out;
        }
        .aura-3 {
          top: 35%; left: 35%;
          width: 45vw; height: 45vw;
          animation: drift3 25s infinite alternate ease-in-out;
        }
        .aura-4 {
          bottom: 15%; right: 15%;
          width: 50vw; height: 50vw;
          animation: drift4 32s infinite alternate-reverse ease-in-out;
        }

        @keyframes drift1 { from { transform: translate(0,0) scale(1.1); } to { transform: translate(-8%, 12%) scale(1.2); } }
        @keyframes drift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(12%, -8%) scale(1.15); } }
        @keyframes drift3 { from { transform: translate(0,0) scale(1.2); } to { transform: translate(-5%, -12%) scale(1.3); } }
        @keyframes drift4 { from { transform: translate(0,0) scale(1.1); } to { transform: translate(10%, 8%) scale(1.2); } }
      `}</style>
    </>
  );
}
