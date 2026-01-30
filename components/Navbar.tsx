"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full px-6 py-4 border-b flex justify-between items-center">
      <h1 className="text-xl font-bold">CampusConnect</h1>

      <div className="flex gap-6 text-sm font-medium">
        <Link href="/discover">Discover</Link>
        <Link href="/friends">Friends</Link>
        <Link href="/activities">Activities</Link>
        <Link href="/work">Work</Link>
        <Link href="/rooms">Rooms</Link>
        <Link href="/chat">Chat</Link>
        <Link href="/profile">Profile</Link>
      </div>
    </nav>
  );
}
