import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useRoute } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { useAuth } from "@/lib/auth";
import { useViewAs } from "@/lib/view-as";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Trash2, Eye, Pencil, Copy, Clock, FileText, BarChart2, TrendingUp, BookOpen, CalendarDays, LayoutGrid, Megaphone, ExternalLink, GripVertical, Loader2, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import type { StoryWithCategory, Category, StoryPart } from "@shared/schema";
import { AdControlDialog } from "@/components/ad-control-dialog";
import { AdManagementDialog } from "@/components/ad-management-dialog";
import { format } from "date-fns";

type StatusFilter = "all" | "published" | "draft" | "recent" | "most-viewed";
type DateFilter = "all" | "7d" | "30d" | "90d" | "month" | "custom";

function StoryPartsManagerDialog({ storyId, storyTitle, open, onOpenChange }: {
  storyId: string;
  storyTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [editingPart, setEditingPart] = useState<StoryPart | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [deletingPartId, setDeletingPartId] = useState<string | null>(null);

  const { data: parts = [], isLoading } = useQuery<StoryPart[]>({
    queryKey: ["/api/admin/stories", storyId, "parts"],
    queryFn: () => fetch(`/api/admin/stories/${storyId}/parts`, { credentials: "include" }).then(r => r.json()),
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/stories/${storyId}/parts`, { title: newTitle, summary: newSummary, storyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });
      setNewTitle(""); setNewSummary("");
      toast({ title: "Part added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ partId, title, summary }: { partId: string; title: string; summary: string }) =>
      apiRequest("PATCH", `/api/admin/stories/parts/${partId}`, { title, summary }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });
      setEditingPart(null);
      toast({ title: "Part updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (partId: string) => apiRequest("DELETE", `/api/admin/stories/parts/${partId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });
      setDeletingPartId(null);
      toast({ title: "Part deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const startEdit = (part: StoryPart) => {
    setEditingPart(part);
    setEditTitle(part.title);
    setEditSummary(part.summary ?? "");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-story-parts-manager">
          <DialogHeader>
            <DialogTitle className="truncate">Manage: {storyTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : parts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No parts yet. Add the first part below.</p>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {parts.map((part, i) => (
                  <AccordionItem key={part.id} value={part.id} className="border rounded-md px-3" data-testid={`part-item-${part.id}`}>
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-2 min-w-0 text-left">
                        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">
                          <span className="text-muted-foreground mr-1">{i + 1}.</span>{part.title}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 space-y-3">
                      {editingPart?.id === part.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Part title"
                            data-testid={`input-edit-part-title-${part.id}`}
                          />
                          <Textarea
                            value={editSummary}
                            onChange={(e) => setEditSummary(e.target.value)}
                            placeholder="Summary (optional)"
                            rows={3}
                            data-testid={`input-edit-part-summary-${part.id}`}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateMutation.mutate({ partId: part.id, title: editTitle, summary: editSummary })}
                              disabled={updateMutation.isPending || !editTitle}
                              data-testid={`button-save-part-${part.id}`}
                            >
                              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingPart(null)} data-testid={`button-cancel-part-${part.id}`}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {part.summary && <p className="text-sm text-muted-foreground">{part.summary}</p>}
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(part)} data-testid={`button-edit-part-${part.id}`}>
                              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletingPartId(part.id)}
                              data-testid={`button-delete-part-${part.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}

            <div className="border-t pt-4 space-y-3">
              <Label className="text-sm font-semibold">Add Part</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Part title"
                data-testid="input-new-part-title"
              />
              <Textarea
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="Summary (optional)"
                rows={2}
                data-testid="input-new-part-summary"
              />
              <Button
                size="sm"
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending || !newTitle}
                data-testid="button-add-part"
              >
                {addMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                Add Part
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPartId} onOpenChange={(o) => { if (!o) setDeletingPartId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Part</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this part and all its pages.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingPartId && deleteMutation.mutate(deletingPartId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

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
  const [adManagementItem, setAdManagementItem] = useState<{ id: string; name: string; adSlotsRaw: string | null } | null>(null);
  const [manageStoryItem, setManageStoryItem] = useState<{ id: string; title: string } | null>(null);

  const { user, isAdmin } = useAuth();
  const { viewAs, viewMeMode } = useViewAs();
  const isContributor = !viewMeMode && (!!viewAs || !isAdmin);
  const effectiveFilterUserId = viewMeMode ? (viewAs?.id ?? user?.id) : !isAdmin ? user?.id : undefined;
  const shouldIncludeNull = viewMeMode && !viewAs && (user?.role === "super_owner" || user?.role === "owner");

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
    queryKey: ["/api/stories", queryString],
    queryFn: () => fetch(`/api/stories${queryString}`, { credentials: "include" }).then(r => r.json()),
    enabled: !categorySlug || !!activeCategory,
  });

  const { data: staffList } = useQuery<Array<{ id: string; name: string | null; username: string }>>({
    queryKey: ["/api/admin/staff-lookup"],
    queryFn: () => fetch("/api/admin/staff-lookup", { credentials: "include" }).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });
  const staffMap = useMemo(() => {
    const m: Record<string, string> = {};
    (staffList ?? []).forEach(s => { m[s.id] = s.name || s.username; });
    return m;
  }, [staffList]);

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
                <th className="text-left p-3 font-medium hidden xl:table-cell">Author</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />Views</span>
                </th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Date</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Status</th>
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
                    <td className="p-3 hidden xl:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-3 hidden md:table-cell"><Skeleton className="h-4 w-10" /></td>
                    <td className="p-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-3 hidden md:table-cell"><Skeleton className="h-5 w-16" /></td>
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
                        <span className="text-[10px] font-mono text-muted-foreground/50 mt-0.5 block">#{story.id.slice(0, 8)}</span>
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
                    <td className="p-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {story.userId ? (staffMap[story.userId] ?? story.userId.slice(0, 8)) : <span className="italic">System</span>}
                      </span>
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
                    <td className="p-3 hidden md:table-cell">
                      <Badge variant={story.status === "published" ? "default" : "secondary"} className="text-xs capitalize">
                        {story.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isContributor && (
                          <>
                            {isAdmin && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Ad Management"
                                  onClick={() => setAdManagementItem({ id: story.id, name: story.title, adSlotsRaw: (story as any).adSlots ?? null })}
                                  data-testid={`button-admanage-${story.id}`}
                                >
                                  <Megaphone className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Ad Slot Control"
                                  onClick={() => setAdControlItem({ id: story.id, adSlotsRaw: (story as any).adSlots ?? null })}
                                  data-testid={`button-adcontrol-${story.id}`}
                                >
                                  <LayoutGrid className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Link href={`/image/stories/${story.id}/edit`}>
                              <Button size="icon" variant="ghost" title="Manage Articles" data-testid={`button-manage-${story.id}`}>
                                <BookOpen className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/image/stories/${story.id}/edit`}>
                              <Button size="icon" variant="ghost" title="Edit Article" data-testid={`button-edit-${story.id}`}>
                                <Pencil className="w-4 h-4" />
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
                            {story.status === "published" && (
                              <a href={`/stories/${story.slug}`} target="_blank" rel="noopener noreferrer">
                                <Button size="icon" variant="ghost" title="View Articles" data-testid={`button-view-${story.id}`}>
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </a>
                            )}
                            {isAdmin && (
                              <Switch
                                checked={story.isActive !== false}
                                onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: story.id, isActive: checked })}
                                data-testid={`switch-active-${story.id}`}
                                title={story.isActive !== false ? "Active" : "Inactive"}
                              />
                            )}
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
          contentType="articles"
          contentId={adControlItem.id}
          adSlotsRaw={adControlItem.adSlotsRaw}
          invalidateKey={["/api/stories"]}
        />
      )}

      {adManagementItem && (
        <AdManagementDialog
          key={adManagementItem.id}
          open={!!adManagementItem}
          onOpenChange={(v) => { if (!v) setAdManagementItem(null); }}
          contentType="story"
          contentId={adManagementItem.id}
          contentName={adManagementItem.name}
          adSlotsRaw={adManagementItem.adSlotsRaw}
          invalidateKey={["/api/stories"]}
        />
      )}

      {manageStoryItem && (
        <StoryPartsManagerDialog
          key={manageStoryItem.id}
          storyId={manageStoryItem.id}
          storyTitle={manageStoryItem.title}
          open={!!manageStoryItem}
          onOpenChange={(v) => { if (!v) setManageStoryItem(null); }}
        />
      )}
    </AdminLayout>
  );
}
