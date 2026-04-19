import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { useAuth } from "@/lib/auth";
import { useViewAs } from "@/lib/view-as";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, BookOpen, Save, Search, ExternalLink, Eye, Copy, GripVertical, X, ImageIcon, Settings2, Clock, BarChart2, CalendarDays, FileText, Star, LayoutGrid, Megaphone } from "lucide-react";
import type { Dua } from "@shared/schema";
import { AdControlDialog } from "@/components/ad-control-dialog";
import { AdManagementDialog } from "@/components/ad-management-dialog";

type DuaListResult = { duas: Dua[]; total: number };

type PartDraft = {
  id: string;
  dbId?: number;
  title: string;
  arabicText: string;
  transliteration: string;
  translation: string;
  explanation: string;
};

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}


function newPartDraft(): PartDraft {
  return { id: Math.random().toString(36).slice(2), title: "", arabicText: "", transliteration: "", translation: "", explanation: "" };
}

type DuaStatusFilter = "all" | "published" | "draft" | "recent" | "most-viewed" | "best-rating";
type DuaDateFilter = "all" | "7d" | "30d" | "90d" | "month" | "custom";

export default function AdminDuasPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Dua | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<DuaStatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DuaDateFilter>("all");
  const [customDays, setCustomDays] = useState("30");
  const [recentDays, setRecentDays] = useState("30");
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { user, isAdmin } = useAuth();
  const { viewAs, viewMeMode } = useViewAs();
  const isContributor = !viewMeMode && (!!viewAs || !isAdmin);
  const effectiveFilterUserId = viewMeMode ? (viewAs?.id ?? user?.id) : !isAdmin ? user?.id : undefined;
  const shouldIncludeNull = viewMeMode && !viewAs && (user?.role === "super_owner" || user?.role === "owner");
  const [adControlItem, setAdControlItem] = useState<{ id: string; adSlotsRaw: string | null } | null>(null);
  const [adManagementItem, setAdManagementItem] = useState<{ id: string; name: string; adSlotsRaw: string | null } | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [published, setPublished] = useState(false);
  const [ratingEnabled, setRatingEnabled] = useState(true);
  const [slugManual, setSlugManual] = useState(false);

  const [parts, setParts] = useState<PartDraft[]>([newPartDraft()]);
  const [removedPartDbIds, setRemovedPartDbIds] = useState<number[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);

  const { startDate, endDate, apiSort } = useMemo(() => {
    const ms = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
    if (statusFilter === "recent") {
      const days = parseInt(recentDays) || 30;
      return { startDate: ms(days), endDate: undefined, apiSort: "newest" };
    }
    if (statusFilter === "most-viewed") {
      const base = { apiSort: "most-viewed" };
      if (dateFilter === "7d") return { ...base, startDate: ms(7), endDate: undefined };
      if (dateFilter === "30d") return { ...base, startDate: ms(30), endDate: undefined };
      if (dateFilter === "90d") return { ...base, startDate: ms(90), endDate: undefined };
      if (dateFilter === "custom") { const d = parseInt(customDays) || 30; return { ...base, startDate: ms(d), endDate: undefined }; }
      if (dateFilter === "month") {
        const [y, m] = filterMonth.split("-").map(Number);
        return { ...base, startDate: new Date(y, m - 1, 1).toISOString(), endDate: new Date(y, m, 0, 23, 59, 59).toISOString() };
      }
      return { ...base, startDate: undefined, endDate: undefined };
    }
    const base = { apiSort: "newest" };
    if (dateFilter === "7d") return { ...base, startDate: ms(7), endDate: undefined };
    if (dateFilter === "30d") return { ...base, startDate: ms(30), endDate: undefined };
    if (dateFilter === "90d") return { ...base, startDate: ms(90), endDate: undefined };
    if (dateFilter === "custom") { const d = parseInt(customDays) || 30; return { ...base, startDate: ms(d), endDate: undefined }; }
    if (dateFilter === "month") {
      const [y, m] = filterMonth.split("-").map(Number);
      return { ...base, startDate: new Date(y, m - 1, 1).toISOString(), endDate: new Date(y, m, 0, 23, 59, 59).toISOString() };
    }
    return { ...base, startDate: undefined, endDate: undefined };
  }, [statusFilter, dateFilter, customDays, recentDays, filterMonth]);

  const queryParams = new URLSearchParams({ limit: "50" });
  if (effectiveFilterUserId) queryParams.set("userId", effectiveFilterUserId);
  if (shouldIncludeNull) queryParams.set("includeNullUser", "true");
  if (search) queryParams.set("search", search);
  if (categoryFilter !== "all") queryParams.set("category", categoryFilter);
  if (statusFilter === "published") queryParams.set("published", "true");
  if (statusFilter === "draft") queryParams.set("published", "false");
  if (apiSort) queryParams.set("sort", apiSort);
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  const queryString = queryParams.toString();

  const { data, isLoading } = useQuery<DuaListResult>({
    queryKey: ["/api/admin/duas", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/duas?${queryString}`, { credentials: "include" });
      return res.json();
    },
  });

  const { data: stats } = useQuery<{ total: number; published: number; totalViews: number; recentCount: number; fiveStarCount: number; fourStarCount: number }>({
    queryKey: ["/api/admin/duas/stats", effectiveFilterUserId, shouldIncludeNull],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (effectiveFilterUserId) p.set("viewAs", effectiveFilterUserId);
      if (shouldIncludeNull) p.set("includeNullUser", "true");
      const url = `/api/admin/duas/stats${p.toString() ? `?${p.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      return res.json();
    },
  });

  const { data: categoriesData } = useQuery<string[]>({
    queryKey: ["/api/admin/duas/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/duas/categories", { credentials: "include" });
      return res.json();
    },
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

  const duas = data?.duas ?? [];

  const createDua = useMutation({
    mutationFn: (d: Partial<Dua>) => apiRequest("POST", "/api/admin/duas", d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/duas"] }),
  });

  const updateDua = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Dua> }) =>
      apiRequest("PATCH", `/api/admin/duas/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/duas"] }),
  });

  const deleteDua = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/duas/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/duas"] }),
  });

  const duplicateDua = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/duas/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/duas"] });
      toast({ title: "Duplicated", description: "A draft copy has been created." });
    },
  });

  const toggleActiveDua = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/duas/${id}/active`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/duas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/duas"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditing(null);
    setTitle(""); setSlug(""); setDescription(""); setCategory(""); setThumbnail(""); setPublished(false); setRatingEnabled(true); setSlugManual(false);
    setParts([newPartDraft()]);
    setDialog(true);
  };

  const openEdit = async (dua: Dua) => {
    setEditing(dua);
    setTitle(dua.title); setSlug(dua.slug); setDescription(dua.description ?? "");
    setCategory(dua.category ?? ""); setThumbnail(dua.thumbnail ?? "");
    setPublished(dua.published ?? false); setRatingEnabled(dua.ratingEnabled ?? true); setSlugManual(true);
    setRemovedPartDbIds([]);
    setParts([]);
    setDialog(true);
    setPartsLoading(true);
    try {
      const res = await fetch(`/api/admin/duas/${dua.id}`, { credentials: "include" });
      const loaded = await res.json();
      const loadedParts = loaded?.parts;
      if (Array.isArray(loadedParts) && loadedParts.length > 0) {
        setParts(loadedParts.map((p: any) => ({
          id: String(p.id),
          dbId: p.id,
          title: p.title ?? "",
          arabicText: p.arabicText ?? "",
          transliteration: p.transliteration ?? "",
          translation: p.translation ?? "",
          explanation: p.explanation ?? "",
        })));
      } else {
        setParts([newPartDraft()]);
      }
    } catch {
      setParts([newPartDraft()]);
    } finally {
      setPartsLoading(false);
    }
  };

  const updatePart = (id: string, field: keyof PartDraft, value: string) => {
    setParts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addPart = () => setParts(prev => [...prev, newPartDraft()]);

  const removePart = (id: string) => {
    const part = parts.find(p => p.id === id);
    if (part?.dbId) {
      setRemovedPartDbIds(prev => [...prev, part.dbId!]);
    }
    if (parts.length === 1 && !part?.dbId) return;
    setParts(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = async () => {
    if (!title || !slug) {
      toast({ title: "Required", description: "Title and slug are required.", variant: "destructive" });
      return;
    }
    try {
      if (editing) {
        await updateDua.mutateAsync({ id: editing.id, data: { title, slug, description, category, thumbnail, published, ratingEnabled } });
        for (const dbId of removedPartDbIds) {
          await apiRequest("DELETE", `/api/admin/dua-parts/${dbId}`);
        }
        const filledParts = parts.filter(p => p.title || p.arabicText || p.transliteration || p.translation || p.explanation);
        for (const part of filledParts) {
          const partData = {
            title: part.title || title,
            arabicText: part.arabicText,
            transliteration: part.transliteration,
            translation: part.translation,
            explanation: part.explanation,
          };
          if (part.dbId) {
            await apiRequest("PATCH", `/api/admin/dua-parts/${part.dbId}`, partData);
          } else {
            await apiRequest("POST", `/api/admin/duas/${editing.id}/parts`, partData);
          }
        }
        queryClient.invalidateQueries({ queryKey: ["/api/admin/duas"] });
        toast({ title: "Saved", description: "Dua updated." });
      } else {
        const res = await apiRequest("POST", "/api/admin/duas", { title, slug, description, category, thumbnail, published, ratingEnabled });
        const created = await res.json();
        const filledParts = parts.filter(p => p.title || p.arabicText || p.transliteration || p.translation || p.explanation);
        for (const part of filledParts) {
          await apiRequest("POST", `/api/admin/duas/${created.id}/parts`, {
            title: part.title || title,
            arabicText: part.arabicText,
            transliteration: part.transliteration,
            translation: part.translation,
            explanation: part.explanation,
          });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/admin/duas"] });
        toast({ title: "Created", description: filledParts.length > 0 ? `Dua created with ${filledParts.length} part(s).` : "Dua created. Use 'Manage Duas' to add content." });
      }
      setDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to save.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDua.mutateAsync(deleteId);
    setDeleteId(null);
    toast({ title: "Deleted" });
  };

  const handleTogglePublished = async (dua: Dua) => {
    await updateDua.mutateAsync({ id: dua.id, data: { published: !dua.published } });
    toast({ title: dua.published ? "Unpublished" : "Published" });
  };

  const isSaving = createDua.isPending || updateDua.isPending;

  const showDateFilter = statusFilter !== "recent";

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-admin-duas-title">Duas</h1>
          <p className="text-sm text-muted-foreground">Manage Islamic supplication collections</p>
        </div>
        {!isContributor && (
          <Button onClick={openCreate} data-testid="button-create-dua">
            <Plus className="w-4 h-4 mr-2" />New Dua
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <Card className="p-4" data-testid="stat-total-duas">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-medium">Total Duas</span>
          </div>
          {stats ? <p className="text-2xl font-bold">{stats.total}</p> : <Skeleton className="h-7 w-12 mt-1" />}
        </Card>
        <Card className="p-4" data-testid="stat-total-views">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <BarChart2 className="w-4 h-4" />
            <span className="text-xs font-medium">Total Views</span>
          </div>
          {stats ? <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p> : <Skeleton className="h-7 w-12 mt-1" />}
        </Card>
        <Card className="p-4" data-testid="stat-published-duas">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-medium">Published</span>
          </div>
          {stats ? <p className="text-2xl font-bold">{stats.published}</p> : <Skeleton className="h-7 w-12 mt-1" />}
        </Card>
        <Card className="p-4" data-testid="stat-rating">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <Star className="w-4 h-4" />
            <span className="text-xs font-medium">Total Rating</span>
          </div>
          {stats ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">⭐ 5-Star</span>
                <span className="text-sm font-bold">{stats.fiveStarCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">⭐ 4-Star</span>
                <span className="text-sm font-bold">{stats.fourStarCount}</span>
              </div>
            </div>
          ) : <Skeleton className="h-10 w-full mt-1" />}
        </Card>
        <Card className="p-4" data-testid="stat-recent">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span className="text-xs font-medium">Recent (30d)</span>
          </div>
          {stats ? <p className="text-2xl font-bold">{stats.recentCount}</p> : <Skeleton className="h-7 w-12 mt-1" />}
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <div className="flex items-center gap-3 p-4 border-b flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search duas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-dua-search"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48" data-testid="select-dua-category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(categoriesData || []).map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DuaStatusFilter)}>
            <SelectTrigger className="w-40" data-testid="select-dua-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="recent">Recent Duas</SelectItem>
              <SelectItem value="most-viewed">Most Viewed</SelectItem>
              <SelectItem value="best-rating">Best Rating</SelectItem>
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
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DuaDateFilter)}>
                <SelectTrigger className="w-36" data-testid="select-dua-date-filter">
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
              {dateFilter === "custom" && (
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
              {dateFilter === "month" && (
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
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : duas.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-40" />
            <p className="font-medium">{!stats?.total ? "No duas yet." : "No results found."}</p>
            {!stats?.total && <p className="text-sm mt-1">Create your first Dua to get started.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden xl:table-cell">Author</TableHead>
                  <TableHead className="text-center">Views</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duas.map(dua => (
                  <TableRow key={dua.id} data-testid={`row-dua-${dua.id}`}>
                    <TableCell className="max-w-[180px]">
                      <div>
                        <p className="font-medium text-sm truncate max-w-[170px]" title={dua.title}>{dua.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[170px]">/duas/{dua.slug}</p>
                        <p className="text-[10px] font-mono text-muted-foreground/50">#{dua.id.slice(0, 8)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[110px]">
                      {dua.category ? (
                        <Badge variant="secondary" className="text-xs truncate max-w-[100px] block" title={dua.category}>
                          {dua.category}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {dua.userId ? (staffMap[dua.userId] ?? dua.userId.slice(0, 8)) : <span className="italic">System</span>}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <Eye className="w-3.5 h-3.5" />
                        {dua.views ?? 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        {((dua as any).averageRating || 0).toFixed(1)}
                        <span className="text-muted-foreground">({(dua as any).totalRatings || 0})</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={dua.published ? "default" : "secondary"} className="text-xs">
                        {dua.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isContributor && (
                          <>
                            {isAdmin && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Ad Management"
                                  onClick={() => setAdManagementItem({ id: dua.id, name: dua.title, adSlotsRaw: (dua as any).adSlots ?? null })}
                                  data-testid={`button-admanage-${dua.id}`}
                                >
                                  <Megaphone className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Ad Slot Control"
                                  onClick={() => setAdControlItem({ id: dua.id, adSlotsRaw: (dua as any).adSlots ?? null })}
                                  data-testid={`button-adcontrol-${dua.id}`}
                                >
                                  <LayoutGrid className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Link href={`/image/duas/${dua.id}/edit`}>
                              <Button size="icon" variant="ghost" title="Manage Duas" data-testid={`button-edit-parts-${dua.id}`}>
                                <BookOpen className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(dua)} data-testid={`button-edit-${dua.id}`} title="Edit details">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon" variant="ghost"
                              onClick={() => duplicateDua.mutate(dua.id)}
                              disabled={duplicateDua.isPending}
                              data-testid={`button-duplicate-${dua.id}`}
                              title="Duplicate as draft"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon" variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(dua.id)}
                              data-testid={`button-delete-${dua.id}`}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            {dua.published && (
                              <a href={`/duas/${dua.slug}`} target="_blank" rel="noopener noreferrer">
                                <Button size="icon" variant="ghost" data-testid={`button-view-${dua.id}`} title="View Duas">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </a>
                            )}
                            {isAdmin && (
                              <Switch
                                checked={dua.isActive !== false}
                                onCheckedChange={(checked) => toggleActiveDua.mutate({ id: dua.id, isActive: checked })}
                                data-testid={`switch-active-${dua.id}`}
                                title={dua.isActive !== false ? "Active" : "Inactive"}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${editing ? "bg-blue-50 dark:bg-blue-950/40" : "bg-primary/10"}`}>
                {editing ? <Settings2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <Plus className="w-4 h-4 text-primary" />}
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  {editing ? "Edit Dua" : "New Dua"}
                </DialogTitle>
                {editing && (
                  <p className="text-xs text-muted-foreground mt-0.5 font-normal">{editing.title}</p>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {/* Section label */}
            <div className="flex items-center gap-2 pb-1 border-b">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Collection Details
              </span>
            </div>

            {/* Collection metadata */}
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={e => { setTitle(e.target.value); if (!slugManual) setSlug(slugify(e.target.value)); }}
                  placeholder="Morning Duas"
                  className="mt-1"
                  data-testid="input-dua-title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>URL Slug</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground shrink-0">/duas/</span>
                    <Input
                      value={slug}
                      onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
                      placeholder="morning-duas"
                      data-testid="input-dua-slug"
                    />
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g. Morning, Evening, Protection..."
                    className="mt-1"
                    list="dua-category-suggestions"
                    data-testid="input-dua-category"
                  />
                  <datalist id="dua-category-suggestions">
                    {(categoriesData || []).map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <Label>Short Description</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief description shown on the card..."
                  className="mt-1"
                  data-testid="input-dua-description"
                />
              </div>

              <div>
                <Label className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  Thumbnail URL <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Input
                  value={thumbnail}
                  onChange={e => setThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                  data-testid="input-dua-thumbnail"
                />
              </div>

              <div className="flex items-center gap-3 py-1">
                <Switch checked={published} onCheckedChange={setPublished} id="dua-published" data-testid="switch-dua-published" />
                <Label htmlFor="dua-published" className="cursor-pointer">Published (visible to visitors)</Label>
              </div>
              <div className="flex items-center gap-3 py-1">
                <Switch checked={ratingEnabled} onCheckedChange={setRatingEnabled} id="dua-rating-enabled" data-testid="switch-dua-rating-enabled" />
                <Label htmlFor="dua-rating-enabled" className="cursor-pointer">Enable Ratings (allow users to rate this dua)</Label>
              </div>
            </div>

            {/* Dua parts — shown for both create and edit mode */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Dua Content</p>
                  <p className="text-xs text-muted-foreground">Add one or more supplications to this collection</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addPart} disabled={partsLoading} data-testid="button-add-part">
                  <Plus className="w-3.5 h-3.5 mr-1" />Add Part
                </Button>
              </div>

              {partsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                </div>
              ) : (
                parts.map((part, idx) => (
                  <Card key={part.id} className="relative" data-testid={`card-part-draft-${idx}`}>
                    <CardHeader className="pb-0 pt-3 px-4">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-1">
                          Part {idx + 1}{part.dbId ? "" : " (new)"}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removePart(part.id)}
                          data-testid={`button-remove-part-${idx}`}
                          title="Remove this part"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-3 space-y-3">
                      <div>
                        <Label className="text-xs">Dua Name / Title</Label>
                        <Input
                          value={part.title}
                          onChange={e => updatePart(part.id, "title", e.target.value)}
                          placeholder="e.g. Bismika Allahumma – Before Sleeping"
                          className="mt-1 h-8 text-sm"
                          data-testid={`input-part-title-${idx}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Arabic Text</Label>
                        <Textarea
                          value={part.arabicText}
                          onChange={e => updatePart(part.id, "arabicText", e.target.value)}
                          rows={3}
                          placeholder="اللَّهُمَّ بِاسْمِكَ..."
                          className="mt-1 text-right text-lg leading-loose"
                          dir="rtl"
                          lang="ar"
                          style={{ fontFamily: "'Amiri', serif" }}
                          data-testid={`input-part-arabic-${idx}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Transliteration <span className="text-muted-foreground font-normal">(pronunciation)</span></Label>
                        <Textarea
                          value={part.transliteration}
                          onChange={e => updatePart(part.id, "transliteration", e.target.value)}
                          rows={2}
                          placeholder="Bismika Allahumma amutu wa ahya..."
                          className="mt-1 text-sm"
                          data-testid={`input-part-transliteration-${idx}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">English Translation</Label>
                        <Textarea
                          value={part.translation}
                          onChange={e => updatePart(part.id, "translation", e.target.value)}
                          rows={2}
                          placeholder="O Allah, in Your name I live and die..."
                          className="mt-1 text-sm"
                          data-testid={`input-part-translation-${idx}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Explanation & Virtues <span className="text-muted-foreground font-normal">(optional — shown on Page 2)</span></Label>
                        <Textarea
                          value={part.explanation}
                          onChange={e => updatePart(part.id, "explanation", e.target.value)}
                          rows={3}
                          placeholder="This dua was narrated by... Its virtues include..."
                          className="mt-1 text-sm"
                          data-testid={`input-part-explanation-${idx}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-dua">
              <Save className="w-4 h-4 mr-2" />
              {editing ? "Update Dua" : "Create Dua"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Dua?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the Dua and all its individual supplications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
          contentType="duas"
          contentId={adControlItem.id}
          adSlotsRaw={adControlItem.adSlotsRaw}
          invalidateKey={["/api/admin/duas"]}
        />
      )}

      {adManagementItem && (
        <AdManagementDialog
          key={adManagementItem.id}
          open={!!adManagementItem}
          onOpenChange={(v) => { if (!v) setAdManagementItem(null); }}
          contentType="dua"
          contentId={adManagementItem.id}
          contentName={adManagementItem.name}
          adSlotsRaw={adManagementItem.adSlotsRaw}
          invalidateKey={["/api/admin/duas"]}
        />
      )}
    </AdminLayout>
  );
}
