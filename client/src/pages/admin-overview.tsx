import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useViewAs } from "@/lib/view-as";
import {
  FileText, BookOpen, Star, Eye, Users, CalendarDays,
  MessageSquare, ArrowLeft, ShieldCheck, Edit3, Layers,
  Activity, Bookmark,
} from "lucide-react";
import { format } from "date-fns";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  editor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  moderator: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

const ROLE_DESCRIPTION: Record<string, string> = {
  admin: "Full site access — manages all content, users, settings, and configurations.",
  editor: "Can publish and edit articles, duas, books, and motivational content.",
  moderator: "Reviews content and manages user-reported issues.",
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["Publish & Edit Articles", "Manage Duas", "Manage Books", "Manage Motivational Stories", "Manage Categories", "Manage Users & Moderators", "Site Settings", "Footer Management", "Trash & Restore"],
  editor: ["Publish & Edit Articles", "Manage Duas", "Manage Books", "Manage Motivational Stories", "Manage Categories", "Trash & Restore"],
  moderator: ["View Articles", "Manage Categories", "Trash & Restore"],
};

interface ContributorStats {
  contributor: {
    id: string;
    username: string;
    name: string;
    email: string;
    role: string;
    permissions: string[] | null;
    avatar_url: string | null;
    created_at: string;
  };
  siteStats: {
    total_articles: string;
    total_duas: string;
    total_books: string;
    total_motivational: string;
  };
}

export default function AdminOverviewPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user, isAdmin } = useAuth();
  const { viewAs, clearViewAs } = useViewAs();

  const params = new URLSearchParams(search);
  const urlId = params.get("id");
  const viewingId = urlId || viewAs?.id || null;
  const subjectId = viewingId || user?.id;
  const isViewingOther = isAdmin && !!viewingId && viewingId !== user?.id;

  if (user && !isAdmin && !viewAs) {
    navigate("/image");
    return null;
  }

  const { data, isLoading } = useQuery<ContributorStats>({
    queryKey: ["/api/admin/contributors", subjectId, "stats"],
    queryFn: () =>
      fetch(`/api/admin/contributors/${subjectId}/stats`, { credentials: "include" })
        .then((r) => r.json()),
    enabled: !!subjectId,
  });

  const c = data?.contributor;
  const stats = data?.siteStats;

  const rolePerms = c?.role ? ROLE_PERMISSIONS[c.role] ?? [] : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {isViewingOther && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Viewing Contributor Mode
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                You are viewing this contributor's overview as an admin.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100"
              onClick={() => navigate("/image")}
              data-testid="button-exit-contributor-mode"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Dashboard
            </Button>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isViewingOther ? "Contributor Overview" : "My Overview"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isViewingOther
              ? "Performance and profile of this contributor"
              : "Your activity and performance on Stories of Light"}
          </p>
        </div>

        {isLoading || !c ? (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-20 w-20 rounded-full mx-auto" />
              <Skeleton className="h-5 w-32 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-24 w-full" />
            </Card>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={c.avatar_url ?? ""} alt={c.name || c.username} />
                    <AvatarFallback className="text-2xl">
                      {(c.name || c.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-bold text-lg">{c.name || c.username}</h2>
                    <p className="text-sm text-muted-foreground">@{c.username}</p>
                    <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full capitalize ${ROLE_COLORS[c.role] ?? "bg-muted text-muted-foreground"}`}>
                      {c.role}
                    </span>
                  </div>
                </div>
                <div className="mt-5 divide-y rounded-lg border text-sm">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" /> Email
                    </span>
                    <span className="font-medium truncate max-w-[160px]">{c.email || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5" /> Joined
                    </span>
                    <span className="font-medium">{format(new Date(c.created_at), "d MMM yyyy")}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> Role
                    </span>
                    <span className="font-medium capitalize">{c.role}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-2">Role Description</h3>
                <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTION[c.role] ?? "Site staff member."}</p>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Access Permissions
                </h3>
                <div className="space-y-1.5">
                  {rolePerms.map((perm) => (
                    <div key={perm} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{perm}</span>
                    </div>
                  ))}
                  {rolePerms.length === 0 && (
                    <p className="text-xs text-muted-foreground">No special permissions configured.</p>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Site Content Overview
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Total content published on the site that this contributor can manage.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total Articles", value: stats?.total_articles ?? "0", icon: FileText, color: "text-primary", bg: "bg-primary/10" },
                    { label: "Total Duas", value: stats?.total_duas ?? "0", icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-500/10" },
                    { label: "Total Books", value: stats?.total_books ?? "0", icon: BookOpen, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { label: "Motivational", value: stats?.total_motivational ?? "0", icon: Star, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <Card key={label} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-lg ${bg}`}>
                          <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                      </div>
                      <p className="text-2xl font-bold">{parseInt(value).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </Card>
                  ))}
                </div>
              </div>

              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> Content Accessible by Role
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Articles", available: ["admin", "editor", "moderator"].includes(c.role), count: stats?.total_articles ?? "0" },
                    { label: "Duas", available: ["admin", "editor"].includes(c.role), count: stats?.total_duas ?? "0" },
                    { label: "Books", available: ["admin", "editor"].includes(c.role), count: stats?.total_books ?? "0" },
                    { label: "Motivational Stories", available: ["admin", "editor"].includes(c.role), count: stats?.total_motivational ?? "0" },
                  ].map(({ label, available, count }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${available ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                        <span className={`text-sm ${available ? "" : "text-muted-foreground"}`}>{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{parseInt(count).toLocaleString()}</span>
                        <Badge variant={available ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                          {available ? "Can Manage" : "No Access"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" /> Performance Note
                </h3>
                <p className="text-sm text-muted-foreground">
                  Per-contributor content tracking (individual article view counts and publishing history)
                  will be available in a future update once author attribution is enabled across content types.
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
