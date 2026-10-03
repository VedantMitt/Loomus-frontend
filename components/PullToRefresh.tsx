"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const router = useRouter();

  // Use a ref to track progress inside the effect without triggering re-runs
  const progressRef = useRef(0);

  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    const threshold = 80;
    let isPulling = false;

    const getScrollTop = () => window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

    const startDrag = (y: number) => {
      if (getScrollTop() > 5) return;
      startY = y;
      currentY = startY;
      isPulling = true;
    };

    const moveDrag = (y: number, e: Event) => {
      if (!isPulling) return;
      if (getScrollTop() > 5) {
        isPulling = false;
        progressRef.current = 0;
        setPullProgress(0);
        return;
      }

      currentY = y;
      const dy = currentY - startY;

      if (dy > 0) {
        if (e.cancelable) e.preventDefault();

        // Rubber-band resistance
        const resistance = dy < threshold ? dy : threshold + (dy - threshold) * 0.4;
        const newProgress = resistance / threshold;

        if (progressRef.current < 1 && newProgress >= 1) {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(15);
          }
        }

        progressRef.current = newProgress;
        setPullProgress(newProgress);
      } else {
        progressRef.current = 0;
        setPullProgress(0);
      }
    };

    const endDrag = () => {
      if (!isPulling) return;
      isPulling = false;
      const dy = currentY - startY;

      if (dy >= threshold && getScrollTop() <= 5) {
        setRefreshing(true);
        router.refresh();
        window.dispatchEvent(new Event("app_refresh"));

        setTimeout(() => {
          setRefreshing(false);
          progressRef.current = 0;
          setPullProgress(0);
        }, 1200);
      } else {
        progressRef.current = 0;
        setPullProgress(0);
      }
      currentY = 0;
    };

    const onTouchStart = (e: TouchEvent) => startDrag(e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => moveDrag(e.touches[0].clientY, e);
    const onTouchEnd = () => endDrag();

    const onMouseDown = (e: MouseEvent) => startDrag(e.clientY);
    const onMouseMove = (e: MouseEvent) => {
      if (e.buttons === 1) moveDrag(e.clientY, e);
    };
    const onMouseUp = () => endDrag();

    const container = document;

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: true });

    container.addEventListener("mousedown", onMouseDown, { passive: true });
    container.addEventListener("mousemove", onMouseMove, { passive: false });
    container.addEventListener("mouseup", onMouseUp, { passive: true });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("mousedown", onMouseDown);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseup", onMouseUp);
    };
  }, [router]); // REMOVED pullProgress to fix the effect reset bug!

  const limitedProgress = Math.min(pullProgress, 1);
  // Max body pull down capped at 80px, refreshing rests at 80px
  const bodyY = refreshing ? 80 : limitedProgress * 80;

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: `${bodyY}px`,
          zIndex: 900,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
          opacity: pullProgress > 0.05 || refreshing ? 1 : 0,
          transition: refreshing || pullProgress === 0 ? "height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.3s" : "none",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "rgba(255,255,255,0.7)", // Minimal semi-transparent white
            transform: `scale(${Math.min(pullProgress * 2.5, 1)}) ${refreshing ? "rotate(0deg)" : `rotate(${pullProgress * 360}deg)`}`,
            animation: refreshing ? "ptr-spin 0.8s linear infinite" : "none",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          <style>{`
            @keyframes ptr-spin { 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>

      <div
        style={{
          paddingTop: `${bodyY}px`,
          transition: refreshing || pullProgress === 0 ? "padding-top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2)" : "none",
          minHeight: "100vh",
          position: "relative",
          zIndex: 10
        }}
      >
        {children}
      </div>
    </div>
  );
}
