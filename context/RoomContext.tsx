"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

type Room = {
  id: string;
  name: string;
  type: string;
  host_name: string;
  host_id?: string;
  media_url?: string;
  queue?: any[];
  is_done?: boolean;
  done_count?: number;
  total_approved?: number;
};

type RoomContextType = {
  activeRoom: Room | null;
  joinRoom: (room: Room) => void;
  leaveRoom: () => Promise<void>;
  refreshActiveRoom: () => Promise<void>;
  socket: Socket | null;
  playing: boolean;
  setPlaying: (val: boolean) => void;
  syncTime: number;
  setSyncTime: (val: number) => void;
};

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Global Media Sync State
  const [playing, setPlaying] = useState(false);
  const [syncTime, setSyncTime] = useState(0);
  
  const router = useRouter();

  // Load from localStorage on mount
  useEffect(() => {
    const savedRoom = localStorage.getItem("loomus_active_room");
    if (savedRoom) {
      try {
        setActiveRoom(JSON.parse(savedRoom));
      } catch (e) {
        localStorage.removeItem("loomus_active_room");
      }
    }
    
    // Sync across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "loomus_active_room") {
        if (e.newValue) {
          setActiveRoom(JSON.parse(e.newValue));
        } else {
          setActiveRoom(null);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const refreshActiveRoom = useCallback(async () => {
    if (!activeRoom) return;
    try {
       const token = localStorage.getItem("token");
       const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
       const res = await fetch(`${API}/rooms/${activeRoom.id}`, {
         headers: { Authorization: `Bearer ${token}` }
       });
       if (res.ok) {
         const data = await res.json();
         const updated = { ...activeRoom, ...data };
         setActiveRoom(updated);
         localStorage.setItem("loomus_active_room", JSON.stringify(updated));
       } else if (res.status === 404) {
         setActiveRoom(null);
         localStorage.removeItem("loomus_active_room");
       }
    } catch {}
  }, [activeRoom]);

  const joinRoom = useCallback((room: Room) => {
    setActiveRoom(room);
    localStorage.setItem("loomus_active_room", JSON.stringify(room));
    // Fetch latest room data once socket is ready
    setTimeout(refreshActiveRoom, 500); 
  }, [refreshActiveRoom]);

  const leaveRoom = useCallback(async () => {
    if (!activeRoom) return;

    try {
      const token = localStorage.getItem("token");
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      await fetch(`${API}/rooms/${activeRoom.id}/leave`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Context Leave error:", err);
    }

    if (socket) {
       socket.emit("room_user_leave", { roomId: activeRoom.id, userId: "unknown" });
       socket.disconnect();
       setSocket(null);
    }

    setActiveRoom(null);
    localStorage.removeItem("loomus_active_room");
  }, [activeRoom, socket]);

  // Socket Management
  useEffect(() => {
    if (!activeRoom) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    let payload: any = {};
    try {
      payload = JSON.parse(atob(token.split(".")[1]));
    } catch {}

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    
    // Only connect if not already connected to THIS room
    if (socket && socket.connected && (socket as any).roomId === activeRoom.id) return;

    if (socket) socket.disconnect();

    const newSocket = io(API);
    (newSocket as any).roomId = activeRoom.id;
    setSocket(newSocket);

    newSocket.emit("room_user_join", {
      roomId: activeRoom.id,
      user: { id: payload.id, name: payload.name, username: payload.username, profile_pic: payload.profile_pic }
    });

    newSocket.on("room_update", (updatedRoom) => {
      setActiveRoom(prev => {
        const merged = { ...prev, ...updatedRoom };
        localStorage.setItem("loomus_active_room", JSON.stringify(merged));
        return merged;
      });
    });

    newSocket.on("room_deleted", () => {
      setActiveRoom(null);
      localStorage.removeItem("loomus_active_room");
    });

    // Sync Listeners
    newSocket.on("receive_sync_play", (time: number) => {
      setSyncTime(time);
      setPlaying(true);
    });

    newSocket.on("receive_sync_pause", () => {
      setPlaying(false);
    });

    newSocket.on("receive_sync_seek", (time: number) => {
      setSyncTime(time);
    });

    // Request initial status when joining
    newSocket.emit("request_sync", { roomId: activeRoom.id });

    return () => {
      // We don't disconnect on unmount of the Provider, 
      // but we do if the room changes (handled by dependency array).
    };
  }, [activeRoom?.id, refreshActiveRoom]);

  useEffect(() => {
    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      // Catch and ignore common media playback errors during unmounting/transitions
      if (
        e.reason &&
        (e.reason.name === "AbortError" || e.reason.name === "NotAllowedError") &&
        (e.reason.message?.includes("play()") || 
         e.reason.message?.includes("media was removed") ||
         e.reason.message?.includes("interrupted"))
      ) {
        e.preventDefault(); 
      }
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  return (
    <RoomContext.Provider 
      value={{ 
        activeRoom, 
        joinRoom, 
        leaveRoom, 
        refreshActiveRoom, 
        socket,
        playing,
        setPlaying,
        syncTime,
        setSyncTime
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error("useRoom must be used within a RoomProvider");
  return context;
};
