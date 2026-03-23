import { Link, Redirect } from "wouter";
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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard, BookmarkIcon, BookOpen, Star, FolderOpen,
  Settings, LogOut, Sun, Moon, ArrowLeft,
  Lightbulb, User,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
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
    <Button size="icon" variant="ghost" onClick={toggle} title="Toggle theme" data-testid="button-user-theme">
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

function UserSidebar({
  activeSection,
  onNavigate,
}: {
  activeSection: string;
  onNavigate: (section: string) => void;
}) {
  const { user, logout } = useAuth();
  const isSettingsActive = activeSection.startsWith("settings");

  const mainItems = [
    { key: "overview", title: "Overview", icon: LayoutDashboard },
    { key: "bookmarks", title: "Bookmarks", icon: BookmarkIcon },
    { key: "saved-stories", title: "Saved Stories", icon: Lightbulb },
    { key: "duas", title: "Dua", icon: Moon },
    { key: "books", title: "My Books", icon: BookOpen },
    { key: "ratings", title: "Ratings", icon: Star },
    { key: "interests", title: "Interests", icon: FolderOpen },
  ];

  const initials = (user?.name || user?.username || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" data-testid="link-user-home">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-serif font-semibold text-sm">Stories of Light</span>
              <p className="text-[10px] text-muted-foreground">My Dashboard</p>
            </div>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    data-active={activeSection === item.key}
                    onClick={() => onNavigate(item.key)}
                    className="cursor-pointer"
                    data-testid={`nav-${item.key}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                <SidebarMenuButton
                  data-active={isSettingsActive}
                  onClick={() => onNavigate("settings")}
                  className="cursor-pointer"
                  data-testid="nav-settings"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t space-y-2">
        <div className="flex items-center gap-3 px-1 py-2 rounded-lg">
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarImage src={user?.avatarUrl || undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name || user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link href="/" className="flex-1">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" data-testid="button-back-to-site">
              <ArrowLeft className="w-4 h-4" />
              Back to site
            </Button>
          </Link>
          <ThemeToggle />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logout().then(() => window.location.href = "/")}
            title="Sign out"
            data-testid="button-user-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

interface UserLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onNavigate: (section: string) => void;
  title: string;
}

export function UserLayout({ children, activeSection, onNavigate, title }: UserLayoutProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.role === "admin" || user.role === "moderator") {
    return <Redirect to="/image" />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar activeSection={activeSection} onNavigate={onNavigate} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center gap-3 px-4 shrink-0 sticky top-0 z-10">
            <SidebarTrigger className="shrink-0" data-testid="button-sidebar-toggle" />
            <div className="h-4 w-px bg-border shrink-0" />
            <h1 className="font-semibold text-base truncate" data-testid="text-section-title">{title}</h1>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
