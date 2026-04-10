import { useLocation, Link, Redirect } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard, FileText, FolderOpen, LogOut, BookOpen,
  Sun, Moon, ExternalLink, Book, Settings, Lightbulb, Library,
  Trash2, Users, ShieldCheck, ChevronRight, LayoutTemplate, UserCircle,
  Eye, UserCheck, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useViewAs } from "@/lib/view-as";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <Button size="icon" variant="ghost" onClick={toggle} data-testid="button-admin-theme">
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

function AdminSidebar() {
  const [location] = useLocation();
  const { logout, isAdmin, isModerator, hasPermission, user } = useAuth();
  const { viewAs, clearViewAs, viewMeMode, setViewMeMode } = useViewAs();

  const effectiveIsAdmin = viewAs ? (viewAs.role === "super_owner" || viewAs.role === "admin" || viewAs.role === "owner") : isAdmin;
  const effectiveIsModerator = viewAs ? viewAs.role === "moderator" : isModerator;
  const effectiveHasPermission = (section: string): boolean => {
    if (viewAs) {
      if (viewAs.role === "admin") return true;
      return (viewAs.permissions || []).includes(section);
    }
    return hasPermission(section);
  };

  const { data: allCategories } = useQuery<any[]>({
    queryKey: ["/api/categories?type=all"],
  });
  const storyCategories = allCategories?.filter(c => c.type === "story") ?? [];

  const isOnArticles = location.startsWith("/image/stories");
  const [articlesOpen, setArticlesOpen] = useState(isOnArticles);

  useEffect(() => {
    if (isOnArticles) setArticlesOpen(true);
  }, [isOnArticles]);

  type MenuItem = {
    key: string;
    title: string;
    href: string;
    icon: React.ElementType;
    isActive: (loc: string) => boolean;
    permission: string | null;
    type?: "collapsible";
  };

  const managementItems: MenuItem[] = [
    {
      key: "dashboard",
      title: "Dashboard",
      href: "/image",
      icon: LayoutDashboard,
      isActive: (loc) => loc === "/image",
      permission: null,
    },
    {
      key: "overview",
      title: "Overview",
      href: "/image/overview",
      icon: UserCircle,
      isActive: (loc) => loc.startsWith("/image/overview"),
      permission: "viewas-only",
    },
    {
      key: "categories",
      title: "Categories",
      href: "/image/categories",
      icon: FolderOpen,
      isActive: (loc) => loc.startsWith("/image/categories"),
      permission: "categories",
    },
    {
      key: "articles",
      title: "All Articles",
      href: "/image/stories",
      icon: Library,
      isActive: (loc) => loc.startsWith("/image/stories"),
      permission: "articles",
      type: "collapsible",
    },
    {
      key: "motivational",
      title: "Motivational Stories",
      href: "/image/motivational-stories",
      icon: Lightbulb,
      isActive: (loc) => loc.startsWith("/image/motivational-stories"),
      permission: "motivational-stories",
    },
    {
      key: "duas",
      title: "Duas",
      href: "/image/duas",
      icon: Moon,
      isActive: (loc) => loc.startsWith("/image/duas"),
      permission: "books",
    },
    {
      key: "books",
      title: "Books",
      href: "/image/books",
      icon: Book,
      isActive: (loc) => loc.startsWith("/image/books"),
      permission: "books",
    },
    {
      key: "users",
      title: "Users",
      href: "/image/users",
      icon: Users,
      isActive: (loc) => loc.startsWith("/image/users"),
      permission: "admin-only",
    },
    {
      key: "moderators",
      title: "Contributors",
      href: "/image/moderators",
      icon: ShieldCheck,
      isActive: (loc) => loc.startsWith("/image/moderators"),
      permission: "admin-only",
    },
    {
      key: "trash",
      title: "Trash",
      href: "/image/trash",
      icon: Trash2,
      isActive: (loc) => loc.startsWith("/image/trash"),
      permission: "trash",
    },
    {
      key: "footer",
      title: "Footer",
      href: "/image/footer",
      icon: LayoutTemplate,
      isActive: (loc) => loc.startsWith("/image/footer"),
      permission: "admin-only",
    },
    {
      key: "settings",
      title: "Settings",
      href: "/image/settings",
      icon: Settings,
      isActive: (loc) => loc.startsWith("/image/settings"),
      permission: "settings",
    },
  ];

  const isMod = (isModerator && !isAdmin) || !!viewAs;
  const visibleItems = managementItems.filter(item => {
    if (item.permission === null) return true;
    if (item.permission === "admin-only") return effectiveIsAdmin && !viewMeMode;
    if (item.permission === "staff-only") return effectiveIsAdmin || effectiveIsModerator || !!viewAs;
    if (item.permission === "viewas-only") return isMod;
    return effectiveHasPermission(item.permission);
  });

  const articlesAllActive = location.startsWith("/image/stories") &&
    !location.startsWith("/image/stories/category/");

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/image" className="flex items-center gap-2" data-testid="link-admin-home">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-serif font-semibold text-sm">Stories of Light</span>
            <p className="text-[10px] text-muted-foreground">Admin Panel</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {viewAs ? (
          <div className="mx-3 mt-2 mb-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2.5">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={viewAs.avatar_url ?? ""} alt={viewAs.name || viewAs.username} />
                <AvatarFallback className="text-[9px] bg-amber-100 text-amber-700">{(viewAs.name || viewAs.username).slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-100 truncate">{viewAs.name || viewAs.username}</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300 capitalize">{viewAs.role} View</p>
              </div>
              <button
                onClick={clearViewAs}
                title="View Me — Return to Admin"
                data-testid="button-view-me-admin"
                className="shrink-0 p-1 rounded-md text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (isModerator && !isAdmin) ? (
          <div className="mx-3 mt-2 mb-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2.5">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={user?.avatarUrl ?? ""} alt={user?.name || user?.username || ""} />
                <AvatarFallback className="text-[9px] bg-amber-100 text-amber-700">
                  {((user?.name || user?.username) ?? "M").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-100 truncate">{user?.name || user?.username}</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300">
                  {viewMeMode ? "View Me — Edit Mode" : "Moderator View"}
                </p>
              </div>
              <button
                onClick={() => setViewMeMode(!viewMeMode)}
                title={viewMeMode ? "Exit Edit Mode" : "View Me — Switch to Edit Mode"}
                data-testid="button-view-me-moderator"
                className={cn(
                  "shrink-0 p-1 rounded-md transition-colors",
                  viewMeMode
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800"
                )}
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                if (item.type === "collapsible") {
                  return (
                    <Collapsible key={item.key} open={articlesOpen} onOpenChange={setArticlesOpen}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            data-active={item.isActive(location)}
                            data-testid="link-admin-all-articles"
                            className="w-full"
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                            <ChevronRight className={cn(
                              "ml-auto w-4 h-4 transition-transform duration-200",
                              articlesOpen && "rotate-90"
                            )} />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild data-active={articlesAllActive}>
                                <Link href="/image/stories" data-testid="link-admin-all-stories">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>All Articles</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            {storyCategories.map((cat) => {
                              const catSlug = cat.urlSlug || cat.slug;
                              const href = `/image/stories/category/${catSlug}`;
                              return (
                                <SidebarMenuSubItem key={cat.id}>
                                  <SidebarMenuSubButton asChild data-active={location === href}>
                                    <Link href={href} data-testid={`link-admin-${cat.name.toLowerCase()}`}>
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>{cat.name}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild data-active={item.isActive(location)}>
                      <Link href={item.href} data-testid={`link-admin-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/" data-testid="link-admin-view-site">
                    <ExternalLink className="w-4 h-4" />
                    <span>View Site</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground mb-2 truncate">{user?.email || user?.username}</div>
        <Button variant="ghost" className="w-full justify-start" onClick={logout} data-testid="button-admin-logout">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isStaff } = useAuth();
  const { viewAs, clearViewAs, setViewAs, setViewMeMode } = useViewAs();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewasId = params.get("viewas");
    if (!viewasId) return;
    window.history.replaceState({}, "", window.location.pathname);
    fetch(`/api/admin/contributors/${viewasId}/stats`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.contributor) return;
        const c = data.contributor;
        setViewAs({ id: c.id, username: c.username, name: c.name, role: c.role, permissions: c.permissions, avatar_url: c.avatar_url });
        setViewMeMode(true);
      })
      .catch(() => {});
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/image/login" />;
  }

  if (!isStaff) {
    return <Redirect to="/" />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 p-3 border-b bg-background shrink-0">
            <SidebarTrigger data-testid="button-admin-sidebar-toggle" />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.username}</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

