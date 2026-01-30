import UserCard from "@/components/UserCard";
import { users } from "@/lib/mockData";

export default function DiscoverPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Discover People</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </main>
  );
}
