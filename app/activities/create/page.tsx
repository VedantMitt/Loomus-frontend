"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateActivityPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [banner, setBanner] = useState<File | null>(null);


const createEvent = async () => {
  if (!title || !type || !date || !location) {
    alert("Please fill all required fields");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/activities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
  title,
  type,
  date,
  location,
  description,
  banner,
}),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to create activity");
      return;
    }

    // success → go back to list
    router.push("/activities");
  } catch (e) {
    alert("Server error");
  }
};


  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Host an Event</h1>

      <div className="space-y-4">
        {/* Banner Upload */}
<div className="space-y-2">
  <label className="text-sm text-gray-400">
    Event Banner
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) => setBanner(e.target.files?.[0] || null)}
    className="w-full p-2 rounded bg-white/5 border border-white/10"
  />

  {banner && (
    <img
      src={URL.createObjectURL(banner)}
      alt="Banner preview"
      className="h-48 w-full object-cover rounded border border-white/10"
    />
  )}
</div>

        <input
          placeholder="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 rounded bg-white/5 border border-white/10"
        />

        <input
          placeholder="Type (Party, Music, Dating, Tech)"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-2 rounded bg-white/5 border border-white/10"
        />

        <input
          placeholder="Date & Time (e.g. Oct 10 • 7 PM)"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-2 rounded bg-white/5 border border-white/10"
        />

        <input
          placeholder="Location (Auditorium / Hostel / Online)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-2 rounded bg-white/5 border border-white/10"
        />

        <textarea
          placeholder="Event Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 rounded bg-white/5 border border-white/10"
          rows={4}
        />

        <button
          onClick={createEvent}
          className="w-full py-2 bg-green-500 text-black rounded"
        >
          Create Event
        </button>
      </div>
    </div>
  );
}
