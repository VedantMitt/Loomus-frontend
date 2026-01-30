"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();

  const continueWithEmail = async () => {
    if (!name || !email) {
      alert("Name and college email required");
      return;
    }

    const res = await fetch("http://localhost:5000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Auth failed");
      return;
    }

    // 🔑 THIS IS THE KEY LINE
    localStorage.setItem("token", data.token);


    setTimeout(() => {
  router.push("/activities");
}, 0);
  };

  return (
    <div className="max-w-sm mx-auto mt-20 space-y-4">
      <h1 className="text-2xl font-bold">CampusConnect</h1>

      <input
        className="w-full p-2 bg-black border"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="w-full p-2 bg-black border"
        placeholder="College email (.edu / .ac.in)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
  onClick={() => {
    console.log("CONTINUE CLICKED");
    continueWithEmail();
  }}
  className="w-full bg-blue-500 text-black p-2"
>
  Continue
</button>

    </div>
  );
}
