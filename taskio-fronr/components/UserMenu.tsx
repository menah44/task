interface UserMenuProps {
  name: string;
  email: string;
}

export default function UserMenu({ name, email }: UserMenuProps) {
  const firstLetter = name?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex items-center gap-3 bg-muted px-3.5 py-1.5 rounded-xl border border-border shadow-sm">
      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
        {firstLetter}
      </div>

      <div className="hidden sm:block text-start">
        <p className="font-semibold text-xs text-foreground">{name || email.split("@")[0]}</p>
        <p className="text-[10px] text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}
