"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PostGigPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  const postGig = () => {
    if (!title || !category || !type) {
      alert("Please fill all required fields");
      return;
    }

    alert("Gig posted! (frontend only)");
    router.push("/work");
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Post a Gig</h1>

      <div className="space-y-4">
        <input
          placeholder="Gig Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 rounded bg-white/5 border border-white/10"
        />

        <input
          placeholder="Category (Editing, Acting, Music, Dev)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 rounded bg-white/5 border border-white/10"
        />

        <input
          placeholder="Type (Paid / Collab / Freelance)"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-2 rounded bg-white/5 border border-white/10"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full p-2 rounded bg-white/5 border border-white/10"
        />

        <button
          onClick={postGig}
          className="w-full py-2 bg-green-500 text-black rounded"
        >
          Post Gig
        </button>
      </div>
    </div>
  );
}
