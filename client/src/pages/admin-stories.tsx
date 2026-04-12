import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useRoute } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { useAuth } from "@/lib/auth";
import { useViewAs } from "@/lib/view-as";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Trash2, Eye, Edit, Copy, Clock, FileText, BarChart2, TrendingUp, BookOpen, CalendarDays, LayoutGrid } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import type { StoryWithCategory, Category } from "@shared/schema";
import { AdControlDialog } from "@/components/ad-control-dialog";
import { format } from "date-fns";

type StatusFilter = "all" | "published" | "draft" | "recent" | "most-viewed";
type DateFilter = "all" | "7d" | "30d" | "90d" | "month" | "custom";

export default function AdminStoriesPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDays, setCustomDays] = useState("30");
  const [recentDays, setRecentDays] = useState("30");
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [adControlItem, setAdControlItem] = useState<{ id: string; adSlotsRaw: string | null } | null>(null);

  const { user, isAdmin } = useAuth();
  const { viewAs, viewMeMode } = useViewAs();
  const isContributor = !viewMeMode && (!!viewAs || !isAdmin);
  const effectiveFilterUserId = viewMeMode ? (viewAs?.id ?? user?.id) : !isAdmin ? user?.id : undefined;
  const shouldIncludeNull = viewMeMode && (user?.role === "super_owner" || user?.role === "owner");

  const [matchCat, catParams] = useRoute("/image/stories/category/:slug");
  const categorySlug = matchCat ? catParams?.slug : null;

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  const activeCategory = categories?.find((c) => c.slug === categorySlug || c.urlSlug === categorySlug);

  const statsUrlBase = effectiveFilterUserId ? `?viewAs=${effectiveFilterUserId}${shouldIncludeNull ? "&includeNullUser=true" : ""}` : "";
  const statsUrl = `/api/stories/stats${statsUrlBase}`;
  const { data: stats } = useQuery<{ total: number; published: number; drafts: number; totalViews: number; recentCount: number }>({
    queryKey: ["/api/stories/stats", effectiveFilterUserId, shouldIncludeNull],
    queryFn: async () => {
      const res = await fetch(statsUrl, { credentials: "include" });
      return res.json();
    },
  });

  const { startDate, endDate, sortBy } = useMemo(() => {
    const ms = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

    if (statusFilter === "recent") {
      const days = parseInt(recentDays) || 30;
      return { startDate: ms(days), endDate: undefined, sortBy: undefined };
    }
    if (statusFilter === "most-viewed") {
      if (dateFilter === "7d") return { startDate: ms(7), endDate: undefined, sortBy: "views" as const };
      if (dateFilter === "30d") return { startDate: ms(30), endDate: undefined, sortBy: "views" as const };
      if (dateFilter === "90d") return { startDate: ms(90), endDate: undefined, sortBy: "views" as const };
      if (dateFilter === "custom") { const d = parseInt(customDays) || 30; return { startDate: ms(d), endDate: undefined, sortBy: "views" as const }; }
      if (dateFilter === "month") {
        const [y, m] = filterMonth.split("-").map(Number);
        return { startDate: new Date(y, m - 1, 1).toISOString(), endDate: new Date(y, m, 0, 23, 59, 59).toISOString(), sortBy: "views" as const };
      }
      return { startDate: undefined, endDate: undefined, sortBy: "views" as const };
    }

    if (dateFilter === "7d") return { startDate: ms(7), endDate: undefined, sortBy: undefined };
    if (dateFilter === "30d") return { startDate: ms(30), endDate: undefined, sortBy: undefined };
    if (dateFilter === "90d") return { startDate: ms(90), endDate: undefined, sortBy: undefined };
    if (dateFilter === "custom") { const d = parseInt(customDays) || 30; return { startDate: ms(d), endDate: undefined, sortBy: undefined }; }
    if (dateFilter === "month") {
      const [y, m] = filterMonth.split("-").map(Number);
      return { startDate: new Date(y, m - 1, 1).toISOString(), endDate: new Date(y, m, 0, 23, 59, 59).toISOString(), sortBy: undefined };
    }
    return { startDate: undefined, endDate: undefined, sortBy: undefined };
  }, [statusFilter, dateFilter, customDays, recentDays, filterMonth]);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  const apiStatus = statusFilter === "published" ? "published" : statusFilter === "draft" ? "draft" : undefined;
  if (apiStatus) queryParams.set("status", apiStatus);
  if (activeCategory?.id) queryParams.set("categoryId", activeCategory.id);
  if (effectiveFilterUserId) queryParams.set("userId", effectiveFilterUserId);
  if (shouldIncludeNull) queryParams.set("includeNullUser", "true");
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  if (sortBy) queryParams.set("sortBy", sortBy);
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const { data: stories, isLoading } = useQuery<StoryWithCategory[]>({
    queryKey: [`/api/stories${queryString}`],
    enabled: !categorySlug || !!activeCategory,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/stories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Story deleted" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await apiRequest("POST", "/api/stories/bulk-delete", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      setSelectedIds(new Set());
      toast({ title: "Stories deleted" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/stories/${id}/duplicate`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Story duplicated", description: `"${data.title}" created as draft` });
      navigate(`/image/stories/${data.id}/edit`);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/admin/stories/${id}/active`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (!stories) return;
    if (selectedIds.size === stories.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(stories.map((s) => s.id)));
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const pageTitle = activeCategory ? activeCategory.name : "All Articles";
  const pageDescription = activeCategory
    ? `Manage articles in ${activeCategory.name}`
    : "Manage all your stories and articles";

  const showDateFilter = statusFilter !== "recent";
  const showCustomDaysInput = dateFilter === "custom";
  const showMonthInput = dateFilter === "month";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-stories-title">{pageTitle}</h1>
          <p className="text-muted-foreground mt-1">{pageDescription}</p>
        </div>
        {!isContributor && (
          <Link href="/image/stories/new">
            <Button data-testid="button-new-story">
              <Plus className="w-4 h-4 mr-2" />
              New Article
            </Button>
          </Link>
        )}
      </div>

      {!activeCategory && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <Card className="p-4" data-testid="stat-total-articles">
            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">Total Articles</span>
            </div>
            {stats ? (
              <p className="text-2xl font-bold">{stats.total}</p>
            ) : (
              <Skeleton className="h-7 w-12 mt-1" />
            )}
          </Card>
          <Card className="p-4" data-testid="stat-total-views">
            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
              <BarChart2 className="w-4 h-4" />
              <span className="text-xs font-medium">Total Views</span>
            </div>
            {stats ? (
              <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
            ) : (
              <Skeleton className="h-7 w-12 mt-1" />
            )}
          </Card>
          <Card className="p-4" data-testid="stat-published">
            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-medium">Published</span>
            </div>
            {stats ? (
              <p className="text-2xl font-bold">{stats.published}</p>
            ) : (
              <Skeleton className="h-7 w-12 mt-1" />
            )}
          </Card>
          <Card className="p-4" data-testid="stat-drafts">
            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Draft</span>
            </div>
            {stats ? (
              <p className="text-2xl font-bold">{stats.drafts}</p>
            ) : (
              <Skeleton className="h-7 w-12 mt-1" />
            )}
          </Card>
          <Card className="p-4" data-testid="stat-recent">
            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              <span className="text-xs font-medium">Recent (30d)</span>
            </div>
            {stats ? (
              <p className="text-2xl font-bold">{stats.recentCount}</p>
            ) : (
              <Skeleton className="h-7 w-12 mt-1" />
            )}
          </Card>
        </div>
      )}

      <Card>
        <div className="flex items-center gap-3 p-4 border-b flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-stories"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="recent">Recent Articles</SelectItem>
              <SelectItem value="most-viewed">Most Viewed</SelectItem>
            </SelectContent>
          </Select>

          {statusFilter === "recent" ? (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">Last</span>
              <Input
                type="number"
                min="1"
                max="365"
                value={recentDays}
                onChange={(e) => setRecentDays(e.target.value)}
                className="w-20 text-center"
                data-testid="input-recent-days"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">days</span>
            </div>
          ) : showDateFilter && (
            <>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                <SelectTrigger className="w-36" data-testid="select-date-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="month">By Month</SelectItem>
                  <SelectItem value="custom">Custom Days</SelectItem>
                </SelectContent>
              </Select>
              {showCustomDaysInput && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Last</span>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="w-20 text-center"
                    data-testid="input-custom-days"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">days</span>
                </div>
              )}
              {showMonthInput && (
                <Input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-40"
                  data-testid="input-filter-month"
                />
              )}
            </>
          )}

          {!isContributor && selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
              disabled={bulkDeleteMutation.isPending}
              data-testid="button-bulk-delete"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete ({selectedIds.size})
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-stories">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-3 w-10">
                  <Checkbox
                    checked={stories && stories.length > 0 && selectedIds.size === stories.length}
                    onCheckedChange={toggleSelectAll}
                    data-testid="checkbox-select-all"
                  />
                </th>
                <th className="text-left p-3 font-medium">Title</th>
                {!activeCategory && (
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Category</th>
                )}
                <th className="text-left p-3 font-medium hidden md:table-cell">Status</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />Views</span>
                </th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Date</th>
                {isAdmin && <th className="text-left p-3 font-medium hidden xl:table-cell">Active</th>}
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-3"><Skeleton className="h-4 w-4" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-48" /></td>
                    {!activeCategory && <td className="p-3 hidden sm:table-cell"><Skeleton className="h-4 w-24" /></td>}
                    <td className="p-3 hidden md:table-cell"><Skeleton className="h-5 w-16" /></td>
                    <td className="p-3 hidden md:table-cell"><Skeleton className="h-4 w-10" /></td>
                    <td className="p-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-3 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : stories && stories.length > 0 ? (
                stories.map((story) => (
                  <tr key={story.id} className="border-b hover:bg-muted/20" data-testid={`row-story-${story.id}`}>
                    <td className="p-3">
                      <Checkbox
                        checked={selectedIds.has(story.id)}
                        onCheckedChange={() => toggleSelect(story.id)}
                        data-testid={`checkbox-story-${story.id}`}
                      />
                    </td>
                    <td className="p-3">
                      <div>
                        <span className="font-medium line-clamp-1">{story.title}</span>
                        <span className="text-xs text-muted-foreground block mt-0.5">/{story.slug}</span>
                      </div>
                    </td>
                    {!activeCategory && (
                      <td className="p-3 hidden sm:table-cell">
                        {story.category ? (
                          <Badge variant="secondary">{story.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    )}
                    <td className="p-3 hidden md:table-cell">
                      <Badge variant={story.status === "published" ? "default" : "secondary"}>
                        {story.status}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground" data-testid={`text-views-${story.id}`}>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {story.views ?? 0}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {story.createdAt ? format(new Date(story.createdAt), "MMM d, yyyy") : "-"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-3 hidden xl:table-cell">
                        <Switch
                          checked={story.isActive !== false}
                          onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: story.id, isActive: checked })}
                          data-testid={`switch-active-${story.id}`}
                          title={story.isActive !== false ? "Active (visible on site)" : "Inactive (hidden from site)"}
                        />
                      </td>
                    )}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/stories/${story.slug}`}>
                          <Button size="icon" variant="ghost" data-testid={`button-view-${story.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {!isContributor && (
                          <>
                            {isAdmin && (
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Ad Slot Control"
                                onClick={() => setAdControlItem({ id: story.id, adSlotsRaw: (story as any).adSlots ?? null })}
                                data-testid={`button-adcontrol-${story.id}`}
                              >
                                <LayoutGrid className="w-4 h-4" />
                              </Button>
                            )}
                            <Link href={`/image/stories/${story.id}/edit`}>
                              <Button size="icon" variant="ghost" data-testid={`button-edit-${story.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => duplicateMutation.mutate(story.id)}
                              disabled={duplicateMutation.isPending}
                              title="Duplicate"
                              data-testid={`button-duplicate-${story.id}`}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(story.id)}
                              data-testid={`button-delete-${story.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    {categorySlug && !activeCategory
                      ? "Loading category..."
                      : `No articles found${activeCategory ? ` in ${activeCategory.name}` : ""}${statusFilter === "recent" ? ` in the last ${recentDays} days` : ""}. ${statusFilter === "most-viewed" ? "No articles with views yet." : ""}`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the article.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {adControlItem && (
        <AdControlDialog
          key={adControlItem.id}
          open={!!adControlItem}
          onOpenChange={(v) => { if (!v) setAdControlItem(null); }}
          contentType="stories"
          contentId={adControlItem.id}
          adSlotsRaw={adControlItem.adSlotsRaw}
          invalidateKey={["/api/stories"]}
        />
      )}
    </AdminLayout>
  );
}
