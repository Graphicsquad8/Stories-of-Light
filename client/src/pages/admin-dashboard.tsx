import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  BookOpen,
  Star,
  Users,
  Eye,
  Bookmark,
  TrendingUp,
  BarChart2,
  PieChart as PieChartIcon,
  List,
  Activity,
  MessageSquare,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { format } from "date-fns";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#14b8a6"];

interface Contributor {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

interface ActiveUser {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  bookmark_count: string;
  reading_count: string;
}

interface DashboardData {
  content: {
    stories: { total: number; published: number; drafts: number };
    motivational: { total: number; published: number };
    duas: { total: number; published: number };
    books: { total: number; free: number; paid: number };
    users: { total: number };
  };
  totalViews: number;
  topContent: {
    stories: Array<{ id: string; title: string; excerpt: string | null; views: number; average_rating: string; category_name: string }>;
    duas: Array<{ id: string; title: string; description: string | null; views: number; category: string }>;
    books: Array<{ id: string; title: string; description: string | null; views: number; average_rating: string; category: string }>;
    motivational: Array<{ id: string; title: string; description: string | null; views: number; average_rating: string; category: string }>;
  };
  bookmarked: {
    stories: Array<{ id: string; title: string; description: string | null; bookmark_count: string }>;
    duas: Array<{ id: string; title: string; description: string | null; bookmark_count: string }>;
    books: Array<{ id: string; title: string; description: string | null; bookmark_count: string }>;
    motivational: Array<{ id: string; title: string; description: string | null; bookmark_count: string }>;
  };
  categories: Array<{ name: string; url_slug: string; story_count: string }>;
  userGrowth: Array<{ month: string; year_month: string; count: string }>;
  recentActivity: {
    stories: Array<{ id: string; title: string; description: string | null; status: string; updated_at: string; category_name: string }>;
    duas: Array<{ id: string; title: string; description: string | null; status: string; updated_at: string; category_name: string }>;
    books: Array<{ id: string; title: string; description: string | null; status: string; updated_at: string; category_name: string }>;
    motivational: Array<{ id: string; title: string; description: string | null; status: string; updated_at: string; category_name: string }>;
  };
  topContributors: Contributor[];
  activeUsers: ActiveUser[];
}

function StatCard({
  label, value, sub, icon: Icon, color, href, isLoading,
}: {
  label: string; value?: number | string; sub?: string; icon: any; color: string; href?: string; isLoading: boolean;
}) {
  const content = (
    <Card className="p-4 hover:shadow-md transition-shadow" data-testid={`card-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      {isLoading ? (
        <div className="space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /></div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs text-muted-foreground font-medium truncate">{label}</span>
            <div className={`p-1.5 rounded-lg bg-muted/60 shrink-0`}>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">{(value ?? 0).toLocaleString()}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{sub}</p>}
        </>
      )}
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

type TrendingCategory = "stories" | "duas" | "books" | "motivational";

const CATEGORY_LABELS: Record<TrendingCategory, string> = {
  stories: "Articles",
  duas: "Duas",
  books: "Books",
  motivational: "Motivational",
};

const CATEGORY_COLORS: Record<TrendingCategory, string> = {
  stories: "bg-primary",
  duas: "bg-violet-500",
  books: "bg-amber-500",
  motivational: "bg-emerald-500",
};

function TrendingCard({ item, category }: {
  item: { id: string; title: string; views: number; excerpt?: string | null; description?: string | null; category_name?: string; category?: string };
  category: TrendingCategory;
}) {
  const cat = item.category_name || item.category || "—";
  const blurb = item.excerpt || item.description || null;
  return (
    <div className="border rounded-xl p-5 hover:shadow-md transition-all bg-card flex flex-col gap-3 min-h-[160px]">
      <div className={`h-1.5 w-14 rounded-full ${CATEGORY_COLORS[category]}`} />
      <div className="flex-1 flex flex-col gap-1.5">
        <p className="text-sm font-semibold line-clamp-2 leading-snug">{item.title}</p>
        {blurb && <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{blurb}</p>}
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-[90px]">{cat}</span>
        <span className="text-xs flex items-center gap-1 text-muted-foreground shrink-0">
          <Eye className="w-3.5 h-3.5" />{item.views ?? 0}
        </span>
      </div>
    </div>
  );
}

function TrendingSection({ data, isLoading }: { data?: DashboardData; isLoading: boolean }) {
  const [category, setCategory] = useState<TrendingCategory>("stories");
  const [sliderIndex, setSliderIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const getItems = (cat: TrendingCategory) => {
    const map: Record<TrendingCategory, any[]> = {
      stories: data?.topContent.stories ?? [],
      duas: data?.topContent.duas ?? [],
      books: data?.topContent.books ?? [],
      motivational: data?.topContent.motivational ?? [],
    };
    return map[cat];
  };

  const items = getItems(category);
  const visible = items.slice(sliderIndex, sliderIndex + 3);
  const canBack = sliderIndex > 0;
  const canForward = sliderIndex + 3 < items.length;

  const handleCategoryChange = (cat: TrendingCategory) => {
    setCategory(cat);
    setSliderIndex(0);
    setShowDropdown(false);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4 text-primary" /> Trending Content
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-medium">
            {CATEGORY_LABELS[category]}
          </Badge>
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowDropdown((v) => !v)}
              data-testid="button-view-all-trending"
            >
              View All <ChevronDown className="w-3 h-3" />
            </Button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-lg shadow-md py-1 min-w-[160px]">
                {(Object.keys(CATEGORY_LABELS) as TrendingCategory[]).map((cat) => (
                  <div key={cat} className="flex items-center justify-between hover:bg-muted transition-colors">
                    <button
                      className={`flex-1 text-left px-3 py-2 text-sm flex items-center gap-2 ${category === cat ? "font-semibold text-primary" : ""}`}
                      onClick={() => handleCategoryChange(cat)}
                      data-testid={`button-trending-${cat}`}
                    >
                      {CATEGORY_LABELS[cat]}
                      {category === cat && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />}
                    </button>
                    <a href={ADMIN_URLS[cat as ContentTab]} className="px-2 py-2 text-muted-foreground hover:text-primary" title={`Go to ${CATEGORY_LABELS[cat]}`} data-testid={`link-trending-goto-${cat}`}>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No content yet in this category</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {visible.map((item) => (
                <TrendingCard key={item.id} item={item} category={category} />
              ))}
              {visible.length < 3 && Array.from({ length: 3 - visible.length }).map((_, i) => (
                <div key={`empty-${i}`} className="border border-dashed rounded-xl min-h-[140px]" />
              ))}
            </div>
            {items.length > 3 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() => setSliderIndex((s) => Math.max(0, s - 1))}
                  disabled={!canBack}
                  data-testid="button-trending-prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.max(0, items.length - 2) }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === sliderIndex ? "bg-primary" : "bg-muted-foreground/30"}`} />
                  ))}
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() => setSliderIndex((s) => s + 1)}
                  disabled={!canForward}
                  data-testid="button-trending-next"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function ContributorDetail({ contributor, onClose }: { contributor: Contributor; onClose: () => void }) {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Contributor Profile</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center gap-4 pt-2">
        <Avatar className="h-16 w-16">
          <AvatarImage src={contributor.avatar_url ?? ""} alt={contributor.name || contributor.username} />
          <AvatarFallback className="text-xl">
            {(contributor.name || contributor.username).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="font-semibold text-lg">{contributor.name || contributor.username}</p>
          <p className="text-sm text-muted-foreground">@{contributor.username}</p>
          <Badge variant="secondary" className="mt-1 capitalize">{contributor.role}</Badge>
        </div>
        <div className="w-full divide-y rounded-lg border">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Join Date</span>
            <span className="text-sm font-medium">{format(new Date(contributor.created_at), "d MMM yyyy")}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Email</span>
            <span className="text-sm font-medium truncate max-w-[180px]">{contributor.email || "—"}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Role</span>
            <span className="text-sm font-medium capitalize">{contributor.role}</span>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

function TopContributors({ contributors, isLoading }: { contributors: Contributor[]; isLoading: boolean }) {
  const [selected, setSelected] = useState<Contributor | null>(null);

  return (
    <>
      <Card className="p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Star className="w-3.5 h-3.5 text-amber-500" /> Top Contributors
        </h2>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : contributors.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No staff members found</p>
        ) : (
          <div className="space-y-0.5">
            {contributors.map((c) => (
              <button
                key={c.id}
                className="w-full flex items-center gap-2 py-2 px-1.5 rounded-lg hover:bg-muted/60 transition-colors text-left"
                onClick={() => setSelected(c)}
                data-testid={`button-contributor-${c.id}`}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={c.avatar_url ?? ""} alt={c.name || c.username} />
                  <AvatarFallback className="text-[10px]">
                    {(c.name || c.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{c.name || c.username}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{c.role}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {format(new Date(c.created_at), "d MMM yy")}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && <ContributorDetail contributor={selected} onClose={() => setSelected(null)} />}
      </Dialog>
    </>
  );
}

function ActiveUsers({ users, isLoading }: { users: ActiveUser[]; isLoading: boolean }) {
  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
        <Activity className="w-3.5 h-3.5 text-emerald-500" /> Active Users
      </h2>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
      ) : users.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">No active users yet</p>
      ) : (
        <div className="space-y-1">
          {users.map((u, i) => {
            const articlesRead = parseInt(u.reading_count);
            return (
              <div key={u.id} className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-muted/40 transition-colors" data-testid={`row-active-user-${u.id}`}>
                <span className="text-xs font-bold text-muted-foreground w-4 text-center shrink-0">{i + 1}</span>
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={u.avatar_url ?? ""} alt={u.name || u.username} />
                  <AvatarFallback className="text-[10px]">
                    {(u.name || u.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{u.name || u.username}</p>
                </div>
                <div className="text-xs text-right shrink-0">
                  <p className="font-semibold text-primary">{articlesRead}</p>
                  <p className="text-[10px] text-muted-foreground">read</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

type ContentTab = "stories" | "duas" | "books" | "motivational";

const CONTENT_LABELS: Record<ContentTab, string> = {
  stories: "Articles",
  duas: "Duas",
  books: "Books",
  motivational: "Motivational",
};

const ADMIN_URLS: Record<ContentTab, string> = {
  stories: "/image/stories",
  duas: "/image/duas",
  books: "/image/books",
  motivational: "/image/motivational",
};

const CONTENT_COLORS: Record<ContentTab, string> = {
  stories: "bg-primary",
  duas: "bg-violet-500",
  books: "bg-amber-500",
  motivational: "bg-emerald-500",
};

function RecentActivitySection({ data, isLoading }: { data?: DashboardData; isLoading: boolean }) {
  const [tab, setTab] = useState<ContentTab>("stories");
  const [sliderIndex, setSliderIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const items = data?.recentActivity?.[tab] ?? [];
  const visible = items.slice(sliderIndex, sliderIndex + 3);
  const canBack = sliderIndex > 0;
  const canForward = sliderIndex + 3 < items.length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const handleTabChange = (t: ContentTab) => { setTab(t); setSliderIndex(0); setShowDropdown(false); };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2 text-base">
          <Activity className="w-4 h-4 text-primary" /> Recent Activity
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-medium">{CONTENT_LABELS[tab]}</Badge>
          <div className="relative" ref={dropdownRef}>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowDropdown((v) => !v)} data-testid="button-view-all-activity">
              View All <ChevronDown className="w-3 h-3" />
            </Button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-lg shadow-md py-1 min-w-[160px]">
                {(Object.keys(CONTENT_LABELS) as ContentTab[]).map((t) => (
                  <div key={t} className="flex items-center justify-between hover:bg-muted transition-colors">
                    <button
                      className={`flex-1 text-left px-3 py-2 text-sm flex items-center gap-2 ${tab === t ? "font-semibold text-primary" : ""}`}
                      onClick={() => handleTabChange(t)}
                      data-testid={`button-activity-tab-${t}`}
                    >
                      {CONTENT_LABELS[t]}
                      {tab === t && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />}
                    </button>
                    <a href={ADMIN_URLS[t]} className="px-2 py-2 text-muted-foreground hover:text-primary" title={`Go to ${CONTENT_LABELS[t]}`} data-testid={`link-activity-goto-${t}`}>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {visible.map((item) => (
                <div key={item.id} className="border rounded-xl p-5 hover:shadow-md transition-all bg-card flex flex-col gap-3 min-h-[160px]">
                  <div className={`h-1.5 w-14 rounded-full ${CONTENT_COLORS[tab]}`} />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <p className="text-sm font-semibold line-clamp-2 leading-snug">{item.title}</p>
                    {item.description && <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>}
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-[80px]">
                      {item.category_name || "—"}
                    </span>
                    <Badge variant={item.status === "published" ? "default" : "secondary"} className="text-[10px] h-5 px-1.5">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {visible.length < 3 && Array.from({ length: 3 - visible.length }).map((_, i) => (
                <div key={`empty-${i}`} className="border border-dashed rounded-xl min-h-[160px]" />
              ))}
            </div>
            {items.length > 3 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setSliderIndex((s) => Math.max(0, s - 1))} disabled={!canBack} data-testid="button-activity-prev">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.max(0, items.length - 2) }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === sliderIndex ? CONTENT_COLORS[tab] : "bg-muted-foreground/30"}`} />
                  ))}
                </div>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setSliderIndex((s) => s + 1)} disabled={!canForward} data-testid="button-activity-next">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function MostBookmarkedSection({ data, isLoading }: { data?: DashboardData; isLoading: boolean }) {
  const [tab, setTab] = useState<ContentTab>("stories");
  const [sliderIndex, setSliderIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const items = data?.bookmarked?.[tab] ?? [];
  const visible = items.slice(sliderIndex, sliderIndex + 3);
  const canBack = sliderIndex > 0;
  const canForward = sliderIndex + 3 < items.length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const handleTabChange = (t: ContentTab) => { setTab(t); setSliderIndex(0); setShowDropdown(false); };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2 text-base">
          <Bookmark className="w-4 h-4 text-violet-500" /> Most Bookmarked
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-medium">{CONTENT_LABELS[tab]}</Badge>
          <div className="relative" ref={dropdownRef}>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowDropdown((v) => !v)} data-testid="button-view-all-bookmarked">
              View All <ChevronDown className="w-3 h-3" />
            </Button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-lg shadow-md py-1 min-w-[160px]">
                {(Object.keys(CONTENT_LABELS) as ContentTab[]).map((t) => (
                  <div key={t} className="flex items-center justify-between hover:bg-muted transition-colors">
                    <button
                      className={`flex-1 text-left px-3 py-2 text-sm flex items-center gap-2 ${tab === t ? "font-semibold text-primary" : ""}`}
                      onClick={() => handleTabChange(t)}
                      data-testid={`button-bookmarked-tab-${t}`}
                    >
                      {CONTENT_LABELS[t]}
                      {tab === t && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />}
                    </button>
                    <a href={ADMIN_URLS[t]} className="px-2 py-2 text-muted-foreground hover:text-primary" title={`Go to ${CONTENT_LABELS[t]}`} data-testid={`link-bookmarked-goto-${t}`}>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No bookmarks yet</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {visible.map((item, i) => (
                <div key={item.id} className="border rounded-xl p-5 hover:shadow-md transition-all bg-card flex flex-col gap-3 min-h-[160px]">
                  <div className={`h-1.5 w-14 rounded-full ${CONTENT_COLORS[tab]}`} />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <p className="text-sm font-semibold line-clamp-2 leading-snug">{item.title}</p>
                    {item.description && <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>}
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                      #{sliderIndex + i + 1}
                    </span>
                    <span className="text-xs flex items-center gap-1 text-muted-foreground shrink-0">
                      <Bookmark className="w-3.5 h-3.5" />{item.bookmark_count}
                    </span>
                  </div>
                </div>
              ))}
              {visible.length < 3 && Array.from({ length: 3 - visible.length }).map((_, i) => (
                <div key={`empty-${i}`} className="border border-dashed rounded-xl min-h-[160px]" />
              ))}
            </div>
            {items.length > 3 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setSliderIndex((s) => Math.max(0, s - 1))} disabled={!canBack} data-testid="button-bookmarked-prev">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.max(0, items.length - 2) }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === sliderIndex ? CONTENT_COLORS[tab] : "bg-muted-foreground/30"}`} />
                  ))}
                </div>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setSliderIndex((s) => s + 1)} disabled={!canForward} data-testid="button-bookmarked-next">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function NormalView({ data, isLoading }: { data?: DashboardData; isLoading: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[5fr_2fr] gap-6">
      <div className="space-y-6">
        <TrendingSection data={data} isLoading={isLoading} />
        <RecentActivitySection data={data} isLoading={isLoading} />
        <MostBookmarkedSection data={data} isLoading={isLoading} />
      </div>
      <div className="space-y-6">
        <TopContributors contributors={data?.topContributors ?? []} isLoading={isLoading} />
        <ActiveUsers users={data?.activeUsers ?? []} isLoading={isLoading} />
        <Card className="p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
            <Layers className="w-3.5 h-3.5 text-blue-500" /> Category Breakdown
          </h2>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {(data?.categories ?? []).map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium">{cat.name}</span>
                    <span className="text-[10px] text-muted-foreground">{cat.story_count}</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, (parseInt(cat.story_count) / Math.max(1, parseInt(data?.categories?.[0]?.story_count ?? "1"))) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {(!data?.categories || data.categories.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-3">No categories found</p>
              )}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
            <Users className="w-3.5 h-3.5 text-blue-500" /> User Growth (6 Months)
          </h2>
          {isLoading ? (
            <div className="space-y-1.5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
          ) : (
            <div className="space-y-0">
              {(data?.userGrowth ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No data yet</p>
              ) : (data?.userGrowth ?? []).map((row, i) => {
                const prev = i > 0 ? parseInt((data?.userGrowth ?? [])[i - 1].count) : null;
                const curr = parseInt(row.count);
                const trend = prev === null ? null : curr > prev ? "up" : curr < prev ? "down" : "same";
                return (
                  <div key={row.year_month} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-xs font-medium">{row.month}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{row.count}</span>
                      {trend === "up" && <span className="text-emerald-600 text-[10px]">▲{curr - (prev ?? 0)}</span>}
                      {trend === "down" && <span className="text-red-500 text-[10px]">▼{(prev ?? 0) - curr}</span>}
                      {!trend && <span className="text-muted-foreground text-[10px]">—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

type ChartType = "bar" | "line" | "pie";

function GraphView({ data, isLoading }: { data?: DashboardData; isLoading: boolean }) {
  const [overviewChart, setOverviewChart] = useState<ChartType>("bar");
  const [topChart, setTopChart] = useState<ChartType>("bar");
  const [topTab, setTopTab] = useState<TrendingCategory>("stories");

  const contentOverviewData = data ? [
    { name: "Articles", total: data.content.stories.total, published: data.content.stories.published, drafts: data.content.stories.drafts },
    { name: "Duas", total: data.content.duas.total, published: data.content.duas.published, drafts: data.content.duas.total - data.content.duas.published },
    { name: "Books", total: data.content.books.total, free: data.content.books.free, paid: data.content.books.paid },
    { name: "Motivational", total: data.content.motivational.total, published: data.content.motivational.published, drafts: data.content.motivational.total - data.content.motivational.published },
  ] : [];

  const pieData = data ? [
    { name: "Published Articles", value: data.content.stories.published },
    { name: "Draft Articles", value: data.content.stories.drafts },
    { name: "Duas", value: data.content.duas.total },
    { name: "Books", value: data.content.books.total },
    { name: "Motivational", value: data.content.motivational.total },
  ].filter(d => d.value > 0) : [];

  const categoryChartData = (data?.categories ?? []).map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    fullName: c.name,
    count: parseInt(c.story_count),
  }));

  const userGrowthData = (data?.userGrowth ?? []).map(u => ({
    month: u.month,
    users: parseInt(u.count),
  }));

  const getTopData = () => {
    const map: Record<string, any[]> = {
      stories: data?.topContent.stories ?? [],
      duas: data?.topContent.duas ?? [],
      books: data?.topContent.books ?? [],
      motivational: data?.topContent.motivational ?? [],
    };
    return (map[topTab] ?? []).map(item => ({
      name: item.title.length > 18 ? item.title.slice(0, 18) + "…" : item.title,
      fullName: item.title,
      views: item.views ?? 0,
    }));
  };

  const ChartToggle = ({ value, onChange }: { value: ChartType; onChange: (v: ChartType) => void }) => (
    <Select value={value} onValueChange={(v) => onChange(v as ChartType)}>
      <SelectTrigger className="w-36 h-8 text-xs" data-testid="select-chart-type">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="bar"><span className="flex items-center gap-2"><BarChart2 className="w-3.5 h-3.5" />Bar Chart</span></SelectItem>
        <SelectItem value="line"><span className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" />Line Chart</span></SelectItem>
        <SelectItem value="pie"><span className="flex items-center gap-2"><PieChartIcon className="w-3.5 h-3.5" />Pie Chart</span></SelectItem>
      </SelectContent>
    </Select>
  );

  const renderContentOverview = () => {
    if (overviewChart === "pie") {
      return (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (overviewChart === "line") {
      return (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={contentOverviewData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} name="Total" />
            <Line type="monotone" dataKey="published" stroke={COLORS[1]} strokeWidth={2} dot={{ r: 4 }} name="Published" />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={contentOverviewData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="total" fill={COLORS[0]} name="Total" radius={[4, 4, 0, 0]} />
          <Bar dataKey="published" fill={COLORS[1]} name="Published" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderTopContent = () => {
    const topData = getTopData();
    if (topChart === "pie") {
      return (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={topData} cx="50%" cy="50%" outerRadius={85} dataKey="views" nameKey="name">
              {topData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(val, _name, props) => [val, props.payload.fullName]} />
            <Legend formatter={(val, entry: any) => entry.payload.fullName} />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (topChart === "line") {
      return (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={topData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val, _name, props) => [val, props.payload.fullName]} />
            <Line type="monotone" dataKey="views" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} name="Views" />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={topData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(val, _name, props) => [val, props.payload.fullName]} />
          <Bar dataKey="views" fill={COLORS[0]} name="Views" radius={[0, 4, 4, 0]}>
            {topData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><BarChart2 className="w-4 h-4" /> Content Overview</h2>
            <ChartToggle value={overviewChart} onChange={setOverviewChart} />
          </div>
          {renderContentOverview()}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Layers className="w-4 h-4" /> Articles by Category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryChartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val, _name, props) => [val + " articles", props.payload.fullName]} />
              <Bar dataKey="count" name="Articles" radius={[4, 4, 0, 0]}>
                {categoryChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Top Content by Views</h2>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {(Object.keys(CATEGORY_LABELS) as TrendingCategory[]).map((cat) => (
                <Button key={cat} size="sm" variant={topTab === cat ? "default" : "outline"} className="h-7 text-xs" onClick={() => setTopTab(cat)}>
                  {CATEGORY_LABELS[cat]}
                </Button>
              ))}
            </div>
            <ChartToggle value={topChart} onChange={setTopChart} />
          </div>
        </div>
        {renderTopContent()}
      </Card>

      {userGrowthData.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> User Growth (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke={COLORS[4]} strokeWidth={2} dot={{ r: 5 }} name="New Users" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Bookmark className="w-4 h-4" /> Most Bookmarked Articles</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={(data?.bookmarked.stories ?? []).map(s => ({ name: s.title.length > 20 ? s.title.slice(0, 20) + "…" : s.title, fullName: s.title, count: parseInt(s.bookmark_count) }))}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val, _name, props) => [val + " bookmarks", props.payload.fullName]} />
            <Bar dataKey="count" name="Bookmarks" radius={[4, 4, 0, 0]}>
              {(data?.bookmarked.stories ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [viewMode, setViewMode] = useState<"normal" | "graph">("normal");

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/admin/dashboard"],
    staleTime: 0,
    refetchInterval: 10 * 1000,
    refetchOnWindowFocus: true,
  });

  const statCards = data ? [
    {
      label: "Articles",
      value: data.content.stories.total,
      sub: `${data.content.stories.published} published · ${data.content.stories.drafts} drafts`,
      icon: FileText,
      color: "text-primary",
      href: "/image/stories",
    },
    {
      label: "Duas",
      value: data.content.duas.total,
      sub: `${data.content.duas.published} published`,
      icon: MessageSquare,
      color: "text-violet-600 dark:text-violet-400",
      href: "/image/duas",
    },
    {
      label: "Books",
      value: data.content.books.total,
      sub: `${data.content.books.free} free · ${data.content.books.paid} paid`,
      icon: BookOpen,
      color: "text-amber-600 dark:text-amber-400",
      href: "/image/books",
    },
    {
      label: "Motivational",
      value: data.content.motivational.total,
      sub: `${data.content.motivational.published} published`,
      icon: Star,
      color: "text-emerald-600 dark:text-emerald-400",
      href: "/image/motivational",
    },
    {
      label: "Users",
      value: data.content.users.total,
      sub: "registered accounts",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      href: "/image/users",
    },
    {
      label: "Total Views",
      value: data.totalViews,
      sub: "across all content",
      icon: Eye,
      color: "text-teal-600 dark:text-teal-400",
    },
  ] : Array.from({ length: 6 }).map((_, i) => ({
    label: ["Articles", "Duas", "Books", "Motivational", "Users", "Total Views"][i],
    value: undefined,
    icon: [FileText, MessageSquare, BookOpen, Star, Users, Eye][i],
    color: ["text-primary", "text-violet-600", "text-amber-600", "text-emerald-600", "text-blue-600", "text-teal-600"][i],
    href: undefined,
    sub: undefined,
  }));

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Complete overview of Stories of Light</p>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === "normal" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("normal")}
            className="gap-2"
            data-testid="button-normal-view"
          >
            <List className="w-4 h-4" />
            Normal View
          </Button>
          <Button
            variant={viewMode === "graph" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("graph")}
            className="gap-2"
            data-testid="button-graph-view"
          >
            <BarChart2 className="w-4 h-4" />
            Graph View
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} isLoading={isLoading} />
        ))}
      </div>

      {viewMode === "normal" ? (
        <NormalView data={data} isLoading={isLoading} />
      ) : (
        <GraphView data={data} isLoading={isLoading} />
      )}
    </AdminLayout>
  );
}
