interface UserMenuProps {
  name: string;
  email: string;
}

export default function UserMenu({ name, email }: UserMenuProps) {
  const firstLetter = name?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex items-center gap-3 bg-[#21262d] px-3.5 py-1.5 rounded-xl border border-[#30363d] shadow-sm">
      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
        {firstLetter}
      </div>

      <div className="hidden sm:block text-left">
        <p className="font-semibold text-xs text-white">{name || email.split("@")[0]}</p>
        <p className="text-[10px] text-gray-400">{email}</p>
      </div>
    </div>
  );
}
