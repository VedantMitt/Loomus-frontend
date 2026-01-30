"use client";

import FriendCard from "@/components/FriendCard";
import { friends } from "@/lib/mockFriends";

export default function FriendsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Friends</h1>

      {friends.length === 0 ? (
        <p className="text-white/60">No friends yet. Discover people!</p>
      ) : (
        <div className="space-y-3">
          {friends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      )}
    </div>
  );
}
