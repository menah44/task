interface UserMenuProps {
  name: string;
  email: string;
}

export default function UserMenu({ name, email }: UserMenuProps) {
  const firstLetter = name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border shadow-sm">
      <div className="w-11 h-11 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-lg">
        {firstLetter}
      </div>

      <div>
        <p className="font-semibold text-sm text-slate-800">{name}</p>
        <p className="text-xs text-slate-500">{email}</p>
      </div>
    </div>
  );
}
