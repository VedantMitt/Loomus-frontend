type User = {
  id: number;
  name: string;
  college: string;
  skills: string[];
  interests: string[];
};

export default function UserCard({ user }: { user: User }) {
  return (
    <div className="border border-white/10 bg-white/5 backdrop-blur rounded-lg p-4 hover:bg-white/10 transition">

      <h3 className="font-semibold text-lg">{user.name}</h3>
      <p className="text-sm text-gray-500">{user.college}</p>

      <div className="mt-3">
        <p className="text-sm font-medium">Skills</p>
<div className="flex flex-wrap gap-2 mt-1">
  {user.skills.map((skill) => (
    <span
      key={skill}
      className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded"
    >
      {skill}
    </span>
  ))}
</div>

</div>


      <div className="mt-3">
        <p className="text-sm font-medium">Interests</p>
        <div className="flex flex-wrap gap-2 mt-1">
  {user.interests.map((interest) => (
    <span
      key={interest}
      className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded"
    >
      {interest}
    </span>
  ))}
</div>

      </div>

      <button className="mt-4 w-full bg-black text-white py-2 rounded">
        Message
      </button>
    </div>
  );
}
