import { isElevatedRole } from "@/lib/auth-utils";
import Link from "next/link";
import { LayoutDashboard, PlusCircle, ClipboardList, Users, Shield, Folder, User, LogOut, Building2, Settings, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import ThemeLogo from "@/components/ThemeLogo";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";


interface SidebarProps {
  userRole: string;
  pathname: string | null;
  logout: () => Promise<void>;
}

export default function Sidebar({ userRole, pathname, logout }: SidebarProps) {
  const { t } = useTranslation();
  const { isCollapsed, isMobileOpen, setMobileOpen, toggleCollapse } = useSidebarStore();

  return (
    
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed md:sticky top-0 z-50 h-screen bg-card border-e border-border flex flex-col justify-between shadow-sm transition-all duration-300 ease-in-out
          ${isCollapsed ? "md:w-20" : "md:w-72"}
          ${isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"}
          rtl:translate-x-full rtl:md:translate-x-0
          ${isMobileOpen ? "rtl:translate-x-0" : ""}
        `}
      >

      <div className="p-5 overflow-y-auto">
        {/* Logo Section */}
        <div className={`mb-8 flex items-center border-b border-border pb-5 px-2 transition-all ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <Link href="/" className="flex items-center">
            {isCollapsed ? (
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-sm">■</div>
            ) : (
              <ThemeLogo width={148} height={48} />
            )}
          </Link>
          
          {!isCollapsed && (
            <span className="text-[10px] tracking-wider uppercase font-extrabold bg-primary/10 text-primary shadow-sm px-2.5 py-1 rounded-md shrink-0">
              {isElevatedRole(userRole) ? t("sidebar.admin", { defaultValue: "Admin" }) : t("sidebar.user", { defaultValue: "User" })}
            </span>
          )}

          {/* Close button for mobile only */}
          <button onClick={() => setMobileOpen(false)} className="md:hidden p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links based on user roles */}
        <nav className="space-y-6 px-1">
          {userRole === "SUPER_ADMIN" ? (
            <>
              <div>
                <div className={`px-3 text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase transition-all duration-300 ${isCollapsed ? "opacity-0 h-0 overflow-hidden mb-0" : "opacity-100 mb-3"}`}>{t("sidebar.platform")}</div>
                <div className="space-y-1">
                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.dashboard") : undefined}
                    href="/super-admin/dashboard"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/super-admin/dashboard" ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <LayoutDashboard className={`w-5 h-5 transition-colors ${pathname === "/super-admin/dashboard" ? "text-primary" : "group-hover:text-primary"}`} />
                    {!isCollapsed && <span>{t("sidebar.dashboard")}</span>}
                  </Link>
                </div>
              </div>

              <div>
                <div className={`px-3 text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase transition-all duration-300 ${isCollapsed ? "opacity-0 h-0 overflow-hidden mb-0" : "opacity-100 mb-3"}`}>{t("sidebar.management")}</div>
                <div className="space-y-1">
                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.organizations") : undefined}
                    href="/super-admin/organizations"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/super-admin/organizations") ? "bg-success/10 text-success font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Building2 className={`w-5 h-5 transition-colors ${pathname?.startsWith("/super-admin/organizations") ? "text-success" : "group-hover:text-success"}`} />
                    {!isCollapsed && <span>{t("sidebar.organizations")}</span>}
                  </Link>

                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.users") : undefined}
                    href="/super-admin/users"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/super-admin/users") ? "bg-warning/10 text-warning font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Users className={`w-5 h-5 transition-colors ${pathname?.startsWith("/super-admin/users") ? "text-warning" : "group-hover:text-warning"}`} />
                    {!isCollapsed && <span>{t("sidebar.users")}</span>}
                  </Link>

                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.audit") : undefined}
                    href="/super-admin/audit"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/super-admin/audit") ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <ClipboardList className={`w-5 h-5 transition-colors ${pathname?.startsWith("/super-admin/audit") ? "text-primary" : "group-hover:text-primary"}`} />
                    {!isCollapsed && <span>{t("sidebar.audit")}</span>}
                  </Link>
                </div>
              </div>

              <div>
                <div className={`px-3 text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase transition-all duration-300 ${isCollapsed ? "opacity-0 h-0 overflow-hidden mb-0" : "opacity-100 mb-3"}`}>{t("sidebar.system")}</div>
                <div className="space-y-1">
                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.settings") : undefined}
                    href="/profile"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/profile" ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Settings className={`w-5 h-5 transition-colors ${pathname === "/profile" ? "text-primary" : "group-hover:text-primary"}`} />
                    {!isCollapsed && <span>{t("sidebar.settings")}</span>}
                  </Link>
                </div>
              </div>
            </>
          ) : userRole === "ADMIN" ? (
            <>
              <div>
                <div className={`px-3 text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase transition-all duration-300 ${isCollapsed ? "opacity-0 h-0 overflow-hidden mb-0" : "opacity-100 mb-3"}`}>{t("sidebar.overview")}</div>
                <div className="space-y-1">
                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.dashboard") : undefined}
                    href="/admin"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/admin" ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <LayoutDashboard className={`w-5 h-5 transition-colors ${pathname === "/admin" ? "text-primary" : "group-hover:text-primary"}`} />
                    {!isCollapsed && <span>{t("sidebar.dashboard")}</span>}
                  </Link>
                </div>
              </div>

              <div>
                <div className={`px-3 text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase transition-all duration-300 ${isCollapsed ? "opacity-0 h-0 overflow-hidden mb-0" : "opacity-100 mb-3"}`}>{t("sidebar.formsAndResponses")}</div>
                <div className="space-y-1">
                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.createForm") : undefined}
                    href="/studio/forms/new"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/studio/forms/new" ? "bg-success/10 text-success font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <PlusCircle className={`w-5 h-5 transition-colors ${pathname === "/studio/forms/new" ? "text-success" : "group-hover:text-success"}`} />
                    {!isCollapsed && <span>{t("sidebar.createForm")}</span>}
                  </Link>

                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.studio") : undefined}
                    href="/studio/forms"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/studio/forms" ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <ClipboardList className={`w-5 h-5 transition-colors ${pathname === "/studio/forms" ? "text-primary" : "group-hover:text-primary"}`} />
                    {!isCollapsed && <span>{t("sidebar.studio")}</span>}
                  </Link>

                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.responses") : undefined}
                    href="/studio/responses"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/studio/responses" ? "bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <FileText className={`w-5 h-5 transition-colors ${pathname === "/studio/responses" ? "text-pink-600 dark:text-pink-400" : "group-hover:text-pink-500"}`} />
                    {!isCollapsed && <span>{t("sidebar.responses")}</span>}
                  </Link>
                </div>
              </div>

              <div>
                <div className={`px-3 text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase transition-all duration-300 ${isCollapsed ? "opacity-0 h-0 overflow-hidden mb-0" : "opacity-100 mb-3"}`}>{t("sidebar.administration")}</div>
                <div className="space-y-1">
                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.users") : undefined}
                    href="/admin/users"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/admin/users") ? "bg-warning/10 text-warning font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Users className={`w-5 h-5 transition-colors ${pathname?.startsWith("/admin/users") ? "text-warning" : "group-hover:text-warning"}`} />
                    {!isCollapsed && <span>{t("sidebar.users")}</span>}
                  </Link>

                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.roles") : undefined}
                    href="/admin/roles"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/admin/roles") ? "bg-error/10 text-error font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Shield className={`w-5 h-5 transition-colors ${pathname?.startsWith("/admin/roles") ? "text-error" : "group-hover:text-error"}`} />
                    {!isCollapsed && <span>{t("sidebar.roles")}</span>}
                  </Link>

                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.groups") : undefined}
                    href="/admin/groups"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/admin/groups") ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Folder className={`w-5 h-5 transition-colors ${pathname?.startsWith("/admin/groups") ? "text-primary" : "group-hover:text-primary"}`} />
                    {!isCollapsed && <span>{t("sidebar.groups")}</span>}
                  </Link>

                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.audit") : undefined}
                    href="/admin/audit"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/admin/audit") ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <ClipboardList className={`w-5 h-5 transition-colors ${pathname?.startsWith("/admin/audit") ? "text-primary" : "group-hover:text-primary"}`} />
                    {!isCollapsed && <span>{t("sidebar.audit")}</span>}
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className={`px-3 text-[11px] font-bold text-muted-foreground/70 tracking-widest uppercase transition-all duration-300 ${isCollapsed ? "opacity-0 h-0 overflow-hidden mb-0" : "opacity-100 mb-3"}`}>{t("sidebar.workspace")}</div>
                <div className="space-y-1">
                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.availableForms") : undefined}
                    href="/userForms"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/userForms" ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <ClipboardList className={`w-5 h-5 transition-colors ${pathname === "/userForms" ? "text-primary" : "group-hover:text-primary"}`} />
                    {!isCollapsed && <span>{t("sidebar.availableForms")}</span>}
                  </Link>

                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.mySubmissions") : undefined}
                    href="/submissions"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname?.startsWith("/submissions") ? "bg-success/10 text-success font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <FileText className={`w-5 h-5 transition-colors ${pathname?.startsWith("/submissions") ? "text-success" : "group-hover:text-success"}`} />
                    {!isCollapsed && <span>{t("sidebar.mySubmissions")}</span>}
                  </Link>

                  <Link onClick={() => setMobileOpen(false)} title={isCollapsed ? t("sidebar.profile") : undefined}
                    href="/profile"
                    className={`flex items-center py-2.5 rounded-lg transition-all font-medium text-sm group ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}  rounded-lg transition-all font-medium text-sm group ${
                      pathname === "/profile" ? "bg-warning/10 text-warning font-bold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <User className={`w-5 h-5 transition-colors ${pathname === "/profile" ? "text-warning" : "group-hover:text-warning"}`} />
                    {!isCollapsed && <span>{t("sidebar.profile")}</span>}
                  </Link>
                </div>
              </div>
            </>
          )}
        </nav>
      </div>

      {/* Bottom Section (Collapse + Logout) */}
      <div className="p-4 border-t border-border bg-card space-y-2">
        <button
          onClick={toggleCollapse}
          className={`hidden md:flex w-full items-center py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all font-medium text-sm ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}`}
          title={isCollapsed ? t("sidebar.expand", { defaultValue: "Expand" }) : undefined}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""} rtl:rotate-180 rtl:${isCollapsed ? "rotate-0" : ""}`} />
          {!isCollapsed && <span>{t("sidebar.collapse", { defaultValue: "Collapse Sidebar" })}</span>}
        </button>

        <button
          onClick={logout}
          className={`w-full flex items-center py-2.5 rounded-lg text-error hover:bg-error/10 hover:text-error transition-all font-medium text-sm text-start ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}`}
          title={isCollapsed ? t("sidebar.logout") : undefined}
        >
          <LogOut className="w-5 h-5 rtl:rotate-180 shrink-0" />
          {!isCollapsed && <span>{t("sidebar.logout")}</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
