"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [college, setCollege] = useState("");

const [skills, setSkills] = useState<string[]>([]);
const [interests, setInterests] = useState<string[]>([]);
  const [profilePic, setProfilePic] = useState<string | null>(null);

const [loading, setLoading] = useState(true);

useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    router.push("/auth/login");
    return;
  }


  const fetchProfile = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/users/mee", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        router.push("/auth/login");
        return;
      }

      const data = await res.json();
      console.log("PROFILE DATA FROM API:", data);


      // 🔥 THIS WAS MISSING / WRONG
      setName(data.name);
      setEmail(data.email);
      setCollege(data.college);

      setSkills(data.skills || []);
      setInterests(data.interests || []);
    } catch (err) {
      console.error(err);
      router.push("/auth/login");
    }
  };

  fetchProfile();
}, []);




  // --- UI STATES ---
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- HANDLERS ---
const handleSaveProfile = async () => {
  setIsSaving(true);
  setMessage(null);

  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/users/mee", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        skills, // Sent as array: ["React", "Node"]
        interests,
        profile_pic: profilePic // Ensure this is a URL/String
      }),
    });

    if (!res.ok) throw new Error();

    setMessage({ type: 'success', text: "Changes saved to CampusConnect!" });
    setTimeout(() => setMessage(null), 3000);
  } catch (err) {
    setMessage({ type: 'error', text: "Failed to save. Try again." });
  } finally {
    setIsSaving(false);
  }
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  const removeItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter((i) => i !== item));
  };

  return (
    <main className="p-6 max-w-2xl mx-auto bg-black text-white min-h-screen pb-20">
      <h1 className="text-2xl font-bold mb-8 text-center md:text-left">Your Profile</h1>

      {/* Profile Picture Section */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-white/5 border-2 border-white/10 group-hover:border-blue-500 transition-all">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">👤</div>
            )}
          </div>
          <label className="absolute bottom-1 right-1 bg-blue-600 p-2.5 rounded-full cursor-pointer shadow-xl hover:scale-110 transition-transform">
            <input 
               type="file" 
               className="hidden" 
               onChange={(e) => {
                 const file = e.target.files?.[0];
                 if (file) setProfilePic(URL.createObjectURL(file));
               }} 
               accept="image/*" 
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
          </label>
        </div>
      </div>

      {/* Profile Fields */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs uppercase text-white/40 font-bold tracking-widest">Email </label>
            <div className="p-3 bg-white/5 border border-white/10 rounded text-white/30 italic">{email}</div>
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase text-white/40 font-bold tracking-widest">College </label>
            <div className="p-3 bg-white/5 border border-white/10 rounded text-white/30 italic">{college}</div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase text-white/40 font-bold tracking-widest">Full Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-white/5 border border-white/10 rounded focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Skills Tag Input */}
        <section>
          <label className="text-xs uppercase text-white/40 font-bold tracking-widest block mb-2">Skills</label>
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), (skillInput && !skills.includes(skillInput)) && (setSkills([...skills, skillInput]), setSkillInput("")))}
            placeholder="Type and press Enter"
            className="w-full p-3 bg-white/5 border border-white/10 rounded mb-3 outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} onClick={() => removeItem(s, skills, setSkills)} className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-sm cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition-all">
                {s} ×
              </span>
            ))}
          </div>
        </section>

        {/* Interests Tag Input */}
        <section>
          <label className="text-xs uppercase text-white/40 font-bold tracking-widest block mb-2">Interests</label>
          <input
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), (interestInput && !interests.includes(interestInput)) && (setInterests([...interests, interestInput]), setInterestInput("")))}
            placeholder="Type and press Enter"
            className="w-full p-3 bg-white/5 border border-white/10 rounded mb-3 outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {interests.map((i) => (
              <span key={i} onClick={() => removeItem(i, interests, setInterests)} className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full text-sm cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition-all">
                {i} ×
              </span>
            ))}
          </div>
        </section>
      </div>

      <hr className="my-10 border-white/10" />

      {/* Success/Error Feedback */}
      {message && (
        <div className={`mb-6 p-3 rounded text-center text-sm font-medium animate-pulse ${
          message.type === 'success' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
        }`}>
          {message.text}
        </div>
      )}

      {/* --- FOOTER ACTIONS --- */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={handleSaveProfile}
          disabled={isSaving}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            isSaving ? "bg-gray-800 text-white/50" : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
          }`}
        >
          {isSaving ? "Saving Changes..." : "Save Profile"}
        </button>

        <button 
          onClick={handleLogout}
          className="w-full py-4 bg-transparent border-2 border-red-600/50 text-red-500 rounded-xl font-bold text-lg hover:bg-red-600 hover:text-white transition-all"
        >
          Logout Account
        </button>
      </div>
    </main>
  );
}