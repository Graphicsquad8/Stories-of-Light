import { useQuery, useMutation } from "@tanstack/react-query";
import type { Book, BookChapter } from "@shared/schema";
import { AdminLayout } from "@/components/admin-layout";
import { useAuth } from "@/lib/auth";
import { useViewAs } from "@/lib/view-as";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Pencil, Trash2, BookOpen, Loader2, Star, Eye, Copy, Upload,
  FileText, Info, Search, Clock, BarChart2, CalendarDays, BookMarked,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useRef } from "react";
import { Link, useLocation } from "wouter";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function BookFormDialog({ book, open, onOpenChange }: {
  book?: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const isEdit = !!book;
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(book?.title || "");
  const [slug, setSlug] = useState(book?.slug || "");
  const [author, setAuthor] = useState(book?.author || "");
  const [description, setDescription] = useState(book?.description || "");
  const [coverUrl, setCoverUrl] = useState(book?.coverUrl || "");
  const [affiliateLink, setAffiliateLink] = useState(book?.affiliateLink || "");
  const [amazonAffiliateLink, setAmazonAffiliateLink] = useState(book?.amazonAffiliateLink || "");
  const [category, setCategory] = useState(book?.category || "");
  const [type, setType] = useState(book?.type || "free");
  const [price, setPrice] = useState(book?.price || "");
  const [previewPages, setPreviewPages] = useState<string[]>(book?.previewPages || []);
  const [buyButtonLabel, setBuyButtonLabel] = useState(book?.buyButtonLabel || "");
  const [ratingEnabled, setRatingEnabled] = useState(book?.ratingEnabled ?? true);
  const [published, setPublished] = useState(book?.published ?? true);
  const [uploading, setUploading] = useState(false);

  const { data: categoriesData } = useQuery<string[]>({
    queryKey: ["/api/admin/books/categories"],
    queryFn: () => fetch("/api/admin/books/categories", { credentials: "include" }).then(r => r.json()),
  });

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit) setSlug(slugify(val));
  };

  const uploadCover = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("cover", file);
    const res = await fetch("/api/upload/cover", { method: "POST", body: fd });
    const data = await res.json();
    setCoverUrl(data.url);
    setUploading(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data: any = {
        title, slug, author, description, coverUrl, affiliateLink,
        amazonAffiliateLink, category, type, ratingEnabled, published,
        price: price || null,
        fullContentUrl: null,
        previewPages: type === "paid" ? previewPages : [],
        buyButtonLabel: buyButtonLabel || null,
      };
      if (isEdit) {
        await apiRequest("PATCH", `/api/books/${book.id}`, data);
        return null;
      } else {
        const res = await apiRequest("POST", "/api/books", data);
        const created = await res.json();
        return created as Book;
      }
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      if (!isEdit && created) {
        toast({ title: "Book created", description: "Opening Parts & Pages editor to add preview content…" });
        onOpenChange(false);
        navigate(`/image/books/${(created as any).id}/edit`);
      } else {
        toast({ title: isEdit ? "Book updated" : "Book added" });
        onOpenChange(false);
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-book-form">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Book" : "Add Book"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-book-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Seerah, Aqeedah..."
                list="book-category-suggestions"
                data-testid="input-book-category"
              />
              <datalist id="book-category-suggestions">
                {(categoriesData || []).map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Book title" data-testid="input-book-title" />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="book-slug" data-testid="input-book-slug" />
          </div>
          <div className="space-y-2">
            <Label>Author</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" data-testid="input-book-author" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description..." rows={3} data-testid="input-book-description" />
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-3">
              {coverUrl && <img src={coverUrl} alt="" className="w-12 h-16 object-cover rounded" />}
              <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="Cover URL or upload" className="flex-1" data-testid="input-book-cover" />
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
              <Button type="button" size="icon" variant="outline" onClick={() => coverInputRef.current?.click()} disabled={uploading} data-testid="button-upload-cover">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3" data-testid="info-book-content">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary">
                {type === "free" ? "Content added via Parts & Pages" : "Preview content added via Parts & Pages"}
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {isEdit
                  ? `Use the Parts & Pages editor (table icon in the books list) to add or edit ${type === "paid" ? "the 1–2 preview pages users can read before buying" : "reading content"}.`
                  : `After saving, you'll be taken to the Parts & Pages editor to add ${type === "paid" ? "the 1–2 preview pages that users can read before buying" : "reading content"}.`}
              </p>
            </div>
          </div>

          {type === "paid" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$9.99" data-testid="input-book-price" />
                </div>
                <div className="space-y-2">
                  <Label>Amazon Affiliate Link</Label>
                  <Input value={amazonAffiliateLink} onChange={(e) => setAmazonAffiliateLink(e.target.value)} placeholder="https://amazon.com/dp/..." data-testid="input-book-amazon" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Buy Button Label</Label>
                <Input
                  value={buyButtonLabel}
                  onChange={(e) => setBuyButtonLabel(e.target.value)}
                  placeholder="Buy on Amazon (default)"
                  data-testid="input-buy-button-label"
                />
                <p className="text-xs text-muted-foreground">Customise the purchase button shown to users — e.g. "Buy on Kindle", "Buy on Daraz". Leave blank for "Buy on Amazon".</p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Affiliate / External Link</Label>
            <Input value={affiliateLink} onChange={(e) => setAffiliateLink(e.target.value)} placeholder="https://..." data-testid="input-book-affiliate" />
          </div>

          <div className="flex items-center gap-3 py-1">
            <Switch checked={published} onCheckedChange={setPublished} id="book-published" data-testid="switch-book-published" />
            <Label htmlFor="book-published" className="cursor-pointer">Published</Label>
          </div>

          <div className="flex items-center gap-3 py-1">
            <Switch checked={ratingEnabled} onCheckedChange={setRatingEnabled} id="book-rating-enabled" data-testid="switch-book-rating-enabled" />
            <Label htmlFor="book-rating-enabled" className="cursor-pointer">Enable Ratings (allow users to rate this book)</Label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-book-cancel">Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !title || !author || !slug} data-testid="button-book-save">
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Update" : "Add"} Book
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChaptersDialog({ book, open, onOpenChange }: { book: Book; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("1");
  const [newEnd, setNewEnd] = useState("1");

  const { data: chapters, isLoading } = useQuery<BookChapter[]>({
    queryKey: ["/api/books", book.id, "chapters"],
    queryFn: () => fetch(`/api/books/${book.id}/chapters`).then(r => r.json()),
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/books/${book.id}/chapters`, {
        title: newTitle,
        orderIndex: (chapters?.length || 0),
        startPage: parseInt(newStart),
        endPage: parseInt(newEnd),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", book.id, "chapters"] });
      setNewTitle(""); setNewStart("1"); setNewEnd("1");
      toast({ title: "Chapter added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/books/chapters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", book.id, "chapters"] });
      toast({ title: "Chapter deleted" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" data-testid="dialog-chapters">
        <DialogHeader>
          <DialogTitle>Chapters — {book.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="space-y-2">
              {chapters?.map((ch, i) => (
                <div key={ch.id} className="flex items-center justify-between p-2 border rounded-md text-sm" data-testid={`admin-chapter-${ch.id}`}>
                  <span><span className="text-muted-foreground mr-2">{i + 1}.</span>{ch.title} (pp. {ch.startPage}–{ch.endPage})</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(ch.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              {(!chapters || chapters.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No chapters yet</p>}
            </div>
          )}
          <div className="border-t pt-4 space-y-3">
            <Label className="text-sm font-semibold">Add Chapter</Label>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Chapter title" data-testid="input-chapter-title" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Start Page</Label>
                <Input type="number" value={newStart} onChange={(e) => setNewStart(e.target.value)} data-testid="input-chapter-start" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Page</Label>
                <Input type="number" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} data-testid="input-chapter-end" />
              </div>
            </div>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !newTitle} size="sm" data-testid="button-add-chapter">
              {addMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Chapter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type BookStatusFilter = "all" | "published" | "draft" | "recent" | "most-viewed" | "best-rating";
type BookDateFilter = "all" | "7d" | "30d" | "90d" | "month" | "custom";

export default function AdminBooksPage() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | undefined>();
  const [chaptersBook, setChaptersBook] = useState<Book | undefined>();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<BookStatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<BookDateFilter>("all");
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
    if (statusFilter === "best-rating") {
      const base = { apiSort: "highest-rated" };
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
  if (search) queryParams.set("search", search);
  if (typeFilter !== "all") queryParams.set("type", typeFilter);
  if (categoryFilter !== "all") queryParams.set("category", categoryFilter);
  if (statusFilter === "published") queryParams.set("published", "true");
  if (statusFilter === "draft") queryParams.set("published", "false");
  if (apiSort) queryParams.set("sort", apiSort);
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  const queryString = queryParams.toString();

  const { data, isLoading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/admin/books", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/books?${queryString}`, { credentials: "include" });
      return res.json();
    },
  });

  const { data: stats } = useQuery<{
    total: number; freeTotal: number; paidTotal: number;
    totalViews: number; freeViews: number; paidViews: number;
    published: number; publishedFree: number; publishedPaid: number;
    recentCount: number; recentFree: number; recentPaid: number;
    fiveStarCount: number; fiveStarFree: number; fiveStarPaid: number;
    fourStarCount: number; fourStarFree: number; fourStarPaid: number;
  }>({
    queryKey: ["/api/admin/books/stats", effectiveFilterUserId],
    queryFn: async () => {
      const url = `/api/admin/books/stats${effectiveFilterUserId ? `?viewAs=${effectiveFilterUserId}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      return res.json();
    },
  });

  const { data: categoriesData } = useQuery<string[]>({
    queryKey: ["/api/admin/books/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/books/categories", { credentials: "include" });
      return res.json();
    },
  });

  const booksList = data?.books || [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/books/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: "Book deleted" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/books/${id}/duplicate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: "Book duplicated" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      await apiRequest("PATCH", `/api/admin/books/${id}/publish`, { published });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openCreate = () => { setEditingBook(undefined); setFormOpen(true); };
  const openEdit = (book: Book) => { setEditingBook(book); setFormOpen(true); };

  const showDateFilter = statusFilter !== "recent";
  const showCustomDaysInput = dateFilter === "custom";
  const showMonthInput = dateFilter === "month";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-admin-books-title">Books</h1>
          <p className="text-sm text-muted-foreground">Manage your Islamic library</p>
        </div>
        {!isContributor && (
          <Button onClick={openCreate} data-testid="button-add-book">
            <Plus className="w-4 h-4 mr-2" /> Add Book
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <Card className="p-4" data-testid="stat-total-books">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-medium">Total Books</span>
          </div>
          {stats ? (
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                <span>Free: {stats.freeTotal}</span>
                <span>·</span>
                <span>Paid: {stats.paidTotal}</span>
              </div>
            </div>
          ) : <Skeleton className="h-10 w-full mt-1" />}
        </Card>

        <Card className="p-4" data-testid="stat-total-views">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <BarChart2 className="w-4 h-4" />
            <span className="text-xs font-medium">Total Views</span>
          </div>
          {stats ? (
            <div>
              <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                <span>Free: {stats.freeViews.toLocaleString()}</span>
                <span>·</span>
                <span>Paid: {stats.paidViews.toLocaleString()}</span>
              </div>
            </div>
          ) : <Skeleton className="h-10 w-full mt-1" />}
        </Card>

        <Card className="p-4" data-testid="stat-published-books">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-medium">Published</span>
          </div>
          {stats ? (
            <div>
              <p className="text-2xl font-bold">{stats.published}</p>
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                <span>Free: {stats.publishedFree}</span>
                <span>·</span>
                <span>Paid: {stats.publishedPaid}</span>
              </div>
            </div>
          ) : <Skeleton className="h-10 w-full mt-1" />}
        </Card>

        <Card className="p-4" data-testid="stat-rating">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Star className="w-4 h-4" />
            <span className="text-xs font-medium">Total Rating</span>
          </div>
          {stats ? (
            <div className="space-y-2 mt-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs text-muted-foreground shrink-0">⭐ 5-Star</span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="tabular-nums">{stats.fiveStarFree}</span>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="tabular-nums">{stats.fiveStarPaid}</span>
                </div>
                <span className="text-sm font-bold tabular-nums ml-1">{stats.fiveStarCount}</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs text-muted-foreground shrink-0">⭐ 4-Star</span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="tabular-nums">{stats.fourStarFree}</span>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="tabular-nums">{stats.fourStarPaid}</span>
                </div>
                <span className="text-sm font-bold tabular-nums ml-1">{stats.fourStarCount}</span>
              </div>
            </div>
          ) : <Skeleton className="h-14 w-full mt-1" />}
        </Card>

        <Card className="p-4" data-testid="stat-recent">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span className="text-xs font-medium">Recent (30d)</span>
          </div>
          {stats ? (
            <div>
              <p className="text-2xl font-bold">{stats.recentCount}</p>
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                <span>Free: {stats.recentFree}</span>
                <span>·</span>
                <span>Paid: {stats.recentPaid}</span>
              </div>
            </div>
          ) : <Skeleton className="h-10 w-full mt-1" />}
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-3 p-4 border-b flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search books..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-books"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36" data-testid="select-type-filter">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="free">Free Books</SelectItem>
              <SelectItem value="paid">Paid Books</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48" data-testid="select-category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(categoriesData || []).map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookStatusFilter)}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="recent">Recent Books</SelectItem>
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
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as BookDateFilter)}>
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
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : booksList.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold mb-2">No books found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {!stats?.total ? "Add your first book." : "Try adjusting your filters."}
            </p>
            {!stats?.total && (
              <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Add Book</Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table data-testid="table-books">
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead className="hidden md:table-cell">Author</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {booksList.map((book) => (
                  <TableRow key={book.id} data-testid={`row-book-${book.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt="" className="w-8 h-12 object-cover rounded shrink-0" />
                        ) : (
                          <div className="w-8 h-12 bg-muted rounded flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-medium line-clamp-1" data-testid={`text-book-row-title-${book.id}`}>{book.title}</span>
                          <span className="text-xs text-muted-foreground block mt-0.5">/{book.slug}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{book.author}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{book.category || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={book.type === "free" ? "default" : "secondary"} className="capitalize text-xs">
                        {book.type}
                      </Badge>
                      {book.price && <span className="text-xs text-muted-foreground ml-1">({book.price})</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        {(book.averageRating || 0).toFixed(1)}
                        <span className="text-muted-foreground">({book.totalRatings || 0})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="w-3.5 h-3.5" />{book.views || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={!!book.published}
                        onCheckedChange={(checked) => togglePublishMutation.mutate({ id: book.id, published: checked })}
                        data-testid={`switch-publish-${book.id}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isContributor && (
                          <>
                            <Link href={`/image/books/${book.id}/edit`}>
                              <Button size="icon" variant="ghost" className="h-8 w-8" data-testid={`button-edit-parts-${book.id}`} title="Edit Parts">
                                <FileText className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => duplicateMutation.mutate(book.id)} data-testid={`button-duplicate-${book.id}`}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(book)} data-testid={`button-edit-book-${book.id}`}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => { if (confirm("Delete this book?")) deleteMutation.mutate(book.id); }}
                              data-testid={`button-delete-book-${book.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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

      <BookFormDialog key={editingBook?.id || "new"} book={editingBook} open={formOpen} onOpenChange={setFormOpen} />
      {chaptersBook && (
        <ChaptersDialog book={chaptersBook} open={!!chaptersBook} onOpenChange={(v) => { if (!v) setChaptersBook(undefined); }} />
      )}
    </AdminLayout>
  );
}
