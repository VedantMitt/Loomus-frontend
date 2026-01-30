"use client";

import { useState } from "react";

export default function ProfilePage() {
  const [name, setName] = useState("Vedant");
  const [college] = useState("ABC College");

  const [skills, setSkills] = useState<string[]>(["React", "Node"]);
  const [interests, setInterests] = useState<string[]>(["Startups", "Music"]);

  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const addSkill = () => {
    if (skillInput && !skills.includes(skillInput)) {
      setSkills([...skills, skillInput]);
      setSkillInput("");
    }
  };

  const addInterest = () => {
    if (interestInput && !interests.includes(interestInput)) {
      setInterests([...interests, interestInput]);
      setInterestInput("");
    }
  };

  const removeItem = (
    item: string,
    list: string[],
    setList: (v: string[]) => void
  ) => {
    setList(list.filter((i) => i !== item));
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-sm mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 rounded bg-white/5 border border-white/10"
        />
      </div>

      {/* College */}
      <div className="mb-6">
        <label className="block text-sm mb-1">College</label>
        <input
          value={college}
          disabled
          className="w-full p-2 rounded bg-white/5 border border-white/10 opacity-70"
        />
      </div>

      {/* Skills */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Skills</h2>

        <div className="flex gap-2 mb-2">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="Add skill"
            className="flex-1 p-2 rounded bg-white/5 border border-white/10"
          />
          <button
            onClick={addSkill}
            className="px-4 bg-blue-500 text-black rounded"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="px-2 py-1 text-sm bg-blue-500/10 text-blue-400 rounded cursor-pointer"
              onClick={() => removeItem(skill, skills, setSkills)}
            >
              {skill} ✕
            </span>
          ))}
        </div>
      </section>

      {/* Interests */}
      <section>
        <h2 className="font-semibold mb-2">Interests</h2>

        <div className="flex gap-2 mb-2">
          <input
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            placeholder="Add interest"
            className="flex-1 p-2 rounded bg-white/5 border border-white/10"
          />
          <button
            onClick={addInterest}
            className="px-4 bg-green-500 text-black rounded"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => (
            <span
              key={interest}
              className="px-2 py-1 text-sm bg-green-500/10 text-green-400 rounded cursor-pointer"
              onClick={() => removeItem(interest, interests, setInterests)}
            >
              {interest} ✕
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
