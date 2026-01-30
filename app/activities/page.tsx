"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ActivityCard from "@/components/ActivityCard";

type Activity = {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  host: string;
  banner?: string;
  description?: string;
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch("http://localhost:5000/activities", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        setActivities(data);
      } catch (e) {
        console.error("Failed to load activities", e);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campus Activities</h1>

        <Link
          href="/activities/create"
          className="px-4 py-2 bg-blue-500 text-black rounded"
        >
          + Host Event
        </Link>
      </div>

      {loading ? (
        <p className="text-white/60">Loading activities...</p>
      ) : activities.length === 0 ? (
        <p className="text-white/60">No activities yet</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
