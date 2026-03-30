"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";

type Conversation = {
  conversation_id: string;
  other_user_id: string;
  name: string;
  username: string;
  profile_pic?: string;
  last_message_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_username: string;
  content: string;
  created_at: string;
};

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initConvId = searchParams.get("conversation");

  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mobile: toggle between sidebar and chat view
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Parse JWT
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUser(payload);
    } catch {
      router.push("/auth/login");
    }
  }, [router]);

  // Init Socket
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const newSocket = io(API);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch Conversations
  const fetchConversations = async (idToSelect?: string) => {
    try {
      setLoadingList(true);
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        
        if (idToSelect) {
          const match = data.find((c: any) => c.conversation_id === idToSelect);
          if (match) setActiveConv(match);
        } else if (initConvId) {
          const match = data.find((c: any) => c.conversation_id === initConvId);
          if (match) setActiveConv(match);
        } else if (data.length > 0 && !activeConv) {
          setActiveConv(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initConvId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const fetchUsers = async () => {
      try {
        setIsSearching(true);
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/users/discover?search=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };
    
    const timeoutId = setTimeout(fetchUsers, 400);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleStartChatFromSearch = async (userId: string) => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/chat/initiate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ otherUserId: userId })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchConversations(data.conversation_id);
        setSearchQuery("");
        setMobileShowChat(true);
      }
    } catch(err) { 
      console.error(err); 
    }
  };

  // Fetch Messages for Active Conv
  useEffect(() => {
    if (!activeConv || !currentUser || !socket) return;
    
    let isMounted = true;
    setLoadingChat(true);

    const loadMessages = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/chat/${activeConv.conversation_id}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoadingChat(false);
      }
    };

    loadMessages();

    // Join room
    socket.emit("join_chat", activeConv.conversation_id);

    // Listeners
    const messageHandler = (newMsg: Message) => {
      if (newMsg.conversation_id === activeConv.conversation_id) {
        setMessages((prev) => [...prev, newMsg]);
        // Update conversation last_message_at
        setConversations(prev => {
          return prev.map(c => c.conversation_id === activeConv.conversation_id 
            ? { ...c, last_message_at: new Date().toISOString() } 
            : c).sort((a,b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
        });
      }
    };

    const deleteHandler = (messageId: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    socket.on("receive_message", messageHandler);
    socket.on("message_deleted", deleteHandler);

    return () => {
      socket.off("receive_message", messageHandler);
      socket.off("message_deleted", deleteHandler);
      isMounted = false;
    };
  }, [activeConv, currentUser, socket]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDeleteMessage = async (msgId: string) => {
    if (!activeConv || !currentUser || !socket) return;
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/chat/messages/${msgId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
        socket.emit("delete_message", { conversationId: activeConv.conversation_id, messageId: msgId });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv || !currentUser || !socket) return;

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      
      // Opt temp UI
      const tempMsg: Message = {
         id: "temp-" + Date.now(),
         conversation_id: activeConv.conversation_id,
         sender_id: currentUser.id,
         sender_username: currentUser.username,
         content: messageText,
         created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMsg]);
      setMessageText("");

      const res = await fetch(`${API}/chat/${activeConv.conversation_id}/messages`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: tempMsg.content })
      });
      
      if (res.ok) {
        const finalMsg = await res.json();
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? finalMsg : m));
        // Emit to others
        socket.emit("send_message", { conversationId: activeConv.conversation_id, message: finalMsg });
        
        // Propagate list
        setConversations(prev => {
          return prev.map(c => c.conversation_id === activeConv.conversation_id 
            ? { ...c, last_message_at: new Date().toISOString() } 
            : c).sort((a,b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .chat-page {
          font-family: 'DM Sans', sans-serif;
          min-height: calc(100vh - 90px);
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          padding: 24px;
          gap: 24px;
        }

        .chat-sidebar {
          width: 300px;
          background: rgba(25, 25, 25, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex-shrink: 0;
        }

        .chat-main {
          flex: 1;
          background: rgba(25, 25, 25, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }

        .chat-header h1, .chat-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #fff;
        }
        
        .chat-header p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #888;
        }

        .conv-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .conv-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .conv-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .conv-item.active {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.2);
        }

        .conv-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .conv-info {
          flex: 1;
          overflow: hidden;
        }
        .conv-name {
          font-size: 15px;
          font-weight: 600;
          color: #eee;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .conv-username {
          font-size: 12px;
          color: #888;
        }

        .msg-list {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .msg-row {
          display: flex;
          width: 100%;
          align-items: center;
        }

        .msg-row.sent {
          justify-content: flex-end;
        }

        .msg-delete-btn {
          background: rgba(255, 60, 60, 0.05);
          color: #ff4444;
          border: none;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s;
          margin-right: 8px;
        }

        .msg-row.sent:hover .msg-delete-btn {
          opacity: 1;
        }

        .msg-delete-btn:hover {
          background: rgba(255, 60, 60, 0.15);
          transform: scale(1.1);
        }

        .msg-bubble {
          max-width: 70%;
          padding: 12px 18px;
          border-radius: 20px;
          font-size: 14px;
          line-height: 1.5;
        }

        .msg-row.sent .msg-bubble {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #fff;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .msg-row.received .msg-bubble {
          background: rgba(255, 255, 255, 0.08);
          color: #eee;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom-left-radius: 4px;
        }

        .msg-time {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 6px;
          text-align: right;
        }

        .chat-input-area {
          padding: 20px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }

        .chat-form {
          display: flex;
          gap: 12px;
        }

        .chat-input {
          flex: 1;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          padding: 14px 24px;
          color: #fff;
          font-size: 15px;
          outline: none;
          transition: border 0.3s;
          font-family: inherit;
        }

        .chat-input:focus {
          border-color: #3b82f6;
        }

        .chat-submit {
          background: #3b82f6;
          color: #fff;
          border: none;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s;
        }
        
        .chat-submit:hover:not(:disabled) {
          background: #2563eb;
          transform: scale(1.05);
        }

        .chat-submit:disabled {
          background: rgba(59, 130, 246, 0.5);
          cursor: not-allowed;
        }

        .empty-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          color: #888;
          text-align: center;
        }

        @media (max-width: 768px) {
          .chat-page {
            padding: 0;
            gap: 0;
            height: calc(100vh - 70px - 72px);
          }
          .chat-sidebar {
            width: 100%;
            height: 100%;
            border-radius: 0;
            border: none;
          }
          .chat-main {
            width: 100%;
            height: 100%;
            border-radius: 0;
            border: none;
          }
          .chat-sidebar.mobile-hidden {
            display: none;
          }
          .chat-main.mobile-hidden {
            display: none;
          }
          .mobile-back-btn {
            display: flex !important;
          }
        }

        @media (min-width: 769px) {
          .mobile-back-btn {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="chat-page">
        {/* Sidebar */}
        <aside className={`chat-sidebar ${mobileShowChat ? 'mobile-hidden' : ''}`}>
          <header className="chat-header">
            <h1>Messages</h1>
            <div style={{ marginTop: "16px", position: "relative" }}>
               <input 
                 type="text" 
                 placeholder="Search users..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 style={{ width: "100%", padding: "10px 16px", borderRadius: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", fontSize: "14px", transition: "border 0.2s" }}
                 onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                 onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
               />
               {searchQuery && (
                 <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "18px" }}>&times;</button>
               )}
            </div>
          </header>
          <div className="conv-list">
            {searchQuery.trim() ? (
              isSearching ? (
                <div style={{ padding: "20px", color: "#888", textAlign: "center", fontSize: "14px" }}>Searching...</div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: "20px", color: "#888", textAlign: "center", fontSize: "14px" }}>No users found.</div>
              ) : (
                searchResults.map(user => {
                  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                  const avatarUrl = user.profile_pic 
                    ? user.profile_pic.startsWith("/uploads") ? `${API}${user.profile_pic}` : user.profile_pic 
                    : `https://ui-avatars.com/api/?name=${user.name}&background=0D1117&color=fff`;
                  
                  return (
                    <div 
                      key={user.id} 
                      className="conv-item"
                      onClick={() => handleStartChatFromSearch(user.id)}
                    >
                      <img src={avatarUrl} alt="" className="conv-avatar" />
                      <div className="conv-info">
                        <div className="conv-name">{user.name}</div>
                        <div className="conv-username">@{user.username}</div>
                      </div>
                    </div>
                  );
                })
              )
            ) : loadingList ? (
              <div style={{ padding: "20px", color: "#888", textAlign: "center" }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: "20px", color: "#888", textAlign: "center", fontSize: "14px" }}>
                No active conversations.<br/><br/>
                Visit a friend's profile to start chatting!
              </div>
            ) : (
              conversations.map(conv => {
                const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                const avatarUrl = conv.profile_pic 
                  ? conv.profile_pic.startsWith("/uploads") ? `${API}${conv.profile_pic}` : conv.profile_pic 
                  : `https://ui-avatars.com/api/?name=${conv.name}&background=0D1117&color=fff`;
                
                return (
                  <div 
                    key={conv.conversation_id} 
                    className={`conv-item ${activeConv?.conversation_id === conv.conversation_id ? 'active' : ''}`}
                    onClick={() => { setActiveConv(conv); setMobileShowChat(true); }}
                  >
                    <img src={avatarUrl} alt="" className="conv-avatar" />
                    <div className="conv-info">
                      <div className="conv-name">{conv.name}</div>
                      <div className="conv-username">@{conv.username}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Main */}
        <main className={`chat-main ${!mobileShowChat ? 'mobile-hidden' : ''}`}>
          {activeConv ? (
            <>
              <header className="chat-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  className="mobile-back-btn"
                  onClick={() => setMobileShowChat(false)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <Link href={`/profile/${activeConv.username}`}>
                  <img 
                    src={activeConv.profile_pic 
                      ? activeConv.profile_pic.startsWith("/uploads") ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${activeConv.profile_pic}` : activeConv.profile_pic 
                      : `https://ui-avatars.com/api/?name=${activeConv.name}&background=0D1117&color=fff`} 
                    alt="" 
                    className="conv-avatar" 
                    style={{ width: '40px', height: '40px' }}
                  />
                </Link>
                <div>
                  <Link href={`/profile/${activeConv.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h2>{activeConv.name}</h2>
                  </Link>
                  <p>@{activeConv.username}</p>
                </div>
              </header>

              <div className="msg-list">
                {loadingChat ? (
                  <div className="empty-state">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="empty-state">
                    <h3>Say Hi! 👋</h3>
                    <p style={{marginTop: "8px", maxWidth: "250px", lineHeight: "1.5"}}>
                      This is the beginning of your conversation with {activeConv.name}.
                    </p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isSent = msg.sender_id === currentUser?.id;
                    return (
                      <div key={msg.id} className={`msg-row ${isSent ? 'sent' : 'received'}`}>
                        {isSent && (
                          <button 
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="msg-delete-btn"
                            title="Unsend"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        )}
                        <div className="msg-bubble">
                          {msg.content}
                          <div className="msg-time">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <footer className="chat-input-area">
                <form className="chat-form" onSubmit={sendMessage}>
                  <input 
                    type="text" 
                    className="chat-input" 
                    placeholder="Type a message..." 
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    required
                  />
                  <button type="submit" className="chat-submit" disabled={!messageText.trim()}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </form>
              </footer>
            </>
          ) : (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: "16px"}}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <h2>Your Messages</h2>
              <p style={{ marginTop: "8px", fontSize: "14px" }}>Select a conversation or start a new one.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#888' }}>Loading chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}
