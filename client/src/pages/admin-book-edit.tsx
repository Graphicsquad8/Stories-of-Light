import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Upload, Info } from "lucide-react";
import type { Book } from "@shared/schema";

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminBookEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { data: book, isLoading } = useQuery<Book>({
    queryKey: ["/api/admin/books", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/books/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Book not found");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: categoriesData } = useQuery<string[]>({
    queryKey: ["/api/admin/books/categories"],
    queryFn: () => fetch("/api/admin/books/categories", { credentials: "include" }).then(r => r.json()),
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [amazonAffiliateLink, setAmazonAffiliateLink] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("free");
  const [price, setPrice] = useState("");
  const [buyButtonLabel, setBuyButtonLabel] = useState("");
  const [ratingEnabled, setRatingEnabled] = useState(true);
  const [published, setPublished] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setSlug(book.slug);
      setAuthor(book.author);
      setDescription(book.description || "");
      setCoverUrl(book.coverUrl || "");
      setAffiliateLink(book.affiliateLink || "");
      setAmazonAffiliateLink(book.amazonAffiliateLink || "");
      setCategory(book.category || "");
      setType(book.type || "free");
      setPrice(book.price || "");
      setBuyButtonLabel(book.buyButtonLabel || "");
      setRatingEnabled(book.ratingEnabled ?? true);
      setPublished(book.published ?? true);
    }
  }, [book]);

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
    mutationFn: () => apiRequest("PATCH", `/api/books/${id}`, {
      title, slug, author, description, coverUrl, affiliateLink,
      amazonAffiliateLink, category, type, ratingEnabled, published,
      price: price || null,
      fullContentUrl: null,
      previewPages: type === "paid" ? (book?.previewPages || []) : [],
      buyButtonLabel: buyButtonLabel || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: "Book updated" });
      navigate("/image/books");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/image/books">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            {isLoading ? <Skeleton className="h-7 w-48" /> : (
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold truncate" data-testid="text-edit-book-title">
                  {book?.title}
                </h1>
                {book && (
                  <Badge variant={book.published ? "default" : "secondary"}>
                    {book.published ? "Published" : "Draft"}
                  </Badge>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">Edit book details and settings.</p>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !title || !author || !slug || isLoading}
            data-testid="button-save-book"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="space-y-5">
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
                  {(categoriesData || []).map(cat => <option key={cat} value={cat} />)}
                </datalist>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Book title"
                data-testid="input-book-title"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="book-slug"
                data-testid="input-book-slug"
              />
            </div>

            <div className="space-y-2">
              <Label>Author</Label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
                data-testid="input-book-author"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description..."
                rows={4}
                data-testid="input-book-description"
              />
            </div>

            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="flex items-center gap-3">
                {coverUrl && <img src={coverUrl} alt="" className="w-12 h-16 object-cover rounded" />}
                <Input
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="Cover URL or upload"
                  className="flex-1"
                  data-testid="input-book-cover"
                />
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading}
                  data-testid="button-upload-cover"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary">
                  {type === "free" ? "Content added via Parts & Pages" : "Preview content added via Parts & Pages"}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Use the Manage Books editor to add or edit {type === "paid" ? "the preview pages users can read before buying" : "reading content"}.
                </p>
              </div>
            </div>

            {type === "paid" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="$9.99"
                      data-testid="input-book-price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amazon Affiliate Link</Label>
                    <Input
                      value={amazonAffiliateLink}
                      onChange={(e) => setAmazonAffiliateLink(e.target.value)}
                      placeholder="https://amazon.com/dp/..."
                      data-testid="input-book-amazon"
                    />
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
                  <p className="text-xs text-muted-foreground">Customise the purchase button — e.g. "Buy on Kindle". Leave blank for "Buy on Amazon".</p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Affiliate / External Link</Label>
              <Input
                value={affiliateLink}
                onChange={(e) => setAffiliateLink(e.target.value)}
                placeholder="https://..."
                data-testid="input-book-affiliate"
              />
            </div>

            <div className="flex items-center gap-3 py-1">
              <Switch checked={published} onCheckedChange={setPublished} id="book-published" data-testid="switch-book-published" />
              <Label htmlFor="book-published" className="cursor-pointer">Published</Label>
            </div>

            <div className="flex items-center gap-3 py-1">
              <Switch checked={ratingEnabled} onCheckedChange={setRatingEnabled} id="book-rating-enabled" data-testid="switch-book-rating-enabled" />
              <Label htmlFor="book-rating-enabled" className="cursor-pointer">Enable Ratings (allow users to rate this book)</Label>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Link href="/image/books">
                <Button variant="outline" data-testid="button-cancel">Cancel</Button>
              </Link>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !title || !author || !slug}
                data-testid="button-save-book-bottom"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
