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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, BookOpen, Loader2, Star, Eye, Copy, Upload, FileText, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
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
  const previewInputRef = useRef<HTMLInputElement>(null);


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
  const [uploading, setUploading] = useState(false);

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

  const uploadPreview = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("preview", file);
    const res = await fetch("/api/upload/preview", { method: "POST", body: fd });
    const data = await res.json();
    setPreviewPages([...previewPages, data.url]);
    setUploading(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data: any = {
        title, slug, author, description, coverUrl, affiliateLink,
        amazonAffiliateLink, category, type,
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
                data-testid="input-book-category"
              />
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
      setNewTitle("");
      setNewStart("1");
      setNewEnd("1");
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

export default function AdminBooksPage() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | undefined>();
  const [chaptersBook, setChaptersBook] = useState<Book | undefined>();

  const { user, isAdmin } = useAuth();
  const { viewAs, viewMeMode } = useViewAs();
  const isContributor = !viewMeMode && (!!viewAs || !isAdmin);
  const viewMeUserId = viewMeMode ? (viewAs?.id ?? user?.id) : undefined;

  const booksQueryKey = viewMeUserId ? ["/api/books", { userId: viewMeUserId }] : ["/api/books"];
  const booksUrl = viewMeUserId ? `/api/books?userId=${viewMeUserId}` : "/api/books";

  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: booksQueryKey,
    queryFn: async () => {
      const res = await fetch(booksUrl, { credentials: "include" });
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/books/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: "Book deleted" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/books/${id}/duplicate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: "Book duplicated" });
    },
  });

  const openCreate = () => { setEditingBook(undefined); setFormOpen(true); };
  const openEdit = (book: Book) => { setEditingBook(book); setFormOpen(true); };

  const mostViewed = books?.reduce((prev, curr) => ((curr.views || 0) > (prev.views || 0) ? curr : prev), books[0]);
  const highestRated = books?.reduce((prev, curr) => ((curr.averageRating || 0) > (prev.averageRating || 0) ? curr : prev), books[0]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
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

        {books && books.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total Books</p>
              <p className="text-2xl font-bold" data-testid="stat-total-books">{books.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Most Viewed</p>
              <p className="text-sm font-medium truncate" data-testid="stat-most-viewed">{mostViewed?.title || "—"}</p>
              <p className="text-xs text-muted-foreground">{mostViewed?.views || 0} views</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Highest Rated</p>
              <p className="text-sm font-medium truncate" data-testid="stat-highest-rated">{highestRated?.title || "—"}</p>
              <p className="text-xs text-muted-foreground">{(highestRated?.averageRating || 0).toFixed(1)} stars</p>
            </Card>
          </div>
        )}

        {isLoading ? (
          <Card className="p-4"><div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div></Card>
        ) : !books || books.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold mb-2">No books yet</h2>
            <p className="text-sm text-muted-foreground mb-4">Add your first book.</p>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Add Book</Button>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.id} data-testid={`row-book-${book.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt="" className="w-8 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-8 h-12 bg-muted rounded flex items-center justify-center"><BookOpen className="w-4 h-4 text-muted-foreground" /></div>
                        )}
                        <span className="font-medium" data-testid={`text-book-row-title-${book.id}`}>{book.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{book.author}</TableCell>
                    <TableCell className="text-muted-foreground">{book.category || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={book.type === "free" ? "default" : "secondary"} className="capitalize text-xs">{book.type}</Badge>
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
                      <div className="flex items-center gap-1 text-sm text-muted-foreground"><Eye className="w-3.5 h-3.5" />{book.views || 0}</div>
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
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
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
          </Card>
        )}
      </div>

      <BookFormDialog key={editingBook?.id || "new"} book={editingBook} open={formOpen} onOpenChange={setFormOpen} />
      {chaptersBook && (
        <ChaptersDialog book={chaptersBook} open={!!chaptersBook} onOpenChange={(v) => { if (!v) setChaptersBook(undefined); }} />
      )}
    </AdminLayout>
  );
}
