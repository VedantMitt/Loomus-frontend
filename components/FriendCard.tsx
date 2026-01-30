type Friend = {
  id: number;
  name: string;
  online: boolean;
};

export default function FriendCard({ friend }: { friend: Friend }) {
  return (
    <div className="flex items-center justify-between p-4 rounded border border-white/10 bg-white/5">
      {/* Left */}
      <div className="flex items-center gap-3">
        <span
          className={`h-3 w-3 rounded-full ${
            friend.online ? "bg-green-400" : "bg-gray-500"
          }`}
        />
        <div>
          <p className="font-medium">{friend.name}</p>
          <p className="text-xs text-white/60">
            {friend.online ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded"
          onClick={() => alert(`Chat with ${friend.name}`)}
        >
          Chat
        </button>

        <button
          className="px-3 py-1 text-sm bg-purple-500/20 text-purple-400 rounded"
          onClick={() => alert(`Invite ${friend.name} to Music Room`)}
        >
          🎧
        </button>

        <button
          className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded"
          onClick={() => alert(`Invite ${friend.name} to Watch Party`)}
        >
          🎬
        </button>
      </div>
    </div>
  );
}
