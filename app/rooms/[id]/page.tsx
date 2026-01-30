"use client";

import { useState } from "react";

type Message = {
  user: string;
  text: string;
};
const convertToEmbed = (url: string) => {
  if (url.includes("youtube.com/watch")) {
    const id = url.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.includes("youtu.be")) {
    const id = url.split("youtu.be/")[1];
    return `https://www.youtube.com/embed/${id}`;
  }
  return url;
};

export default function MusicRoom() {
  const [videoUrl, setVideoUrl] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = () => {
    if (!chatInput) return;
    setMessages([...messages, { user: "You", text: chatInput }]);
    setChatInput("");
  };

  return (
    <main className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-80px)]">
      {/* Music Player */}
      <div className="md:col-span-2">
        <h1 className="text-xl font-bold mb-2">Music Room 🎧</h1>

        <input
          placeholder="Paste YouTube embed URL"
          value={videoUrl}
          
          onChange={(e) => setVideoUrl(convertToEmbed(e.target.value))}
          className="w-full p-2 mb-4 rounded bg-white/5 border border-white/10"
        />

        {videoUrl && (
          <iframe
            className="w-full aspect-video rounded"
            src={videoUrl}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        )}
      </div>

      {/* Chat */}
      <div className="flex flex-col border border-white/10 rounded p-3">
        <h2 className="font-semibold mb-2">Room Chat</h2>

        <div className="flex-1 overflow-y-auto space-y-2 mb-2">
          {messages.map((msg, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{msg.user}:</span>{" "}
              <span className="text-white/80">{msg.text}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Say something..."
            className="flex-1 p-2 rounded bg-white/5 border border-white/10"
          />
          <button
            onClick={sendMessage}
            className="px-3 bg-purple-500 text-black rounded"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
