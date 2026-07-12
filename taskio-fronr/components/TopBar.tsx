import OrgBadge from "./OrgBadge";
import UserMenu from "./UserMenu";
import ThemeSwitcher from "./ThemeSwitcher";
import { Menu } from "lucide-react";

interface TopBarProps {
  name: string;
  email: string;
}

export default function TopBar({ name, email }: TopBarProps) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button className="md:hidden text-muted-foreground hover:text-foreground">
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-sm font-semibold text-foreground">
          Welcome back, {name || email}
        </h2>
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <OrgBadge />
        <UserMenu name={name} email={email} />
      </div>
    </header>
  );
}
