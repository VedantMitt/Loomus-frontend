type Activity = {
  id: number;
  title: string;
  type: string;
  date: string;
  location: string;
  host: string;
  banner?: string;
  description?: string;
};

export default function ActivityCard({ activity }: { activity: Activity }) {
  console.log("BANNER:", activity.banner);
  return (
    <div className="rounded border border-white/10 bg-white/5 overflow-hidden">

      {activity.banner && (
  <img
    src={activity.banner}
    alt={activity.title}
    className="w-full h-40 object-cover rounded mb-3"
  />
)}
{!activity.joined ? (
  <button onClick={joinActivity}>Join</button>
) : (
  <Link href={`/rooms/${activity.roomId}`}>Open Room</Link>
)}


      {/* CONTENT */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">{activity.title}</h2>
            <p className="text-sm text-white/60">{activity.type}</p>
          </div>

          <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
            {activity.date}
          </span>
        </div>

        <p className="text-sm mt-2 text-white/80">
          📍 {activity.location}
        </p>

        <p className="text-xs mt-1 text-white/50">
          Hosted by {activity.host}
        </p>

        {activity.description && (
          <p className="text-sm mt-3 text-white/70">
            {activity.description}
          </p>
        )}

        <div className="flex gap-3 mt-4">
          <button className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-400 rounded">
            ⭐ Interested
          </button>

          <button className="px-3 py-1 text-sm bg-green-500/20 text-green-400 rounded">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
