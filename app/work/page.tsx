"use client";

import Link from "next/link";
import WorkCard from "@/components/WorkCard";
import { gigs } from "@/lib/mockGigs";

export default function WorkPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Work & Gigs</h1>

        <Link
          href="/work/post"
          className="px-4 py-2 bg-green-500 text-black rounded"
        >
          + Post Gig
        </Link>
      </div>

      <div className="space-y-4">
        {gigs.map((gig) => (
          <WorkCard key={gig.id} gig={gig} />
        ))}
      </div>
    </div>
  );
}
