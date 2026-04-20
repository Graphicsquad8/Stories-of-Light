import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { AdSlot } from "@/components/ad-slot";
import { AudioPlayer } from "@/components/audio-player";
import { VideoPlayer } from "@/components/video-player";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft, ChevronRight, BookOpen, PanelLeftClose, PanelLeftOpen,
  Home, Headphones, ExternalLink, Lock, List, Star, Video,
  ArrowRight, BookMarked, ChevronDown, ChevronUp, FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect, useCallback } from "react";
import type { Book, BookPartWithPages } from "@shared/schema";

const PREVIEW_PAGE_LIMIT = 2;

type Phase = "cover" | "toc" | "reading";

function flattenPages(parts: BookPartWithPages[]) {
  return parts.flatMap((part, pi) =>
    (part.pages || []).map((page, pgi) => ({
      partIdx: pi,
      pageIdx: pgi,
      part,
      page,
      globalIdx: parts.slice(0, pi).reduce((s, p) => s + (p.pages?.length || 0), 0) + pgi,
    }))
  );
}

export default function BookReaderPage() {
  const [, params] = useRoute("/books/:slug/read");
  const slug = params?.slug;
  const { user } = useAuth();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const isPreviewMode = searchParams.get("preview") === "true";
  const startInReadMode = searchParams.get("mode") === "read";

  const [phase, setPhase] = useState<Phase>(startInReadMode ? "reading" : "cover");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [showAudio, setShowAudio] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [previewEnded, setPreviewEnded] = useState(false);
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  const [viewingToc, setViewingToc] = useState(false);

  const { data: book, isLoading: bookLoading } = useQuery<Book>({
    queryKey: ["/api/books/slug", slug],
    queryFn: () => fetch(`/api/books/slug/${slug}`).then(r => r.json()),
    enabled: !!slug,
  });

  const { data: parts, isLoading: partsLoading } = useQuery<BookPartWithPages[]>({
    queryKey: ["/api/books", book?.id, "parts"],
    queryFn: () => fetch(`/api/books/${book!.id}/parts`).then(r => r.json()),
    enabled: !!book?.id,
  });

  const adSlotsMap: Record<string, any> = (() => {
    try { return JSON.parse((book as any)?.adSlots || "{}"); }
    catch { return {}; }
  })();

  const saveMutation = useMutation({
    mutationFn: async (data: { lastPage: number; lastChapterId?: string }) => {
      await apiRequest("POST", `/api/books/${book!.id}/progress`, data);
    },
  });

  const saveProgress = useCallback(
    (partIndex: number, pageIndex: number) => {
      if (!user || !book || !parts) return;
      const part = parts[partIndex];
      saveMutation.mutate({ lastPage: partIndex * 100 + pageIndex, lastChapterId: part?.id });
    },
    [user, book, parts]
  );

  const navigateTo = (partIdx: number, pageIdx: number) => {
    setActivePartIndex(partIdx);
    setActivePageIndex(pageIdx);
    setShowAudio(false);
    setShowVideo(false);
    setViewingToc(false);
    saveProgress(partIdx, pageIdx);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (phase !== "reading") setPhase("reading");
  };

  const activePart = parts?.[activePartIndex];
  const activePage = activePart?.pages?.[activePageIndex];
  const totalPages = activePart?.pages?.length ?? 0;
  const isFirstPage = activePageIndex === 0;
  const flatPages = parts ? flattenPages(parts) : [];
  const totalBookPages = flatPages.length;
  const currentFlatIndex = flatPages.findIndex(
    fp => fp.partIdx === activePartIndex && fp.pageIdx === activePageIndex
  );
  const globalPageNum = currentFlatIndex + 1;

  const isAtStart = activePageIndex === 0 && activePartIndex === 0 && !previewEnded;
  const isAtPreviewLimit = isPreviewMode && currentFlatIndex >= PREVIEW_PAGE_LIMIT - 1;
  const isAtEnd = previewEnded
    ? true
    : isPreviewMode
    ? isAtPreviewLimit
    : parts
    ? activePageIndex >= totalPages - 1 && activePartIndex >= parts.length - 1
    : true;

  const handleNext = () => {
    if (isPreviewMode && currentFlatIndex >= PREVIEW_PAGE_LIMIT - 1) {
      setPreviewEnded(true);
      return;
    }
    if (activePageIndex < totalPages - 1) navigateTo(activePartIndex, activePageIndex + 1);
    else if (parts && activePartIndex < parts.length - 1) navigateTo(activePartIndex + 1, 0);
  };

  const handlePrev = () => {
    if (previewEnded) { setPreviewEnded(false); return; }
    if (activePageIndex > 0) navigateTo(activePartIndex, activePageIndex - 1);
    else if (activePartIndex > 0) {
      const prevPart = parts![activePartIndex - 1];
      navigateTo(activePartIndex - 1, (prevPart.pages?.length ?? 1) - 1);
    }
  };

  const togglePartExpand = (partId: string) => {
    setExpandedParts(prev => {
      const s = new Set(prev);
      s.has(partId) ? s.delete(partId) : s.add(partId);
      return s;
    });
  };

  useEffect(() => {
    setShowAudio(false);
    setShowVideo(false);
  }, [activePartIndex]);

  if (bookLoading || partsLoading) {
    return (
      <PublicLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!book) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <BookOpen className="w-12 h-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Book Not Found</h1>
          <Link href="/books"><Button variant="outline">Back to Books</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  if (!parts || parts.length === 0) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <BookOpen className="w-12 h-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold">No Content Yet</h1>
          <p className="text-muted-foreground text-sm">This book doesn't have any chapters yet.</p>
          <Link href={`/books/${book.slug}`}><Button variant="outline"><Home className="w-4 h-4 mr-2" /> Book Details</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  if (phase === "cover") {
    return (
      <PublicLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <Link href={`/books/${book.slug}`}>
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-to-detail">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Book Details
            </Button>
          </Link>

          <div className="grid md:grid-cols-[280px_1fr] gap-10 items-start">
            <div className="flex justify-center md:justify-start">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-56 md:w-full max-w-[280px] rounded-xl shadow-2xl object-cover"
                  data-testid="img-book-cover"
                />
              ) : (
                <div className="w-56 md:w-full max-w-[280px] aspect-[3/4] rounded-xl bg-muted flex items-center justify-center border">
                  <BookOpen className="w-16 h-16 text-muted-foreground/40" />
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div>
                {book.category && (
                  <Badge variant="secondary" className="mb-3" data-testid="badge-book-category">
                    {book.category}
                  </Badge>
                )}
                <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight mb-2" data-testid="text-book-title">
                  {book.title}
                </h1>
                <p className="text-muted-foreground text-lg" data-testid="text-book-author">
                  by {book.author}
                </p>
              </div>

              {(book as any).averageRating > 0 && (
                <div className="flex items-center gap-2" data-testid="text-book-rating">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round((book as any).averageRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                  <span className="font-medium">{((book as any).averageRating || 0).toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">({(book as any).totalRatings} ratings)</span>
                </div>
              )}

              {book.description && (
                <p className="text-foreground/80 leading-relaxed text-base" data-testid="text-book-description">
                  {book.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <List className="w-4 h-4" />
                  {parts.length} {parts.length === 1 ? "Part" : "Parts"}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="flex items-center gap-1.5">
                  <BookMarked className="w-4 h-4" />
                  {flatPages.length} {flatPages.length === 1 ? "Page" : "Pages"}
                </span>
                {isPreviewMode && (
                  <>
                    <span className="text-muted-foreground/30">·</span>
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      <Lock className="w-3 h-3 mr-1" /> Preview Mode
                    </Badge>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={() => setPhase("toc")}
                  data-testid="button-view-toc"
                >
                  View Table of Contents
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => { setPhase("reading"); navigateTo(0, 0); }}
                  data-testid="button-start-reading"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start Reading
                </Button>
              </div>

              {book.type === "paid" && !isPreviewMode && (
                <div className="pt-2">
                  {((book as any).amazonAffiliateLink || (book as any).affiliateLink) && (
                    <a
                      href={(book as any).amazonAffiliateLink || (book as any).affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      <Button variant="secondary" size="sm" data-testid="button-buy-book-cover">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {(book as any).buyButtonLabel || "Buy on Amazon"}
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (phase === "toc") {
    let globalPage = 0;
    return (
      <PublicLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center gap-3 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPhase("cover")}
              data-testid="button-back-to-cover"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Cover
            </Button>
            <span className="text-muted-foreground">/</span>
            <h1 className="font-serif text-2xl font-bold" data-testid="text-toc-title">
              Table of Contents
            </h1>
          </div>

          <div className="mb-4">
            <p className="text-muted-foreground text-sm">
              <span className="font-medium text-foreground">{book.title}</span>
              {" "}by {book.author}
            </p>
          </div>

          <div className="border rounded-xl overflow-hidden" data-testid="toc-list">
            <div className="grid grid-cols-[2.5rem_1fr_auto] text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 px-4 py-2.5 border-b">
              <span>#</span>
              <span>Chapter / Part</span>
              <span className="text-right">Pages</span>
            </div>

            {parts.map((part, partIdx) => {
              const partStartPage = globalPage + 1;
              const partPageCount = part.pages?.length || 0;
              const capturedPartIdx = partIdx;
              const capturedStartPage = globalPage;
              globalPage += partPageCount;

              return (
                <div key={part.id} data-testid={`toc-part-${part.id}`}>
                  <button
                    onClick={() => { navigateTo(capturedPartIdx, 0); }}
                    className="w-full grid grid-cols-[2.5rem_1fr_auto] items-center px-4 py-3.5 hover:bg-muted/40 transition-colors border-b last:border-0 text-left group"
                    data-testid={`toc-button-${part.id}`}
                  >
                    <span className="text-sm font-semibold text-muted-foreground">
                      {partIdx + 1}
                    </span>
                    <div>
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {part.title}
                      </span>
                      {part.summary && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {part.summary}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground flex items-center gap-2 shrink-0">
                      <span>
                        {partPageCount > 0
                          ? `p. ${partStartPage}–${partStartPage + partPageCount - 1}`
                          : "—"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>

                  {part.pages && part.pages.length > 1 && (
                    <div className="pl-10 pr-4 pb-1 border-b last:border-0 bg-muted/20">
                      {part.pages.map((page, pageIdx) => {
                        const pageNum = capturedStartPage + pageIdx + 1;
                        return (
                          <button
                            key={page.id}
                            onClick={() => { navigateTo(capturedPartIdx, pageIdx); }}
                            className="w-full flex items-center justify-between py-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                            data-testid={`toc-page-${page.id}`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-xs opacity-60 w-5 text-right">{pageNum}.</span>
                              <span className="line-clamp-1 text-left">
                                {page.content
                                  ? page.content.replace(/<[^>]+>/g, "").slice(0, 60).trim() || `Page ${pageIdx + 1}`
                                  : `Page ${pageIdx + 1}`}
                              </span>
                            </span>
                            <ChevronRight className="w-3 h-3 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-8">
            <Button
              size="lg"
              onClick={() => { setPhase("reading"); navigateTo(0, 0); }}
              data-testid="button-start-reading-from-toc"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Start Reading from Beginning
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div data-testid="reader-container">
        <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-40">
          <div className="mx-auto px-3 sm:px-5 py-2.5" style={{ maxWidth: "1400px" }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0 h-8 w-8"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  data-testid="button-toggle-sidebar"
                >
                  {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                </Button>
                <div className="min-w-0">
                  <span className="font-serif font-semibold text-sm sm:text-base truncate block" data-testid="text-reader-title">
                    {book.title}
                  </span>
                  <span className="text-xs text-muted-foreground" data-testid="text-reader-progress">
                    {viewingToc
                      ? "Table of Contents"
                      : `Page ${globalPageNum} of ${totalBookPages}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isPreviewMode && (
                  <Badge variant="outline" className="hidden sm:flex text-amber-600 border-amber-300 gap-1 mr-1">
                    <Lock className="w-3 h-3" /> Preview
                  </Badge>
                )}
                <Button
                  size="icon"
                  variant={viewingToc ? "default" : "ghost"}
                  className="h-8 w-8"
                  onClick={() => setViewingToc(!viewingToc)}
                  title="Table of Contents"
                  data-testid="button-toc"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" disabled={isAtStart || viewingToc} onClick={handlePrev} data-testid="button-prev-page">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" disabled={(isAtEnd && !isAtPreviewLimit) || viewingToc} onClick={handleNext} data-testid="button-next-page">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setPhase("cover")} title="Back to Cover" data-testid="button-back-cover">
                  <Home className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex" style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <aside
            className={`${sidebarOpen ? "w-56" : "w-0 overflow-hidden"} shrink-0 border-r bg-muted/20 transition-all duration-300`}
            data-testid="reader-sidebar-left"
          >
            <div className="sticky top-[calc(var(--header-h,4rem)+3.5rem)]">
              <button
                onClick={() => setViewingToc(!viewingToc)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 border-b text-sm font-medium transition-colors ${viewingToc ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                data-testid="button-sidebar-toc"
              >
                <List className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">Table of Contents</span>
                {viewingToc ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
              </button>

              <ScrollArea className="h-[calc(100vh-14rem)]">
                <div className="p-1.5 space-y-0.5 pt-2">
                  {parts.map((part, i) => {
                    const partGlobalStart = flatPages.find(fp => fp.partIdx === i)?.globalIdx ?? 0;
                    const isActive = !viewingToc && activePartIndex === i;
                    return (
                      <button
                        key={part.id}
                        onClick={() => navigateTo(i, 0)}
                        className={`w-full text-left px-2.5 py-2 rounded-md text-sm transition-colors ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                        data-testid={`sidebar-part-${part.id}`}
                      >
                        <span className="text-xs opacity-60 mr-1.5">{i + 1}.</span>
                        <span className="line-clamp-2">{part.title}</span>
                        {(part.pages?.length || 0) > 0 && (
                          <span className={`block text-xs mt-0.5 ${isActive ? "opacity-70" : "text-muted-foreground"}`}>
                            p. {partGlobalStart + 1}–{partGlobalStart + (part.pages?.length || 0)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </aside>

          {!sidebarOpen && (
            <div className="shrink-0">
              <div className="sticky top-[calc(var(--header-h,4rem)+3.5rem)] pt-3 pl-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setSidebarOpen(true)}
                  data-testid="button-expand-sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <main className="flex-1 min-w-0">
            <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
              {viewingToc ? (
                <TocInlineView
                  parts={parts}
                  flatPages={flatPages}
                  activePartIndex={activePartIndex}
                  activePageIndex={activePageIndex}
                  expandedParts={expandedParts}
                  onToggleExpand={togglePartExpand}
                  onNavigate={navigateTo}
                />
              ) : (
                <>
                  {isFirstPage && activePart && (
                    <div className="mb-8">
                      <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-3" data-testid="text-part-title">
                        {activePart.title}
                      </h2>
                      {activePart.summary && (
                        <p className="text-muted-foreground leading-relaxed mb-5 text-base" data-testid="text-part-summary">
                          {activePart.summary}
                        </p>
                      )}

                      {(activePart.audioUrl || activePart.videoUrl) && (
                        <div className="flex items-center gap-3 mb-5">
                          {activePart.audioUrl && (
                            <button
                              onClick={() => { setShowAudio(!showAudio); setShowVideo(false); }}
                              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${showAudio ? "text-primary underline underline-offset-2" : "text-primary hover:underline hover:underline-offset-2"}`}
                              data-testid="button-toggle-audio"
                            >
                              <Headphones className="w-4 h-4" />
                              {showAudio ? "Hide Audio" : "Listen"}
                            </button>
                          )}
                          {activePart.videoUrl && (
                            <>
                              {activePart.audioUrl && <span className="text-muted-foreground/40">|</span>}
                              <button
                                onClick={() => { setShowVideo(!showVideo); setShowAudio(false); }}
                                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${showVideo ? "text-primary underline underline-offset-2" : "text-primary hover:underline hover:underline-offset-2"}`}
                                data-testid="button-toggle-video"
                              >
                                <Video className="w-4 h-4" />
                                {showVideo ? "Hide Video" : "Watch"}
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {showAudio && activePart.audioUrl && (
                        <div className="mb-5">
                          <AudioPlayer url={activePart.audioUrl} title={`Listen: ${activePart.title}`} />
                        </div>
                      )}

                      {showVideo && activePart.videoUrl ? (
                        <div className="my-4 rounded-xl overflow-hidden aspect-video">
                          <VideoPlayer url={activePart.videoUrl} wrapperClassName="w-full h-full" />
                        </div>
                      ) : (
                        !showAudio && activePart.coverImage && (
                          <div className="my-4 rounded-xl overflow-hidden">
                            <img
                              src={activePart.coverImage}
                              alt={activePart.title}
                              className="w-full h-auto max-h-[60vh] object-cover block"
                              loading="lazy"
                              data-testid="img-part-cover"
                            />
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {previewEnded ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-6" data-testid="preview-ended-banner">
                      <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                        <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h2 className="font-serif text-2xl font-bold mb-2">Preview Ends Here</h2>
                        <p className="text-muted-foreground max-w-md">
                          You've read the free preview. To continue reading the full book, get your copy below.
                        </p>
                      </div>
                      {((book as any).amazonAffiliateLink || (book as any).affiliateLink) && (
                        <a
                          href={(book as any).amazonAffiliateLink || (book as any).affiliateLink}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                        >
                          <Button size="lg" data-testid="button-buy-from-preview">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {(book as any).buyButtonLabel || "Buy on Amazon"}
                          </Button>
                        </a>
                      )}
                      <Link href={`/books/${book.slug}`}>
                        <Button variant="outline" size="lg" data-testid="button-back-to-detail-from-preview">
                          <Home className="w-4 h-4 mr-2" /> Back to Book Details
                        </Button>
                      </Link>
                    </div>
                  ) : activePage?.content ? (
                    <div
                      className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-p:leading-relaxed prose-p:text-foreground/90"
                      dangerouslySetInnerHTML={{ __html: activePage.content }}
                      data-testid="content-page"
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>No content on this page yet.</p>
                    </div>
                  )}

                  {!previewEnded && (
                    <>
                      <div className="my-8 border-y py-4">
                        <AdSlot
                          slot="in-article"
                          className="w-full"
                          disabled={adSlotsMap["in-article"] === false}
                          contentId={book.id}
                          contentType="book"
                          contentManualMode={adSlotsMap["in-article_mode"] === "manual"}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-2 gap-4">
                        <Button
                          variant="outline"
                          disabled={isAtStart}
                          onClick={handlePrev}
                          data-testid="button-prev-bottom"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                        </Button>
                        <span className="text-sm text-muted-foreground text-center hidden sm:block" data-testid="text-page-progress">
                          {isPreviewMode
                            ? `Preview · Page ${Math.min(globalPageNum, PREVIEW_PAGE_LIMIT)} of ${PREVIEW_PAGE_LIMIT}`
                            : `Page ${globalPageNum} of ${totalBookPages}`}
                        </span>
                        <Button
                          variant={isAtPreviewLimit ? "default" : "outline"}
                          onClick={handleNext}
                          disabled={isAtEnd && !isAtPreviewLimit}
                          data-testid="button-next-bottom"
                        >
                          {isAtPreviewLimit ? (
                            <><Lock className="w-4 h-4 mr-1" /> Get Full Book</>
                          ) : (
                            <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                          )}
                        </Button>
                      </div>

                      {activePageIndex === totalPages - 1 && activePartIndex < parts.length - 1 && (
                        <div className="text-center mt-6">
                          <Button
                            size="lg"
                            onClick={() => navigateTo(activePartIndex + 1, 0)}
                            data-testid="button-next-part"
                          >
                            Continue to Part {activePartIndex + 2}: {parts[activePartIndex + 1]?.title}
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </main>

          <aside className="hidden xl:block w-[300px] shrink-0 border-l" data-testid="sidebar-ads-right">
            <div className="sticky top-[calc(var(--header-h,4rem)+3.5rem)] p-3 space-y-4">
              {adSlotsMap["sidebar-small"] !== false && (
                <div className="w-[268px] h-[250px] flex overflow-hidden">
                  <AdSlot
                    slot="sidebar-small"
                    label="AdSense Placeholder — 300×250"
                    className="w-full h-full"
                    contentId={book.id}
                    contentType="book"
                    contentManualMode={adSlotsMap["sidebar-small_mode"] === "manual"}
                  />
                </div>
              )}

              {adSlotsMap["sidebar-small-2"] !== false && (
                <div className="w-[268px] h-[250px] flex overflow-hidden">
                  <AdSlot
                    slot="sidebar-small-2"
                    label="AdSense Placeholder — 300×250 (B)"
                    className="w-full h-full"
                    contentId={book.id}
                    contentType="book"
                    contentManualMode={adSlotsMap["sidebar-small-2_mode"] === "manual"}
                  />
                </div>
              )}

              {adSlotsMap["sidebar-large"] !== false && (
                <div className="w-[268px] h-[600px] flex overflow-hidden">
                  <AdSlot
                    slot="sidebar-large"
                    label="AdSense Placeholder — 300×600"
                    className="w-full h-full"
                    contentId={book.id}
                    contentType="book"
                    contentManualMode={adSlotsMap["sidebar-large_mode"] === "manual"}
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}

function TocInlineView({
  parts,
  flatPages,
  activePartIndex,
  activePageIndex,
  expandedParts,
  onToggleExpand,
  onNavigate,
}: {
  parts: BookPartWithPages[];
  flatPages: ReturnType<typeof flattenPages>;
  activePartIndex: number;
  activePageIndex: number;
  expandedParts: Set<string>;
  onToggleExpand: (id: string) => void;
  onNavigate: (partIdx: number, pageIdx: number) => void;
}) {
  return (
    <div data-testid="toc-inline-view">
      <h2 className="font-serif text-2xl font-bold mb-6">Table of Contents</h2>
      <div className="border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_auto] text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 px-4 py-2.5 border-b">
          <span>#</span>
          <span>Chapter</span>
          <span className="text-right">Pages</span>
        </div>
        {parts.map((part, partIdx) => {
          const partGlobalStart = flatPages.find(fp => fp.partIdx === partIdx)?.globalIdx ?? 0;
          const pageCount = part.pages?.length || 0;
          const isExpanded = expandedParts.has(part.id);
          const isCurrent = activePartIndex === partIdx;

          return (
            <div key={part.id} className="border-b last:border-0" data-testid={`inline-toc-part-${part.id}`}>
              <div className="flex items-center px-4 py-3 hover:bg-muted/30 transition-colors group">
                <span className="text-sm font-semibold text-muted-foreground w-8 shrink-0">{partIdx + 1}</span>
                <button
                  onClick={() => onNavigate(partIdx, 0)}
                  className={`flex-1 text-left font-medium text-sm ${isCurrent ? "text-primary" : "group-hover:text-primary transition-colors"}`}
                  data-testid={`inline-toc-nav-${part.id}`}
                >
                  {part.title}
                  {isCurrent && (
                    <span className="ml-2 text-xs font-normal text-primary/70">(current)</span>
                  )}
                  {part.summary && (
                    <p className="text-xs text-muted-foreground font-normal mt-0.5 line-clamp-1">{part.summary}</p>
                  )}
                </button>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground text-right">
                    {pageCount > 0
                      ? `p. ${partGlobalStart + 1}–${partGlobalStart + pageCount}`
                      : "—"}
                  </span>
                  {pageCount > 1 && (
                    <button
                      onClick={() => onToggleExpand(part.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`inline-toc-expand-${part.id}`}
                    >
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && part.pages && part.pages.length > 0 && (
                <div className="pl-10 pr-4 pb-2 bg-muted/10">
                  {part.pages.map((page, pageIdx) => {
                    const globalNum = partGlobalStart + pageIdx + 1;
                    const isCurrentPage = isCurrent && activePageIndex === pageIdx;
                    return (
                      <button
                        key={page.id}
                        onClick={() => onNavigate(partIdx, pageIdx)}
                        className={`w-full flex items-center gap-3 py-2 text-sm transition-colors text-left ${isCurrentPage ? "text-primary font-medium" : "text-muted-foreground hover:text-primary"}`}
                        data-testid={`inline-toc-page-${page.id}`}
                      >
                        <span className="text-xs w-6 text-right shrink-0 font-medium">{globalNum}</span>
                        <FileText className="w-3.5 h-3.5 shrink-0 opacity-50" />
                        <span className="line-clamp-1 flex-1">
                          {page.content
                            ? page.content.replace(/<[^>]+>/g, "").slice(0, 80).trim() || `Page ${pageIdx + 1}`
                            : `Page ${pageIdx + 1}`}
                        </span>
                        {isCurrentPage && <ChevronLeft className="w-3.5 h-3.5 shrink-0 rotate-180" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
