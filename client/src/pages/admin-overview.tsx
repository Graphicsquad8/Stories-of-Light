import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useViewAs } from "@/lib/view-as";
import { useState, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  FileText, BookOpen, Star, Eye, CalendarDays, MessageSquare,
  ArrowLeft, ShieldCheck, Layers, Activity, Bookmark,
  TrendingUp, ChevronDown, ChevronLeft, ChevronRight,
  Search, Users,
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
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  moderator: "Moderator",
};

const ROLE_DESCRIPTION: Record<string, string> = {
  super_owner: "Highest authority — full control over accounts, credentials, and all system configurations.",
  owner: "Full site ownership — manages all content, contributors, settings, and configurations.",
  admin: "Full site access — manages all content, users, settings, and configurations.",
  editor: "Can publish and edit articles, duas, books, and motivational content.",
  moderator: "Reviews content and manages user-reported issues.",
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_owner: ["Full System Access", "Credential Management", "Publish & Edit All Content", "Manage All Contributors", "Manage Users", "Site Settings", "Footer Management", "Trash & Restore"],
  owner: ["Publish & Edit Articles", "Manage Duas", "Manage Books", "Manage Motivational Stories", "Manage Categories", "Manage Contributors", "Manage Users", "Site Settings", "Footer Management", "Trash & Restore"],
  admin: ["Publish & Edit Articles", "Manage Duas", "Manage Books", "Manage Motivational Stories", "Manage Categories", "Manage Users & Moderators", "Site Settings", "Footer Management", "Trash & Restore"],
  editor: ["Publish & Edit Articles", "Manage Duas", "Manage Books", "Manage Motivational Stories", "Manage Categories", "Trash & Restore"],
  moderator: ["View Articles", "Manage Categories", "Trash & Restore"],
};

type ContentTab = "stories" | "duas" | "books" | "motivational";

const CONTENT_LABELS: Record<ContentTab, string> = {
  stories: "Articles",
  motivational: "Motivational",
  duas: "Duas",
  books: "Books",
};

const CONTENT_COLORS: Record<ContentTab, string> = {
  stories: "bg-primary",
  duas: "bg-violet-500",
  books: "bg-amber-500",
  motivational: "bg-emerald-500",
};

interface OverviewData {
  contributor: {
    id: string; username: string; name: string; email: string;
    role: string; permissions: string[] | null; avatar_url: string | null; created_at: string;
  };
  stats: {
    my_articles: string; my_published_articles: string;
    my_motivational: string; my_published_motivational: string;
    my_duas: string; my_books: string; total_views: string;
  };
  topContent: {
    stories: Array<{ id: string; title: string; slug: string; excerpt?: string | null; views: number; category_name?: string; category?: string; category_url_slug?: string }>;
    duas: Array<{ id: string; title: string; slug: string; description?: string | null; views: number; category?: string }>;
    books: Array<{ id: string; title: string; slug: string; description?: string | null; views: number; category?: string }>;
    motivational: Array<{ id: string; title: string; slug: string; description?: string | null; views: number; category?: string }>;
  };
  recentActivity: {
    stories: Array<{ id: string; title: string; slug: string; description?: string | null; status: string; updated_at: string; category_name?: string; category_url_slug?: string }>;
    duas: Array<{ id: string; title: string; slug: string; description?: string | null; status: string; updated_at: string; category_name?: string }>;
    books: Array<{ id: string; title: string; slug: string; description?: string | null; status: string; updated_at: string; category_name?: string }>;
    motivational: Array<{ id: string; title: string; slug: string; description?: string | null; status: string; updated_at: string; category_name?: string }>;
  };
  bookmarked: {
    stories: Array<{ id: string; title: string; slug: string; description?: string | null; bookmark_count: string }>;
    duas: Array<{ id: string; title: string; slug: string; description?: string | null; bookmark_count: string }>;
    books: Array<{ id: string; title: string; slug: string; description?: string | null; bookmark_count: string }>;
    motivational: Array<{ id: string; title: string; slug: string; description?: string | null; bookmark_count: string }>;
  };
  activeVisitors: Array<{
    id: string; username: string; name: string; email: string; avatar_url: string | null; created_at: string;
    reading_count: string; story_bookmarks: string; dua_bookmarks: string; book_bookmarks: string; motivational_bookmarks: string;
  }>;
}

function DonutRing({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const data = [{ value: pct }, { value: 100 - pct }];
  return (
    <ResponsiveContainer width={60} height={60}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={20} outerRadius={28} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
          <Cell fill={color} />
          <Cell fill="currentColor" className="text-muted/30" opacity={0.3} />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

function ProfileModal({ contributor, open, onClose }: {
  contributor: OverviewData["contributor"] | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const c = contributor;
  const rolePerms = c?.role ? ROLE_PERMISSIONS[c.role] ?? [] : [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Profile Overview</DialogTitle>
        </DialogHeader>
        {!c ? (
          <div className="space-y-3 py-2"><Skeleton className="h-20 w-20 rounded-full mx-auto" /><Skeleton className="h-5 w-32 mx-auto" /><Skeleton className="h-32 w-full" /></div>
        ) : (
          <div className="flex flex-col items-center gap-4 pt-1">
            <Avatar className="h-20 w-20">
              <AvatarImage src={c.avatar_url ?? ""} alt={c.name || c.username} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {(c.name || c.username).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-bold text-base">{c.name || c.username}</p>
              <p className="text-sm text-muted-foreground">@{c.username}</p>
              <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full capitalize ${ROLE_COLORS[c.role] ?? "bg-muted text-muted-foreground"}`}>
                {ROLE_LABEL[c.role] ?? c.role}
              </span>
            </div>
            <div className="w-full divide-y rounded-lg border text-sm">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-muted-foreground flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Email</span>
                <span className="font-medium truncate max-w-[160px]">{c.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-muted-foreground flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5" /> Joined</span>
                <span className="font-medium">{format(new Date(c.created_at), "d MMM yyyy")}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-muted-foreground flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Role</span>
                <span className="font-medium">{ROLE_LABEL[c.role] ?? c.role}</span>
              </div>
            </div>
            {rolePerms.length > 0 && (
              <div className="w-full rounded-lg border p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Permissions</p>
                <div className="space-y-1.5">
                  {rolePerms.map((perm) => (
                    <div key={perm} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TrendingCard({ item, category }: {
  item: { id: string; title: string; slug?: string; views: number; excerpt?: string | null; description?: string | null; category_name?: string; category?: string; category_url_slug?: string };
  category: ContentTab;
}) {
  const cat = item.category_name || item.category || "—";
  const blurb = item.excerpt || item.description || null;
  const slug = item.slug;
  let href = "#";
  if (slug) {
    if (category === "stories") href = `/${item.category_url_slug || "stories"}/${slug}`;
    else if (category === "duas") href = `/duas/${slug}`;
    else if (category === "books") href = `/books/${slug}`;
    else if (category === "motivational") href = `/motivational-stories/${slug}`;
  }
  return (
    <a href={href} className="border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all bg-card flex flex-col gap-2.5 min-h-[140px] cursor-pointer group" data-testid={`card-trending-${item.id}`}>
      <div className={`h-1.5 w-12 rounded-full ${CONTENT_COLORS[category]}`} />
      <div className="flex-1 flex flex-col gap-1">
        <p className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">{item.title}</p>
        {blurb && <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{blurb}</p>}
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-[80px]">{cat}</span>
        <span className="text-xs flex items-center gap-1 text-muted-foreground shrink-0"><Eye className="w-3 h-3" />{item.views ?? 0}</span>
      </div>
    </a>
  );
}

function ContentSlider({ title, icon: Icon, items, category, emptyText }: {
  title: string; icon: any;
  items: any[]; category: ContentTab; emptyText: string;
}) {
  const [idx, setIdx] = useState(0);
  const visible = items.slice(idx, idx + 3);
  const canBack = idx > 0;
  const canForward = idx + 3 < items.length;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <Icon className="w-4 h-4 text-primary" /> {title}
        </h3>
        <Badge variant="secondary" className="text-[11px]">{CONTENT_LABELS[category]}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{emptyText}</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {visible.map((item) => <TrendingCard key={item.id} item={item} category={category} />)}
            {visible.length < 3 && Array.from({ length: 3 - visible.length }).map((_, i) => (
              <div key={`empty-${i}`} className="border border-dashed rounded-xl min-h-[140px]" />
            ))}
          </div>
          {items.length > 3 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setIdx(s => Math.max(0, s - 1))} disabled={!canBack}><ChevronLeft className="w-4 h-4" /></Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.max(0, items.length - 2) }).map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-primary" : "bg-muted-foreground/30"}`} />
                ))}
              </div>
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setIdx(s => s + 1)} disabled={!canForward}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function TabbedSlider({ title, icon: Icon, data, field, emptyText }: {
  title: string; icon: any;
  data: OverviewData | undefined;
  field: "topContent" | "recentActivity" | "bookmarked";
  emptyText: string;
}) {
  const [tab, setTab] = useState<ContentTab>("stories");
  const [showDropdown, setShowDropdown] = useState(false);
  const [idx, setIdx] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false); }
    if (showDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  const rawItems: any[] = data?.[field]?.[tab] ?? [];
  const items = rawItems;
  const visible = items.slice(idx, idx + 3);
  const canBack = idx > 0;
  const canForward = idx + 3 < items.length;

  const handleTab = (t: ContentTab) => { setTab(t); setIdx(0); setShowDropdown(false); };

  const ADMIN_URLS: Record<ContentTab, string> = {
    stories: "/image/stories", duas: "/image/duas", books: "/image/books", motivational: "/image/motivational-stories",
  };

  const renderCard = (item: any) => {
    if (field === "recentActivity") {
      return (
        <a
          key={item.id}
          href={ADMIN_URLS[tab]}
          className="border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all bg-card flex flex-col gap-2 min-h-[140px] cursor-pointer group"
          data-testid={`card-activity-${item.id}`}
        >
          <div className={`h-1.5 w-12 rounded-full ${CONTENT_COLORS[tab]}`} />
          <p className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors flex-1">{item.title}</p>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-[80px]">{item.category_name || "—"}</span>
            <Badge variant={item.status === "published" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">{item.status}</Badge>
          </div>
        </a>
      );
    }
    if (field === "bookmarked") {
      return (
        <div key={item.id} className="border rounded-xl p-4 bg-card flex flex-col gap-2 min-h-[140px]" data-testid={`card-bookmarked-${item.id}`}>
          <div className={`h-1.5 w-12 rounded-full ${CONTENT_COLORS[tab]}`} />
          <p className="text-sm font-semibold line-clamp-2 flex-1">{item.title}</p>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">{item.description ? item.description.slice(0, 30) + "…" : "—"}</span>
            <span className="text-xs flex items-center gap-1 text-muted-foreground shrink-0"><Bookmark className="w-3 h-3" />{item.bookmark_count}</span>
          </div>
        </div>
      );
    }
    return <TrendingCard key={item.id} item={item} category={tab} />;
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <Icon className="w-4 h-4 text-primary" /> {title}
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[11px]">{CONTENT_LABELS[tab]}</Badge>
          <div className="relative" ref={dropdownRef}>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowDropdown(v => !v)}>
              View All <ChevronDown className="w-3 h-3" />
            </Button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-lg shadow-md py-1 min-w-[140px]">
                {(Object.keys(CONTENT_LABELS) as ContentTab[]).map((t) => (
                  <button
                    key={t}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${tab === t ? "font-semibold text-primary" : ""}`}
                    onClick={() => handleTab(t)}
                  >
                    {CONTENT_LABELS[t]}
                    {tab === t && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{emptyText}</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {visible.map((item) => renderCard(item))}
            {visible.length < 3 && Array.from({ length: 3 - visible.length }).map((_, i) => (
              <div key={`empty-${i}`} className="border border-dashed rounded-xl min-h-[140px]" />
            ))}
          </div>
          {items.length > 3 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setIdx(s => Math.max(0, s - 1))} disabled={!canBack}><ChevronLeft className="w-4 h-4" /></Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.max(0, items.length - 2) }).map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-primary" : "bg-muted-foreground/30"}`} />
                ))}
              </div>
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setIdx(s => s + 1)} disabled={!canForward}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default function AdminOverviewPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user, isAdmin } = useAuth();
  const { viewAs } = useViewAs();
  const [profileOpen, setProfileOpen] = useState(false);

  const params = new URLSearchParams(search);
  const urlId = params.get("id");
  const viewingId = urlId || viewAs?.id || null;
  const subjectId = viewingId || user?.id;
  const isViewingOther = isAdmin && !!viewingId && viewingId !== user?.id;

  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["/api/admin/contributors", subjectId, "overview"],
    queryFn: () =>
      fetch(`/api/admin/contributors/${subjectId}/overview`, { credentials: "include" })
        .then((r) => r.json()),
    enabled: !!subjectId,
  });

  const c = data?.contributor;
  const stats = data?.stats;

  const myArticles     = parseInt(stats?.my_articles ?? "0");
  const myPublished    = parseInt(stats?.my_published_articles ?? "0");
  const myMotivational = parseInt(stats?.my_motivational ?? "0");
  const myPublishedMotiv = parseInt(stats?.my_published_motivational ?? "0");
  const myDuas         = parseInt(stats?.my_duas ?? "0");
  const myBooks        = parseInt(stats?.my_books ?? "0");
  const totalViews     = parseInt(stats?.total_views ?? "0");

  const rolePerms = c?.role ? ROLE_PERMISSIONS[c.role] ?? [] : [];

  const statCards = [
    { label: "My Articles",     value: myArticles,     color: "#6366f1", sub: `${myPublished} published`,       icon: FileText },
    { label: "My Motivational", value: myMotivational, color: "#10b981", sub: `${myPublishedMotiv} published`,  icon: Star },
    { label: "My Duas",         value: myDuas,          color: "#8b5cf6", sub: "total duas uploaded",           icon: MessageSquare },
    { label: "My Books",        value: myBooks,         color: "#f59e0b", sub: "total books uploaded",          icon: BookOpen },
    { label: "Total Views",     value: totalViews,      color: "#06b6d4", sub: "across all content",            icon: Eye },
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
            <Button variant="outline" size="sm" className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100" onClick={() => navigate("/image")} data-testid="button-exit-contributor-mode">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Dashboard
            </Button>
          </div>
        )}

        {/* Header: Search + Profile */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search content..." className="pl-9 h-9 text-sm" data-testid="input-overview-search" />
          </div>
          <div className="ml-auto">
            {isLoading || !c ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div>
              </div>
            ) : (
              <button
                className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                onClick={() => setProfileOpen(true)}
                data-testid="button-overview-profile"
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={c.avatar_url ?? ""} alt={c.name || c.username} />
                  <AvatarFallback className="text-sm bg-primary/10 text-primary">
                    {(c.name || c.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="text-sm font-semibold leading-tight">{c.name || c.username}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{c.email}</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Stat Cards — 5 */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map(({ label, value, color, sub, icon: Icon }) => (
              <Card key={label} className="p-4 flex items-start justify-between gap-2" data-testid={`card-stat-${label.toLowerCase().replace(/ /g, "-")}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground font-medium mb-1">{label}</p>
                  <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{sub}</p>
                </div>
                <div className="shrink-0">
                  <DonutRing value={value} max={Math.max(value, 1)} color={color} />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Dashboard-style two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_8fr] gap-6">
          {/* ─── LEFT COLUMN ─── */}
          <div className="space-y-4">
            {/* Access Permissions */}
            <Card className="p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Access Permissions
              </h3>
              {isLoading || !c ? (
                <div className="space-y-2">{[1,2,3,4].map(i=><Skeleton key={i} className="h-5 w-full"/>)}</div>
              ) : (
                <div className="space-y-1.5">
                  {rolePerms.map((perm) => (
                    <div key={perm} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{perm}</span>
                    </div>
                  ))}
                  {rolePerms.length === 0 && <p className="text-xs text-muted-foreground">No special permissions configured.</p>}
                </div>
              )}
            </Card>

            {/* My Content Overview (progress bars) */}
            <Card className="p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> My Content Overview
              </h3>
              {isLoading ? (
                <div className="space-y-4">{[1,2,3,4].map(i=><Skeleton key={i} className="h-8 w-full"/>)}</div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "Articles",             value: myArticles,     color: "bg-indigo-500" },
                    { label: "Duas",                 value: myDuas,          color: "bg-violet-500" },
                    { label: "Books",                value: myBooks,         color: "bg-amber-500" },
                    { label: "Motivational Stories", value: myMotivational, color: "bg-emerald-500" },
                  ].map(({ label, value, color }) => {
                    const total = myArticles + myDuas + myBooks + myMotivational;
                    const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium">{label}</span>
                          <span className="text-xs text-muted-foreground">{value}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Active Visitors */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> Active Visitors
              </h3>
              {isLoading ? (
                <div className="space-y-2">{[1,2,3,4,5].map(i=><Skeleton key={i} className="h-8 w-full"/>)}</div>
              ) : (data?.activeVisitors ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No visitor activity yet</p>
              ) : (
                <div className="space-y-0.5">
                  {(data?.activeVisitors ?? []).map((u, i) => {
                    const saved = parseInt(u.story_bookmarks) + parseInt(u.dua_bookmarks) + parseInt(u.book_bookmarks) + parseInt(u.motivational_bookmarks);
                    return (
                      <div key={u.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors" data-testid={`row-visitor-${u.id}`}>
                        <span className="text-[10px] font-bold text-muted-foreground w-4 text-center shrink-0">{i + 1}</span>
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage src={u.avatar_url ?? ""} alt={u.name || u.username} />
                          <AvatarFallback className="text-[9px]">{(u.name || u.username).slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{u.name || u.username}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-muted-foreground">{u.reading_count} read</span>
                          <span className="text-[10px] text-amber-600">{saved} saved</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
              </>
            ) : (
              <>
                <TabbedSlider title="Trending Content" icon={TrendingUp} data={data} field="topContent" emptyText="No content uploaded yet" />
                <TabbedSlider title="Recent Activity" icon={Activity} data={data} field="recentActivity" emptyText="No recent activity" />
                <TabbedSlider title="Most Bookmarked" icon={Bookmark} data={data} field="bookmarked" emptyText="No bookmarks on your content yet" />
              </>
            )}
          </div>
        </div>

        <ProfileModal contributor={c} open={profileOpen} onClose={() => setProfileOpen(false)} />
      </div>
    </AdminLayout>
  );
}
