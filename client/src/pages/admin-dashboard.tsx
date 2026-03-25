import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface DashboardData {
  content: {
    stories: { total: number; published: number; drafts: number };
    motivational: { total: number; published: number };
    duas: { total: number; published: number };
    books: { total: number; free: number; paid: number };
    users: { total: number };
  };
  topContent: {
    stories: Array<{ id: string; title: string; views: number; average_rating: string; category_name: string }>;
    duas: Array<{ id: string; title: string; views: number; category: string }>;
    books: Array<{ id: string; title: string; views: number; average_rating: string; category: string }>;
    motivational: Array<{ id: string; title: string; views: number; average_rating: string; category: string }>;
  };
  bookmarked: {
    stories: Array<{ id: string; title: string; bookmark_count: string }>;
    duas: Array<{ id: string; title: string; bookmark_count: string }>;
  };
  categories: Array<{ name: string; url_slug: string; story_count: string }>;
  userGrowth: Array<{ month: string; year_month: string; count: string }>;
  recentActivity: Array<{ id: string; title: string; status: string; updated_at: string; category_name: string }>;
}

function StatCard({
  label, value, sub, icon: Icon, color, href, isLoading,
}: {
  label: string; value?: number | string; sub?: string; icon: any; color: string; href?: string; isLoading: boolean;
}) {
  const content = (
    <Card className="p-5 hover:shadow-md transition-shadow" data-testid={`card-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      {isLoading ? (
        <div className="space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /></div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <p className="text-3xl font-bold">{value ?? 0}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </>
      )}
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function TopContentTable({ items, type }: {
  items: Array<{ id: string; title: string; views: number; average_rating?: string; category_name?: string; category?: string; bookmark_count?: string }>;
  type: "views" | "bookmarks";
}) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No data yet</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
          <span className="text-lg font-bold text-muted-foreground w-6 shrink-0 text-center">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-1">{item.title}</p>
            {(item.category_name || item.category) && (
              <p className="text-xs text-muted-foreground">{item.category_name || item.category}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
            {type === "views" ? (
              <><Eye className="w-3.5 h-3.5" /><span>{item.views ?? 0}</span></>
            ) : (
              <><Bookmark className="w-3.5 h-3.5" /><span>{item.bookmark_count ?? 0}</span></>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function NormalView({ data, isLoading }: { data?: DashboardData; isLoading: boolean }) {
  const [topTab, setTopTab] = useState("stories");
  const [bookmarkTab, setBookmarkTab] = useState("stories");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Top Performing Content</h2>
          <Tabs value={topTab} onValueChange={setTopTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="stories">Articles</TabsTrigger>
              <TabsTrigger value="duas">Duas</TabsTrigger>
              <TabsTrigger value="books">Books</TabsTrigger>
              <TabsTrigger value="motivational">Motivational</TabsTrigger>
            </TabsList>
            <TabsContent value="stories">
              {isLoading ? <Skeleton className="h-40 w-full" /> : <TopContentTable items={data?.topContent.stories ?? []} type="views" />}
            </TabsContent>
            <TabsContent value="duas">
              {isLoading ? <Skeleton className="h-40 w-full" /> : <TopContentTable items={data?.topContent.duas ?? []} type="views" />}
            </TabsContent>
            <TabsContent value="books">
              {isLoading ? <Skeleton className="h-40 w-full" /> : <TopContentTable items={data?.topContent.books ?? []} type="views" />}
            </TabsContent>
            <TabsContent value="motivational">
              {isLoading ? <Skeleton className="h-40 w-full" /> : <TopContentTable items={data?.topContent.motivational ?? []} type="views" />}
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Bookmark className="w-4 h-4" /> Most Bookmarked</h2>
          <Tabs value={bookmarkTab} onValueChange={setBookmarkTab}>
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="stories" className="flex-1">Articles</TabsTrigger>
              <TabsTrigger value="duas" className="flex-1">Duas</TabsTrigger>
            </TabsList>
            <TabsContent value="stories">
              {isLoading ? <Skeleton className="h-40 w-full" /> : <TopContentTable items={data?.bookmarked.stories ?? []} type="bookmarks" />}
            </TabsContent>
            <TabsContent value="duas">
              {isLoading ? <Skeleton className="h-40 w-full" /> : <TopContentTable items={data?.bookmarked.duas ?? []} type="bookmarks" />}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Layers className="w-4 h-4" /> Category Breakdown</h2>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {(data?.categories ?? []).map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <span className="text-sm text-muted-foreground">{cat.story_count} articles</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, (parseInt(cat.story_count) / Math.max(1, parseInt(data?.categories?.[0]?.story_count ?? "1"))) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!data?.categories || data.categories.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No categories found</p>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Activity className="w-4 h-4" /> Recent Activity</h2>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {(data?.recentActivity ?? []).map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {item.updated_at ? format(new Date(item.updated_at), "MMM d, yyyy") : "-"}
                    </span>
                  </div>
                  <Badge variant={item.status === "published" ? "default" : "secondary"} className="shrink-0 text-xs">
                    {item.status}
                  </Badge>
                </div>
              ))}
              {(!data?.recentActivity || data.recentActivity.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> User Growth (Last 6 Months)</h2>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium">Month</th>
                  <th className="text-left p-3 font-medium">New Users</th>
                  <th className="text-left p-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {(data?.userGrowth ?? []).length === 0 ? (
                  <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No user registration data available</td></tr>
                ) : (
                  (data?.userGrowth ?? []).map((row, i) => {
                    const prev = i > 0 ? parseInt((data?.userGrowth ?? [])[i - 1].count) : null;
                    const curr = parseInt(row.count);
                    const trend = prev === null ? null : curr > prev ? "up" : curr < prev ? "down" : "same";
                    return (
                      <tr key={row.year_month} className="border-b last:border-0">
                        <td className="p-3 font-medium">{row.month}</td>
                        <td className="p-3">{row.count}</td>
                        <td className="p-3">
                          {trend === "up" && <span className="text-emerald-600 text-xs font-medium">▲ +{curr - (prev ?? 0)}</span>}
                          {trend === "down" && <span className="text-red-500 text-xs font-medium">▼ -{(prev ?? 0) - curr}</span>}
                          {trend === "same" && <span className="text-muted-foreground text-xs">—</span>}
                          {trend === null && <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

type ChartType = "bar" | "line" | "pie";

function GraphView({ data, isLoading }: { data?: DashboardData; isLoading: boolean }) {
  const [overviewChart, setOverviewChart] = useState<ChartType>("bar");
  const [topChart, setTopChart] = useState<ChartType>("bar");
  const [topTab, setTopTab] = useState("stories");

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
            <Tabs value={topTab} onValueChange={setTopTab}>
              <TabsList>
                <TabsTrigger value="stories">Articles</TabsTrigger>
                <TabsTrigger value="duas">Duas</TabsTrigger>
                <TabsTrigger value="books">Books</TabsTrigger>
                <TabsTrigger value="motivational">Motivational</TabsTrigger>
              </TabsList>
            </Tabs>
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
    staleTime: 5 * 60 * 1000,
  });

  const statCards = data ? [
    {
      label: "Total Articles",
      value: data.content.stories.total,
      sub: `${data.content.stories.published} published · ${data.content.stories.drafts} drafts`,
      icon: FileText,
      color: "text-primary",
      href: "/image/stories",
    },
    {
      label: "Total Duas",
      value: data.content.duas.total,
      sub: `${data.content.duas.published} published`,
      icon: MessageSquare,
      color: "text-violet-600 dark:text-violet-400",
      href: "/image/duas",
    },
    {
      label: "Total Books",
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
      href: "/image/motivational-stories",
    },
    {
      label: "Total Users",
      value: data.content.users.total,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      href: "/image/users",
    },
  ] : Array.from({ length: 5 }).map((_, i) => ({
    label: ["Total Articles", "Total Duas", "Total Books", "Motivational", "Total Users"][i],
    value: undefined,
    icon: [FileText, MessageSquare, BookOpen, Star, Users][i],
    color: ["text-primary", "text-violet-600", "text-amber-600", "text-emerald-600", "text-blue-600"][i],
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
