"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Form fields
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [profilePic, setProfilePic] = useState("");
  const [uploading, setUploading] = useState(false);

  // Crop state
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);



  // Load current data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const stored = localStorage.getItem("user");
        if (!stored) return;
        const u = JSON.parse(stored);

        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API}/users/${u.username}`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        setUsername(data.username || "");
        setBio(data.bio || "");
        setGender(data.gender || "");
        setDob(data.dob || "");
        setInstagram(data.instagram || "");
        setLinkedin(data.linkedin || "");
        setIsPrivate(data.is_private || false);
        setProfilePic(data.profile_pic || "");
      } catch {
        console.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!token || !user) return;

      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.toLowerCase(),
          bio,
          gender,
          dob,
          instagram,
          linkedin,
          is_private: isPrivate,
          profile_pic: profilePic,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      // Update localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          name: data.name,
          email: data.email,
          username: data.username,
        })
      );

      setMessage({ type: "ok", text: "Profile saved! ✅" });
      setTimeout(() => router.push(`/profile/${data.username}`), 1200);
    } catch (err: any) {
      setMessage({ type: "err", text: err.message });
    } finally {
      setSaving(false);
    }
  };



  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedArea(croppedPixels);
  }, []);

  const getCroppedBlob = async (): Promise<Blob> => {
    const image = new Image();
    image.src = cropImage!;
    await new Promise((r) => (image.onload = r));
    const canvas = document.createElement("canvas");
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const { x, y, width, height } = croppedArea!;
    ctx.drawImage(image, x, y, width, height, 0, 0, size, size);
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9));
  };

  const handleCropConfirm = async () => {
    if (!cropImage || !croppedArea) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob();
      const token = localStorage.getItem("token");
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const fd = new FormData();
      fd.append("avatar", blob, "avatar.jpg");
      const res = await fetch(`${API}/upload/profile-pic`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfilePic(data.profile_pic);
      setMessage({ type: "ok", text: "Profile picture updated!" });
    } catch (err: any) {
      setMessage({ type: "err", text: err.message });
    } finally {
      setUploading(false);
      setCropImage(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  };

  const handleDeletePic = async () => {
    setProfilePic("");
    setMessage({ type: "ok", text: "Profile picture removed. Hit Save to apply." });
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white px-4 py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .edit-container { max-width: 560px; margin: 0 auto; font-family: 'DM Sans', sans-serif; }
        .edit-card { background: #111; border: 1px solid #1e1e1e; border-radius: 14px; padding: 20px 22px; margin-bottom: 16px; }
        .edit-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #555; margin-bottom: 8px; display: block; }
        .edit-input {
          width: 100%; background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 9px;
          padding: 11px 14px; color: #f0f0f0; font-family: 'DM Sans', sans-serif; font-size: 14px;
          outline: none; transition: border-color 0.2s;
        }
        .edit-input:focus { border-color: #1d4ed8; }
        .edit-input::placeholder { color: #333; }
        .edit-textarea { resize: vertical; min-height: 60px; }
        .tag-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .tag-blue { background: rgba(59,130,246,0.12); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
        .tag-blue:hover { background: rgba(239,68,68,0.15); color: #f87171; border-color: rgba(239,68,68,0.3); }
        .tag-purple { background: rgba(168,85,247,0.12); color: #c084fc; border: 1px solid rgba(168,85,247,0.2); }
        .tag-purple:hover { background: rgba(239,68,68,0.15); color: #f87171; border-color: rgba(239,68,68,0.3); }
        .save-btn {
          width: 100%; padding: 14px; background: #1d4ed8; color: #fff; border: none; border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .save-btn:hover { background: #1e40af; }
        .save-btn:active { transform: scale(0.98); }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .msg-ok { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); color: #4ade80; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px; text-align: center; }
        .msg-err { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #f87171; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px; text-align: center; }
        .avatar-wrap { position: relative; width: 100px; height: 100px; margin: 0 auto 8px; cursor: pointer; }
        .avatar-img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid #222; }
        .avatar-overlay {
          position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,0.55);
          display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s;
          font-size: 12px; color: #fff; font-weight: 500;
        }
        .avatar-wrap:hover .avatar-overlay { opacity: 1; }
        .crop-modal {
          position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.85);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .crop-area { position: relative; width: 320px; height: 320px; border-radius: 12px; overflow: hidden; }
        .crop-controls { margin-top: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .crop-slider { width: 260px; accent-color: #1d4ed8; }
        .crop-btns { display: flex; gap: 10px; }
        .crop-btn {
          padding: 10px 28px; border-radius: 8px; border: none; font-weight: 600; font-size: 14px;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }
        .crop-confirm { background: #1d4ed8; color: #fff; }
        .crop-confirm:hover { background: #1e40af; }
        .crop-cancel { background: #222; color: #aaa; }
        .crop-cancel:hover { background: #333; }
        .del-btn {
          margin-top: 8px; background: none; border: 1px solid #333; color: #888; padding: 5px 14px;
          border-radius: 6px; font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .del-btn:hover { border-color: #f87171; color: #f87171; }
      `}</style>

      {/* Crop Modal */}
      {cropImage && (
        <div className="crop-modal">
          <div className="crop-area">
            <Cropper
              image={cropImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="crop-controls">
            <label style={{ color: "#888", fontSize: "12px" }}>Zoom</label>
            <input
              type="range"
              className="crop-slider"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <div className="crop-btns">
              <button className="crop-btn crop-cancel" onClick={() => { setCropImage(null); setZoom(1); }}>
                Cancel
              </button>
              <button className="crop-btn crop-confirm" onClick={handleCropConfirm} disabled={uploading}>
                {uploading ? "Uploading..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="edit-container">
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "20px" }}>Edit Profile</h1>

        {message && (
          <div className={message.type === "ok" ? "msg-ok" : "msg-err"}>
            {message.text}
          </div>
        )}

        {/* Profile Picture */}
        <div className="edit-card" style={{ textAlign: "center" }}>
          <label className="edit-label">Profile Picture</label>
          <div
            className="avatar-wrap"
            onClick={() => document.getElementById("avatar-file")?.click()}
          >
            <img
              className="avatar-img"
              src={
                profilePic
                  ? profilePic.startsWith("/uploads")
                    ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${profilePic}`
                    : profilePic
                  : `https://ui-avatars.com/api/?name=${username}&background=0D1117&color=fff&size=200`
              }
              alt="Profile"
            />
            <div className="avatar-overlay">{uploading ? "Uploading..." : "Change"}</div>
          </div>
          {profilePic && (
            <button className="del-btn" onClick={handleDeletePic}>
              Remove Photo
            </button>
          )}
          <input
            id="avatar-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setCropImage(reader.result as string);
              reader.readAsDataURL(file);
              e.target.value = "";
            }}
          />
        </div>

        {/* Username */}
        <div className="edit-card">
          <label className="edit-label">Username</label>
          <input
            className="edit-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
          />
        </div>


        {/* Bio */}
        <div className="edit-card">
          <label className="edit-label">Bio</label>
          <textarea
            className="edit-input edit-textarea"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people about yourself..."
            rows={3}
          />
        </div>

        {/* Gender */}
        <div className="edit-card">
          <label className="edit-label">Gender</label>
          <select 
            className="edit-input" 
            value={gender} 
            onChange={(e) => setGender(e.target.value)}
            style={{ appearance: "none", cursor: "pointer" }}
          >
            <option value="" disabled>Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-Binary">Non-Binary</option>
          </select>

          <label className="edit-label" style={{ marginTop: "16px" }}>Date of Birth</label>
          <input
            type="date"
            className="edit-input"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            style={{ colorScheme: "dark" }}
          />
        </div>

        {/* Social Links */}
        <div className="edit-card">
          <label className="edit-label">Social Links</label>
          <input
            type="text"
            className="edit-input"
            placeholder="Instagram Username"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            style={{ marginBottom: "16px" }}
          />
          <input
            type="text"
            className="edit-input"
            placeholder="LinkedIn Profile URL"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>

        {/* Privacy Section */}
        <div className="edit-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 4px 0" }}>Private Account</h2>
            <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
              If enabled, your chapters only appear to friends on the feed.
            </p>
          </div>
          <button 
            onClick={() => setIsPrivate(!isPrivate)}
            style={{ 
              width: "44px", height: "24px", borderRadius: "12px", background: isPrivate ? "#3b82f6" : "#333", 
              position: "relative", cursor: "pointer", border: "none", transition: "all 0.3s"
            }}
          >
            <div style={{
              width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
              position: "absolute", top: "3px", left: isPrivate ? "23px" : "3px", transition: "all 0.3s"
            }} />
          </button>
        </div>

        {/* Save */}
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes →"}
        </button>
      </div>
    </div>
  );
}