type Gig = {
  id: number;
  title: string;
  category: string;
  type: string;
  description: string;
  postedBy: string;
};

export default function WorkCard({ gig }: { gig: Gig }) {
  return (
    <div className="p-4 rounded border border-white/10 bg-white/5">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold">{gig.title}</h2>
          <p className="text-sm text-white/60">{gig.category}</p>
        </div>

        <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
          {gig.type}
        </span>
      </div>

      <p className="text-sm mt-2 text-white/80">
        {gig.description}
      </p>

      <p className="text-xs mt-2 text-white/50">
        Posted by {gig.postedBy}
      </p>

      <div className="flex gap-3 mt-4">
        <button className="px-3 py-1 text-sm bg-green-500/20 text-green-400 rounded">
          Apply
        </button>

        <button className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded">
          Message
        </button>
      </div>
    </div>
  );
}
