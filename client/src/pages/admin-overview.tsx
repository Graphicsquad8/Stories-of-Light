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
  PieChart, Pie, Cell, RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
  FileText, BookOpen, Star, Eye, Users, CalendarDays,
  MessageSquare, ArrowLeft, ShieldCheck, Edit3, Layers,
  Activity, Bookmark, TrendingUp, BarChart2,
} from "lucide-react";
import { format } from "date-fns";

const ROLE_COLORS: Record<string, string> = {
  super_owner: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  owner:       "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  admin:       "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  editor:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  moderator:   "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

const ROLE_LABEL: Record<string, string> = {
  super_owner: "Super Owner",
  owner:       "Owner",
  admin:       "Admin",
  editor:      "Editor",
  moderator:   "Moderator",
};

const ROLE_DESCRIPTION: Record<string, string> = {
  super_owner: "Highest authority — full control over accounts, credentials, and all system configurations.",
  owner:       "Full site ownership — manages all content, contributors, settings, and configurations.",
  admin:       "Full site access — manages all content, users, settings, and configurations.",
  editor:      "Can publish and edit articles, duas, books, and motivational content.",
  moderator:   "Reviews content and manages user-reported issues.",
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_owner: ["Full System Access", "Credential Management", "Publish & Edit All Content", "Manage All Contributors", "Manage Users", "Site Settings", "Footer Management", "Trash & Restore"],
  owner:       ["Publish & Edit Articles", "Manage Duas", "Manage Books", "Manage Motivational Stories", "Manage Categories", "Manage Contributors", "Manage Users", "Site Settings", "Footer Management", "Trash & Restore"],
  admin:       ["Publish & Edit Articles", "Manage Duas", "Manage Books", "Manage Motivational Stories", "Manage Categories", "Manage Users & Moderators", "Site Settings", "Footer Management", "Trash & Restore"],
  editor:      ["Publish & Edit Articles", "Manage Duas", "Manage Books", "Manage Motivational Stories", "Manage Categories", "Trash & Restore"],
  moderator:   ["View Articles", "Manage Categories", "Trash & Restore"],
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
  userContent: {
    my_articles: string;
    my_published_articles: string;
    my_article_views: string;
    my_duas: string;
    my_dua_views: string;
    my_books: string;
    my_book_views: string;
    my_motivational: string;
    my_motivational_views: string;
  };
  siteStats: {
    total_articles: string;
    total_duas: string;
    total_books: string;
    total_motivational: string;
  };
}

function DonutRing({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const data = [
    { value: pct },
    { value: 100 - pct },
  ];
  return (
    <ResponsiveContainer width={56} height={56}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={18}
          outerRadius={26}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          strokeWidth={0}
        >
          <Cell fill={color} />
          <Cell fill="var(--muted)" opacity={0.3} />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function AdminOverviewPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user, isAdmin, isModerator } = useAuth();
  const { viewAs, clearViewAs } = useViewAs();

  const params = new URLSearchParams(search);
  const urlId = params.get("id");
  const viewingId = urlId || viewAs?.id || null;
  const subjectId = viewingId || user?.id;
  const isViewingOther = isAdmin && !!viewingId && viewingId !== user?.id;

  const { data, isLoading } = useQuery<ContributorStats>({
    queryKey: ["/api/admin/contributors", subjectId, "stats"],
    queryFn: () =>
      fetch(`/api/admin/contributors/${subjectId}/stats`, { credentials: "include" })
        .then((r) => r.json()),
    enabled: !!subjectId,
  });

  const c = data?.contributor;
  const uc = data?.userContent;
  const stats = data?.siteStats;

  const rolePerms = c?.role ? ROLE_PERMISSIONS[c.role] ?? [] : [];

  const myArticles   = parseInt(uc?.my_articles ?? "0");
  const myPublished  = parseInt(uc?.my_published_articles ?? "0");
  const myViews      = parseInt(uc?.my_article_views ?? "0") + parseInt(uc?.my_dua_views ?? "0") + parseInt(uc?.my_book_views ?? "0") + parseInt(uc?.my_motivational_views ?? "0");
  const myDuas       = parseInt(uc?.my_duas ?? "0");
  const myBooks      = parseInt(uc?.my_books ?? "0");
  const myMotivational = parseInt(uc?.my_motivational ?? "0");

  const totalSiteArticles = parseInt(stats?.total_articles ?? "1");
  const totalSiteDuas     = parseInt(stats?.total_duas ?? "1");
  const totalSiteBooks    = parseInt(stats?.total_books ?? "1");
  const totalSiteMotiv    = parseInt(stats?.total_motivational ?? "1");

  const barData = [
    { name: "Articles", mine: myArticles, site: totalSiteArticles },
    { name: "Duas",     mine: myDuas,     site: totalSiteDuas },
    { name: "Books",    mine: myBooks,    site: totalSiteBooks },
    { name: "Motiv.",   mine: myMotivational, site: totalSiteMotiv },
  ];

  const statCards = [
    { label: "My Articles", value: myArticles, max: totalSiteArticles, color: "#6366f1", sub: `${myPublished} published`, icon: FileText },
    { label: "Total Views", value: myViews, max: Math.max(myViews, 100), color: "#10b981", sub: "across all content", icon: Eye },
    { label: "My Duas", value: myDuas, max: totalSiteDuas, color: "#8b5cf6", sub: `of ${totalSiteDuas} site duas`, icon: MessageSquare },
    { label: "My Books", value: myBooks, max: totalSiteBooks, color: "#f59e0b", sub: `of ${totalSiteBooks} site books`, icon: BookOpen },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {isViewingOther && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Viewing Contributor Mode</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">You are viewing this contributor's overview as an admin.</p>
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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-overview-title">
              {isViewingOther ? "Contributor Overview" : "My Overview"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isViewingOther
                ? "Performance and profile of this contributor"
                : "Your activity and performance on Stories of Light"}
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(({ label, value, max, color, sub, icon: Icon }) => (
              <Card key={label} className="p-4 flex items-start justify-between gap-2" data-testid={`card-stat-${label.toLowerCase().replace(/ /g,"-")}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
                  <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
                </div>
                <div className="shrink-0">
                  <DonutRing value={value} max={max} color={color} />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Main Content Grid */}
        {isLoading || !c ? (
          <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-20 w-20 rounded-full mx-auto" />
              <Skeleton className="h-5 w-32 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-24 w-full" />
            </Card>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6">
            {/* Left: Profile */}
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={c.avatar_url ?? ""} alt={c.name || c.username} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {(c.name || c.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-bold text-lg">{c.name || c.username}</h2>
                    <p className="text-sm text-muted-foreground">@{c.username}</p>
                    <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full capitalize ${ROLE_COLORS[c.role] ?? "bg-muted text-muted-foreground"}`}>
                      {ROLE_LABEL[c.role] ?? c.role}
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
                    <span className="font-medium capitalize">{ROLE_LABEL[c.role] ?? c.role}</span>
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

            {/* Right: Content Stats + Chart */}
            <div className="space-y-4">
              {/* Content Overview */}
              <Card className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> My Content Overview
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Articles",            mine: myArticles,     total: totalSiteArticles, color: "bg-indigo-500" },
                    { label: "Duas",                mine: myDuas,          total: totalSiteDuas,     color: "bg-violet-500" },
                    { label: "Books",               mine: myBooks,         total: totalSiteBooks,    color: "bg-amber-500" },
                    { label: "Motivational Stories", mine: myMotivational, total: totalSiteMotiv,    color: "bg-emerald-500" },
                  ].map(({ label, mine, total, color }) => {
                    const pct = total > 0 ? Math.min(100, Math.round((mine / total) * 100)) : 0;
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{label}</span>
                          <span className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{mine}</span> / {total} site total
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Bar Chart: My vs Site */}
              <Card className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" /> Content Comparison
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barData} barSize={16} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
                      cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                    />
                    <Bar dataKey="mine" name="My Content" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="site"  name="Site Total" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2 justify-center">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-sm bg-indigo-500" /> My Content
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700" /> Site Total
                  </div>
                </div>
              </Card>

              {/* Content Accessible by Role */}
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> Content Accessible by Role
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Articles",             available: ["super_owner", "owner", "admin", "editor", "moderator"].includes(c.role), count: myArticles },
                    { label: "Duas",                 available: ["super_owner", "owner", "admin", "editor"].includes(c.role),              count: myDuas },
                    { label: "Books",                available: ["super_owner", "owner", "admin", "editor"].includes(c.role),              count: myBooks },
                    { label: "Motivational Stories", available: ["super_owner", "owner", "admin", "editor"].includes(c.role),              count: myMotivational },
                  ].map(({ label, available, count }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${available ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                        <span className={`text-sm ${available ? "" : "text-muted-foreground"}`}>{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{count.toLocaleString()}</span>
                        <Badge variant={available ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                          {available ? "Can Manage" : "No Access"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
