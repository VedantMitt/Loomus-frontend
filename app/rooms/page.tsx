"use client";

import { useState } from "react";
import Link from "next/link";

export default function RoomsPage() {
  const [rooms, setRooms] = useState([
    { id: "1", name: "Late Night Vibes 🎧" },
    { id: "2", name: "Coding + LoFi 💻" },
  ]);

  const [roomName, setRoomName] = useState("");

  const createRoom = () => {
    if (!roomName) return;
    setRooms([...rooms, { id: Date.now().toString(), name: roomName }]);
    setRoomName("");
  };

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Music Rooms</h1>

      <div className="flex gap-2 mb-6">
        <input
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Room name"
          className="flex-1 p-2 rounded bg-white/5 border border-white/10"
        />
        <button
          onClick={createRoom}
          className="px-4 bg-purple-500 text-black rounded"
        >
          Create
        </button>
      </div>

      <div className="space-y-3">
        {rooms.map((room) => (
          <Link
            key={room.id}
            href={`/rooms/${room.id}`}
            className="block p-4 rounded bg-white/5 border border-white/10 hover:bg-white/10"
          >
            {room.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
