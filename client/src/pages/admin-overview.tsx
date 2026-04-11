import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useViewAs } from "@/lib/view-as";
import { useState, useRef, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  FileText, BookOpen, Star, Eye, CalendarDays, MessageSquare,
  ArrowLeft, ShieldCheck, Layers, Activity, Bookmark,
  TrendingUp, ChevronDown, ChevronLeft, ChevronRight,
  Search, Users, Camera, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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

const ADMIN_URLS: Record<ContentTab, string> = {
  stories: "/image/stories",
  duas: "/image/duas",
  books: "/image/books",
  motivational: "/image/motivational-stories",
};

interface OverviewData {
  contributor: {
    id: string; username: string; name: string; email: string;
    role: string; permissions: string[] | null; avatar_url: string | null; created_at: string;
  };
  stats: {
    my_articles: string; my_published_articles: string; my_article_views: string;
    my_motivational: string; my_published_motivational: string; my_motivational_views: string;
    my_duas: string; my_dua_views: string;
    my_books: string; my_book_views: string;
    total_views: string;
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

function DonutRing({ value, color }: { value: number; color: string }) {
  const pct = value > 0 ? 75 : 0;
  const data = [{ value: pct }, { value: 100 - pct }];
  return (
    <ResponsiveContainer width={58} height={58}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={19} outerRadius={27} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
          <Cell fill={color} />
          <Cell fill="#e2e8f0" />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

function TrendingCard({ item, category }: {
  item: { id: string; title: string; slug?: string; views?: number; excerpt?: string | null; description?: string | null; category_name?: string; category?: string; category_url_slug?: string };
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
    <a href={href} className="border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all bg-card flex flex-col gap-2 min-h-[130px] cursor-pointer group" data-testid={`card-trending-${item.id}`}>
      <div className={`h-1.5 w-10 rounded-full ${CONTENT_COLORS[category]}`} />
      <p className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors flex-1">{item.title}</p>
      {blurb && <p className="text-[11px] text-muted-foreground line-clamp-1">{blurb}</p>}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full truncate max-w-[70px]">{cat}</span>
        <span className="text-xs flex items-center gap-1 text-muted-foreground"><Eye className="w-3 h-3" />{item.views ?? 0}</span>
      </div>
    </a>
  );
}

function BookmarkCard({ item, category }: {
  item: { id: string; title: string; description?: string | null; bookmark_count: string };
  category: ContentTab;
}) {
  return (
    <div className="border rounded-xl p-4 bg-card flex flex-col gap-2 min-h-[130px]" data-testid={`card-bookmarked-${item.id}`}>
      <div className={`h-1.5 w-10 rounded-full ${CONTENT_COLORS[category]}`} />
      <p className="text-sm font-semibold line-clamp-2 flex-1">{item.title}</p>
      <div className="flex items-center justify-end">
        <span className="text-xs flex items-center gap-1 text-muted-foreground"><Bookmark className="w-3 h-3" />{item.bookmark_count}</span>
      </div>
    </div>
  );
}

function ActivityCard({ item, category }: {
  item: { id: string; title: string; status: string; category_name?: string; updated_at: string };
  category: ContentTab;
}) {
  return (
    <a href={ADMIN_URLS[category]} className="border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all bg-card flex flex-col gap-2 min-h-[130px] cursor-pointer group" data-testid={`card-activity-${item.id}`}>
      <div className={`h-1.5 w-10 rounded-full ${CONTENT_COLORS[category]}`} />
      <p className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors flex-1">{item.title}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full truncate max-w-[70px]">{item.category_name || "—"}</span>
        <Badge variant={item.status === "published" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">{item.status}</Badge>
      </div>
    </a>
  );
}

function ContentSection({ title, icon: Icon, items, category, renderCard, emptyText }: {
  title: string; icon: any; items: any[]; category: ContentTab;
  renderCard: (item: any, cat: ContentTab) => React.ReactNode;
  emptyText: string;
}) {
  const [idx, setIdx] = useState(0);
  const visible = items.slice(idx, idx + 3);
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2 text-sm"><Icon className="w-4 h-4 text-primary" /> {title}</h3>
        <Badge variant="secondary" className="text-[11px]">{CONTENT_LABELS[category]}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{emptyText}</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {visible.map((item) => renderCard(item, category))}
            {visible.length < 3 && Array.from({ length: 3 - visible.length }).map((_, i) => (
              <div key={`e-${i}`} className="border border-dashed rounded-xl min-h-[130px]" />
            ))}
          </div>
          {items.length > 3 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setIdx(s => Math.max(0, s - 1))} disabled={idx === 0}><ChevronLeft className="w-4 h-4" /></Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.max(0, items.length - 2) }).map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-primary" : "bg-muted-foreground/30"}`} />
                ))}
              </div>
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setIdx(s => s + 1)} disabled={idx + 3 >= items.length}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function TabbedSection({ title, icon: Icon, data, field, emptyText }: {
  title: string; icon: any;
  data: OverviewData | undefined;
  field: "topContent" | "recentActivity" | "bookmarked";
  emptyText: string;
}) {
  const [tab, setTab] = useState<ContentTab>("stories");
  const [idx, setIdx] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false); }
    if (showDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  const items: any[] = data?.[field]?.[tab] ?? [];
  const visible = items.slice(idx, idx + 3);
  const handleTab = (t: ContentTab) => { setTab(t); setIdx(0); setShowDropdown(false); };

  const renderItem = (item: any) => {
    if (field === "topContent") return <TrendingCard key={item.id} item={item} category={tab} />;
    if (field === "recentActivity") return <ActivityCard key={item.id} item={item} category={tab} />;
    return <BookmarkCard key={item.id} item={item} category={tab} />;
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2 text-sm"><Icon className="w-4 h-4 text-primary" /> {title}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[11px]">{CONTENT_LABELS[tab]}</Badge>
          <div className="relative" ref={dropdownRef}>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowDropdown(v => !v)}>
              View All <ChevronDown className="w-3 h-3" />
            </Button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-lg shadow-md py-1 min-w-[130px]">
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
            {visible.map((item) => renderItem(item))}
            {visible.length < 3 && Array.from({ length: 3 - visible.length }).map((_, i) => (
              <div key={`e-${i}`} className="border border-dashed rounded-xl min-h-[130px]" />
            ))}
          </div>
          {items.length > 3 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setIdx(s => Math.max(0, s - 1))} disabled={idx === 0}><ChevronLeft className="w-4 h-4" /></Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.max(0, items.length - 2) }).map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-primary" : "bg-muted-foreground/30"}`} />
                ))}
              </div>
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setIdx(s => s + 1)} disabled={idx + 3 >= items.length}><ChevronRight className="w-4 h-4" /></Button>
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const params = new URLSearchParams(search);
  const urlId = params.get("id");
  const viewingId = urlId || viewAs?.id || null;
  const subjectId = viewingId || user?.id;
  const isViewingOther = isAdmin && !!viewingId && viewingId !== user?.id;
  const canUploadAvatar = !isViewingOther;

  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["/api/admin/contributors", subjectId, "overview"],
    queryFn: () =>
      fetch(`/api/admin/contributors/${subjectId}/overview`, { credentials: "include" })
        .then((r) => r.json()),
    enabled: !!subjectId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("avatar", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contributors", subjectId, "overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile photo updated" });
    },
    onError: () => toast({ title: "Upload failed", description: "Could not update profile photo.", variant: "destructive" }),
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
    e.target.value = "";
  }, [avatarMutation]);

  const c = data?.contributor;
  const stats = data?.stats;

  const myArticles        = parseInt(stats?.my_articles ?? "0");
  const myPublished       = parseInt(stats?.my_published_articles ?? "0");
  const myArticleViews    = parseInt(stats?.my_article_views ?? "0");
  const myMotivational    = parseInt(stats?.my_motivational ?? "0");
  const myPublishedMotiv  = parseInt(stats?.my_published_motivational ?? "0");
  const myMotivViews      = parseInt(stats?.my_motivational_views ?? "0");
  const myDuas            = parseInt(stats?.my_duas ?? "0");
  const myDuaViews        = parseInt(stats?.my_dua_views ?? "0");
  const myBooks           = parseInt(stats?.my_books ?? "0");
  const myBookViews       = parseInt(stats?.my_book_views ?? "0");
  const totalViews        = parseInt(stats?.total_views ?? "0");

  const rolePerms = c?.role ? ROLE_PERMISSIONS[c.role] ?? [] : [];

  const statCards = [
    { label: "My Articles",     value: myArticles,     color: "#6366f1", sub: `${myPublished} published`,        icon: FileText },
    { label: "My Motivational", value: myMotivational,  color: "#10b981", sub: `${myPublishedMotiv} published`,  icon: Star },
    { label: "My Duas",         value: myDuas,           color: "#8b5cf6", sub: "total duas uploaded",           icon: MessageSquare },
    { label: "My Books",        value: myBooks,          color: "#f59e0b", sub: "total books uploaded",          icon: BookOpen },
    { label: "Total Views",     value: totalViews,       color: "#06b6d4", sub: "across all content",            icon: Eye },
  ];

  const totalOwn = myArticles + myDuas + myBooks + myMotivational;

  return (
    <AdminLayout>
      <div className="space-y-5">
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

        {/* ── Boxed Header ── */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search content..." className="pl-9 h-9 text-sm bg-muted/40 border-muted" data-testid="input-overview-search" />
            </div>

            <div className="ml-auto flex items-center gap-3">
              {isLoading || !c ? (
                <>
                  <div className="text-right space-y-1"><Skeleton className="h-4 w-24 ml-auto" /><Skeleton className="h-3 w-32 ml-auto" /></div>
                  <Skeleton className="h-11 w-11 rounded-full" />
                </>
              ) : (
                <>
                  <div className="text-right">
                    <p className="text-sm font-semibold leading-tight">{c.name || c.username}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{c.email}</p>
                    <span className={`inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[c.role] ?? "bg-muted text-muted-foreground"}`}>
                      {ROLE_LABEL[c.role] ?? c.role}
                    </span>
                  </div>
                  <div className="relative shrink-0">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={c.avatar_url ?? ""} alt={c.name || c.username} />
                      <AvatarFallback className="text-base bg-primary/10 text-primary">
                        {(c.name || c.username).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {canUploadAvatar && (
                      <button
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                        onClick={() => fileInputRef.current?.click()}
                        title="Change profile photo"
                        data-testid="button-avatar-upload"
                        disabled={avatarMutation.isPending}
                      >
                        {avatarMutation.isPending
                          ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                          : <Camera className="w-4 h-4 text-white" />}
                      </button>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* ── 5 Stat Cards ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map(({ label, value, color, sub, icon: Icon }) => (
              <Card key={label} className="p-4 flex items-start justify-between gap-2" data-testid={`card-stat-${label.toLowerCase().replace(/ /g, "-")}`}>
                <div className="flex-1 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2`} style={{ backgroundColor: `${color}20` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium mb-0.5">{label}</p>
                  <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{sub}</p>
                </div>
                <DonutRing value={value} color={color} />
              </Card>
            ))}
          </div>
        )}

        {/* ── Main two-column dashboard layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[8fr_4fr] gap-5">

          {/* ─── LEFT: Content Sections ─── */}
          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-60 w-full rounded-xl" />
                <Skeleton className="h-60 w-full rounded-xl" />
                <Skeleton className="h-60 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </>
            ) : (
              <>
                <TabbedSection title="Trending Content" icon={TrendingUp} data={data} field="topContent" emptyText="No content uploaded yet" />
                <TabbedSection title="Recent Activity" icon={Activity} data={data} field="recentActivity" emptyText="No recent activity" />
                <TabbedSection title="Most Bookmarked" icon={Bookmark} data={data} field="bookmarked" emptyText="No bookmarks on your content yet" />

                {/* My Content Overview */}
                <Card className="p-5">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> My Content Overview
                  </h3>
                  {/* Header row */}
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</span>
                    <div className="flex gap-8">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-12 text-right">Count</span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-12 text-right">Views</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { label: "Articles",             count: myArticles,     views: myArticleViews,  dot: "bg-indigo-500" },
                      { label: "Duas",                 count: myDuas,          views: myDuaViews,      dot: "bg-violet-500" },
                      { label: "Books",                count: myBooks,         views: myBookViews,     dot: "bg-amber-500" },
                      { label: "Motivational Stories", count: myMotivational,  views: myMotivViews,    dot: "bg-emerald-500" },
                    ].map(({ label, count, views, dot }) => (
                      <div key={label} className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                          <span className="text-sm font-medium truncate">{label}</span>
                        </div>
                        <div className="flex gap-8 shrink-0">
                          <span className="text-sm font-semibold w-12 text-right" data-testid={`count-${label.toLowerCase().replace(/\s+/g, "-")}`}>{count.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground w-12 text-right" data-testid={`views-${label.toLowerCase().replace(/\s+/g, "-")}`}>{views.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Totals footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t px-1">
                    <span className="text-xs font-semibold text-muted-foreground">Total</span>
                    <div className="flex gap-8 shrink-0">
                      <span className="text-sm font-bold w-12 text-right" data-testid="count-total">{totalOwn.toLocaleString()}</span>
                      <span className="text-sm font-bold w-12 text-right" data-testid="views-total">{totalViews.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>

          {/* ─── RIGHT: Permissions + Active Visitors ─── */}
          <div className="space-y-4">
            {/* Access Permissions */}
            <Card className="p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Access Permissions
              </h3>
              {isLoading || !c ? (
                <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-5 w-full" />)}</div>
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

            {/* Active Visitors */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> Active Visitors
                {!isLoading && (data?.activeVisitors ?? []).length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground font-normal">top {(data?.activeVisitors ?? []).length}</span>
                )}
              </h3>
              {isLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
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
                        <div className="flex flex-col items-end gap-0 shrink-0">
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
        </div>
      </div>
    </AdminLayout>
  );
}
