import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  BookOpen, Star, Eye, ExternalLink, BookmarkIcon,
  ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { BookWithChapters, Book, BookPartWithPages } from "@shared/schema";

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="p-0.5"
          data-testid={`star-input-${s}`}
        >
          <Star className={`w-6 h-6 transition-colors ${s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
        </button>
      ))}
    </div>
  );
}

function PreviewModal({ open, onOpenChange, pages }: { open: boolean; onOpenChange: (v: boolean) => void; pages: string[] }) {
  const [idx, setIdx] = useState(0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-preview">
        <DialogHeader>
          <DialogTitle>Book Preview</DialogTitle>
        </DialogHeader>
        <div className="relative">
          {pages[idx] && (
            <img src={pages[idx]} alt={`Preview page ${idx + 1}`} className="w-full rounded-lg" data-testid="img-preview-page" />
          )}
          {pages.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <Button size="icon" variant="outline" disabled={idx === 0} onClick={() => setIdx(i => i - 1)} data-testid="button-prev-preview">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {idx + 1} of {pages.length}</span>
              <Button size="icon" variant="outline" disabled={idx === pages.length - 1} onClick={() => setIdx(i => i + 1)} data-testid="button-next-preview">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BookDetailPage() {
  const [, params] = useRoute("/books/:slug");
  const slug = params?.slug;
  const { user } = useAuth();
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const { data: book, isLoading } = useQuery<BookWithChapters>({
    queryKey: ["/api/books/slug", slug],
    queryFn: () => fetch(`/api/books/slug/${slug}`).then(r => r.json()),
    enabled: !!slug,
  });

  const { data: bookmarkStatus } = useQuery<{ bookmarked: boolean }>({
    queryKey: ["/api/books", book?.id, "bookmark"],
    queryFn: () => fetch(`/api/books/${book!.id}/bookmark`).then(r => r.json()),
    enabled: !!book && !!user,
  });

  const { data: myRating } = useQuery<any>({
    queryKey: ["/api/books", book?.id, "my-rating"],
    queryFn: () => fetch(`/api/books/${book!.id}/my-rating`).then(r => r.json()),
    enabled: !!book && !!user,
  });

  const { data: ratings } = useQuery<any[]>({
    queryKey: ["/api/books", book?.id, "ratings"],
    queryFn: () => fetch(`/api/books/${book!.id}/ratings`).then(r => r.json()),
    enabled: !!book,
  });

  const { data: recommendations } = useQuery<Book[]>({
    queryKey: ["/api/books", book?.id, "recommendations"],
    queryFn: () => fetch(`/api/books/${book!.id}/recommendations`).then(r => r.json()),
    enabled: !!book,
  });

  const { data: parts } = useQuery<BookPartWithPages[]>({
    queryKey: ["/api/books", book?.id, "parts"],
    queryFn: () => fetch(`/api/books/${book!.id}/parts`).then(r => r.json()),
    enabled: !!book?.id,
  });

  const hasPreviewContent = parts && parts.some(p => p.pages && p.pages.length > 0);

  useEffect(() => {
    if (book?.id) {
      fetch(`/api/books/${book.id}/view`, { method: "POST" });
    }
  }, [book?.id]);

  useEffect(() => {
    if (myRating) {
      setRatingValue(myRating.rating);
      setRatingComment(myRating.comment || "");
    }
  }, [myRating]);

  const bookmarkMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/books/${book!.id}/bookmark`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", book?.id, "bookmark"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/dashboard"] });
    },
  });

  const rateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/books/${book!.id}/rate`, { rating: ratingValue, comment: ratingComment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", book?.id, "ratings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books", book?.id, "my-rating"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books/slug", slug] });
      toast({ title: "Rating submitted" });
    },
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="aspect-[3/4]" />
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!book) {
    return (
      <PublicLayout>
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <h1 className="font-serif text-2xl font-bold mb-2">Book Not Found</h1>
          <p className="text-muted-foreground mb-4">The book you're looking for doesn't exist.</p>
          <Link href="/books"><Button variant="outline">Back to Books</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link href="/books">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-books">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Books
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div>
            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-muted shadow-lg">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" data-testid="img-book-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-20 h-20 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {book.category && <Badge variant="secondary">{book.category}</Badge>}
                  <Badge className={book.type === "free" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"}>
                    {book.type === "free" ? "Free" : "Paid"}
                  </Badge>
                </div>
                <h1 className="font-serif text-3xl font-bold mb-1" data-testid="text-book-title" dangerouslySetInnerHTML={{ __html: book.title }} />
                <p className="text-lg text-muted-foreground" data-testid="text-book-author">by {book.author}</p>
              </div>
              {user && (
                <Button
                  size="icon"
                  variant={bookmarkStatus?.bookmarked ? "default" : "outline"}
                  onClick={() => bookmarkMutation.mutate()}
                  data-testid="button-bookmark-book"
                >
                  <BookmarkIcon className={`w-4 h-4 ${bookmarkStatus?.bookmarked ? "fill-current" : ""}`} />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm">
              {book.ratingEnabled && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(book.averageRating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                  ))}
                  <span className="ml-1 font-medium">{(book.averageRating || 0).toFixed(1)}</span>
                  <span className="text-muted-foreground">({book.totalRatings || 0} ratings)</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="w-4 h-4" /> {book.views || 0} views
              </div>
            </div>

            {book.description && (
              <p className="text-muted-foreground leading-relaxed" data-testid="text-book-description" dangerouslySetInnerHTML={{ __html: book.description || "" }} />
            )}

            {book.price && book.type === "paid" && (
              <p className="text-xl font-bold text-primary" data-testid="text-book-price">{book.price}</p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {book.type === "free" && (
                <Link href={`/books/${book.slug}/read`}>
                  <Button size="lg" data-testid="button-read-online">
                    <BookOpen className="w-4 h-4 mr-2" /> Read Online
                  </Button>
                </Link>
              )}
              {book.type === "paid" && hasPreviewContent && (
                <Link href={`/books/${book.slug}/read?preview=true`}>
                  <Button size="lg" variant="outline" data-testid="button-read-preview">
                    <Eye className="w-4 h-4 mr-2" /> Read Preview
                  </Button>
                </Link>
              )}
              {book.type === "paid" && !hasPreviewContent && book.previewPages && book.previewPages.length > 0 && (
                <Button size="lg" variant="outline" onClick={() => setPreviewOpen(true)} data-testid="button-view-sample">
                  <Eye className="w-4 h-4 mr-2" /> View Sample
                </Button>
              )}
              {book.type === "paid" && (book.amazonAffiliateLink || book.affiliateLink) && (
                <a href={book.amazonAffiliateLink || book.affiliateLink || ""} target="_blank" rel="noopener noreferrer nofollow">
                  <Button size="lg" data-testid="button-buy-amazon">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {(book as any).buyButtonLabel || "Buy on Amazon"}
                  </Button>
                </a>
              )}
            </div>

            {book.chapters && book.chapters.length > 0 && (
              <div className="pt-4">
                <h3 className="font-serif text-lg font-semibold mb-3" data-testid="text-chapters-heading">Chapters</h3>
                <div className="space-y-1">
                  {book.chapters.map((ch, i) => (
                    <div key={ch.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 text-sm" data-testid={`chapter-${ch.id}`}>
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground w-6">{i + 1}.</span>
                        {ch.title}
                      </span>
                      <span className="text-xs text-muted-foreground">pp. {ch.startPage}–{ch.endPage}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {book.ratingEnabled && user && (
          <Card className="p-6 mb-8" data-testid="card-rating-form">
            <h3 className="font-serif text-lg font-semibold mb-4">Rate This Book</h3>
            <div className="space-y-3">
              <StarRatingInput value={ratingValue} onChange={setRatingValue} />
              <Textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Write a short review (optional)..."
                rows={3}
                data-testid="input-rating-comment"
              />
              <Button
                onClick={() => rateMutation.mutate()}
                disabled={ratingValue === 0 || rateMutation.isPending}
                data-testid="button-submit-rating"
              >
                {rateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {myRating ? "Update Rating" : "Submit Rating"}
              </Button>
            </div>
          </Card>
        )}

        {book.ratingEnabled && ratings && ratings.length > 0 && (
          <div className="mb-8">
            <h3 className="font-serif text-lg font-semibold mb-4" data-testid="text-reviews-heading">Reviews ({ratings.length})</h3>
            <div className="space-y-3">
              {ratings.map((r: any) => (
                <Card key={r.id} className="p-4" data-testid={`review-${r.id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                </Card>
              ))}
            </div>
          </div>
        )}

        {recommendations && recommendations.length > 0 && (
          <div>
            <h3 className="font-serif text-lg font-semibold mb-4" data-testid="text-recommendations-heading">You May Also Like</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recommendations.map((rec) => (
                <Link key={rec.id} href={`/books/${rec.slug}`}>
                  <Card className="overflow-hidden group cursor-pointer hover-elevate" data-testid={`rec-book-${rec.id}`}>
                    <div className="aspect-[3/4] overflow-hidden bg-muted">
                      {rec.coverUrl ? (
                        <img src={rec.coverUrl} alt={rec.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-10 h-10 text-muted-foreground/30" /></div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-sm line-clamp-2">{rec.title}</h4>
                      <p className="text-xs text-muted-foreground">{rec.author}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {book.previewPages && book.previewPages.length > 0 && (
          <PreviewModal open={previewOpen} onOpenChange={setPreviewOpen} pages={book.previewPages} />
        )}
      </div>
    </PublicLayout>
  );
}
