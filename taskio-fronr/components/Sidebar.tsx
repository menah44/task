import Link from "next/link";
import { LayoutDashboard, PlusCircle, ClipboardList, Users, Shield, Folder, User, LogOut, Building2, Settings } from "lucide-react";

interface SidebarProps {
  userRole: string;
  pathname: string | null;
  logout: () => Promise<void>;
}

export default function Sidebar({ userRole, pathname, logout }: SidebarProps) {
  return (
    <aside className="w-72 bg-[#161b22] border-r border-[#30363d] flex flex-col justify-between hidden md:flex h-screen sticky top-0">
      <div className="p-6">
        {/* Logo Section */}
        <div className="text-xl font-bold text-white mb-8 flex items-center justify-between border-b border-[#30363d] pb-4">
          <span className="tracking-tight flex items-center gap-2">
            <span className="text-primary text-2xl font-black">■</span> Form
          </span>
          <span className="text-[10px] tracking-wider uppercase font-extrabold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md">
            {userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? "Admin" : "User"}
          </span>
        </div>

        {/* Navigation Links based on user roles */}
        <nav className="space-y-1">
          {userRole === "SUPER_ADMIN" ? (
            <>
              <Link
                href="/super-admin/dashboard"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                  pathname === "/super-admin/dashboard" ? "bg-primary/10 text-primary border border-primary/20" : "border border-transparent"
                }`}
              >
                <LayoutDashboard className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/super-admin/organizations"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                  pathname?.startsWith("/super-admin/organizations") ? "bg-success/10 text-success border border-success/20" : "border border-transparent"
                }`}
              >
                <Building2 className="w-5 h-5 text-gray-400 group-hover:text-success transition-colors" />
                <span>Organizations</span>
              </Link>

              <Link
                href="/super-admin/users"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                  pathname?.startsWith("/super-admin/users") ? "bg-warning/10 text-warning border border-warning/20" : "border border-transparent"
                }`}
              >
                <Users className="w-5 h-5 text-gray-400 group-hover:text-warning transition-colors" />
                <span>Users</span>
              </Link>

              <Link
                href="/super-admin/audit"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                  pathname?.startsWith("/super-admin/audit") ? "bg-purple-600/10 text-purple-400 border border-purple-600/20" : "border border-transparent"
                }`}
              >
                <ClipboardList className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                <span>Audit Logs</span>
              </Link>

              <Link
                href="/super-admin/settings"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                  pathname?.startsWith("/super-admin/settings") ? "bg-gray-600/10 text-gray-400 border border-gray-600/20" : "border border-transparent"
                }`}
              >
                <Settings className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
                <span>Settings</span>
              </Link>
            </>
          ) : userRole === "ADMIN" ? (
            <>
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                  pathname === "/admin" ? "bg-primary/10 text-primary border border-primary/20" : "border border-transparent"
                }`}
              >
                <LayoutDashboard className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/studio/forms/new"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                  pathname === "/studio/forms/new" ? "bg-success/10 text-success border border-success/20" : "border border-transparent"
                }`}
              >
                <PlusCircle className="w-5 h-5 text-gray-400 group-hover:text-success transition-colors" />
                <span>Create Form</span>
              </Link>

              <Link
                href="/studio/forms"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                  pathname === "/studio/forms" ? "bg-purple-600/10 text-purple-400 border border-purple-600/20" : "border border-transparent"
                }`}
              >
                <ClipboardList className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                <span>Responses</span>
              </Link>

              <Link
                href="/admin/users"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                  pathname?.startsWith("/admin/users") ? "bg-warning/10 text-warning border border-warning/20" : "border border-transparent"
                }`}
              >
                <Users className="w-5 h-5 text-gray-400 group-hover:text-warning transition-colors" />
                <span>User Management</span>
              </Link>

              <Link
                href="/admin/roles"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                  pathname?.startsWith("/admin/roles") ? "bg-error/10 text-error border border-error/20" : "border border-transparent"
                }`}
              >
                <Shield className="w-5 h-5 text-gray-400 group-hover:text-error transition-colors" />
                <span>Roles</span>
              </Link>

              <Link
                href="/admin/groups"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                  pathname?.startsWith("/admin/groups") ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20" : "border border-transparent"
                }`}
              >
                <Folder className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                <span>Groups</span>
              </Link>

              <Link
                href="/admin/audit"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                  pathname?.startsWith("/admin/audit") ? "bg-purple-600/10 text-purple-400 border border-purple-600/20" : "border border-transparent"
                }`}
              >
                <ClipboardList className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                <span>Audit Logs</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/userForms"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                  pathname === "/userForms" ? "bg-primary/10 text-primary border border-primary/20" : "border border-transparent"
                }`}
              >
                <ClipboardList className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                <span>My Forms</span>
              </Link>

              <Link
                href="/profile"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-[#21262d] hover:text-white transition-all font-medium text-sm group ${
                  pathname === "/profile" ? "bg-warning/10 text-warning border border-warning/20" : "border border-transparent"
                }`}
              >
                <User className="w-5 h-5 text-gray-400 group-hover:text-warning transition-colors" />
                <span>Profile</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Logout Section */}
      <div className="p-4 border-t border-[#30363d] bg-[#161b22]/50">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-error hover:bg-error/10 hover:text-red-300 transition-all font-medium text-sm text-left border border-transparent"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
