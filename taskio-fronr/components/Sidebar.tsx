import Link from "next/link";
import { LayoutDashboard, PlusCircle, ClipboardList, Users, Shield, Folder, User, LogOut, Building2, Settings, FileText } from "lucide-react";

interface SidebarProps {
  userRole: string;
  pathname: string | null;
  logout: () => Promise<void>;
}

export default function Sidebar({ userRole, pathname, logout }: SidebarProps) {
  return (
    <aside className="w-72 bg-card border-r border-border flex flex-col justify-between hidden md:flex h-screen sticky top-0 shadow-sm">
      <div className="p-5 overflow-y-auto">
        {/* Logo Section */}
        <div className="text-xl font-bold text-foreground mb-8 flex items-center justify-between border-b border-border pb-5 px-2">
          <span className="tracking-tight flex items-center gap-2">
            <span className="text-purple-600 text-2xl font-black">■</span> 
            <span className="text-lg">Form</span>
          </span>
          <span className="text-[10px] tracking-wider uppercase font-extrabold bg-purple-100 text-purple-700 shadow-sm px-2.5 py-1 rounded-md">
            {userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? "Admin" : "User"}
          </span>
        </div>

        {/* Navigation Links based on user roles */}
        <nav className="space-y-6 px-1">
          {userRole === "SUPER_ADMIN" ? (
            <>
              <div>
                <div className="px-3 text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase mb-3">Platform</div>
                <div className="space-y-1">
                  <Link
                    href="/super-admin/dashboard"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/super-admin/dashboard" ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <LayoutDashboard className={`w-5 h-5 transition-colors ${pathname === "/super-admin/dashboard" ? "text-primary" : "group-hover:text-primary"}`} />
                    <span>Dashboard</span>
                  </Link>
                </div>
              </div>

              <div>
                <div className="px-3 text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase mb-3">Management</div>
                <div className="space-y-1">
                  <Link
                    href="/super-admin/organizations"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/super-admin/organizations") ? "bg-success/10 text-success font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Building2 className={`w-5 h-5 transition-colors ${pathname?.startsWith("/super-admin/organizations") ? "text-success" : "group-hover:text-success"}`} />
                    <span>Organizations</span>
                  </Link>

                  <Link
                    href="/super-admin/users"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/super-admin/users") ? "bg-warning/10 text-warning font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Users className={`w-5 h-5 transition-colors ${pathname?.startsWith("/super-admin/users") ? "text-warning" : "group-hover:text-warning"}`} />
                    <span>Users</span>
                  </Link>

                  <Link
                    href="/super-admin/audit"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/super-admin/audit") ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <ClipboardList className={`w-5 h-5 transition-colors ${pathname?.startsWith("/super-admin/audit") ? "text-purple-600 dark:text-purple-400" : "group-hover:text-purple-500"}`} />
                    <span>Audit Logs</span>
                  </Link>
                </div>
              </div>

              <div>
                <div className="px-3 text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase mb-3">System</div>
                <div className="space-y-1">
                  <Link
                    href="/super-admin/settings"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/super-admin/settings") ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Settings className={`w-5 h-5 transition-colors ${pathname?.startsWith("/super-admin/settings") ? "text-indigo-600 dark:text-indigo-400" : "group-hover:text-indigo-500"}`} />
                    <span>Settings</span>
                  </Link>
                </div>
              </div>
            </>
          ) : userRole === "ADMIN" ? (
            <>
              <div>
                <div className="px-3 text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase mb-3">Overview</div>
                <div className="space-y-1">
                  <Link
                    href="/admin"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/admin" ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <LayoutDashboard className={`w-5 h-5 transition-colors ${pathname === "/admin" ? "text-primary" : "group-hover:text-primary"}`} />
                    <span>Dashboard</span>
                  </Link>
                </div>
              </div>

              <div>
                <div className="px-3 text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase mb-3">Forms & Responses</div>
                <div className="space-y-1">
                  <Link
                    href="/studio/forms/new"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/studio/forms/new" ? "bg-success/10 text-success font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <PlusCircle className={`w-5 h-5 transition-colors ${pathname === "/studio/forms/new" ? "text-success" : "group-hover:text-success"}`} />
                    <span>Create Form</span>
                  </Link>

                  <Link
                    href="/studio/forms"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/studio/forms" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <ClipboardList className={`w-5 h-5 transition-colors ${pathname === "/studio/forms" ? "text-purple-600 dark:text-purple-400" : "group-hover:text-purple-500"}`} />
                    <span>Forms</span>
                  </Link>

                  <Link
                    href="/studio/responses"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/studio/responses" ? "bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <FileText className={`w-5 h-5 transition-colors ${pathname === "/studio/responses" ? "text-pink-600 dark:text-pink-400" : "group-hover:text-pink-500"}`} />
                    <span>Responses</span>
                  </Link>
                </div>
              </div>

              <div>
                <div className="px-3 text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase mb-3">Administration</div>
                <div className="space-y-1">
                  <Link
                    href="/admin/users"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/admin/users") ? "bg-warning/10 text-warning font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Users className={`w-5 h-5 transition-colors ${pathname?.startsWith("/admin/users") ? "text-warning" : "group-hover:text-warning"}`} />
                    <span>Users</span>
                  </Link>

                  <Link
                    href="/admin/roles"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/admin/roles") ? "bg-error/10 text-error font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Shield className={`w-5 h-5 transition-colors ${pathname?.startsWith("/admin/roles") ? "text-error" : "group-hover:text-error"}`} />
                    <span>Roles</span>
                  </Link>

                  <Link
                    href="/admin/groups"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/admin/groups") ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Folder className={`w-5 h-5 transition-colors ${pathname?.startsWith("/admin/groups") ? "text-indigo-600 dark:text-indigo-400" : "group-hover:text-indigo-500"}`} />
                    <span>Groups</span>
                  </Link>

                  <Link
                    href="/admin/audit"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/admin/audit") ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <ClipboardList className={`w-5 h-5 transition-colors ${pathname?.startsWith("/admin/audit") ? "text-purple-600 dark:text-purple-400" : "group-hover:text-purple-500"}`} />
                    <span>Audit Logs</span>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="px-3 text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase mb-3">Workspace</div>
                <div className="space-y-1">
                  <Link
                    href="/userForms"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/userForms" ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <ClipboardList className={`w-5 h-5 transition-colors ${pathname === "/userForms" ? "text-primary" : "group-hover:text-primary"}`} />
                    <span>Available Forms</span>
                  </Link>

                  <Link
                    href="/submissions"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/submissions") ? "bg-success/10 text-success font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <FileText className={`w-5 h-5 transition-colors ${pathname?.startsWith("/submissions") ? "text-success" : "group-hover:text-success"}`} />
                    <span>Submissions</span>
                  </Link>

                  <Link
                    href="/profile"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/profile" ? "bg-warning/10 text-warning font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <User className={`w-5 h-5 transition-colors ${pathname === "/profile" ? "text-warning" : "group-hover:text-warning"}`} />
                    <span>Profile</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </nav>
      </div>

      {/* Logout Section */}
      <div className="p-4 border-t border-border bg-card">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-error hover:bg-error/10 hover:text-error transition-all font-medium text-sm text-left"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
